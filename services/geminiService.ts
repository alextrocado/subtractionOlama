
import { GoogleGenAI, Type } from "@google/genai";
import { MathExercise } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getRandomNumbers = () => {
  const n1 = Math.floor(Math.random() * (999 - 200 + 1)) + 200;
  const n2 = Math.floor(Math.random() * (n1 - 10 - 100 + 1)) + 100;
  return { n1, n2 };
};

export const generateMathExercise = async (): Promise<MathExercise> => {
  const { n1, n2 } = getRandomNumbers();

  const prompt = `Calculate the step-by-step decomposition for: ${n1} - ${n2}.
  
  The second number (${n2}) must be decomposed into:
  - n2_centenas (hundreds)
  - n2_dezenas (tens)
  - n2_unidades (ones)

  Calculate the partial results:
  - res_centenas = ${n1} - n2_centenas
  - res_dezenas = res_centenas - n2_dezenas
  - res_final = res_dezenas - n2_unidades

  Create 3 pedagogical hints in English.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: "You are a math assistant for children. Return strict JSON format in English.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          n1: { type: Type.INTEGER },
          n2: { type: Type.INTEGER },
          n2_centenas: { type: Type.INTEGER },
          n2_dezenas: { type: Type.INTEGER },
          n2_unidades: { type: Type.INTEGER },
          res_centenas: { type: Type.INTEGER },
          res_dezenas: { type: Type.INTEGER },
          res_final: { type: Type.INTEGER },
          dicas: {
            type: Type.OBJECT,
            properties: {
              centenas: { type: Type.STRING },
              dezenas: { type: Type.STRING },
              unidades: { type: Type.STRING }
            },
            required: ["centenas", "dezenas", "unidades"]
          }
        },
        required: ["n1", "n2", "n2_centenas", "n2_dezenas", "n2_unidades", "res_centenas", "res_dezenas", "res_final", "dicas"]
      }
    }
  });

  try {
    const text = response.text || "{}";
    const data = JSON.parse(text) as MathExercise;
    data.n1 = n1;
    data.n2 = n2;
    return data;
  } catch (error) {
    return generateMathExercise();
  }
};

export const analyzeResolutionPhoto = async (base64Image: string, exercise: MathExercise) => {
  const prompt = `Look at this photo of a handwritten math resolution for the problem: ${exercise.n1} - ${exercise.n2}.
  Extract the three steps of the decomposition method and the final answer:
  1. Hundreds step: subtraction of ${exercise.n2_centenas} (e.g., "${exercise.n1} - ${exercise.n2_centenas}")
  2. Tens step: subtraction of ${exercise.n2_dezenas}
  3. Units step: subtraction of ${exercise.n2_unidades}
  4. Final Answer: The result written after the main equation "${exercise.n1} - ${exercise.n2} = ..."

  For each decomposition step, identify the "expressao" and the "resultado".
  For the "resultado_final", extract the numeric answer written for the main subtraction.
  Return ONLY a JSON object.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          centenas: {
            type: Type.OBJECT,
            properties: {
              expressao: { type: Type.STRING },
              resultado: { type: Type.STRING }
            }
          },
          dezenas: {
            type: Type.OBJECT,
            properties: {
              expressao: { type: Type.STRING },
              resultado: { type: Type.STRING }
            }
          },
          unidades: {
            type: Type.OBJECT,
            properties: {
              expressao: { type: Type.STRING },
              resultado: { type: Type.STRING }
            }
          },
          resultado_final: { type: Type.STRING }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
};
