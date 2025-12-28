
import { MathExercise } from "../types";

const OLLAMA_URL = "http://localhost:11434/api/chat";

const getRandomNumbers = () => {
  const n1 = Math.floor(Math.random() * (999 - 200 + 1)) + 200;
  const n2 = Math.floor(Math.random() * (n1 - 10 - 100 + 1)) + 100;
  return { n1, n2 };
};

export const generateMathExercise = async (): Promise<MathExercise> => {
  const { n1, n2 } = getRandomNumbers();

  const prompt = `Calculate the step-by-step decomposition for: ${n1} - ${n2}.
  The second number (${n2}) must be decomposed into: n2_centenas, n2_dezenas, n2_unidades.
  Partial results:
  - res_centenas = ${n1} - n2_centenas
  - res_dezenas = res_centenas - n2_dezenas
  - res_final = res_dezenas - n2_unidades
  
  Create 3 pedagogical hints in English.
  Return ONLY a valid JSON object with this structure:
  {
    "n1": ${n1}, "n2": ${n2},
    "n2_centenas": integer, "n2_dezenas": integer, "n2_unidades": integer,
    "res_centenas": integer, "res_dezenas": integer, "res_final": integer,
    "dicas": { "centenas": "string", "dezenas": "string", "unidades": "string" }
  }`;

  try {
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2',
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        format: 'json'
      })
    });

    const data = await response.json();
    return JSON.parse(data.message.content) as MathExercise;
  } catch (error) {
    console.error("Ollama Error, falling back to local calculation:", error);
    // Fallback manual em caso de erro do Ollama
    const c = Math.floor(n2 / 100) * 100;
    const d = Math.floor((n2 % 100) / 10) * 10;
    const u = n2 % 10;
    return {
      n1, n2,
      n2_centenas: c, n2_dezenas: d, n2_unidades: u,
      res_centenas: n1 - c, res_dezenas: (n1 - c) - d, res_final: n1 - n2,
      dicas: {
        centenas: `Start by subtracting the hundreds: ${c}.`,
        dezenas: `Now take away the tens: ${d}.`,
        unidades: `Finally, subtract the ones: ${u}.`
      }
    };
  }
};

export const analyzeResolutionPhoto = async (base64Image: string, exercise: MathExercise) => {
  const prompt = `Analyze this handwritten math resolution for: ${exercise.n1} - ${exercise.n2}.
  Extract:
  1. Centenas step: "${exercise.n1} - ${exercise.n2_centenas} = ${exercise.res_centenas}"
  2. Dezenas step: "${exercise.res_centenas} - ${exercise.n2_dezenas} = ${exercise.res_dezenas}"
  3. Unidades step: "${exercise.res_dezenas} - ${exercise.n2_unidades} = ${exercise.res_final}"
  4. Final Answer: The result of the main problem written at the top.
  
  Return JSON:
  {
    "centenas": {"expressao": "string", "resultado": "string"},
    "dezenas": {"expressao": "string", "resultado": "string"},
    "unidades": {"expressao": "string", "resultado": "string"},
    "resultado_final": "string"
  }`;

  try {
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llava',
        messages: [{
          role: 'user',
          content: prompt,
          images: [base64Image]
        }],
        stream: false,
        format: 'json'
      })
    });

    const data = await response.json();
    return JSON.parse(data.message.content);
  } catch (error) {
    console.error("Ollama Vision Error:", error);
    throw error;
  }
};
