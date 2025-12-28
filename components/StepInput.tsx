
import React from 'react';

interface StepInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  isCorrect: boolean | null;
  placeholder?: string;
  disabled?: boolean;
  alignRight?: boolean;
  size?: 'sm' | 'md';
}

export const StepInput: React.FC<StepInputProps> = ({ 
  label, 
  value, 
  onChange, 
  isCorrect, 
  placeholder,
  disabled,
  alignRight = false,
  size = 'md'
}) => {
  const borderColor = isCorrect === null 
    ? 'border-blue-100' 
    : isCorrect 
      ? 'border-green-400 bg-green-50' 
      : 'border-red-400 bg-red-50';

  const containerWidth = size === 'sm' ? 'w-20 md:w-24' : 'w-full';
  const padding = size === 'sm' ? 'p-1.5 md:p-2 text-base md:text-lg' : 'p-3 md:p-4 text-xl md:text-2xl';
  const labelText = size === 'sm' ? 'text-[9px] md:text-[10px]' : 'text-[10px] md:text-xs';

  return (
    <div className={`flex flex-col gap-1 ${containerWidth} transition-all duration-300`}>
      <label className={`${labelText} font-bold text-blue-400 uppercase tracking-wider ml-1`}>
        {label}
      </label>
      <div className="relative group">
        <input
          type="number"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`
            w-full ${padding} font-bold rounded-xl md:rounded-2xl border-2 md:border-4 
            shadow-[0_2px_0_0_rgba(191,219,254,1)] md:shadow-[0_4px_0_0_rgba(191,219,254,1)]
            transition-all duration-200 outline-none 
            focus:ring-2 md:focus:ring-4 focus:ring-blue-200 focus:translate-y-[1px] focus:shadow-none
            ${borderColor} 
            ${alignRight ? 'text-right' : 'text-center'}
            text-blue-900 placeholder:text-blue-100
          `}
        />
        {isCorrect !== null && (
          <div className={`absolute ${size === 'sm' ? '-top-2 -right-2 scale-75' : 'top-1/2 -right-3 -translate-y-1/2'} z-10 animate-bounce`}>
            {isCorrect ? '🌟' : '❌'}
          </div>
        )}
      </div>
    </div>
  );
};
