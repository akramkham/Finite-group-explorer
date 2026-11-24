import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { copyTextToClipboard } from '../../utils/exportResults';

interface ExportBarProps {
  reportTitle?: string;
  reportFilename?: string;
  reportContent: string;
  csvFilename?: string;
  csvContent?: string;
  jsonFilename?: string;
  jsonData?: unknown;
}

export const ExportBar: React.FC<ExportBarProps> = ({ reportContent }) => {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const handleCopy = async () => {
    setCopyError(false);
    const ok = await copyTextToClipboard(reportContent);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } else {
      setCopyError(true);
      window.setTimeout(() => setCopyError(false), 2500);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleCopy}
        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/70 text-xs font-medium text-slate-700 dark:text-[#F8FAFC] hover:border-[#7C3AED] dark:hover:border-[#22D3EE]/70 inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-[#10B981]" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-[#7C3AED] dark:text-[#22D3EE]" />
        )}
        <span>{copied ? 'Copied' : copyError ? 'Clipboard blocked' : 'Copy Result'}</span>
      </button>
    </div>
  );
};


