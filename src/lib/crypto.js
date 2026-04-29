const ENCRYPTION_SECRET = import.meta.env.VITE_PROFILE_ENCRYPTION_SECRET || "";

// Convert string to Uint8Array
const enc = new TextEncoder();
const dec = new TextDecoder();

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64(bytes) {
  let binary = "";
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return btoa(binary);
}

async function getCryptoKey() {
  if (!ENCRYPTION_SECRET) {
    throw new Error("Missing VITE_PROFILE_ENCRYPTION_SECRET");
  }

  // Must be exactly 32 bytes after base64 decode for AES-256
  const rawKey = base64ToBytes(ENCRYPTION_SECRET);

  return crypto.subtle.importKey("raw", rawKey, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptText(value) {
  if (value == null || value === "") return null;

  const key = await getCryptoKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(String(value)),
  );

  return JSON.stringify({
    iv: bytesToBase64(iv),
    data: bytesToBase64(encrypted),
  });
}

export async function decryptText(payload) {
  if (!payload) return null;

  const parsed = typeof payload === "string" ? JSON.parse(payload) : payload;
  const key = await getCryptoKey();

  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: base64ToBytes(parsed.iv),
    },
    key,
    base64ToBytes(parsed.data),
  );

  return dec.decode(decrypted);
}
