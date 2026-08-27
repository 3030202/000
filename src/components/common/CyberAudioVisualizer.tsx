import React, { useEffect, useRef } from 'react';
import { VoiceState, voiceEngine } from '../../services/voiceAssistantEngine';

interface CyberAudioVisualizerProps {
  state: VoiceState;
  height?: number;
  width?: number | string;
  showOrb?: boolean;
}

export const CyberAudioVisualizer: React.FC<CyberAudioVisualizerProps> = ({
  state,
  height = 40,
  width = '100%',
  showOrb = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = voiceEngine.getAnalyser();
    const bufferLength = analyser ? analyser.frequencyBinCount : 32;
    const dataArray = new Uint8Array(bufferLength);

    let phase = 0;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      phase += 0.05;

      ctx.clearRect(0, 0, w, h);

      if (analyser && (state === 'listening' || state === 'speaking')) {
        analyser.getByteFrequencyData(dataArray);
      } else {
        // Simulated harmonic wave when analyser is idle or synthesizing
        for (let i = 0; i < bufferLength; i++) {
          if (state === 'thinking') {
            dataArray[i] = 120 + Math.sin(phase * 2 + i * 0.4) * 80;
          } else if (state === 'speaking') {
            dataArray[i] = 90 + Math.sin(phase * 1.5 + i * 0.3) * 60;
          } else if (state === 'listening') {
            dataArray[i] = 50 + Math.sin(phase + i * 0.2) * 30;
          } else {
            dataArray[i] = 15 + Math.sin(phase * 0.5 + i * 0.1) * 10;
          }
        }
      }

      // Draw background grid lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      // Palette determination
      let primaryColor = 'rgba(56, 189, 248, 0.9)'; // Cyan (idle)
      let secondaryColor = 'rgba(2, 132, 199, 0.6)';
      if (state === 'listening') {
        primaryColor = 'rgba(74, 222, 128, 0.95)'; // Neon Green
        secondaryColor = 'rgba(34, 197, 94, 0.5)';
      } else if (state === 'thinking') {
        primaryColor = 'rgba(250, 204, 21, 0.95)'; // Yellow
        secondaryColor = 'rgba(234, 179, 8, 0.5)';
      } else if (state === 'speaking') {
        primaryColor = 'rgba(168, 85, 247, 0.95)'; // Magenta / Purple
        secondaryColor = 'rgba(192, 132, 252, 0.5)';
      }

      // 1. Draw Symmetric Frequency Bars
      const barCount = 28;
      const barWidth = Math.max(2, (w / barCount) - 3);
      const centerX = w / 2;

      for (let i = 0; i < barCount; i++) {
        const val = dataArray[i % bufferLength] / 255;
        const barHeight = Math.max(3, val * (h * 0.85));
        const x = i * (barWidth + 3);
        const y = (h - barHeight) / 2;

        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        grad.addColorStop(0, primaryColor);
        grad.addColorStop(1, secondaryColor);

        ctx.fillStyle = grad;
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = state !== 'idle' ? 6 : 1;
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      // 2. Draw Central Cyber Voice Orb if enabled
      if (showOrb) {
        const orbRadius = state === 'speaking' || state === 'listening' ? 12 + Math.sin(phase * 3) * 3 : 9;
        ctx.save();
        ctx.translate(centerX, h / 2);

        // Outer glowing pulse ring
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, orbRadius + 4, 0, Math.PI * 2);
        ctx.stroke();

        // Inner solid glowing core
        ctx.fillStyle = secondaryColor;
        ctx.beginPath();
        ctx.arc(0, 0, orbRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state, showOrb]);

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        background: 'rgba(2, 6, 15, 0.8)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <canvas
        ref={canvasRef}
        width={360}
        height={height}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      {/* State label badge */}
      <div
        style={{
          position: 'absolute',
          top: '2px',
          right: '4px',
          fontSize: '7.5px',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          color:
            state === 'listening'
              ? 'var(--green)'
              : state === 'thinking'
              ? 'var(--yellow)'
              : state === 'speaking'
              ? '#c084fc'
              : 'var(--cyan)'
        }}
      >
        {state === 'listening' && '● REC MIC'}
        {state === 'thinking' && '● THINKING'}
        {state === 'speaking' && '● VOICE OUT'}
        {state === 'idle' && 'VOICE READY'}
      </div>
    </div>
  );
};
