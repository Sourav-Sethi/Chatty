import CryptoJS from "crypto-js";

const SECRET = "chatty-demo-shared-secret"; // For demo only. Use per-chat secret in production.

export function formatMessageTime(date) {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
}

export function encryptMessage(plainText) {
  return CryptoJS.AES.encrypt(plainText, SECRET).toString();
}

export function decryptMessage(cipherText) {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return "[Decryption failed]";
  }
}