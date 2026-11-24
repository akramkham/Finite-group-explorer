import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, RotateCcw, Sparkles } from 'lucide-react';
import { eulerPhi, formatPrimeFactorizationLatex, gcdWithSteps } from '../../math/numberTheory';
import { ModulePresetPayload } from '../../types/navigation';
import { rowsToCSV } from '../../utils/exportResults';
import { ExportBar } from '../ui/ExportBar';
import { MathTex } from '../ui/MathTex';
import { SectionHeader, StatusIndicator } from '../ui/SectionHeader';
import { SolutionStep, StepSolutionCard } from '../ui/StepSolutionCard';
import { SubgroupLatticeDiagram } from '../ui/SubgroupLatticeDiagram';

interface GeneratorSectionProps {
  onRecordCalculation: (moduleName: string, inputSummary: string, resultSummary: string) => void;
  preset?: ModulePresetPayload['generators'] & { nonce: number };
}

export const GeneratorSection: React.FC<GeneratorSectionProps> = ({
  onRecordCalculation,
  preset,
}) => {
  const [inputN, setInputN] = useState('12');
  const [nVal, setNVal] = useState(12);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = (override?: string) => {
    setError(null);
    const raw = (override ?? inputN).trim();
    if (!/^\d+$/.test(raw)) {
      setError('Enter a valid positive integer n between 1 and 200 (no decimals or letters).');
      return;
    }
    const val = Number(raw);
    if (val < 1 || val > 200) {
      setError('Cyclic group order n must satisfy 1 ≤ n ≤ 200.');
      return;
    }
    setNVal(val);
    const phiRes = eulerPhi(val);
    onRecordCalculation(
      'Generator Calculator',
      `Generators of Z_${val}`,
      `${phiRes.phi} generator(s) · φ(${val}) = ${phiRes.phi}`
    );
  };

  useEffect(() => {
    if (!preset) return;
    setInputN(preset.n);
    setError(null);
    const val = Number(preset.n.trim());
    if (Number.isInteger(val) && val >= 1 && val <= 200) {
      setNVal(val);
    }
  }, [preset]);

  const phiResult = useMemo(() => eulerPhi(nVal), [nVal]);

  const elementChecks = useMemo(() => {
    return Array.from({ length: nVal }, (_, a) => {
      const g = gcdWithSteps(nVal, a);
      const order = nVal / g.result;
      const isGen = nVal === 1 ? a === 0 : g.result === 1;
      return {
        a,
        gcd: g.result,
        steps: g.steps.map((s) => s.equation),
        order,
        isGenerator: isGen,
      };
    });
  }, [nVal]);

  const generators = useMemo(
    () => elementChecks.filter((e) => e.isGenerator).map((e) => e.a),
    [elementChecks]
  );

  const table1To20 = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => {
      const n = i + 1;
      const phi = eulerPhi(n);
      const gens = n === 1 ? [0] : phi.coprimes;
      return { n, phi: phi.phi, generators: gens };
    });
  }, []);

  const solutionSteps: SolutionStep[] = useMemo(() => {
    const sampleNonGen = elementChecks.find((e) => !e.isGenerator && e.a > 0);
    return [
      {
        title: 'Cyclic Generator Criterion',
        explanation: `An element a ∈ Z_${nVal} generates the whole group Z_${nVal} if and only if its additive order n / gcd(n, a) equals ${nVal}, i.e. gcd(a, ${nVal}) = 1.`,
        formulaTex: `\\langle a \\rangle = \\mathbb{Z}_{${nVal}} \\iff \\gcd(a, ${nVal}) = 1 \\iff O(a) = ${nVal}`,
      },
      {
        title: 'Analytic Count via Euler Totient φ(n)',
        explanation: `Factorize ${nVal} = ${formatPrimeFactorizationLatex(phiResult.primeFactors).replace(/\\cdot/g, '·')} and apply Euler's totient formula to predict the exact generator count.`,
        formulaTex: `${phiResult.formulaExpression} = ${phiResult.formulaEvaluation}`,
      },
      {
        title: 'Sample Element Euclidean Check',
        explanation: sampleNonGen
          ? `Notice a = ${sampleNonGen.a} gives gcd(${nVal}, ${sampleNonGen.a}) = ${sampleNonGen.gcd} > 1, so it generates only a subgroup of order ${sampleNonGen.order}; whereas 1 has gcd(${nVal}, 1) = 1.`
          : nVal === 1
            ? `In the trivial group Z_1 = {0}, 0 generates the whole group.`
            : `Because ${nVal} is prime, every nonzero element 1 ≤ a < ${nVal} has gcd(${nVal}, a) = 1 and generates Z_${nVal}.`,
        formulaTex: sampleNonGen
          ? `O(${sampleNonGen.a}) = \\frac{${nVal}}{\\gcd(${nVal}, ${sampleNonGen.a})} = \\frac{${nVal}}{${sampleNonGen.gcd}} = ${sampleNonGen.order} < ${nVal}`
          : `\\varphi(${nVal}) = ${phiResult.phi}`,
      },
    ];
  }, [nVal, phiResult, elementChecks]);

  const exportReport = useMemo(() => {
    return [
      `Generators of Cyclic Group Z_${nVal}`,
      `Generators ({ a : gcd(a, ${nVal}) = 1 }): { ${generators.join(', ')} }`,
      `Generator Count: ${generators.length}`,
      `Euler Totient φ(${nVal}): ${phiResult.phi}`,
      '',
      'Verification Steps:',
      ...phiResult.steps.map((s, i) => `${i + 1}. ${s}`),
    ].join('\n');
  }, [nVal, generators, phiResult]);

  const exportCSV = useMemo(() => {
    return rowsToCSV(
      ['Element_a', `gcd(${nVal}, a)`, 'Order', 'Is_Generator'],
      elementChecks.map((r) => [r.a, r.gcd, r.order, r.isGenerator ? 'Yes' : 'No'])
    );
  }, [nVal, elementChecks]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Cyclic Group Generator Calculator"
        description="Identify all generators of Z_n using O(a) = n / gcd(n, a) and verify that the number of generators equals Euler's totient φ(n)."
        formulaTex="\langle a \rangle = \mathbb{Z}_n \iff \gcd(a, n) = 1 \iff O(a) = n"
      />

      {/* Input Card */}
      <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 sm:p-6 space-y-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-[#94A3B8]">Examples:</span>
          {[4, 6, 8, 10, 12, 15, 17].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => {
                setInputN(String(val));
                handleCalculate(String(val));
              }}
              className="px-2.5 py-1 text-xs font-mono-math rounded-md border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/60 text-slate-700 dark:text-[#F8FAFC] hover:border-purple-500 dark:hover:border-[#22D3EE] transition-colors"
            >
              Z_{val}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
          <div className="flex-1 space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-[#F8FAFC]">
              Cyclic Group Order n (1 ≤ n ≤ 200)
            </label>
            <input
              type="number"
              min={1}
              max={200}
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
              <span>Find Generators</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setInputN('4');
                handleCalculate('4');
              }}
              className="px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/60 text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-50 dark:hover:bg-[#0B1120] hover:border-purple-400 dark:hover:border-[#22D3EE] text-sm inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
            >
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-[#22D3EE]" />
              <span>Example (Z₄)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setInputN('12');
                handleCalculate('12');
              }}
              className="px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/60 text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-50 dark:hover:bg-[#0B1120] text-sm inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
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

      {/* Results & Verification */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 space-y-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
            <div>
              <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Generators of Z_{nVal}</div>
              <div className="mt-1 text-xl font-semibold font-mono-math text-purple-600 dark:text-[#22D3EE] break-words">
                {'{ '}
                {generators.join(', ')}
                {' }'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-[#334155]">
              <div>
                <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Generator Count</div>
                <div className="font-mono-math text-lg font-semibold text-slate-900 dark:text-[#F8FAFC]">
                  {generators.length}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Euler Totient φ({nVal})</div>
                <div className="font-mono-math text-lg font-semibold text-purple-600 dark:text-[#C4B5FD]">
                  {phiResult.phi}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-[#334155] flex items-center justify-between">
              <span className="text-xs text-slate-600 dark:text-[#94A3B8]">
                Count === φ({nVal}) Theorem Check
              </span>
              <StatusIndicator
                status={generators.length === phiResult.phi}
                label={generators.length === phiResult.phi ? 'Verified equal' : 'Mismatch'}
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-[#334155]">
              <ExportBar
                reportTitle={`Generators of Z_${nVal}`}
                reportFilename={`generators_Z${nVal}.md`}
                reportContent={exportReport}
                csvFilename={`generators_Z${nVal}.csv`}
                csvContent={exportCSV}
              />
            </div>
          </div>

          <StepSolutionCard
            heading="Step-by-Step Generator Proof"
            steps={solutionSteps}
            conclusionTex={`|\\operatorname{Gen}(\\mathbb{Z}_{${nVal}})| = \\varphi(${nVal}) = ${generators.length}`}
          />
        </div>

        {/* Element-by-element GCD verification */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 space-y-3 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
          <h2 className="text-base font-semibold text-slate-900 dark:text-[#F8FAFC]">
            GCD & Order Verification for Every Element in <MathTex tex={`\\mathbb{Z}_{${nVal}}`} />
          </h2>
          <div className="overflow-x-auto max-h-96 rounded-lg border border-slate-200 dark:border-[#334155]">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="sticky top-0 bg-slate-50 dark:bg-[#0B1120] border-b border-slate-200 dark:border-[#334155] text-xs text-slate-500 dark:text-[#94A3B8]">
                <tr>
                  <th className="py-2 px-3 font-medium">a</th>
                  <th className="py-2 px-3 font-medium">gcd({nVal}, a)</th>
                  <th className="py-2 px-3 font-medium">O(a) = {nVal}/gcd</th>
                  <th className="py-2 px-3 font-medium">Generator?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#334155] font-mono-math">
                {elementChecks.map((row) => (
                  <tr
                    key={row.a}
                    className={row.isGenerator ? 'bg-purple-50/60 dark:bg-[#7C3AED]/15' : 'hover:bg-slate-50 dark:hover:bg-[#0B1120]/50'}
                  >
                    <td className="py-2 px-3 font-semibold text-slate-900 dark:text-[#F8FAFC]">
                      {row.a}
                    </td>
                    <td className="py-2 px-3 text-slate-600 dark:text-[#94A3B8]">{row.gcd}</td>
                    <td className="py-2 px-3 text-slate-900 dark:text-[#22D3EE]">{row.order}</td>
                    <td className="py-2 px-3 font-sans">
                      <StatusIndicator
                        status={row.isGenerator}
                        label={row.isGenerator ? 'Generator' : 'Not generator'}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Subgroup Lattice */}
      {nVal <= 120 && <SubgroupLatticeDiagram n={nVal} />}

      {/* Reference Table n = 1 to 20 */}
      <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 space-y-3 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
        <h2 className="text-base font-semibold text-slate-900 dark:text-[#F8FAFC]">
          Generator & φ(n) Reference Table (n = 1 to 20)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-[#0B1120] text-xs text-slate-500 dark:text-[#94A3B8]">
                <th className="py-2 px-3 font-medium">n</th>
                <th className="py-2 px-3 font-medium text-right">φ(n)</th>
                <th className="py-2 px-3 font-medium">Generators of Z_n</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#334155] font-mono-math">
              {table1To20.map((row) => (
                <tr key={row.n} className="hover:bg-slate-50 dark:hover:bg-[#0B1120]/50 transition-colors">
                  <td className="py-2 px-3 font-semibold text-slate-900 dark:text-[#F8FAFC]">
                    Z_{row.n}
                  </td>
                  <td className="py-2 px-3 text-right text-purple-600 dark:text-[#22D3EE] font-semibold">
                    {row.phi}
                  </td>
                  <td className="py-2 px-3 text-slate-700 dark:text-[#94A3B8]">
                    {'{ '}
                    {row.generators.join(', ')}
                    {' }'}
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
