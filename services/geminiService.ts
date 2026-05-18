
import { AnalysisResult, RiskLevel } from "../types";

export const analyzeMessage = async (text: string): Promise<AnalysisResult> => {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || errorData.error || 'Backend analysis failed');
    }

    return await response.json();
  } catch (error: any) {
    console.error("Gemini analysis error:", error);
    return {
      isFraud: false,
      riskLevel: RiskLevel.LOW,
      confidence: 0,
      reasoning: [error.message || "Tizimda xatolik yuz berdi"],
      suggestedAction: "Iltimos, qaytadan urinib ko'ring yoki API kalitni tekshiring"
    };
  }
};
