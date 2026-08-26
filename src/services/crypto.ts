// WebCrypto AES-GCM 256-bit zero-knowledge encryption module

const PBKDF2_ITERATIONS = 100000;
const AES_KEY_LENGTH = 256;

// Convert string to Uint8Array
function strToBuf(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Convert Uint8Array to string
function bufToStr(buf: ArrayBuffer): string {
  return new TextDecoder().decode(buf);
}

// Convert ArrayBuffer or Uint8Array to Hex String
function bufToHex(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert Hex String to Uint8Array
function hexToBuf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Derive AES-GCM CryptoKey from password and salt using PBKDF2
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    strToBuf(password) as any,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

export interface EncryptedPayload {
  version: number;
  salt: string; // Hex
  iv: string;   // Hex
  ciphertext: string; // Hex
}

export async function encryptData(plaintext: string, masterPass: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(masterPass, salt);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as any },
    key,
    strToBuf(plaintext) as any
  );

  const payload: EncryptedPayload = {
    version: 1,
    salt: bufToHex(salt),
    iv: bufToHex(iv),
    ciphertext: bufToHex(encrypted)
  };

  return JSON.stringify(payload);
}

export async function decryptData(encryptedJson: string, masterPass: string): Promise<string> {
  try {
    const payload: EncryptedPayload = JSON.parse(encryptedJson);
    if (!payload.salt || !payload.iv || !payload.ciphertext) {
      throw new Error('Invalid encrypted payload format');
    }

    const salt = hexToBuf(payload.salt);
    const iv = hexToBuf(payload.iv);
    const ciphertext = hexToBuf(payload.ciphertext);

    const key = await deriveKey(masterPass, salt);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as any },
      key,
      ciphertext as any
    );

    return bufToStr(decrypted);
  } catch (err) {
    throw new Error('Decryption failed: Incorrect master password or corrupted payload');
  }
}

// Compute SHA-256 hash string for verification
export async function computeSha256(text: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', strToBuf(text) as any);
  return bufToHex(hashBuffer);
}

// Cipher Scramble Effect Generator for Matrix Decryption Reveal
const GLYPHS = '0123456789ABCDEF$#%*@&~+=-_/?!§';
export function generateMatrixScramble(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
  }
  return result;
}
