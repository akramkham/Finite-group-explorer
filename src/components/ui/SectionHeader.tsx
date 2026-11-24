import React from 'react';
import { CheckCircle2, HelpCircle, XCircle } from 'lucide-react';
import { PropertyStatus } from '../../math/cayleyAndProperties';
import { MathTex } from './MathTex';

interface StatusIndicatorProps {
  status: PropertyStatus | boolean;
  label?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, label }) => {
  const normalized: PropertyStatus =
    typeof status === 'boolean' ? (status ? 'satisfied' : 'not_satisfied') : status;

  if (normalized === 'satisfied') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-[#10B981]">
        <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>{label ?? 'Satisfied'}</span>
      </span>
    );
  }

  if (normalized === 'not_satisfied') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 dark:text-[#EF4444]">
        <XCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>{label ?? 'Not satisfied'}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-[#F59E0B]">
      <HelpCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span>{label ?? 'Unable to verify'}</span>
    </span>
  );
};

interface SectionHeaderProps {
  title: string;
  description: string;
  formulaTex?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, description, formulaTex }) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-[#334155]">
      <div className="space-y-1.5 max-w-3xl">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-[#F8FAFC] text-balance">
          {title}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-[#94A3B8] leading-relaxed">
          {description}
        </p>
      </div>
      {formulaTex && (
        <div className="px-4 py-2.5 rounded-xl bg-white dark:bg-gradient-to-r dark:from-[#172554] dark:to-[#111827] border border-slate-200 dark:border-[#7C3AED]/45 text-slate-800 dark:text-[#F8FAFC] text-sm shrink-0 overflow-x-auto shadow-[0_6px_20px_-10px_rgba(34,211,238,0.28)]">
          <MathTex tex={formulaTex} />
        </div>
      )}
    </div>
  );
};
