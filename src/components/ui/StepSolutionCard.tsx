import React from 'react';
import { MathTex } from './MathTex';

export interface SolutionStep {
  title: string;
  explanation: string;
  formulaTex?: string;
}

interface StepSolutionCardProps {
  heading?: string;
  steps: SolutionStep[];
  conclusionTex?: string;
  conclusionText?: string;
}

export const StepSolutionCard: React.FC<StepSolutionCardProps> = ({
  heading = 'Step-by-Step Mathematical Solution',
  steps,
  conclusionTex,
  conclusionText,
}) => {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 sm:p-6 space-y-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
      <h2 className="text-base font-semibold text-slate-900 dark:text-[#F8FAFC]">{heading}</h2>

      <ol className="space-y-3">
        {steps.map((step, idx) => (
          <li
            key={idx}
            className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#0B1120]/75 border border-slate-200/80 dark:border-[#334155] space-y-2"
          >
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-mono-math font-semibold text-[#7C3AED] dark:text-[#22D3EE] shrink-0">
                Step {idx + 1}.
              </span>
              <span className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">
                {step.title}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed">
              {step.explanation}
            </p>
            {step.formulaTex && (
              <div className="px-3 py-2 rounded-md bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-[#334155] text-sm overflow-x-auto text-slate-900 dark:text-[#F8FAFC]">
                <MathTex tex={step.formulaTex} />
              </div>
            )}
          </li>
        ))}
      </ol>

      {(conclusionTex || conclusionText) && (
        <div className="p-3.5 rounded-lg bg-purple-50/70 dark:bg-gradient-to-r dark:from-[#7C3AED]/20 dark:via-[#172554] dark:to-[#22D3EE]/12 border border-purple-200 dark:border-[#7C3AED]/50 space-y-1">
          {conclusionTex && (
            <div className="text-sm text-purple-950 dark:text-[#F8FAFC] overflow-x-auto">
              <MathTex tex={conclusionTex} />
            </div>
          )}
          {conclusionText && (
            <p className="text-xs sm:text-sm text-purple-900/90 dark:text-[#94A3B8] leading-relaxed">
              {conclusionText}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
