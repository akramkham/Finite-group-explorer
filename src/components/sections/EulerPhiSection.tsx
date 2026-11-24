import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, RotateCcw, Sparkles } from 'lucide-react';
import {
  eulerPhi,
  EulerPhiResult,
  formatPrimeFactorization,
  formatPrimeFactorizationLatex,
} from '../../math/numberTheory';
import { ModulePresetPayload } from '../../types/navigation';
import { rowsToCSV } from '../../utils/exportResults';
import { ExportBar } from '../ui/ExportBar';
import { MathTex } from '../ui/MathTex';
import { SectionHeader } from '../ui/SectionHeader';
import { SolutionStep, StepSolutionCard } from '../ui/StepSolutionCard';

interface EulerPhiSectionProps {
  onRecordCalculation: (moduleName: string, inputSummary: string, resultSummary: string) => void;
  preset?: ModulePresetPayload['eulerPhi'] & { nonce: number };
}

export const EulerPhiSection: React.FC<EulerPhiSectionProps> = ({
  onRecordCalculation,
  preset,
}) => {
  const [inputN, setInputN] = useState('12');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EulerPhiResult>(() => eulerPhi(12));

  const handleCalculate = (override?: string) => {
    setError(null);
    const raw = (override ?? inputN).trim();
    if (!/^\d+$/.test(raw)) {
      setError('Enter a valid positive integer n between 1 and 1,000,000.');
      return;
    }
    const val = Number(raw);
    if (val < 1 || val > 1000000) {
      setError('Input n must satisfy 1 ≤ n ≤ 1,000,000.');
      return;
    }
    const res = eulerPhi(val);
    setResult(res);
    onRecordCalculation(
      'Euler Phi Calculator',
      `φ(${val})`,
      `φ(${val}) = ${res.phi} (${formatPrimeFactorization(res.primeFactors)})`
    );
  };

  useEffect(() => {
    if (!preset) return;
    setInputN(preset.n);
    setError(null);
    const val = Number(preset.n.trim());
    if (Number.isInteger(val) && val >= 1 && val <= 1000000) {
      setResult(eulerPhi(val));
    }
  }, [preset]);

  const table1To20 = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => eulerPhi(i + 1));
  }, []);

  const solutionSteps: SolutionStep[] = useMemo(() => {
    if (result.n === 1) {
      return [
        {
          title: 'Base Case n = 1',
          explanation: 'By definition gcd(1, 1) = 1, so φ(1) = 1.',
          formulaTex: '\\varphi(1) = 1',
        },
      ];
    }
    const factorTex = formatPrimeFactorizationLatex(result.primeFactors);
    const primePowerSteps = result.primeFactors
      .map((pf) => {
        const val = Math.pow(pf.prime, pf.exponent) - Math.pow(pf.prime, pf.exponent - 1);
        return `\\varphi(${pf.prime}^{${pf.exponent}}) = ${pf.prime}^{${pf.exponent}} - ${pf.prime}^{${pf.exponent - 1}} = ${val}`;
      })
      .join(',\\; ');

    return [
      {
        title: 'Prime-Power Factorization',
        explanation: `Factorize n = ${result.n} uniquely into prime powers.`,
        formulaTex: `${result.n} = ${factorTex}`,
      },
      {
        title: 'Multiplicativity Across Coprime Prime Powers',
        explanation: 'Evaluate φ(p^e) = p^e - p^{e-1} for each distinct prime factor.',
        formulaTex: primePowerSteps,
      },
      {
        title: 'Multiply Factor Values & Cross-Check Generators',
        explanation: `Combining factors yields φ(${result.n}) = ${result.phi}, which also equals the exact number of generators in Z_${result.n} and |U(${result.n})|.`,
        formulaTex: `${result.formulaExpression} = ${result.formulaEvaluation}`,
      },
    ];
  }, [result]);

  const exportReport = useMemo(() => {
    return [
      `Euler's Totient Function φ(${result.n})`,
      `Prime Factorization: ${result.n} = ${formatPrimeFactorization(result.primeFactors)}`,
      `Totient Value: φ(${result.n}) = ${result.phi}`,
      `Generators of Z_${result.n}: ${result.phi}`,
      result.coprimes.length > 0 ? `Coprimes: { ${result.coprimes.join(', ')} }` : 'Coprime list omitted for n > 2000.',
      '',
      'Steps:',
      ...result.steps.map((s, i) => `${i + 1}. ${s}`),
    ].join('\n');
  }, [result]);

  const exportCSV = useMemo(() => {
    if (result.coprimes.length > 0) {
      return rowsToCSV(
        ['n', 'Coprime_Integer_k', 'gcd(n,k)'],
        result.coprimes.map((k) => [result.n, k, 1])
      );
    }
    return rowsToCSV(
      ['n', 'Prime_Factorization', 'phi(n)'],
      table1To20.map((r) => [r.n, formatPrimeFactorization(r.primeFactors), r.phi])
    );
  }, [result, table1To20]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Euler Phi Function Calculator"
        description="Compute φ(n), prime power factorization, coprime integers, and compare directly with the number of generators of Z_n."
        formulaTex="\varphi(n) = \prod_{i=1}^r \left(p_i^{e_i} - p_i^{e_i - 1}\right)"
      />

      {/* Input */}
      <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 sm:p-6 space-y-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
          <div className="flex-1 space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-[#F8FAFC]">
              Positive Integer n (1 ≤ n ≤ 1,000,000)
            </label>
            <input
              type="number"
              min={1}
              max={1000000}
              value={inputN}
              onChange={(e) => setInputN(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCalculate()}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-[#334155] bg-white dark:bg-[#0B1120] text-slate-900 dark:text-[#F8FAFC] font-mono-math text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-[#22D3EE]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleCalculate()}
              className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#8B5CF6] hover:to-[#7C3AED] text-[#F8FAFC] text-sm font-medium shadow-sm shadow-[#7C3AED]/25 transition-all inline-flex items-center gap-2 whitespace-nowrap"
            >
              <Calculator className="w-4 h-4" />
              <span>Calculate φ(n)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setInputN('36');
                handleCalculate('36');
              }}
              className="px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/60 text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-50 dark:hover:bg-[#0B1120] hover:border-purple-400 dark:hover:border-[#22D3EE] text-sm inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
            >
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-[#22D3EE]" />
              <span>Example (36)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setInputN('4');
                handleCalculate('4');
              }}
              className="px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/60 text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-50 dark:hover:bg-[#0B1120] text-sm inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset (4)</span>
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-red-300 dark:border-[#EF4444]/60 bg-red-50 dark:bg-[#EF4444]/15 px-4 py-3 text-sm text-red-700 dark:text-[#FCA5A5]">
            {error}
          </div>
        )}
      </div>

      {/* Output & Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-6 space-y-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#334155]">
              <div>
                <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Euler's Totient Value</div>
                <div className="mt-1 text-3xl font-semibold font-mono-math text-purple-600 dark:text-[#22D3EE]">
                  φ({result.n}) = {result.phi.toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Generators of Z_{result.n}</div>
                <div className="mt-1 text-lg font-semibold font-mono-math text-slate-900 dark:text-[#F8FAFC]">
                  {result.phi.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#334155] overflow-x-auto text-slate-900 dark:text-[#F8FAFC]">
              <MathTex tex={`${result.formulaExpression} = ${result.formulaEvaluation}`} display />
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-[#334155]">
              <ExportBar
                reportTitle={`Euler Phi Calculation φ(${result.n})`}
                reportFilename={`euler_phi_${result.n}.md`}
                reportContent={exportReport}
                csvFilename={`coprimes_${result.n}.csv`}
                csvContent={exportCSV}
              />
            </div>
          </div>

          <StepSolutionCard
            heading="Step-by-Step Totient Derivation"
            steps={solutionSteps}
            conclusionTex={`\\varphi(${result.n}) = ${result.phi}`}
          />
        </div>

        <div className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-6 space-y-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-[#F8FAFC]">
              Coprime Integers in {'{1, ..., '}{result.n}{'}'}
            </h2>
            <span className="text-xs font-mono-math text-slate-500 dark:text-[#94A3B8]">
              {result.coprimes.length > 0 ? `${result.coprimes.length} integers` : 'Displayed for n ≤ 2000'}
            </span>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#334155] font-mono-math text-xs text-slate-800 dark:text-[#F8FAFC] max-h-60 overflow-y-auto leading-relaxed">
            {result.coprimes.length > 0
              ? result.coprimes.join(', ')
              : `n = ${result.n} exceeds 2000; exact coprime count computed analytically via prime factorization as ${result.phi.toLocaleString()}.`}
          </div>

          <p className="text-xs text-slate-500 dark:text-[#94A3B8] leading-relaxed">
            In the cyclic group <MathTex tex={`\\mathbb{Z}_{${result.n}}`} />, each element <MathTex tex="k" /> with <MathTex tex={`\\gcd(k, ${result.n}) = 1`} /> (and <MathTex tex="0" /> for <MathTex tex="n=1" />) generates the entire group, so the multiplicative group of units <MathTex tex={`U(${result.n})`} /> has order <MathTex tex={`\\varphi(${result.n}) = ${result.phi}`} />.
          </p>
        </div>
      </div>

      {/* Table n = 1 to 20 */}
      <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 space-y-3 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
        <h2 className="text-base font-semibold text-slate-900 dark:text-[#F8FAFC]">
          Euler Phi Reference Table (n = 1 to 20)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm font-mono-math">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-[#0B1120] text-xs text-slate-500 dark:text-[#94A3B8] font-sans">
                <th className="py-2 px-3 font-medium">n</th>
                <th className="py-2 px-3 font-medium">Factorization</th>
                <th className="py-2 px-3 font-medium text-right">φ(n)</th>
                <th className="py-2 px-3 font-medium">Coprimes ≤ n</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#334155]">
              {table1To20.map((row) => (
                <tr key={row.n} className="hover:bg-slate-50 dark:hover:bg-[#0B1120]/50 transition-colors">
                  <td className="py-2 px-3 font-semibold text-slate-900 dark:text-[#F8FAFC]">{row.n}</td>
                  <td className="py-2 px-3 text-slate-600 dark:text-[#94A3B8]">
                    {formatPrimeFactorization(row.primeFactors)}
                  </td>
                  <td className="py-2 px-3 text-right font-semibold text-purple-600 dark:text-[#22D3EE]">
                    {row.phi}
                  </td>
                  <td className="py-2 px-3 text-slate-700 dark:text-[#F8FAFC]">
                    {row.coprimes.join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
