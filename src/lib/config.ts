// src/lib/config.ts

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error(
    "VITE_GEMINI_API_KEY tidak ditemukan. Silakan buat file .env di root project dan tambahkan VITE_GEMINI_API_KEY=KUNCI_API_ANDA."
  );
}

export { API_KEY };
