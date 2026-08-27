// ==============================================================================
// 000-MISSION-CONTROL: VOICE RECOGNITION (STT), TTS SYNTHESIS & DUPLEX ENGINE
// ==============================================================================

export interface VoiceConfig {
  sttLanguage: string; // 'ru-RU' | 'en-US'
  ttsEngine: 'browser' | 'openai'; // 'browser' | 'openai'
  browserVoiceURI: string;
  openaiVoice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  speechRate: number; // 0.8 to 1.5
  speechPitch: number; // 0.8 to 1.2
  autoSpeak: boolean; // Auto-speak AI assistant responses
  isHandsFree: boolean; // Auto-listen for next user phrase after AI finishes speaking
}

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

export const OPENAI_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const;

export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  sttLanguage: 'ru-RU',
  ttsEngine: 'browser',
  browserVoiceURI: '',
  openaiVoice: 'nova',
  speechRate: 1.05,
  speechPitch: 1.0,
  autoSpeak: true,
  isHandsFree: false
};

export const getSavedVoiceConfig = (): VoiceConfig => {
  try {
    const raw = localStorage.getItem('000_voice_config');
    if (raw) {
      return { ...DEFAULT_VOICE_CONFIG, ...JSON.parse(raw) };
    }
  } catch {}
  return DEFAULT_VOICE_CONFIG;
};

export const saveVoiceConfig = (cfg: VoiceConfig): void => {
  localStorage.setItem('000_voice_config', JSON.stringify(cfg));
};

/**
 * Strips markdown formatting (headers, backticks, bold, links, code blocks)
 * to provide clean, natural plaintext for speech synthesis.
 */
export const cleanMarkdownForSpeech = (md: string): string => {
  if (!md) return '';
  return md
    .replace(/```[\s\S]*?```/g, ' [code block omitted] ') // replace code blocks
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/[#*_~>|]/g, ' ') // markdown symbols
    .replace(/\n+/g, '. ') // newlines to pauses
    .replace(/\s+/g, ' ')
    .trim();
};

class VoiceAssistantEngine {
  private recognition: any = null;
  private isListeningActive = false;
  private currentAudioElement: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 64;
        this.analyser.smoothingTimeConstant = 0.8;
      }
    } catch {}
  }

  public getAnalyser(): AnalyserNode | null {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    return this.analyser;
  }

  public isSTTSupported(): boolean {
    return !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }

  public isTTSSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  public getBrowserVoices(): SpeechSynthesisVoice[] {
    if (!this.isTTSSupported()) return [];
    return window.speechSynthesis.getVoices();
  }

  /**
   * Start microphone capture and STT recognition
   */
  public async startListening(options: {
    language?: string;
    onResult: (finalText: string) => void;
    onInterim?: (interimText: string) => void;
    onError?: (error: string) => void;
    onEnd?: () => void;
  }): Promise<boolean> {
    if (this.isListeningActive) {
      this.stopListening();
    }

    // Stop speaking if currently active
    this.stopSpeaking();

    // Connect microphone to audio analyzer for live visualizer
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (this.audioContext && this.analyser) {
          if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
          }
          this.micSource = this.audioContext.createMediaStreamSource(this.micStream);
          this.micSource.connect(this.analyser);
        }
      }
    } catch (err: any) {
      console.warn('Microphone stream access warning:', err);
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      options.onError?.('SpeechRecognition API not supported in this browser. Please use Chrome/Edge or type manually.');
      return false;
    }

    try {
      this.recognition = new SpeechRec();
      this.recognition.lang = options.language || 'ru-RU';
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;

      let finalAccumulated = '';

      this.recognition.onresult = (event: any) => {
        let interimText = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalAccumulated += transcript;
          } else {
            interimText += transcript;
          }
        }

        if (interimText && options.onInterim) {
          options.onInterim(interimText);
        }

        if (finalAccumulated) {
          options.onResult(finalAccumulated.trim());
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error !== 'no-speech') {
          options.onError?.(event.error || 'Recognition error');
        }
      };

      this.recognition.onend = () => {
        this.stopListening();
        options.onEnd?.();
      };

      this.recognition.start();
      this.isListeningActive = true;
      return true;
    } catch (err: any) {
      options.onError?.(err.message || 'Failed to start microphone');
      this.stopListening();
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {}
      this.recognition = null;
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }

    if (this.micSource) {
      try {
        this.micSource.disconnect();
      } catch {}
      this.micSource = null;
    }

    this.isListeningActive = false;
  }

  /**
   * Synthesize text to speech
   */
  public async speak(
    rawText: string,
    config: VoiceConfig,
    openAiBaseUrl?: string,
    openAiApiKey?: string,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    this.stopSpeaking();
    const cleanText = cleanMarkdownForSpeech(rawText);
    if (!cleanText) {
      onEnd?.();
      return;
    }

    // 1. OpenAI TTS Mode
    if (config.ttsEngine === 'openai' && openAiBaseUrl && openAiApiKey) {
      try {
        const cleanBase = openAiBaseUrl.trim().replace(/\/+$/, '');
        const speechUrl = cleanBase.endsWith('/v1') ? `${cleanBase}/audio/speech` : `${cleanBase}/v1/audio/speech`;

        const res = await fetch(speechUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAiApiKey.trim()}`
          },
          body: JSON.stringify({
            model: 'tts-1',
            input: cleanText.slice(0, 1000), // OpenAI max input safe limit
            voice: config.openaiVoice || 'nova',
            speed: config.speechRate || 1.0
          })
        });

        if (!res.ok) {
          throw new Error(`OpenAI TTS HTTP ${res.status}`);
        }

        const audioBlob = await res.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        this.currentAudioElement = audio;

        // Connect audio element to analyzer
        if (this.audioContext && this.analyser) {
          if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
          }
          const source = this.audioContext.createMediaElementSource(audio);
          source.connect(this.analyser);
          this.analyser.connect(this.audioContext.destination);
        }

        audio.onplay = () => onStart?.();
        audio.onended = () => {
          this.currentAudioElement = null;
          URL.revokeObjectURL(audioUrl);
          onEnd?.();
        };
        audio.onerror = () => {
          this.currentAudioElement = null;
          URL.revokeObjectURL(audioUrl);
          onEnd?.();
        };

        await audio.play();
        return;
      } catch (err) {
        console.warn('OpenAI TTS failed, falling back to browser synthesis:', err);
        // Fallback to browser synthesis
      }
    }

    // 2. Browser SpeechSynthesis Mode (Default & Universal)
    if (this.isTTSSupported()) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = config.speechRate || 1.0;
      utterance.pitch = config.speechPitch || 1.0;
      utterance.lang = config.sttLanguage || 'ru-RU';

      const voices = this.getBrowserVoices();
      if (config.browserVoiceURI) {
        const found = voices.find(v => v.voiceURI === config.browserVoiceURI);
        if (found) utterance.voice = found;
      } else {
        // Auto-select matching language voice
        const matched = voices.find(v => v.lang.startsWith(config.sttLanguage.slice(0, 2)));
        if (matched) utterance.voice = matched;
      }

      utterance.onstart = () => onStart?.();
      utterance.onend = () => onEnd?.();
      utterance.onerror = () => onEnd?.();

      window.speechSynthesis.speak(utterance);
    } else {
      onEnd?.();
    }
  }

  public stopSpeaking(): void {
    if (this.isTTSSupported()) {
      window.speechSynthesis.cancel();
    }
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.currentTime = 0;
      this.currentAudioElement = null;
    }
  }
}

export const voiceEngine = new VoiceAssistantEngine();
