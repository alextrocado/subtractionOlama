
export interface MathExercise {
  n1: number;
  n2: number;
  n2_centenas: number;
  n2_dezenas: number;
  n2_unidades: number;
  res_centenas: number;
  res_dezenas: number;
  res_final: number;
  dicas: {
    centenas: string;
    dezenas: string;
    unidades: string;
  };
}

export type StepRowKey = 'centenas' | 'dezenas' | 'unidades';

export interface RowState {
  expressao: string;
  resultado: string;
  isCorrect: boolean | null;
  attempts: number;
  showDica: boolean;
}
