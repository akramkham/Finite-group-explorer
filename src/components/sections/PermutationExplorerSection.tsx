import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, RotateCcw, Sparkles } from 'lucide-react';
import { factorial } from '../../math/numberTheory';
import {
  analyzePermutation,
  composePermutations,
  generateSymmetricGroup,
  parsePermutationInput,
  PermutationAnalysis,
} from '../../math/permutations';
import { ModulePresetPayload } from '../../types/navigation';
import { rowsToCSV } from '../../utils/exportResults';
import { ExportBar } from '../ui/ExportBar';
import { SectionHeader } from '../ui/SectionHeader';
import { SolutionStep, StepSolutionCard } from '../ui/StepSolutionCard';

interface PermutationExplorerSectionProps {
  onRecordCalculation: (moduleName: string, inputSummary: string, resultSummary: string) => void;
  preset?: ModulePresetPayload['permutations'] & { nonce: number };
}

export const PermutationExplorerSection: React.FC<PermutationExplorerSectionProps> = ({
  onRecordCalculation,
  preset,
}) => {
  const [nVal, setNVal] = useState(4);
  const [sigmaInput, setSigmaInput] = useState('(1 2 3)');
  const [tauInput, setTauInput] = useState('(2 3 4)');
  const [error, setError] = useState<string | null>(null);

  const [sigmaAnalysis, setSigmaAnalysis] = useState<PermutationAnalysis>(() =>
    analyzePermutation(parsePermutationInput('(1 2 3)', 4))
  );
  const [tauAnalysis, setTauAnalysis] = useState<PermutationAnalysis>(() =>
    analyzePermutation(parsePermutationInput('(2 3 4)', 4))
  );
  const [compAnalysis, setCompAnalysis] = useState<PermutationAnalysis>(() => {
    const s = parsePermutationInput('(1 2 3)', 4);
    const t = parsePermutationInput('(2 3 4)', 4);
    return analyzePermutation(composePermutations(s, t));
  });

  const handleCompute = (overrideN?: number, overrideSigma?: string, overrideTau?: string) => {
    setError(null);
    const n = overrideN ?? nVal;
    const sRaw = overrideSigma ?? sigmaInput;
    const tRaw = overrideTau ?? tauInput;
    try {
      const s = parsePermutationInput(sRaw, n);
      const t = parsePermutationInput(tRaw, n);
      const sA = analyzePermutation(s);
      const tA = analyzePermutation(t);
      const cA = analyzePermutation(composePermutations(s, t));

      setSigmaAnalysis(sA);
      setTauAnalysis(tA);
      setCompAnalysis(cA);

      onRecordCalculation(
        'Permutation Explorer',
        `${sA.cycleNotation} ∘ ${tA.cycleNotation} in S_${n}`,
        `${cA.cycleNotation} · Order ${cA.order} · ${cA.parity}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid permutation input.');
    }
  };

  useEffect(() => {
    if (!preset) return;
    setNVal(preset.n);
    setSigmaInput(preset.sigma);
    setTauInput(preset.tau);
    setError(null);
    try {
      const s = parsePermutationInput(preset.sigma, preset.n);
      const t = parsePermutationInput(preset.tau, preset.n);
      setSigmaAnalysis(analyzePermutation(s));
      setTauAnalysis(analyzePermutation(t));
      setCompAnalysis(analyzePermutation(composePermutations(s, t)));
    } catch {
      // ignore invalid preset
    }
  }, [preset]);

  const reverseComp = useMemo(
    () => analyzePermutation(composePermutations(tauAnalysis.image, sigmaAnalysis.image)),
    [sigmaAnalysis, tauAnalysis]
  );

  const groupElements = useMemo(() => {
    if (nVal > 4) return [];
    return generateSymmetricGroup(nVal);
  }, [nVal]);

  const handleReset = () => {
    setNVal(4);
    setSigmaInput('(1 2 3)');
    setTauInput('(2 3 4)');
    handleCompute(4, '(1 2 3)', '(2 3 4)');
  };

  const solutionSteps: SolutionStep[] = useMemo(() => {
    const cycleLengths = compAnalysis.disjointCycles.map((c) => c.length);
    const traceStr = compAnalysis.twoLineTop
      .slice(0, 4)
      .map((x, idx) => `${x} \\mapsto ${tauAnalysis.image[idx]} \\mapsto ${compAnalysis.image[idx]}`)
      .join(',\\; ');

    return [
      {
        title: 'Right-to-Left Function Evaluation (σ ∘ τ)',
        explanation: `Evaluate (σ ∘ τ)(x) = σ(τ(x)) for every x ∈ {1, ..., ${compAnalysis.n}} by applying τ first and then σ.`,
        formulaTex: `${traceStr}${compAnalysis.n > 4 ? ',\\; \\dots' : ''}`,
      },
      {
        title: 'Disjoint Cycle Decomposition',
        explanation: `Follow orbits of elements moved by σ ∘ τ to factor the image [${compAnalysis.image.join(' ')}] into disjoint cycles.`,
        formulaTex: `${sigmaAnalysis.cycleNotation} \\circ ${tauAnalysis.cycleNotation} = ${compAnalysis.cycleNotation}`,
      },
      {
        title: 'Element Order via LCM of Cycle Lengths',
        explanation:
          cycleLengths.length === 0
            ? 'The product is the identity e, which has order 1.'
            : `The order of a permutation in disjoint cycle form equals the least common multiple of its cycle lengths (${cycleLengths.join(', ')}).`,
        formulaTex:
          cycleLengths.length === 0
            ? 'O(e) = 1'
            : `O(${compAnalysis.cycleNotation}) = \\operatorname{lcm}(${cycleLengths.join(', ')}) = ${compAnalysis.order}`,
      },
      {
        title: 'Inverse Construction & Commutativity Check',
        explanation: `Reverse the direction of each disjoint cycle to obtain (σ ∘ τ)⁻¹ = ${compAnalysis.inverseCycleNotation}. Reversing the order gives τ ∘ σ = ${reverseComp.cycleNotation}.`,
        formulaTex: `(\\sigma \\circ \\tau)^{-1} = ${compAnalysis.inverseCycleNotation}, \\qquad \\tau \\circ \\sigma = ${reverseComp.cycleNotation}`,
      },
    ];
  }, [sigmaAnalysis, tauAnalysis, compAnalysis, reverseComp]);

  const exportReport = useMemo(() => {
    return [
      `Symmetric Group S_${compAnalysis.n}`,
      `σ = ${sigmaAnalysis.cycleNotation} (order ${sigmaAnalysis.order}, ${sigmaAnalysis.parity}, inverse ${sigmaAnalysis.inverseCycleNotation})`,
      `τ = ${tauAnalysis.cycleNotation} (order ${tauAnalysis.order}, ${tauAnalysis.parity}, inverse ${tauAnalysis.inverseCycleNotation})`,
      `σ ∘ τ = ${compAnalysis.cycleNotation} (order ${compAnalysis.order}, ${compAnalysis.parity}, inverse ${compAnalysis.inverseCycleNotation})`,
      `τ ∘ σ = ${reverseComp.cycleNotation}`,
      `Image vector of σ ∘ τ: [${compAnalysis.image.join(' ')}]`,
    ].join('\n');
  }, [sigmaAnalysis, tauAnalysis, compAnalysis, reverseComp]);

  const exportCSV = useMemo(() => {
    if (groupElements.length === 0) {
      return rowsToCSV(
        ['Symbol', 'Cycle_Notation', 'One_Line_Image', 'Inverse', 'Order', 'Parity', 'Sign'],
        [
          ['sigma', sigmaAnalysis.cycleNotation, sigmaAnalysis.image.join(' '), sigmaAnalysis.inverseCycleNotation, sigmaAnalysis.order, sigmaAnalysis.parity, sigmaAnalysis.sign],
          ['tau', tauAnalysis.cycleNotation, tauAnalysis.image.join(' '), tauAnalysis.inverseCycleNotation, tauAnalysis.order, tauAnalysis.parity, tauAnalysis.sign],
          ['sigma o tau', compAnalysis.cycleNotation, compAnalysis.image.join(' '), compAnalysis.inverseCycleNotation, compAnalysis.order, compAnalysis.parity, compAnalysis.sign],
        ]
      );
    }
    return rowsToCSV(
      ['Cycle_Notation', 'One_Line', 'Inverse', 'Order', 'Parity'],
      groupElements.map((el) => [el.cycleNotation, el.image.join(' '), el.inverseCycleNotation, el.order, el.parity])
    );
  }, [groupElements, sigmaAnalysis, tauAnalysis, compAnalysis]);

  const renderTwoLine = (p: PermutationAnalysis) => (
    <div className="inline-flex flex-col font-mono-math text-xs sm:text-sm bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#334155] rounded-lg px-3 py-2 overflow-x-auto max-w-full">
      <div className="flex gap-3 border-b border-slate-200 dark:border-[#334155] pb-1 text-slate-500 dark:text-[#94A3B8]">
        {p.twoLineTop.map((v) => (
          <span key={v} className="w-5 text-center shrink-0">
            {v}
          </span>
        ))}
      </div>
      <div className="flex gap-3 pt-1 font-semibold text-slate-900 dark:text-[#F8FAFC]">
        {p.twoLineBottom.map((v, i) => (
          <span key={i} className="w-5 text-center shrink-0">
            {v}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Permutation Group Explorer (Sₙ)"
        description="Analyze permutations in two-line and disjoint cycle notation, compose elements using right-to-left function composition, compute inverses, and determine cycle orders."
        formulaTex="(\sigma \circ \tau)(x) = \sigma(\tau(x)), \qquad |S_n| = n!"
      />

      {/* Convention Banner */}
      <div className="rounded-xl border border-purple-200 dark:border-[#7C3AED]/45 bg-gradient-to-r from-purple-50 to-cyan-50/70 dark:from-[#7C3AED]/15 dark:to-[#22D3EE]/10 px-5 py-3.5 text-xs sm:text-sm text-purple-950 dark:text-[#F8FAFC]">
        <span className="font-semibold text-purple-800 dark:text-[#22D3EE]">Composition Convention:</span> Standard mathematical right-to-left function composition{' '}
        <span className="font-mono-math text-purple-700 dark:text-[#C4B5FD]">(σ ∘ τ)(x) = σ(τ(x))</span> (apply τ first, then apply σ). Supports cycle notation like{' '}
        <span className="font-mono-math">(1 3 2)(4 5)</span> or one-line image notation like{' '}
        <span className="font-mono-math">3 1 2 5 4</span>.
      </div>

      {/* Input Card */}
      <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 sm:p-6 space-y-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-[#F8FAFC]">
              Symmetric Group S_n
            </label>
            <select
              value={nVal}
              onChange={(e) => {
                const nextN = Number(e.target.value);
                setNVal(nextN);
                try {
                  parsePermutationInput(sigmaInput, nextN);
                  parsePermutationInput(tauInput, nextN);
                  handleCompute(nextN, sigmaInput, tauInput);
                } catch {
                  const defaultSigma = '(1 2)';
                  const defaultTau = nextN >= 3 ? '(2 3)' : '(1 2)';
                  setSigmaInput(defaultSigma);
                  setTauInput(defaultTau);
                  handleCompute(nextN, defaultSigma, defaultTau);
                }
              }}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-[#334155] bg-white dark:bg-[#0B1120] text-slate-900 dark:text-[#F8FAFC] font-mono-math text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-[#22D3EE]"
            >
              {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>
                  S_{n} ({factorial(n).toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3 space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-[#F8FAFC]">
              Permutation σ
            </label>
            <input
              type="text"
              value={sigmaInput}
              onChange={(e) => setSigmaInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCompute()}
              placeholder="(1 2 3)"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-[#334155] bg-white dark:bg-[#0B1120] text-slate-900 dark:text-[#F8FAFC] font-mono-math text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-[#22D3EE]"
            />
          </div>

          <div className="md:col-span-3 space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-[#F8FAFC]">
              Permutation τ
            </label>
            <input
              type="text"
              value={tauInput}
              onChange={(e) => setTauInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCompute()}
              placeholder="(2 3 4)"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-[#334155] bg-white dark:bg-[#0B1120] text-slate-900 dark:text-[#F8FAFC] font-mono-math text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-[#22D3EE]"
            />
          </div>

          <div className="md:col-span-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleCompute()}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#8B5CF6] hover:to-[#7C3AED] text-[#F8FAFC] text-sm font-medium shadow-sm shadow-[#7C3AED]/25 transition-all inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Calculator className="w-4 h-4" />
              <span>Compose & Analyze</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setNVal(5);
                setSigmaInput('(1 3 5)(2 4)');
                setTauInput('(1 2)(3 4 5)');
                handleCompute(5, '(1 3 5)(2 4)', '(1 2)(3 4 5)');
              }}
              className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/60 text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-50 dark:hover:bg-[#0B1120] hover:border-purple-400 dark:hover:border-[#22D3EE] text-sm inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
            >
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-[#22D3EE]" />
              <span>S₅ Example</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
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

      {/* Cards for σ, τ, σ∘τ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[
          { title: 'Permutation σ', data: sigmaAnalysis },
          { title: 'Permutation τ', data: tauAnalysis },
          { title: 'Composition σ ∘ τ', data: compAnalysis },
        ].map(({ title, data }) => (
          <div
            key={title}
            className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 space-y-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-[#F8FAFC]">{title}</h2>
              <span className="text-xs font-mono-math text-slate-500 dark:text-[#94A3B8]">
                {data.isIdentity ? 'Identity' : `Order ${data.order}`}
              </span>
            </div>

            <div>
              <div className="text-xs text-slate-500 dark:text-[#94A3B8] mb-1">Two-Line Notation</div>
              {renderTwoLine(data)}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-[#334155] text-sm">
              <div>
                <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Disjoint Cycles</div>
                <div className="font-mono-math font-semibold text-purple-600 dark:text-[#22D3EE]">
                  {data.cycleNotation}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Inverse</div>
                <div className="font-mono-math font-semibold text-slate-900 dark:text-[#F8FAFC]">
                  {data.inverseCycleNotation}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Order</div>
                <div className="font-mono-math font-semibold text-slate-900 dark:text-[#F8FAFC]">
                  {data.order}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Parity</div>
                <div className="font-mono-math font-semibold text-purple-600 dark:text-[#C4B5FD]">
                  {data.parity} (sgn = {data.sign > 0 ? '+1' : '-1'})
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Step-by-Step Solution & Export */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-[#F8FAFC]">
            Composition Proof & Trace
          </h2>
          <ExportBar
            reportTitle={`Permutation Composition in S_${compAnalysis.n}`}
            reportFilename={`permutation_S${compAnalysis.n}.md`}
            reportContent={exportReport}
            csvFilename={`permutations_S${compAnalysis.n}.csv`}
            csvContent={exportCSV}
          />
        </div>

        <StepSolutionCard
          heading="Step-by-Step Permutation Derivation"
          steps={solutionSteps}
          conclusionTex={`(\\sigma \\circ \\tau) = ${compAnalysis.cycleNotation}, \\quad O = ${compAnalysis.order}, \\quad \\operatorname{sgn} = ${compAnalysis.sign > 0 ? '+1' : '-1'}`}
        />
      </div>

      {/* Non-commutativity check & Element trace */}
      <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 space-y-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-[#F8FAFC]">
            Element-by-Element Trace of (σ ∘ τ)(x) = σ(τ(x))
          </h2>
          <div className="text-xs font-mono-math text-slate-600 dark:text-[#C4B5FD]">
            τ ∘ σ = {reverseComp.cycleNotation}{' '}
            {reverseComp.cycleNotation !== compAnalysis.cycleNotation
              ? '(≠ σ ∘ τ, non-Abelian!)'
              : '(= σ ∘ τ, these two commute)'}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
          {compAnalysis.twoLineTop.map((x, idx) => (
            <div
              key={x}
              className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#334155] text-center font-mono-math text-xs"
            >
              <div className="text-slate-500 dark:text-[#94A3B8]">x = {x}</div>
              <div className="mt-1 text-slate-800 dark:text-[#F8FAFC]">
                {x} → {tauAnalysis.image[idx]} →{' '}
                <span className="font-semibold text-purple-600 dark:text-[#22D3EE]">
                  {compAnalysis.image[idx]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Browse S_n when n <= 4 */}
      {groupElements.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 space-y-3 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-[#F8FAFC]">
              All {groupElements.length} Permutations in S_{nVal}
            </h2>
            <span className="text-xs text-slate-500 dark:text-[#94A3B8]">
              Click any element to load it as σ
            </span>
          </div>
          <div className="overflow-x-auto max-h-72 rounded-lg border border-slate-200 dark:border-[#334155]">
            <table className="w-full text-left border-collapse text-xs sm:text-sm font-mono-math">
              <thead className="sticky top-0 bg-slate-50 dark:bg-[#0B1120] border-b border-slate-200 dark:border-[#334155] text-xs text-slate-500 dark:text-[#94A3B8] font-sans">
                <tr>
                  <th className="py-2 px-3 font-medium">Cycle Notation</th>
                  <th className="py-2 px-3 font-medium">One-Line</th>
                  <th className="py-2 px-3 font-medium">Inverse</th>
                  <th className="py-2 px-3 font-medium text-right">Order</th>
                  <th className="py-2 px-3 font-medium">Parity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#334155]">
                {groupElements.map((el) => (
                  <tr
                    key={el.image.join(',')}
                    onClick={() => {
                      setSigmaInput(el.cycleNotation);
                      handleCompute(nVal, el.cycleNotation, tauInput);
                    }}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-[#0B1120]/60 transition-colors"
                  >
                    <td className="py-2 px-3 font-semibold text-purple-600 dark:text-[#22D3EE]">
                      {el.cycleNotation}
                    </td>
                    <td className="py-2 px-3 text-slate-700 dark:text-[#F8FAFC]">
                      [{el.image.join(' ')}]
                    </td>
                    <td className="py-2 px-3 text-slate-600 dark:text-[#94A3B8]">
                      {el.inverseCycleNotation}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-900 dark:text-[#F8FAFC]">
                      {el.order}
                    </td>
                    <td className="py-2 px-3 font-sans text-xs text-slate-600 dark:text-[#94A3B8]">
                      {el.parity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
