
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateMathExercise, analyzeResolutionPhoto } from './services/ollamaService';
import { MathExercise, StepRowKey, RowState } from './types';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exercise, setExercise] = useState<MathExercise | null>(null);
  const [finalAnswer, setFinalAnswer] = useState('');
  const [isFinalCorrect, setIsFinalCorrect] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [rows, setRows] = useState<Record<StepRowKey, RowState>>({
    centenas: { expressao: '', resultado: '', isCorrect: null, attempts: 0, showDica: false },
    dezenas: { expressao: '', resultado: '', isCorrect: null, attempts: 0, showDica: false },
    unidades: { expressao: '', resultado: '', isCorrect: null, attempts: 0, showDica: false },
  });

  const fetchNewProblem = useCallback(async () => {
    setLoading(true);
    setError(null);
    setFinalAnswer('');
    setIsFinalCorrect(null);
    setRows({
      centenas: { expressao: '', resultado: '', isCorrect: null, attempts: 0, showDica: false },
      dezenas: { expressao: '', resultado: '', isCorrect: null, attempts: 0, showDica: false },
      unidades: { expressao: '', resultado: '', isCorrect: null, attempts: 0, showDica: false },
    });
    try {
      const data = await generateMathExercise();
      setExercise(data);
    } catch (e) { 
      console.error(e);
      setError("Certifica-te que o Ollama está a correr localmente!");
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { 
    fetchNewProblem(); 
  }, [fetchNewProblem]);

  const handleInputChange = (row: StepRowKey, field: 'expressao' | 'resultado', value: string) => {
    setRows(prev => ({
      ...prev,
      [row]: { ...prev[row], [field]: value, isCorrect: null, showDica: false }
    }));
  };

  const validateRow = (rowKey: StepRowKey, rowData: RowState, currentExercise: MathExercise) => {
    const cleanExp = rowData.expressao.replace(/\s/g, '');
    let expectedExp = '';
    let expectedRes = 0;

    if (rowKey === 'centenas') {
      expectedExp = `${currentExercise.n1}-${currentExercise.n2_centenas}`;
      expectedRes = currentExercise.res_centenas;
    } else if (rowKey === 'dezenas') {
      expectedExp = `${currentExercise.res_centenas}-${currentExercise.n2_dezenas}`;
      expectedRes = currentExercise.res_dezenas;
    } else {
      expectedExp = `${currentExercise.res_dezenas}-${currentExercise.n2_unidades}`;
      expectedRes = currentExercise.res_final;
    }

    return (cleanExp === expectedExp || cleanExp === expectedExp.replace('-', '−')) && 
           parseInt(rowData.resultado) === expectedRes;
  };

  const checkRow = (rowKey: StepRowKey) => {
    if (!exercise) return;
    const isCorrect = validateRow(rowKey, rows[rowKey], exercise);

    if (isCorrect) {
      setRows(prev => ({ ...prev, [rowKey]: { ...prev[rowKey], isCorrect: true, showDica: false } }));
    } else {
      const newAttempts = rows[rowKey].attempts + 1;
      if (newAttempts >= 3) {
        let expectedExp = '';
        let expectedRes = 0;
        if (rowKey === 'centenas') { expectedExp = `${exercise.n1}-${exercise.n2_centenas}`; expectedRes = exercise.res_centenas; }
        else if (rowKey === 'dezenas') { expectedExp = `${exercise.res_centenas}-${exercise.n2_dezenas}`; expectedRes = exercise.res_dezenas; }
        else { expectedExp = `${exercise.res_dezenas}-${exercise.n2_unidades}`; expectedRes = exercise.res_final; }

        setRows(prev => ({ 
          ...prev, 
          [rowKey]: { ...prev[rowKey], expressao: expectedExp, resultado: expectedRes.toString(), isCorrect: true, attempts: newAttempts, showDica: true } 
        }));
      } else {
        setRows(prev => ({ ...prev, [rowKey]: { ...prev[rowKey], isCorrect: false, attempts: newAttempts, showDica: true } }));
      }
    }
  };

  const checkFinalResult = useCallback(() => {
    if (!exercise || !finalAnswer) return;
    if (parseInt(finalAnswer) === exercise.res_final) {
      setIsFinalCorrect(true);
    } else {
      setIsFinalCorrect(false);
    }
  }, [exercise, finalAnswer]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !exercise) return;

    setAnalyzing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64String = (event.target?.result as string).split(',')[1];
      try {
        const result = await analyzeResolutionPhoto(base64String, exercise);
        
        const newRows = { ...rows };
        const keys: StepRowKey[] = ['centenas', 'dezenas', 'unidades'];
        
        keys.forEach(key => {
          if (result[key]?.expressao || result[key]?.resultado) {
            newRows[key] = {
              ...newRows[key],
              expressao: result[key].expressao || '',
              resultado: result[key].resultado || '',
              isCorrect: null,
              showDica: false
            };
            const isCorrect = validateRow(key, newRows[key], exercise);
            if (isCorrect) newRows[key].isCorrect = true;
          }
        });
        
        setRows(newRows);

        if (result.resultado_final) {
          const rawVal = result.resultado_final.replace(/\D/g, '');
          setFinalAnswer(rawVal);
          if (parseInt(rawVal) === exercise.res_final) {
            setIsFinalCorrect(true);
          }
        }
      } catch (err) {
        console.error(err);
        setError("Erro na análise da foto. Verifica se o Ollama (Llava) está ativo.");
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const stepsDone = rows.unidades.isCorrect === true;
  const isFinalSolved = isFinalCorrect === true;

  const isRowDisabled = (rowKey: StepRowKey) => {
    if (rows[rowKey].isCorrect === true) return true;
    if (rowKey === 'dezenas') return rows.centenas.isCorrect !== true;
    if (rowKey === 'unidades') return rows.dezenas.isCorrect !== true;
    return false;
  };

  return (
    <div className="min-h-screen bg-[#f0f9ff] p-4 md:p-10 flex flex-col items-center">
      <header className="text-center mb-6 md:mb-10">
        <div className="bg-white px-4 py-1 rounded-full shadow-sm inline-block mb-3 border border-blue-50">
           <span className="text-blue-500 font-black text-[10px] tracking-widest uppercase">Gugu Math Engine (Ollama)</span>
        </div>
        <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-blue-600 drop-shadow-sm mb-2">Subtraction by Decomposition</h1>
      </header>

      <main className="w-full max-w-3xl bg-white rounded-[35px] md:rounded-[45px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border-4 md:border-8 border-white p-3 md:p-10 relative overflow-hidden">
        {analyzing && (
           <div className="absolute inset-0 bg-white/90 z-50 flex flex-col items-center justify-center p-10 text-center animate-fadeIn backdrop-blur-sm">
             <div className="w-20 h-20 border-8 border-blue-100 border-t-blue-500 rounded-full animate-spin mb-4"></div>
             <h3 className="text-2xl font-black text-blue-900 mb-2">A analisar o teu papel...</h3>
             <p className="text-blue-500 font-bold">A ler centenas, dezenas, unidades e o resultado final! 🤖</p>
           </div>
        )}

        {loading ? (
          <div className="py-24 text-center">
            <div className="w-16 h-16 border-8 border-blue-100 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-blue-400 font-black text-2xl animate-pulse">A gerar novo desafio...</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center">
            <p className="text-red-500 font-bold text-xl mb-4">{error}</p>
            <p className="text-sm text-gray-500 mb-8">Executa: <code className="bg-gray-100 p-1">OLLAMA_ORIGINS="*" ollama serve</code></p>
            <button onClick={fetchNewProblem} className="px-8 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg">Tentar Novamente 🔄</button>
          </div>
        ) : exercise && (
          <>
            <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[25px] md:rounded-[35px] p-4 md:p-8 mb-8 md:mb-12 text-center border-4 border-white shadow-inner flex flex-col items-center gap-2 md:gap-4 transition-all ${!stepsDone ? 'opacity-80' : 'ring-4 ring-blue-300 ring-offset-4 ring-offset-white'}`}>
              <div className="flex flex-row items-center justify-center gap-1 md:gap-4 lg:gap-6 w-full flex-nowrap whitespace-nowrap overflow-x-auto no-scrollbar py-1">
                <span className="text-xl md:text-3xl lg:text-5xl font-black text-blue-950 tracking-tighter shrink-0">
                  {exercise.n1} <span className="text-red-400">−</span> {exercise.n2}
                </span>
                
                <span className="text-xl md:text-3xl lg:text-5xl font-black text-blue-200 shrink-0">=</span>
                
                <div className="relative shrink-0">
                  <input
                    type="number"
                    value={finalAnswer}
                    onChange={(e) => {
                      setFinalAnswer(e.target.value);
                      setIsFinalCorrect(null);
                    }}
                    disabled={!stepsDone || isFinalSolved}
                    placeholder="?"
                    className={`w-20 md:text-center md:w-28 lg:w-36 p-2 md:p-4 lg:p-5 text-xl md:text-3xl lg:text-5xl font-black rounded-[20px] md:rounded-[35px] border-4 transition-all outline-none text-center shadow-sm
                      ${!stepsDone ? 'bg-gray-100 border-gray-100 text-gray-300 cursor-not-allowed' : 
                        isFinalSolved ? 'border-green-400 bg-green-50 text-green-700' : 
                        isFinalCorrect === false ? 'border-red-400 bg-red-50 text-red-700' : 
                        'border-blue-200 focus:border-blue-400 bg-white text-blue-900 placeholder:text-blue-100'}`}
                  />
                  {isFinalCorrect === false && (
                    <div className="absolute -bottom-5 left-0 right-0 text-[8px] font-bold text-red-500 uppercase tracking-widest animate-bounce">Tenta de novo! ❌</div>
                  )}
                </div>
                
                <button
                  onClick={checkFinalResult}
                  disabled={!stepsDone || isFinalSolved || !finalAnswer}
                  className={`w-10 h-10 md:w-16 md:h-16 lg:w-20 lg:h-20 shrink-0 flex items-center justify-center rounded-[15px] md:rounded-[30px] font-black text-white shadow-[0_4px_0_0_rgba(0,0,0,0.1)] transition-all active:translate-y-1 active:shadow-none disabled:opacity-30
                    ${isFinalSolved ? 'bg-green-500 shadow-green-700' : 'bg-indigo-400 hover:bg-indigo-500 shadow-indigo-600'}`}
                >
                  <span className="text-sm md:text-lg lg:text-xl">{isFinalSolved ? '🏆' : 'OK'}</span>
                </button>
              </div>

              {!stepsDone && (
                <div className="bg-white/50 px-3 py-1 rounded-full text-blue-400 font-bold text-[8px] md:text-xs uppercase tracking-[0.1em] md:tracking-[0.2em] animate-pulse">
                  Resolve os passos abaixo primeiro! 👇
                </div>
              )}
            </div>

            <div className="max-w-xl mx-auto space-y-4">
              {(['centenas', 'dezenas', 'unidades'] as StepRowKey[]).map((rowKey) => {
                const disabled = isRowDisabled(rowKey);
                const isLocked = (rowKey === 'dezenas' && rows.centenas.isCorrect !== true) || 
                                 (rowKey === 'unidades' && rows.dezenas.isCorrect !== true);
                
                return (
                  <div key={rowKey} className={`flex flex-col gap-2 mb-6 animate-fadeIn transition-opacity duration-300 ${isLocked ? 'opacity-40' : 'opacity-100'}`}>
                    <div className="flex items-center gap-2 ml-1">
                      <span className={`font-black text-xs uppercase tracking-widest ${isLocked ? 'text-gray-400' : 'text-blue-500'}`}>
                        {rowKey}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={rows[rowKey].expressao}
                        onChange={(e) => handleInputChange(rowKey, 'expressao', e.target.value)}
                        disabled={disabled}
                        placeholder=""
                        className={`flex-1 p-3 md:p-4 text-lg md:text-2xl font-black rounded-2xl border-4 transition-all outline-none text-center
                          ${rows[rowKey].isCorrect === true ? 'border-green-400 bg-green-50 text-green-700' : 
                            isLocked ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed' : 'border-blue-100 focus:border-blue-400 text-blue-900'}`}
                      />
                      <span className="text-xl font-black text-blue-100">=</span>
                      <input
                        type="number"
                        value={rows[rowKey].resultado}
                        onChange={(e) => handleInputChange(rowKey, 'resultado', e.target.value)}
                        disabled={disabled}
                        placeholder="?"
                        className={`w-20 md:w-32 p-3 md:p-4 text-lg md:text-2xl font-black rounded-2xl border-4 transition-all outline-none text-center
                          ${rows[rowKey].isCorrect === true ? 'border-green-400 bg-green-50 text-green-700' : 
                            isLocked ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed' : 'border-blue-100 focus:border-blue-400 text-blue-900'}`}
                      />
                      <button 
                        onClick={() => checkRow(rowKey)} 
                        disabled={disabled || isLocked} 
                        className={`w-12 h-12 flex items-center justify-center rounded-2xl font-black shadow-md transition-all
                          ${rows[rowKey].isCorrect === true ? 'bg-green-500 text-white shadow-green-700' : 
                            isLocked ? 'bg-gray-200 text-gray-400 shadow-none cursor-not-allowed' : 'bg-blue-500 text-white shadow-blue-700 active:translate-y-1'}`}
                      >
                        {rows[rowKey].isCorrect === true ? '⭐' : 'OK'}
                      </button>
                    </div>
                    {rows[rowKey].showDica && !isLocked && (
                      <div className="mt-2 p-3 bg-yellow-50 border-2 border-yellow-200 rounded-xl text-yellow-800 text-sm font-bold animate-slideDown">
                        💡 {exercise.dicas[rowKey]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex flex-col gap-4 max-w-xl mx-auto">
               {!stepsDone && (
                  <>
                    <button onClick={() => fileInputRef.current?.click()} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-4 rounded-[25px] flex items-center justify-center gap-4 shadow-[0_6px_0_0_#4338ca] active:translate-y-1 transition-all">
                      <span className="text-2xl">📷</span>
                      <span className="text-lg font-black uppercase">Verificar o meu Papel</span>
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileUpload} />
                  </>
               )}

              {isFinalSolved && (
                <div className="p-6 md:p-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-[25px] text-center text-white animate-bounce shadow-xl border-4 border-white">
                  <h2 className="text-2xl md:text-3xl font-black mb-1">ÉS UM MESTRE! 🏆</h2>
                  <p className="text-lg md:text-xl font-bold opacity-90">Decomposição completa!</p>
                </div>
              )}

              <button onClick={fetchNewProblem} className="w-full bg-blue-600 text-white font-black py-5 rounded-[25px] hover:bg-blue-700 transition-all text-xl shadow-[0_8px_0_0_#1d4ed8] active:translate-y-1">
                OUTRA CONTA 🎲
              </button>
            </div>
          </>
        )}
      </main>

      <footer className="mt-8 text-blue-200 font-bold text-xs tracking-[0.2em] uppercase">
        Gugu Math Engine • Local AI Powered
      </footer>
    </div>
  );
};

export default App;
