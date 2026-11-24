import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, RotateCcw, Sparkles } from 'lucide-react';
import { AbelianClassificationResult, classifyAbelianGroups } from '../../math/abelianGroups';
import { formatPrimeFactorizationLatex } from '../../math/numberTheory';
import { ModulePresetPayload } from '../../types/navigation';
import { rowsToCSV } from '../../utils/exportResults';
import { ExportBar } from '../ui/ExportBar';
import { MathTex } from '../ui/MathTex';
import { SectionHeader, StatusIndicator } from '../ui/SectionHeader';
import { SolutionStep, StepSolutionCard } from '../ui/StepSolutionCard';

interface ClassificationSectionProps {
  onRecordCalculation: (moduleName: string, inputSummary: string, resultSummary: string) => void;
  preset?: ModulePresetPayload['classification'] & { nonce: number };
}

export const ClassificationSection: React.FC<ClassificationSectionProps> = ({
  onRecordCalculation,
  preset,
}) => {
  const [inputN, setInputN] = useState('72');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AbelianClassificationResult>(() =>
    classifyAbelianGroups(72)
  );

  const handleCalculate = (overrideVal?: string) => {
    setError(null);
    const raw = (overrideVal ?? inputN).trim();
    if (!raw) {
      setError('Enter a positive integer n (for example, 72).');
      return;
    }
    if (!/^\d+$/.test(raw)) {
      setError(`"${raw}" is not a positive integer. Decimals, negative numbers, and symbols are not valid group orders.`);
      return;
    }
    const n = Number(raw);
    if (n < 1 || n > 1000000) {
      setError('Group order n must satisfy 1 ≤ n ≤ 1,000,000.');
      return;
    }
    try {
      const cls = classifyAbelianGroups(n);
      if (cls.totalClasses > 1000) {
        setError(`Order ${n} produces ${cls.totalClasses} classes; choose n with ≤ 1000 classes for interactive display.`);
        return;
      }
      setResult(cls);
      onRecordCalculation(
        'Group Classification',
        `Abelian groups of order ${n}`,
        `${cls.totalClasses} isomorphism class${cls.totalClasses === 1 ? '' : 'es'} (${cls.primeFactorizationText})`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Classification failed.');
    }
  };

  useEffect(() => {
    if (!preset) return;
    setInputN(preset.n);
    setError(null);
    const n = Number(preset.n.trim());
    if (Number.isInteger(n) && n >= 1 && n <= 1000000) {
      setResult(classifyAbelianGroups(n));
    }
  }, [preset]);

  const handleExample72 = () => {
    setInputN('72');
    handleCalculate('72');
  };

  const handleReset = () => {
    setInputN('24');
    handleCalculate('24');
  };

  const solutionSteps: SolutionStep[] = useMemo(() => {
    if (result.n === 1) {
      return [
        {
          title: 'Trivial Group Identity',
          explanation: 'Order n = 1 has only the identity element, yielding one isomorphism class.',
          formulaTex: 'n = 1 \\implies |\\text{Classes}| = 1,\\quad G \\cong \\mathbb{Z}_1 = \\{e\\}',
        },
      ];
    }

    const factorTex = formatPrimeFactorizationLatex(result.primeFactors);
    const partProdTex = result.partitionCounts.map((pc) => `p(${pc.exponent})`).join(' \\cdot ');
    const partValTex = result.partitionCounts.map((pc) => pc.count).join(' \\cdot ');
    const partDesc = result.partitionCounts
      .map(
        (pc) =>
          `for p=${pc.prime} with e=${pc.exponent}: p(${pc.exponent})=${pc.count} [${pc.partitions.map((pt) => pt.join('+')).join(', ')}]`
      )
      .join('; ');

    return [
      {
        title: 'Prime-Power Factorization',
        explanation: `Decompose order n = ${result.n} into distinct prime powers via trial division.`,
        formulaTex: `${result.n} = ${factorTex}`,
      },
      {
        title: 'Integer Partitions of Each Exponent',
        explanation: `Count all integer partitions for each exponent: ${partDesc}.`,
        formulaTex: `\\text{Total Classes} = ${partProdTex} = ${partValTex} = ${result.totalClasses}`,
      },
      {
        title: 'Elementary Divisors to Invariant Factors',
        explanation:
          'Each choice of partitions defines prime-power cyclic factors (elementary divisors). Aligning partition parts from smallest to largest across primes and multiplying across columns yields unique divisibility chains d₁ | d₂ | ... | d_m.',
        formulaTex: `\\prod_{j=1}^m d_j = ${result.n}, \\qquad d_1 \\mid d_2 \\mid \\dots \\mid d_m`,
      },
    ];
  }, [result]);

  const exportReport = useMemo(() => {
    return [
      `Finite Abelian Group Classification for Order n = ${result.n}`,
      `Prime Factorization: ${result.n} = ${result.primeFactorizationText}`,
      `Total Non-Isomorphic Classes: ${result.totalClasses}`,
      '',
      'Classes:',
      ...result.classes.map(
        (c) =>
          `${c.index}. Invariant: ${c.invariantNotation} | Elementary: ${c.elementaryNotation} | Max Order: ${c.maxElementOrder} | ${c.isCyclic ? 'Cyclic' : 'Non-cyclic'}`
      ),
    ].join('\n');
  }, [result]);

  const exportCSV = useMemo(() => {
    return rowsToCSV(
      ['Class_Index', 'Invariant_Factors', 'Elementary_Divisors', 'Max_Element_Order', 'Cyclic', 'Verified_Order'],
      result.classes.map((c) => [
        c.index,
        c.invariantNotation,
        c.elementaryNotation,
        c.maxElementOrder,
        c.isCyclic ? 'Yes' : 'No',
        c.verifiedOrder,
      ])
    );
  }, [result]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Finite Abelian Group Classification"
        description="Algorithmically classify all finite Abelian groups of order n up to isomorphism using the Fundamental Theorem of Finite Abelian Groups."
        formulaTex="G \cong \mathbb{Z}_{d_1} \times \dots \times \mathbb{Z}_{d_m}, \quad d_1 \mid d_2 \mid \dots \mid d_m"
      />

      {/* Input Card */}
      <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 sm:p-6 space-y-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-[#94A3B8]">Quick orders:</span>
          {[8, 12, 24, 36, 72, 100, 144].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => {
                setInputN(String(val));
                handleCalculate(String(val));
              }}
              className="px-2.5 py-1 text-xs font-mono-math rounded-md border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/70 text-slate-700 dark:text-[#F8FAFC] hover:border-[#7C3AED] dark:hover:border-[#22D3EE] hover:text-[#7C3AED] dark:hover:text-[#22D3EE] transition-colors"
            >
              n = {val}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
          <div className="flex-1 space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-[#94A3B8]">
              Group Order n (positive integer)
            </label>
            <input
              type="number"
              min={1}
              max={1000000}
              value={inputN}
              onChange={(e) => setInputN(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCalculate()}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-[#334155] bg-white dark:bg-[#0B1120] text-slate-900 dark:text-[#F8FAFC] font-mono-math text-sm focus:outline-none focus:ring-2 focus:ring-[#22D3EE]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleCalculate()}
              className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#8B5CF6] hover:to-[#7C3AED] text-[#F8FAFC] text-sm font-medium transition-all shadow-[0_6px_16px_-6px_rgba(124,58,237,0.65)] inline-flex items-center gap-2 whitespace-nowrap"
            >
              <Calculator className="w-4 h-4" />
              <span>Classify</span>
            </button>
            <button
              type="button"
              onClick={handleExample72}
              className="px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/70 text-slate-700 dark:text-[#F8FAFC] hover:border-[#7C3AED] dark:hover:border-[#22D3EE]/70 text-sm font-medium transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4 text-[#7C3AED] dark:text-[#22D3EE]" />
              <span>Example (n = 72)</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/70 text-slate-700 dark:text-[#F8FAFC] hover:border-[#7C3AED] dark:hover:border-[#22D3EE]/70 text-sm font-medium transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-red-300 dark:border-[#EF4444]/60 bg-red-50 dark:bg-[#EF4444]/15 px-4 py-3 text-sm text-red-700 dark:text-[#FCA5A5]">
            {error}
          </div>
        )}
      </div>

      {/* Summary & Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 space-y-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
          <div className="space-y-1">
            <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Prime Factorization</div>
            <div className="text-xl font-semibold text-slate-900 dark:text-[#F8FAFC] overflow-x-auto">
              <MathTex tex={`${result.n} = ${formatPrimeFactorizationLatex(result.primeFactors)}`} />
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-[#334155] space-y-1">
            <div className="text-xs text-slate-500 dark:text-[#94A3B8]">
              Distinct Isomorphism Classes
            </div>
            <div className="text-3xl font-semibold font-mono-math text-[#7C3AED] dark:text-[#22D3EE]">
              {result.totalClasses}
            </div>
          </div>
          {result.partitionCounts.length > 0 && (
            <div className="pt-3 border-t border-slate-100 dark:border-[#334155] space-y-2">
              <div className="text-xs text-slate-500 dark:text-[#94A3B8]">
                Partition Breakdown
              </div>
              <div className="space-y-1.5 text-xs font-mono-math text-slate-700 dark:text-[#F8FAFC]">
                {result.partitionCounts.map((pc) => (
                  <div key={pc.prime} className="flex items-center justify-between">
                    <span>
                      p={pc.prime}, e={pc.exponent}
                    </span>
                    <span className="text-[#7C3AED] dark:text-[#22D3EE]">
                      p({pc.exponent}) = {pc.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="pt-3 border-t border-slate-100 dark:border-[#334155]">
            <ExportBar
              reportTitle={`Abelian Classification for n = ${result.n}`}
              reportFilename={`abelian_classification_${result.n}.md`}
              reportContent={exportReport}
              csvFilename={`abelian_classification_${result.n}.csv`}
              csvContent={exportCSV}
            />
          </div>
        </div>

        <div className="lg:col-span-8">
          <StepSolutionCard
            heading="Step-by-Step Classification Process"
            steps={solutionSteps}
            conclusionTex={`|\\text{Abelian}(${result.n})| = ${result.totalClasses}`}
            conclusionText={`Every finite Abelian group of order ${result.n} is isomorphic to exactly one of the ${result.totalClasses} group(s) tabulated below.`}
          />
        </div>
      </div>

      {/* Classification Table */}
      <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 space-y-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-[#F8FAFC]">
            Complete Isomorphism Classes of Order {result.n}
          </h2>
          <span className="text-xs font-mono-math text-slate-500 dark:text-[#94A3B8]">
            Invariant Factors & Elementary Divisors
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-[#334155]">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#0B1120] border-b border-slate-200 dark:border-[#334155] text-xs text-slate-500 dark:text-[#94A3B8]">
                <th className="py-2.5 px-3 font-medium">#</th>
                <th className="py-2.5 px-3 font-medium">Invariant Factor Decomposition</th>
                <th className="py-2.5 px-3 font-medium">Elementary Divisor Decomposition</th>
                <th className="py-2.5 px-3 font-medium text-right">Max Order</th>
                <th className="py-2.5 px-3 font-medium">Cyclic</th>
                <th className="py-2.5 px-3 font-medium">Order Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#334155]">
              {result.classes.map((cls) => (
                <tr key={cls.index} className="hover:bg-slate-50 dark:hover:bg-[#0B1120]/50 transition-colors">
                  <td className="py-3 px-3 font-mono-math text-slate-500 dark:text-[#94A3B8]">
                    {cls.index}
                  </td>
                  <td className="py-3 px-3 text-slate-900 dark:text-[#F8FAFC] font-medium whitespace-nowrap">
                    <MathTex tex={cls.invariantLatex} />
                  </td>
                  <td className="py-3 px-3 text-slate-700 dark:text-[#94A3B8] whitespace-nowrap">
                    <MathTex tex={cls.elementaryLatex} />
                  </td>
                  <td className="py-3 px-3 font-mono-math text-right text-[#7C3AED] dark:text-[#22D3EE] font-semibold">
                    {cls.maxElementOrder}
                  </td>
                  <td className="py-3 px-3">
                    <StatusIndicator
                      status={cls.isCyclic}
                      label={cls.isCyclic ? 'Cyclic' : 'Non-cyclic'}
                    />
                  </td>
                  <td className="py-3 px-3 font-mono-math text-xs text-emerald-700 dark:text-[#10B981] whitespace-nowrap">
                    ∏ = {cls.verifiedOrder} (Verified)
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
