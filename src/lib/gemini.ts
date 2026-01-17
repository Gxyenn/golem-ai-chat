import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyBgVeCCbKQ2HSiW0AAVjmNWjbRq_9R3blo";

const genAI = new GoogleGenerativeAI(API_KEY);

const SYSTEM_PROMPT = `Kamu adalah Golem AI, asisten AI yang sopan, ramah, dan sangat membantu. Kamu diciptakan oleh Stoky untuk membantu pengguna dengan berbagai pertanyaan dan tugas.

Karakteristik kepribadianmu:
- Selalu sopan dan hormat kepada pengguna
- Menjawab dengan jelas dan terstruktur
- Menggunakan bahasa yang mudah dipahami
- Selalu siap membantu dengan sepenuh hati
- Jika tidak yakin, kamu akan jujur mengatakannya
- Mendukung format Markdown untuk jawaban yang lebih rapi

Saat menjawab kode, selalu gunakan code blocks dengan bahasa pemrograman yang sesuai.
Contoh: \`\`\`javascript atau \`\`\`python

Salam pembuka: "Halo! Saya Golem AI, siap membantu Anda. Ada yang bisa saya bantu hari ini?"`;

export interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

export async function sendMessage(
  message: string,
  history: ChatMessage[],
  imageData?: { data: string; mimeType: string }
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: imageData ? "gemini-1.5-flash" : "gemini-1.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    const chat = model.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.7,
      },
    });

    let result;
    
    if (imageData) {
      result = await chat.sendMessage([
        {
          inlineData: {
            data: imageData.data,
            mimeType: imageData.mimeType,
          },
        },
        message || "Jelaskan gambar ini",
      ]);
    } else {
      result = await chat.sendMessage(message);
    }

    return result.response.text();
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    throw new Error("Maaf, terjadi kesalahan saat memproses pesan Anda. Silakan coba lagi.");
  }
}

export async function streamMessage(
  message: string,
  history: ChatMessage[],
  onChunk: (chunk: string) => void,
  imageData?: { data: string; mimeType: string }
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    const chat = model.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.7,
      },
    });

    let result;
    
    if (imageData) {
      result = await chat.sendMessageStream([
        {
          inlineData: {
            data: imageData.data,
            mimeType: imageData.mimeType,
          },
        },
        message || "Jelaskan gambar ini",
      ]);
    } else {
      result = await chat.sendMessageStream(message);
    }

    let fullResponse = "";
    
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullResponse += chunkText;
      onChunk(chunkText);
    }

    return fullResponse;
  } catch (error) {
    console.error("Error streaming message from Gemini:", error);
    throw new Error("Maaf, terjadi kesalahan saat memproses pesan Anda. Silakan coba lagi.");
  }
}
