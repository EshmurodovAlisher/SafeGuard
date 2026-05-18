
# 🛡️ SafeGuard AI: O'zbekiston

Ushbu platforma O'zbekistondagi moliyaviy firibgarlik (Phishing, Vishing) va kiberxavfsizlik muammolariga qarshi kurashish uchun yaratilgan.

## 🚀 Tekin serverga joylash (Deployment)

Loyiha frontend-only (React + ESM) bo'lgani uchun uni quyidagi platformalarda bepul ishlatish mumkin:

### 1. Vercel orqali (Tavsiya etiladi)
- GitHub-ga loyihani yuklang.
- [Vercel.com](https://vercel.com) saytiga kiring va loyihani import qiling.
- **Environment Variables** bo'limiga quyidagilarni qo'shing:
  - `API_KEY`: Gemini API kalitingiz.
- "Deploy" tugmasini bosing.

### 2. Netlify orqali
- Loyihani Netlify-ga "Drag & Drop" qiling yoki GitHub orqali ulang.
- "Site Settings" > "Environment variables" bo'limida `API_KEY` ni o'rnating.

### 3. GitHub Pages
- `package.json` fayliga `homepage` qismini qo'shing va `gh-pages` kutubxonasi orqali deploy qiling.

## 🛠 Texnologiyalar
- **AI Model**: Google Gemini 2.5 (Live & Flash)
- **Frontend**: React (ESM modules)
- **Styling**: Tailwind CSS
- **Live Interaction**: Gemini Live API (Ovozli tahlil uchun)

## ⚠️ Diqqat!
Loyiha real vaqtda audio tahlil qilishi uchun foydalanuvchining mikrofoniga ruxsat berishi talab etiladi. HTTPS ulanishi (xavfsiz server) bo'lmasa, mikrofon ishlamasligi mumkin.
