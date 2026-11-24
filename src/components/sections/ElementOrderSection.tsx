import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, RotateCcw, Sparkles } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  AbelianGroupAnalysis,
  analyzeAbelianGroup,
  computeAbelianElementOrder,
  ElementOrderAnalysis,
  formatTuple,
} from '../../math/abelianGroups';
import { ModulePresetPayload } from '../../types/navigation';
import { rowsToCSV } from '../../utils/exportResults';
import { ExportBar } from '../ui/ExportBar';
import { SectionHeader } from '../ui/SectionHeader';
import { SolutionStep, StepSolutionCard } from '../ui/StepSolutionCard';

interface ElementOrderSectionProps {
  onRecordCalculation: (moduleName: string, inputSummary: string, resultSummary: string) => void;
  preset?: ModulePresetPayload['elementOrder'] & { nonce: number };
}

export const ElementOrderSection: React.FC<ElementOrderSectionProps> = ({
  onRecordCalculation,
  preset,
}) => {
  const [moduliInput, setModuliInput] = useState('4, 6');
  const [elementInput, setElementInput] = useState('2, 3');
  const [error, setError] = useState<string | null>(null);

  const [orderResult, setOrderResult] = useState<ElementOrderAnalysis>(() =>
    computeAbelianElementOrder([2, 3], [4, 6])
  );
  const [groupAnalysis, setGroupAnalysis] = useState<AbelianGroupAnalysis>(() =>
    analyzeAbelianGroup([4, 6])
  );

  const handleCalculate = (overrideModuli?: string, overrideElement?: string) => {
    setError(null);
    const modRaw = (overrideModuli ?? moduliInput).trim();
    const elRaw = (overrideElement ?? elementInput).trim();

    try {
      if (!modRaw || !elRaw) {
        throw new Error('Both group moduli and element coordinates are required.');
      }
      const modTokens = modRaw.split(/[×x,\s]+/).filter(Boolean);
      if (modTokens.length === 0 || modTokens.length > 5) {
        throw new Error('Provide 1 to 5 positive integer moduli (e.g. "12" or "4, 6").');
      }
      const moduli = modTokens.map((tok) => {
        if (!/^\d+$/.test(tok)) {
          throw new Error(`Invalid modulus "${tok}". Each modulus must be a positive integer.`);
        }
        const m = Number(tok);
        if (m < 1 || m > 500) {
          throw new Error(`Modulus ${m} is out of range; use 1 ≤ m ≤ 500.`);
        }
        return m;
      });

      const elTokens = elRaw
        .replace(/[()]/g, '')
        .split(/[,\s]+/)
        .filter(Boolean);
      if (elTokens.length !== moduli.length) {
        throw new Error(
          `Dimension mismatch: element has ${elTokens.length} coordinate(s), but ${moduli.map((m) => `Z_${m}`).join(' × ')} expects ${moduli.length}.`
        );
      }
      const elParts = elTokens.map((tok) => {
        if (!/^-?\d+$/.test(tok)) {
          throw new Error(`Invalid coordinate "${tok}". Element coordinates must be integers.`);
        }
        return Number(tok);
      });

      const res = computeAbelianElementOrder(elParts, moduli);
      const grp = analyzeAbelianGroup(moduli);
      setOrderResult(res);
      setGroupAnalysis(grp);

      onRecordCalculation(
        'Element Order Calculator',
        `${formatTuple(res.element)} in ${grp.groupName}`,
        `O = ${res.order}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid input.');
    }
  };

  useEffect(() => {
    if (!preset) return;
    setModuliInput(preset.moduli);
    setElementInput(preset.element);
    setError(null);
    const moduli = preset.moduli.split(/[×x,\s]+/).filter(Boolean).map(Number);
    const elParts = preset.element.replace(/[()]/g, '').split(/[,\s]+/).filter(Boolean).map(Number);
    if (moduli.length > 0 && moduli.length === elParts.length) {
      setOrderResult(computeAbelianElementOrder(elParts, moduli));
      setGroupAnalysis(analyzeAbelianGroup(moduli));
    }
  }, [preset]);

  const loadPreset = (modStr: string, elStr: string) => {
    setModuliInput(modStr);
    setElementInput(elStr);
    handleCalculate(modStr, elStr);
  };

  const maxOrderElements = useMemo(() => {
    if (!groupAnalysis.enumerated) return [];
    return groupAnalysis.elements.filter((e) => e.order === groupAnalysis.maxElementOrder);
  }, [groupAnalysis]);

  const solutionSteps: SolutionStep[] = useMemo(() => {
    const coordSteps: SolutionStep[] = orderResult.coordinateBreakdown.map((cb) => ({
      title: `Coordinate ${cb.coordinateIndex + 1} in Z_${cb.modulus} (a_${cb.coordinateIndex + 1} = ${cb.value})`,
      explanation:
        cb.gcdSteps.length > 0
          ? `Apply Euclidean division (${cb.gcdSteps.join(' ; ')}) to find gcd(${cb.modulus}, ${cb.value}) = ${cb.gcdValue}, then divide the modulus by this GCD.`
          : `gcd(${cb.modulus}, 0) = ${cb.modulus}, so the identity coordinate has order 1.`,
      formulaTex: `O(${cb.value}) = \\frac{${cb.modulus}}{\\gcd(${cb.modulus}, ${cb.value})} = \\frac{${cb.modulus}}{${cb.gcdValue}} = ${cb.coordinateOrder}`,
    }));

    const coordOrders = orderResult.coordinateBreakdown.map((c) => c.coordinateOrder);
    if (coordOrders.length > 1) {
      coordSteps.push({
        title: 'Combine Coordinate Orders via LCM',
        explanation: `A multiple k·${formatTuple(orderResult.element)} hits the identity ${groupAnalysis.identityLabel} iff every coordinate order O(a_i) divides k.`,
        formulaTex: `O(${formatTuple(orderResult.element)}) = \\operatorname{lcm}(${coordOrders.join(', ')}) = ${orderResult.order}`,
      });
    }
    return coordSteps;
  }, [orderResult, groupAnalysis.identityLabel]);

  const exportReport = useMemo(() => {
    return [
      `Element: ${formatTuple(orderResult.element)} in ${groupAnalysis.groupName}`,
      `Computed Order: ${orderResult.order}`,
      '',
      'Coordinate Breakdown:',
      ...orderResult.coordinateBreakdown.map(
        (cb) => `- Z_${cb.modulus}: ${cb.formula} (Euclidean: ${cb.gcdSteps.join(' ; ') || 'gcd=modulus'})`
      ),
      '',
      orderResult.lcmFormula,
      orderResult.explanation,
    ].join('\n');
  }, [orderResult, groupAnalysis.groupName]);

  const exportCSV = useMemo(() => {
    if (!groupAnalysis.enumerated) return undefined;
    return rowsToCSV(
      ['Order', 'Element_Count'],
      groupAnalysis.orderDistribution.map((d) => [d.order, d.count])
    );
  }, [groupAnalysis]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Element Order Calculator"
        description="Compute exact element orders in cyclic groups Z_n and finite direct products Z_{n₁} × ... × Z_{nₖ} with full GCD and LCM derivations."
        formulaTex="O(a) = \frac{n}{\gcd(n, a)}, \qquad O((a_1,\dots,a_k)) = \operatorname{lcm}\big(O(a_1),\dots,O(a_k)\big)"
      />

      {/* Input Card */}
      <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 sm:p-6 space-y-5 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-[#94A3B8]">Guided Examples:</span>
          <button
            type="button"
            onClick={() => loadPreset('2, 3', '1, 2')}
            className="px-2.5 py-1 text-xs font-mono-math rounded-md border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/70 hover:border-[#7C3AED] dark:hover:border-[#22D3EE] text-slate-700 dark:text-[#F8FAFC] transition-colors"
          >
            (1, 2) in Z₂ × Z₃
          </button>
          <button
            type="button"
            onClick={() => loadPreset('4, 6', '2, 3')}
            className="px-2.5 py-1 text-xs font-mono-math rounded-md border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/70 hover:border-[#7C3AED] dark:hover:border-[#22D3EE] text-slate-700 dark:text-[#F8FAFC] transition-colors"
          >
            (2, 3) in Z₄ × Z₆
          </button>
          <button
            type="button"
            onClick={() => loadPreset('4, 6', '1, 2')}
            className="px-2.5 py-1 text-xs font-mono-math rounded-md border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/70 hover:border-[#7C3AED] dark:hover:border-[#22D3EE] text-slate-700 dark:text-[#F8FAFC] transition-colors"
          >
            (1, 2) in Z₄ × Z₆
          </button>
          <button
            type="button"
            onClick={() => loadPreset('2, 2', '1, 1')}
            className="px-2.5 py-1 text-xs font-mono-math rounded-md border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/70 hover:border-[#7C3AED] dark:hover:border-[#22D3EE] text-slate-700 dark:text-[#F8FAFC] transition-colors"
          >
            All orders in Z₂ × Z₂
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-4 space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-[#94A3B8]">
              Group Moduli (e.g. "12" or "4, 6")
            </label>
            <input
              type="text"
              value={moduliInput}
              onChange={(e) => setModuliInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCalculate()}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-[#334155] bg-white dark:bg-[#0B1120] text-slate-900 dark:text-[#F8FAFC] font-mono-math text-sm focus:outline-none focus:ring-2 focus:ring-[#22D3EE]"
            />
          </div>

          <div className="md:col-span-4 space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-[#94A3B8]">
              Element Coordinates (e.g. "5" or "2, 3")
            </label>
            <input
              type="text"
              value={elementInput}
              onChange={(e) => setElementInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCalculate()}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-[#334155] bg-white dark:bg-[#0B1120] text-slate-900 dark:text-[#F8FAFC] font-mono-math text-sm focus:outline-none focus:ring-2 focus:ring-[#22D3EE]"
            />
          </div>

          <div className="md:col-span-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCalculate()}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#8B5CF6] hover:to-[#7C3AED] text-[#F8FAFC] text-sm font-medium transition-all shadow-[0_6px_16px_-6px_rgba(124,58,237,0.65)] inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Calculator className="w-4 h-4" />
              <span>Calculate</span>
            </button>
            <button
              type="button"
              onClick={() => loadPreset('2, 3', '1, 2')}
              className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/70 text-slate-700 dark:text-[#F8FAFC] hover:border-[#7C3AED] dark:hover:border-[#22D3EE]/70 text-sm inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
            >
              <Sparkles className="w-4 h-4 text-[#7C3AED] dark:text-[#22D3EE]" />
              <span>Example</span>
            </button>
            <button
              type="button"
              onClick={() => loadPreset('4, 6', '2, 3')}
              aria-label="Reset"
              className="p-2.5 rounded-lg border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/70 text-slate-700 dark:text-[#F8FAFC] hover:border-[#7C3AED] dark:hover:border-[#22D3EE]/70 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Clickable element selector when enumerated */}
        {groupAnalysis.enumerated && groupAnalysis.elements.length <= 36 && (
          <div className="pt-3 border-t border-slate-100 dark:border-[#334155] space-y-2">
            <div className="text-xs text-slate-500 dark:text-[#94A3B8]">
              Select any element in {groupAnalysis.groupName}:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {groupAnalysis.elements.map((el) => {
                const isActive = formatTuple(orderResult.element) === el.label;
                return (
                  <button
                    key={el.label}
                    type="button"
                    onClick={() => {
                      const valStr = el.tuple.join(', ');
                      const activeModStr = groupAnalysis.moduli.join(', ');
                      setModuliInput(activeModStr);
                      setElementInput(valStr);
                      handleCalculate(activeModStr, valStr);
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono-math border transition-colors ${
                      isActive
                        ? 'bg-[#7C3AED] border-[#7C3AED] text-[#F8FAFC]'
                        : 'border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/70 text-slate-700 dark:text-[#F8FAFC] hover:border-[#22D3EE]'
                    }`}
                  >
                    {el.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {error && (
          <div role="alert" className="rounded-lg border border-red-300 dark:border-[#EF4444]/60 bg-red-50 dark:bg-[#EF4444]/15 px-4 py-3 text-sm text-red-700 dark:text-[#FCA5A5]">
            {error}
          </div>
        )}
      </div>

      {/* Step-by-Step Result */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 flex flex-wrap items-center justify-between gap-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
            <div>
              <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Final Element Order</div>
              <div className="mt-1 text-2xl font-semibold font-mono-math text-slate-900 dark:text-[#F8FAFC]">
                O({formatTuple(orderResult.element)}) ={' '}
                <span className="text-[#7C3AED] dark:text-[#22D3EE]">{orderResult.order}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Max Order in Group</div>
              <div className="mt-1 text-lg font-semibold font-mono-math text-[#7C3AED] dark:text-[#C4B5FD]">
                {groupAnalysis.maxElementOrder}
              </div>
            </div>
            <div className="w-full pt-3 border-t border-slate-100 dark:border-[#334155]">
              <ExportBar
                reportTitle={`Element Order in ${groupAnalysis.groupName}`}
                reportFilename={`order_${groupAnalysis.moduli.join('x')}.md`}
                reportContent={exportReport}
                csvFilename={exportCSV ? `order_distribution_${groupAnalysis.moduli.join('x')}.csv` : undefined}
                csvContent={exportCSV}
              />
            </div>
          </div>

          <StepSolutionCard
            heading="Step-by-Step GCD & LCM Derivation"
            steps={solutionSteps}
            conclusionTex={`O(${formatTuple(orderResult.element)}) = ${orderResult.order}`}
            conclusionText={orderResult.explanation}
          />
        </div>

        {/* Distribution Chart & Max Order Elements */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-6 flex flex-col space-y-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-[#F8FAFC]">
              Order Distribution in {groupAnalysis.groupName}
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              Total elements: {groupAnalysis.order}
            </p>
          </div>

          {groupAnalysis.enumerated ? (
            <>
              <div className="h-56 w-full rounded-lg bg-slate-50/70 dark:bg-[#0B1120]/70 border border-slate-200/70 dark:border-[#334155] p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={groupAnalysis.orderDistribution}
                    margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="elemOrderGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.9} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
                    <XAxis dataKey="order" tick={{ fontSize: 12, fill: '#94A3B8' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        border: '1px solid #334155',
                        borderRadius: '10px',
                        color: '#F8FAFC',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="count" fill="url(#elemOrderGrad)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#334155] space-y-2">
                <div className="text-xs font-medium text-slate-500 dark:text-[#94A3B8]">
                  Elements of Maximum Order ({groupAnalysis.maxElementOrder}) — {maxOrderElements.length} found
                </div>
                <div className="font-mono-math text-xs text-slate-800 dark:text-[#F8FAFC] bg-slate-50 dark:bg-[#0B1120] p-3 rounded-lg border border-slate-200 dark:border-[#334155] max-h-24 overflow-y-auto leading-relaxed">
                  {maxOrderElements.slice(0, 32).map((e) => e.label).join(', ')}
                  {maxOrderElements.length > 32 ? ` ... (+${maxOrderElements.length - 32} more)` : ''}
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-slate-500 dark:text-[#94A3B8] py-8">
              Full distribution omitted for order {groupAnalysis.order} (&gt; 256).
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
