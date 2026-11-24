import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, RotateCcw, Sparkles } from 'lucide-react';
import {
  analyzePermutation,
  parsePermutationInput,
  PermutationAnalysis,
  symmetricGroupParitySummary,
} from '../../math/permutations';
import { ModulePresetPayload } from '../../types/navigation';
import { rowsToCSV } from '../../utils/exportResults';
import { ExportBar } from '../ui/ExportBar';
import { SectionHeader } from '../ui/SectionHeader';
import { SolutionStep, StepSolutionCard } from '../ui/StepSolutionCard';

interface ParityAnalyzerSectionProps {
  onRecordCalculation: (moduleName: string, inputSummary: string, resultSummary: string) => void;
  preset?: ModulePresetPayload['parity'] & { nonce: number };
}

export const ParityAnalyzerSection: React.FC<ParityAnalyzerSectionProps> = ({
  onRecordCalculation,
  preset,
}) => {
  const [nVal, setNVal] = useState(5);
  const [permInput, setPermInput] = useState('(1 3 5)(2 4)');
  const [error, setError] = useState<string | null>(null);

  const [analysis, setAnalysis] = useState<PermutationAnalysis>(() =>
    analyzePermutation(parsePermutationInput('(1 3 5)(2 4)', 5))
  );

  const groupParity = useMemo(() => symmetricGroupParitySummary(nVal), [nVal]);

  const handleAnalyze = (overrideN?: number, overridePerm?: string) => {
    setError(null);
    const n = overrideN ?? nVal;
    const raw = overridePerm ?? permInput;
    try {
      const p = parsePermutationInput(raw, n);
      const res = analyzePermutation(p);
      setAnalysis(res);
      onRecordCalculation(
        'Even & Odd Analyzer',
        `${res.cycleNotation} in S_${n}`,
        `${res.parity} (${res.inversionCount} inversions)`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid permutation.');
    }
  };

  useEffect(() => {
    if (!preset) return;
    setNVal(preset.n);
    setPermInput(preset.perm);
    setError(null);
    try {
      setAnalysis(analyzePermutation(parsePermutationInput(preset.perm, preset.n)));
    } catch {
      // ignore invalid preset
    }
  }, [preset]);

  const solutionSteps: SolutionStep[] = useMemo(() => {
    const transDecomp =
      analysis.disjointCycles.length === 0
        ? 'e \\; (0 \\text{ transpositions})'
        : analysis.disjointCycles
            .map((cyc) => {
              if (cyc.length <= 2) return `(${cyc.join('\\;')})`;
              const pairs: string[] = [];
              for (let k = cyc.length - 1; k >= 1; k--) {
                pairs.push(`(${cyc[0]}\\;${cyc[k]})`);
              }
              return pairs.join('');
            })
            .join('\\,');

    return [
      {
        title: 'Inversion Count Method',
        explanation: `Count all ordered index pairs (i < j) where σ(i) > σ(j) in the one-line image [${analysis.image.join(' ')}]. Found ${analysis.inversionCount} inversion(s).`,
        formulaTex: `\\operatorname{inv}(\\sigma) = ${analysis.inversionCount} \\implies (-1)^{\\operatorname{inv}(\\sigma)} = (-1)^{${analysis.inversionCount}} = ${analysis.sign > 0 ? '+1' : '-1'}`,
      },
      {
        title: 'Transposition Factorization Method',
        explanation: `Each k-cycle factors into (k - 1) adjacent/star transpositions. Summing over cycles gives ${analysis.transpositionCount} transposition(s).`,
        formulaTex: `${analysis.cycleNotation} = ${transDecomp}, \\quad (-1)^{${analysis.transpositionCount}} = ${analysis.sign > 0 ? '+1' : '-1'}`,
      },
      {
        title: `Alternating Subgroup Partition of S_${groupParity.n}`,
        explanation: groupParity.steps.join(' '),
        formulaTex:
          groupParity.n === 1
            ? '|S_1| = 1,\\; |A_1| = 1'
            : `|A_{${groupParity.n}}| = \\frac{${groupParity.n}!}{2} = \\frac{${groupParity.totalPermutations}}{2} = ${groupParity.evenCount}`,
      },
    ];
  }, [analysis, groupParity]);

  const exportReport = useMemo(() => {
    return [
      `Parity Analysis for ${analysis.cycleNotation} in S_${analysis.n}`,
      `Classification: ${analysis.parity} Permutation (sgn = ${analysis.sign > 0 ? '+1' : '-1'})`,
      `Inversion Count: ${analysis.inversionCount}`,
      `Transposition Count: ${analysis.transpositionCount}`,
      `Alternating Group |A_${groupParity.n}|: ${groupParity.evenCount} even, ${groupParity.oddCount} odd (total ${groupParity.totalPermutations})`,
      '',
      'Verification Steps:',
      ...analysis.paritySteps.map((s, i) => `${i + 1}. ${s}`),
    ].join('\n');
  }, [analysis, groupParity]);

  const exportCSV = useMemo(() => {
    return rowsToCSV(
      ['i', 'j', 'sigma(i)', 'sigma(j)'],
      analysis.inversions.map((inv) => [inv.i, inv.j, inv.sigmaI, inv.sigmaJ])
    );
  }, [analysis]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Even & Odd Permutation Analyzer"
        description="Count inversions, decompose permutations into transpositions, classify parity as Even or Odd, and verify alternating group counts |Aₙ| = n! / 2."
        formulaTex="\operatorname{sgn}(\sigma) = (-1)^{\operatorname{inv}(\sigma)} = \prod_{1 \le i < j \le n} \frac{\sigma(j) - \sigma(i)}{j - i}"
      />

      {/* Input Card */}
      <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 sm:p-6 space-y-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-3 space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-[#F8FAFC]">
              Symmetric Group S_n
            </label>
            <select
              value={nVal}
              onChange={(e) => {
                const next = Number(e.target.value);
                setNVal(next);
                try {
                  parsePermutationInput(permInput, next);
                  handleAnalyze(next, permInput);
                } catch {
                  const fallback = next === 1 ? 'e' : next === 2 ? '(1 2)' : '(1 2 3)';
                  setPermInput(fallback);
                  handleAnalyze(next, fallback);
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-[#334155] bg-white dark:bg-[#0B1120] text-slate-900 dark:text-[#F8FAFC] font-mono-math text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-[#22D3EE]"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>
                  S_{n}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-5 space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-[#F8FAFC]">
              Permutation (Cycle or One-Line Notation)
            </label>
            <input
              type="text"
              value={permInput}
              onChange={(e) => setPermInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder="(1 3 5)(2 4)"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-[#334155] bg-white dark:bg-[#0B1120] text-slate-900 dark:text-[#F8FAFC] font-mono-math text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-[#22D3EE]"
            />
          </div>

          <div className="md:col-span-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleAnalyze()}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#8B5CF6] hover:to-[#7C3AED] text-[#F8FAFC] text-sm font-medium shadow-sm shadow-[#7C3AED]/25 transition-all inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Calculator className="w-4 h-4" />
              <span>Analyze Parity</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setNVal(5);
                setPermInput('(1 2 3 4 5)');
                handleAnalyze(5, '(1 2 3 4 5)');
              }}
              className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/60 text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-50 dark:hover:bg-[#0B1120] hover:border-purple-400 dark:hover:border-[#22D3EE] text-sm inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
            >
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-[#22D3EE]" />
              <span>S₅ Example</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setNVal(5);
                setPermInput('(1 3 5)(2 4)');
                handleAnalyze(5, '(1 3 5)(2 4)');
              }}
              aria-label="Reset"
              className="p-2.5 rounded-lg border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/60 text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-50 dark:hover:bg-[#0B1120] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-red-300 dark:border-[#EF4444]/60 bg-red-50 dark:bg-[#EF4444]/15 px-4 py-3 text-sm text-red-700 dark:text-[#FCA5A5]">
            {error}
          </div>
        )}
      </div>

      {/* Parity Classification & Inversions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-6 space-y-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#334155]">
              <div>
                <div className="text-xs text-slate-500 dark:text-[#94A3B8]">
                  Classification for {analysis.cycleNotation}
                </div>
                <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-[#F8FAFC]">
                  <span
                    className={
                      analysis.parity === 'Even'
                        ? 'text-emerald-600 dark:text-[#10B981]'
                        : 'text-purple-600 dark:text-[#C4B5FD]'
                    }
                  >
                    {analysis.parity} Permutation
                  </span>{' '}
                  <span className="text-base font-mono-math text-slate-500 dark:text-[#94A3B8]">
                    (sgn = {analysis.sign > 0 ? '+1' : '-1'})
                  </span>
                </div>
              </div>
              <div className="text-right font-mono-math">
                <div className="text-xs text-slate-500 dark:text-[#94A3B8] font-sans">Inversions</div>
                <div className="text-xl font-semibold text-slate-900 dark:text-[#22D3EE]">
                  {analysis.inversionCount}
                </div>
              </div>
            </div>

            <div className="pt-1 space-y-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">
                Detected Inversion Pairs (i &lt; j with σ(i) &gt; σ(j))
              </h3>
              {analysis.inversions.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                  0 inversions — strictly increasing image sequence.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {analysis.inversions.map((inv) => (
                    <span
                      key={`${inv.i}-${inv.j}`}
                      className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-[#0B1120] font-mono-math text-xs text-slate-700 dark:text-[#22D3EE]"
                    >
                      ({inv.i}, {inv.j}): {inv.sigmaI} &gt; {inv.sigmaJ}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-[#334155]">
              <ExportBar
                reportTitle={`Parity Analysis: ${analysis.cycleNotation} in S_${analysis.n}`}
                reportFilename={`parity_S${analysis.n}.md`}
                reportContent={exportReport}
                csvFilename={`inversions_S${analysis.n}.csv`}
                csvContent={exportCSV}
              />
            </div>
          </div>

          <StepSolutionCard
            heading="Step-by-Step Parity & Transposition Proof"
            steps={solutionSteps}
            conclusionTex={`\\operatorname{sgn}(${analysis.cycleNotation}) = ${analysis.sign > 0 ? '+1' : '-1'} \\;(\\text{${analysis.parity}})`}
          />
        </div>

        {/* S_n Even vs Odd Count Card */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-6 space-y-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
          <h2 className="text-base font-semibold text-slate-900 dark:text-[#F8FAFC]">
            Even & Odd Permutations in S_{groupParity.n}
          </h2>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#334155]">
              <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Total |S_{groupParity.n}|</div>
              <div className="mt-1 font-mono-math text-lg font-semibold text-slate-900 dark:text-[#F8FAFC]">
                {groupParity.totalPermutations.toLocaleString()}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#334155]">
              <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Even |A_{groupParity.n}|</div>
              <div className="mt-1 font-mono-math text-lg font-semibold text-emerald-600 dark:text-[#10B981]">
                {groupParity.evenCount.toLocaleString()}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#334155]">
              <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Odd Count</div>
              <div className="mt-1 font-mono-math text-lg font-semibold text-purple-600 dark:text-[#C4B5FD]">
                {groupParity.oddCount.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-[#334155]">
            <h3 className="text-xs font-medium text-slate-500 dark:text-[#94A3B8]">
              Mathematical Proof & Verification
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-[#94A3B8] leading-relaxed">
              {groupParity.steps.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
