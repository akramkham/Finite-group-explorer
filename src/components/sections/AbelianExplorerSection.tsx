import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, RotateCcw, Sparkles } from 'lucide-react';
import { AbelianGroupAnalysis, analyzeAbelianGroup } from '../../math/abelianGroups';
import {
  formatPrimeFactorizationLatex,
  gcd,
  primeFactorization,
} from '../../math/numberTheory';
import { ModulePresetPayload } from '../../types/navigation';
import { rowsToCSV } from '../../utils/exportResults';
import { ExportBar } from '../ui/ExportBar';
import { MathTex } from '../ui/MathTex';
import { SectionHeader, StatusIndicator } from '../ui/SectionHeader';
import { SolutionStep, StepSolutionCard } from '../ui/StepSolutionCard';
import { SubgroupLatticeDiagram } from '../ui/SubgroupLatticeDiagram';

interface AbelianExplorerSectionProps {
  onRecordCalculation: (moduleName: string, inputSummary: string, resultSummary: string) => void;
  preset?: ModulePresetPayload['abelian'] & { nonce: number };
}

const PRESETS: { label: string; mode: 'cyclic' | 'product'; input: string }[] = [
  { label: 'Z_12 (Cyclic)', mode: 'cyclic', input: '12' },
  { label: 'Z_2 × Z_2', mode: 'product', input: '2, 2' },
  { label: 'Z_2 × Z_4', mode: 'product', input: '2, 4' },
  { label: 'Z_3 × Z_3', mode: 'product', input: '3, 3' },
  { label: 'Z_4 × Z_6', mode: 'product', input: '4, 6' },
];

export const AbelianExplorerSection: React.FC<AbelianExplorerSectionProps> = ({
  onRecordCalculation,
  preset,
}) => {
  const [mode, setMode] = useState<'cyclic' | 'product'>('product');
  const [cyclicInput, setCyclicInput] = useState('12');
  const [productInput, setProductInput] = useState('2, 2');
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AbelianGroupAnalysis>(() => analyzeAbelianGroup([2, 2]));

  const handleCalculate = (overrideMode?: 'cyclic' | 'product', overrideVal?: string) => {
    setError(null);
    const activeMode = overrideMode ?? mode;
    const raw = (overrideVal ?? (activeMode === 'cyclic' ? cyclicInput : productInput)).trim();

    try {
      if (!raw) {
        throw new Error(
          activeMode === 'cyclic'
            ? 'Input is empty. Enter a positive integer n between 1 and 1000 for Z_n.'
            : 'Input is empty. Enter 1 to 5 positive integer moduli separated by commas (e.g. 4, 6).'
        );
      }

      let moduli: number[];
      if (activeMode === 'cyclic') {
        if (!/^\d+$/.test(raw)) {
          throw new Error(`"${raw}" is not a valid positive integer. Avoid decimals, signs, or letters.`);
        }
        const n = Number(raw);
        if (n < 1 || n > 1000) {
          throw new Error('Cyclic group order n must satisfy 1 ≤ n ≤ 1000.');
        }
        moduli = [n];
      } else {
        const parts = raw
          .split(/[×x,\s]+/)
          .map((s) => s.trim())
          .filter(Boolean);
        if (parts.length === 0 || parts.length > 5) {
          throw new Error('Enter 1 to 5 positive integer moduli separated by commas (e.g. 4, 6).');
        }
        moduli = parts.map((p) => {
          if (!/^\d+$/.test(p)) {
            throw new Error(`Invalid modulus "${p}". Each cyclic factor must be a positive integer.`);
          }
          const val = Number(p);
          if (val < 1 || val > 100) {
            throw new Error(`Factor ${val} is out of range. Each factor must satisfy 1 ≤ n_i ≤ 100.`);
          }
          return val;
        });
      }

      const result = analyzeAbelianGroup(moduli);
      setAnalysis(result);
      onRecordCalculation(
        'Abelian Group Explorer',
        result.groupName,
        `Order ${result.order} · ${result.isCyclic ? 'Cyclic' : 'Non-cyclic'} · Max order ${result.maxElementOrder}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid group specification.');
    }
  };

  useEffect(() => {
    if (!preset) return;
    setMode(preset.mode);
    if (preset.mode === 'cyclic') setCyclicInput(preset.input);
    else setProductInput(preset.input);
    setError(null);
    const parts = preset.input
      .split(/[×x,\s]+/)
      .map((s) => Number(s.trim()))
      .filter((v) => Number.isInteger(v) && v >= 1);
    if (parts.length > 0) {
      setAnalysis(analyzeAbelianGroup(parts));
    }
  }, [preset]);

  const handleReset = () => {
    setMode('cyclic');
    setCyclicInput('12');
    setProductInput('2, 2');
    setError(null);
    setAnalysis(analyzeAbelianGroup([12]));
  };

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    setMode(p.mode);
    if (p.mode === 'cyclic') setCyclicInput(p.input);
    else setProductInput(p.input);
    handleCalculate(p.mode, p.input);
  };

  const solutionSteps: SolutionStep[] = useMemo(() => {
    const factors = primeFactorization(analysis.order);
    const factorTex = formatPrimeFactorizationLatex(factors);
    const pairwisePairs: string[] = [];
    for (let i = 0; i < analysis.moduli.length; i++) {
      for (let j = i + 1; j < analysis.moduli.length; j++) {
        pairwisePairs.push(
          `\\gcd(${analysis.moduli[i]}, ${analysis.moduli[j]}) = ${gcd(analysis.moduli[i], analysis.moduli[j])}`
        );
      }
    }

    return [
      {
        title: 'Group Order & Factorization',
        explanation: `Compute the product of factor orders modulo coordinate dimensions: ${analysis.moduli.join(' × ')} = ${analysis.order}.`,
        formulaTex: `|G| = ${analysis.moduli.join(' \\cdot ')} = ${analysis.order}${factors.length > 0 ? ` = ${factorTex}` : ''}`,
      },
      {
        title: 'Identity Element & Additive Inverses',
        explanation: `Under coordinate-wise addition mod (${analysis.moduli.join(', ')}), adding ${analysis.identityLabel} leaves every tuple unchanged, and the inverse of (a₁, ...) is (-a₁ mod n₁, ...).`,
        formulaTex: `e = ${analysis.identityLabel}, \\qquad -(a_i) \\equiv n_i - a_i \\pmod{n_i}`,
      },
      {
        title: 'Commutativity & Axiom Verification',
        explanation: `Integer addition modulo n_i satisfies a_i + b_i ≡ b_i + a_i (mod n_i) in every coordinate, guaranteeing the group is Abelian. ${analysis.associativityNote}`,
        formulaTex: `(a_1,\\dots,a_k) + (b_1,\\dots,b_k) = (b_1,\\dots,b_k) + (a_1,\\dots,a_k)`,
      },
      {
        title: 'Exponent & Cyclicity Criterion',
        explanation: analysis.isCyclic
          ? `The exponent equals lcm(${analysis.moduli.join(', ')}) = ${analysis.maxElementOrder} = |G|, and factor moduli are pairwise coprime, so G is cyclic with ${analysis.generators.length > 0 ? analysis.generators.length : 'φ(|G|)'} generator(s).`
          : `The exponent is lcm(${analysis.moduli.join(', ')}) = ${analysis.maxElementOrder} < ${analysis.order}, so no element attains order |G| and G cannot be cyclic.`,
        formulaTex: `\\exp(G) = \\operatorname{lcm}(${analysis.moduli.join(', ')}) = ${analysis.maxElementOrder}${pairwisePairs.length > 0 ? `,\\quad ${pairwisePairs.slice(0, 3).join(',\\; ')}` : ''}`,
      },
    ];
  }, [analysis]);

  const exportReport = useMemo(() => {
    return [
      `Group: ${analysis.groupName}`,
      `Order: |G| = ${analysis.order}`,
      `Identity: ${analysis.identityLabel}`,
      `Cyclic: ${analysis.isCyclic ? 'Yes (isomorphic to Z_' + analysis.order + ')' : 'No'}`,
      `Abelian: ${analysis.isAbelian ? 'Yes' : 'No'}`,
      `Exponent (Max Element Order): ${analysis.maxElementOrder}`,
      '',
      'Derivation:',
      ...analysis.explanations.map((e, i) => `${i + 1}. ${e}`),
    ].join('\n');
  }, [analysis]);

  const exportCSV = useMemo(() => {
    if (!analysis.enumerated) return undefined;
    return rowsToCSV(
      ['Element', 'Inverse', 'Order', 'Role'],
      analysis.elements.map((el) => [
        el.label,
        el.inverseLabel,
        el.order,
        el.order === 1 ? 'Identity' : el.order === analysis.order ? 'Generator' : `Order-${el.order} element`,
      ])
    );
  }, [analysis]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Finite Abelian Group Explorer"
        description="Construct cyclic groups Z_n and finite direct products Z_{n₁} × ... × Z_{nₖ} with coordinate-wise modular addition, axiom checks, element orders, and cyclic subgroup lattices."
        formulaTex="G = \mathbb{Z}_{n_1} \times \mathbb{Z}_{n_2} \times \dots \times \mathbb{Z}_{n_k}, \quad |G| = \prod_{i=1}^k n_i"
      />

      {/* Input Panel */}
      <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 sm:p-6 space-y-5 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center p-1 rounded-lg bg-slate-100 dark:bg-[#0B1120] border border-slate-200 dark:border-[#334155]">
            <button
              type="button"
              onClick={() => setMode('cyclic')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                mode === 'cyclic'
                  ? 'bg-white dark:bg-[#7C3AED] text-slate-900 dark:text-[#F8FAFC] shadow-sm'
                  : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
              }`}
            >
              Cyclic Group Z_n
            </button>
            <button
              type="button"
              onClick={() => setMode('product')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                mode === 'product'
                  ? 'bg-white dark:bg-[#7C3AED] text-slate-900 dark:text-[#F8FAFC] shadow-sm'
                  : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
              }`}
            >
              Direct Product Z_n₁ × ... × Z_nₖ
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-[#94A3B8]">Presets:</span>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(p)}
                className="px-2.5 py-1 text-xs font-mono-math rounded-md border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/70 text-slate-700 dark:text-[#F8FAFC] hover:border-[#7C3AED] dark:hover:border-[#22D3EE] hover:text-[#7C3AED] dark:hover:text-[#22D3EE] transition-colors whitespace-nowrap"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
          <div className="flex-1 space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-[#94A3B8]">
              {mode === 'cyclic'
                ? 'Cyclic Group Order n (integer ≥ 1)'
                : 'Direct Product Moduli (comma-separated, e.g. 4, 6 for Z₄ × Z₆)'}
            </label>
            <input
              type="text"
              value={mode === 'cyclic' ? cyclicInput : productInput}
              onChange={(e) =>
                mode === 'cyclic' ? setCyclicInput(e.target.value) : setProductInput(e.target.value)
              }
              onKeyDown={(e) => e.key === 'Enter' && handleCalculate()}
              placeholder={mode === 'cyclic' ? '12' : '4, 6'}
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
              <span>Calculate</span>
            </button>
            <button
              type="button"
              onClick={() => applyPreset(PRESETS[4])}
              className="px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/70 text-slate-700 dark:text-[#F8FAFC] hover:border-[#7C3AED] dark:hover:border-[#22D3EE]/70 text-sm font-medium transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4 text-[#7C3AED] dark:text-[#22D3EE]" />
              <span>Example</span>
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

      {/* Structural Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
          <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Group Structure</div>
          <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-[#F8FAFC] overflow-x-auto">
            <MathTex tex={analysis.groupLatex} />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
          <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Group Order |G|</div>
          <div className="mt-1 text-xl font-semibold font-mono-math text-[#7C3AED] dark:text-[#22D3EE]">
            {analysis.order}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
          <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Identity Element</div>
          <div className="mt-1 text-xl font-semibold font-mono-math text-slate-900 dark:text-[#F8FAFC]">
            {analysis.identityLabel}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
          <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Cyclic?</div>
          <div className="mt-2">
            <StatusIndicator
              status={analysis.isCyclic}
              label={analysis.isCyclic ? 'Cyclic' : 'Not cyclic'}
            />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
          <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Abelian?</div>
          <div className="mt-2">
            <StatusIndicator
              status={analysis.isAbelian}
              label={analysis.isAbelian ? 'Abelian' : 'Non-Abelian'}
            />
          </div>
        </div>
      </div>

      {/* Axiom Verification & Export */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 space-y-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-[#F8FAFC]">
              Axiom & Property Verification
            </h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-[#334155] text-sm">
            <div className="py-2.5 flex items-center justify-between gap-4">
              <span className="text-slate-600 dark:text-[#94A3B8]">Closure</span>
              <StatusIndicator status={analysis.closureSatisfied} />
            </div>
            <div className="py-2.5 flex items-start justify-between gap-4">
              <div>
                <div className="text-slate-600 dark:text-[#94A3B8]">Associativity</div>
                <div className="text-xs text-slate-500 dark:text-[#94A3B8]/80 mt-0.5">
                  {analysis.associativityNote}
                </div>
              </div>
              <StatusIndicator status={analysis.associativityStatus} />
            </div>
            <div className="py-2.5 flex items-center justify-between gap-4">
              <span className="text-slate-600 dark:text-[#94A3B8]">Commutativity</span>
              <StatusIndicator status={analysis.commutativitySatisfied} />
            </div>
            <div className="py-2.5 flex items-center justify-between gap-4">
              <span className="text-slate-600 dark:text-[#94A3B8]">Max Element Order</span>
              <span className="font-mono-math font-semibold text-slate-900 dark:text-[#22D3EE]">
                {analysis.maxElementOrder}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-[#334155]">
            <ExportBar
              reportTitle={`Abelian Group Analysis: ${analysis.groupName}`}
              reportFilename={`abelian_${analysis.moduli.join('x')}.md`}
              reportContent={exportReport}
              csvFilename={exportCSV ? `abelian_elements_${analysis.moduli.join('x')}.csv` : undefined}
              csvContent={exportCSV}
            />
          </div>
        </div>

        <div className="lg:col-span-7">
          <StepSolutionCard
            heading="Step-by-Step Mathematical Proof"
            steps={solutionSteps}
            conclusionTex={`${analysis.groupLatex} ${analysis.isCyclic ? `\\cong \\mathbb{Z}_{${analysis.order}}` : `\\not\\cong \\mathbb{Z}_{${analysis.order}}`}`}
            conclusionText={
              analysis.isCyclic
                ? `${analysis.groupName} is cyclic of order ${analysis.order}.`
                : `${analysis.groupName} is Abelian of order ${analysis.order}, with exponent ${analysis.maxElementOrder} < ${analysis.order}, so it is non-cyclic.`
            }
          />
        </div>
      </div>

      {/* Subgroup Lattice for Cyclic Groups */}
      {analysis.moduli.length === 1 && analysis.order <= 120 && (
        <SubgroupLatticeDiagram n={analysis.moduli[0]} />
      )}

      {/* Element Table */}
      <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 space-y-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-[#F8FAFC]">
            Group Elements, Inverses & Orders
          </h2>
          <span className="text-xs font-mono-math text-slate-500 dark:text-[#94A3B8]">
            {analysis.enumerated
              ? `Showing all ${analysis.elements.length} elements`
              : `Enumeration skipped for |G| = ${analysis.order} (> 256)`}
          </span>
        </div>

        {analysis.enumerated && (
          <div className="overflow-x-auto max-h-96 rounded-lg border border-slate-200 dark:border-[#334155]">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="sticky top-0 bg-slate-50 dark:bg-[#0B1120] border-b border-slate-200 dark:border-[#334155] text-xs text-slate-500 dark:text-[#94A3B8]">
                <tr>
                  <th className="py-2.5 px-3 font-medium">Element g</th>
                  <th className="py-2.5 px-3 font-medium">Inverse -g</th>
                  <th className="py-2.5 px-3 font-medium text-right">Order O(g)</th>
                  <th className="py-2.5 px-3 font-medium">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#334155]">
                {analysis.elements.map((el) => {
                  const isIdentity = el.order === 1;
                  const isGen = el.order === analysis.order;
                  return (
                    <tr
                      key={el.label}
                      className="hover:bg-slate-50 dark:hover:bg-[#0B1120]/50 transition-colors"
                    >
                      <td className="py-2 px-3 font-mono-math font-medium text-slate-900 dark:text-[#F8FAFC]">
                        {el.label}
                      </td>
                      <td className="py-2 px-3 font-mono-math text-slate-600 dark:text-[#94A3B8]">
                        {el.inverseLabel}
                      </td>
                      <td className="py-2 px-3 font-mono-math text-right font-semibold text-[#7C3AED] dark:text-[#22D3EE]">
                        {el.order}
                      </td>
                      <td className="py-2 px-3 text-xs text-slate-500 dark:text-[#94A3B8]">
                        {isIdentity ? 'Identity' : isGen ? 'Generator' : `Subgroup order ${el.order}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
