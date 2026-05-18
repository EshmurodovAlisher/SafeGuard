import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const distPath = path.join(process.cwd(), 'dist');

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
  
  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  if (!apiKey) {
    console.warn('WARNING: GEMINI_API_KEY is not set in the environment.');
  }

  // Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', hasApiKey: !!apiKey });
  });

  // API Routes
  app.post('/api/analyze', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      if (!apiKey) {
        return res.status(500).json({ error: 'API Key not configured on server' });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: `Siz SafeGuard AI kiberxavfsizlik bo'yicha mutaxassisiz. 
          O'zbekistondagi kiberjinoyatchilik usullarini yaxshi bilasiz.
          
          Quyidagi holatlarni firibgarlik (THREAT) deb baholang:
          1. Karta ma'lumotlarini so'rash (karta raqami, srok, CVV).
          2. SMS orqali kelgan kodni (6 talik yoki 5 talik raqamlar) so'rash.
          3. Fake yutuqlar: "Siz 10,000,000 so'm yutdingiz", "Prezident sovg'asi", "Bonusni olish uchun kiring".
          4. Typosquatted havolalar: click-bonus.uz, payme-card.uz, uzum-market.net, nbu-online.com (rasmiy emas).
          5. Qo'rqitish: "Kartangiz bloklanadi", "Mablag'larni saqlab qolish uchun kodni ayting".
          
          Natijani JSON formatida qaytaring. Schema:
          {
            "isFraud": boolean,
            "riskLevel": "PAST" | "O'RTA" | "YUQORI",
            "confidence": number (0-1),
            "reasoning": string[],
            "suggestedAction": string
          }
          
          Tahlil qilinadigan matn: "${text}"` }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isFraud: { type: Type.BOOLEAN },
              riskLevel: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              reasoning: { type: Type.ARRAY, items: { type: Type.STRING } },
              suggestedAction: { type: Type.STRING }
            },
            required: ["isFraud", "riskLevel", "confidence", "reasoning", "suggestedAction"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Empty response from AI');
      }

      try {
        const parsed = JSON.parse(responseText);
        res.json(parsed);
      } catch (parseError) {
        console.error('JSON Parse error:', responseText);
        res.status(500).json({ 
          error: 'AI response parsing failed', 
          rawResponse: responseText.substring(0, 500) 
        });
      }
    } catch (error: any) {
      console.error('Gemini error:', error);
      res.status(500).json({ 
        error: 'Analysis failed', 
        details: error?.message || String(error) 
      });
    }
  });

  app.post('/api/vishing-analyze', async (req, res) => {
    try {
      const { audioData } = req.body;
      if (!audioData) {
        return res.status(400).json({ error: 'Audio data is required' });
      }

      if (!apiKey) {
        return res.status(500).json({ error: 'API Key not configured on server' });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            inlineData: {
              mimeType: "audio/L16;rate=16000",
              data: audioData
            }
          },
          { text: `Siz SafeGuard AI detektorisiz. Ushbu audio suhbatni tahlil qiling. 
          Agar firibgarlik (karta kodi so'rash, bank nomidan shubhali gaplar) sezilsa, 
          faqat bitta qatorda [DANGER] deb boshlab ogohlantirish bering. 
          Aks holda faqat suhbat matnini (transkripsiyasini) qaytaring.` }
        ]
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error('Vishing Gemini error:', error);
      res.status(500).json({ 
        error: 'Vishing analysis failed',
        details: error?.message || String(error)
      });
    }
  });

  // Vite middleware or static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
