import React, { useEffect, useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { buildDihedralGroup, DihedralElement } from '../../math/dihedralGroups';
import { mod } from '../../math/numberTheory';
import { ModulePresetPayload } from '../../types/navigation';
import { rowsToCSV } from '../../utils/exportResults';
import { ExportBar } from '../ui/ExportBar';
import { MathTex } from '../ui/MathTex';
import { SectionHeader, StatusIndicator } from '../ui/SectionHeader';
import { SolutionStep, StepSolutionCard } from '../ui/StepSolutionCard';

interface DihedralExplorerSectionProps {
  onRecordCalculation: (moduleName: string, inputSummary: string, resultSummary: string) => void;
  preset?: ModulePresetPayload['dihedral'] & { nonce: number };
}

const PRESET_NS = [3, 4, 5, 6, 8];

export const DihedralExplorerSection: React.FC<DihedralExplorerSectionProps> = ({
  onRecordCalculation,
  preset,
}) => {
  const [nVal, setNVal] = useState(6);
  const [customNInput, setCustomNInput] = useState('6');
  const [customError, setCustomError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0); // current symmetry applied to polygon
  const [leftOpIdx, setLeftOpIdx] = useState(1); // r
  const [rightOpIdx, setRightOpIdx] = useState(6); // s in D_6

  const dihedral = useMemo(() => buildDihedralGroup(nVal), [nVal]);
  const activeElement: DihedralElement = dihedral.elements[activeIndex] ?? dihedral.elements[0];
  const leftElem = dihedral.elements[leftOpIdx] ?? dihedral.elements[0];
  const rightElem = dihedral.elements[rightOpIdx] ?? dihedral.elements[0];
  const productIdx = dihedral.cayleyTable[leftElem.index][rightElem.index];
  const productElem = dihedral.elements[productIdx];

  const selectN = (nextN: number) => {
    setNVal(nextN);
    setCustomNInput(String(nextN));
    setCustomError(null);
    setActiveIndex(0);
    setLeftOpIdx(1);
    setRightOpIdx(nextN);
    onRecordCalculation(
      'Dihedral Group Explorer',
      `D_${nextN} (regular ${nextN}-gon)`,
      `|D_${nextN}| = ${2 * nextN} · Z(D_${nextN}) order ${nextN % 2 === 0 ? 2 : 1}`
    );
  };

  useEffect(() => {
    if (!preset) return;
    if (Number.isInteger(preset.n) && preset.n >= 3 && preset.n <= 12) {
      setNVal(preset.n);
      setCustomNInput(String(preset.n));
      setCustomError(null);
      setActiveIndex(0);
      setLeftOpIdx(1);
      setRightOpIdx(preset.n);
    }
  }, [preset]);

  const applyCustomN = () => {
    const raw = customNInput.trim();
    if (!/^\d+$/.test(raw)) {
      setCustomError('Enter an integer n between 3 and 12.');
      return;
    }
    const v = Number(raw);
    if (v < 3 || v > 12) {
      setCustomError('Polygon sides n must satisfy 3 ≤ n ≤ 12.');
      return;
    }
    selectN(v);
  };

  // Apply generator r or s on the left: g_new = gen ∘ g_current
  const applyGenerator = (genIndex: number) => {
    const nextIdx = dihedral.cayleyTable[genIndex][activeIndex];
    setActiveIndex(nextIdx);
  };

  const polygonGeometry = useMemo(() => {
    const cx = 160;
    const cy = 160;
    const R = 104;
    const labelR = 126;

    const slotCoords = Array.from({ length: nVal }, (_, slot) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * slot) / nVal;
      return {
        x: cx + R * Math.cos(angle),
        y: cy + R * Math.sin(angle),
        lx: cx + labelR * Math.cos(angle),
        ly: cy + labelR * Math.sin(angle),
      };
    });

    const pointsAttr = slotCoords.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    const vertices = Array.from({ length: nVal }, (_, v) => {
      const destSlot = activeElement.vertexMapping[v] - 1;
      const pos = slotCoords[destSlot];
      return {
        vertexLabel: v + 1,
        destSlot: destSlot + 1,
        x: pos.x,
        y: pos.y,
        lx: pos.lx,
        ly: pos.ly,
      };
    });

    return { cx, cy, pointsAttr, slotCoords, vertices };
  }, [nVal, activeElement]);

  const productDerivationTex = useMemo(() => {
    const a = leftElem;
    const b = rightElem;
    if (!a.isReflection && !b.isReflection) {
      return `${a.latex} \\circ ${b.latex} = r^{${a.k} + ${b.k} \\bmod ${nVal}} = ${productElem.latex}`;
    }
    if (!a.isReflection && b.isReflection) {
      return `${a.latex} \\circ ${b.latex} = (r^{${a.k}} s) r^{${b.k}} = s r^{-${a.k} + ${b.k} \\bmod ${nVal}} = ${productElem.latex}`;
    }
    if (a.isReflection && !b.isReflection) {
      return `${a.latex} \\circ ${b.latex} = s r^{${a.k} + ${b.k} \\bmod ${nVal}} = ${productElem.latex}`;
    }
    return `${a.latex} \\circ ${b.latex} = s(r^{${a.k}} s)r^{${b.k}} = s^2 r^{${b.k} - ${a.k} \\bmod ${nVal}} = ${productElem.latex}`;
  }, [leftElem, rightElem, productElem, nVal]);

  const solutionSteps: SolutionStep[] = useMemo(() => {
    const elemStep: SolutionStep = activeElement.isReflection
      ? {
          title: `Active Reflection ${activeElement.label}: Order & Inverse`,
          explanation: `Every reflection in D_${nVal} satisfies (s r^k)² = s(r^k s)r^k = s² r^{-k} r^k = e, so it is self-inverse of order 2.`,
          formulaTex: `(${activeElement.latex})^2 = e \\implies O(${activeElement.latex}) = 2,\\quad (${activeElement.latex})^{-1} = ${activeElement.latex}`,
        }
      : {
          title: `Active Rotation ${activeElement.label}: Order & Inverse`,
          explanation:
            activeElement.k === 0
              ? `Identity rotation e fixes all ${nVal} vertices and has order 1.`
              : `Using r^${nVal} = e, the order of r^${activeElement.k} is ${nVal}/gcd(${nVal}, ${activeElement.k}) = ${activeElement.order}, and its inverse is r^{${mod(-activeElement.k, nVal)}}.`,
          formulaTex:
            activeElement.k === 0
              ? 'O(e) = 1,\\quad e^{-1} = e'
              : `O(${activeElement.latex}) = \\frac{${nVal}}{\\gcd(${nVal}, ${activeElement.k})} = ${activeElement.order},\\quad (${activeElement.latex})^{-1} = r^{${mod(-activeElement.k, nVal)}}`,
        };

    return [
      elemStep,
      {
        title: `Binary Product Check: ${leftElem.label} ∘ ${rightElem.label}`,
        explanation: `Using the fundamental commuting relation r^k s = s r^{-k} and s² = e to normalize any word into s^a r^m:`,
        formulaTex: productDerivationTex,
      },
      {
        title: `Centre Z(D_${nVal}) Parity Theorem`,
        explanation:
          nVal % 2 === 0
            ? `Since n = ${nVal} is even, the 180° half-turn r^{${nVal / 2}} satisfies s r^{${nVal / 2}} s = r^{-${nVal / 2}} = r^{${nVal / 2}}, so Z(D_${nVal}) = {e, r^${nVal / 2}}. Non-Abelian since sr ≠ rs.`
            : `Since n = ${nVal} is odd, no nontrivial rotation satisfies r^k = r^{-k}, and reflections fail to commute with r, so Z(D_${nVal}) = {e}.`,
        formulaTex: `Z(D_{${nVal}}) = \\{${dihedral.centreLabels.join(', ')}\\}, \\quad |Z(D_{${nVal}})| = ${dihedral.centreLabels.length}`,
      },
    ];
  }, [activeElement, nVal, leftElem, productDerivationTex, dihedral]);

  const exportReport = useMemo(() => {
    return [
      `Dihedral Group D_${nVal} (Regular ${nVal}-gon Symmetries)`,
      `Group Order: |D_${nVal}| = ${dihedral.order}`,
      `Abelian: No (srs = r^{-1})`,
      `Centre Z(D_${nVal}): { ${dihedral.centreLabels.join(', ')} }`,
      `Active Element: ${activeElement.label} (order ${activeElement.order}, inverse ${activeElement.inverseLabel}, vertex mapping [${activeElement.vertexMapping.join(' ')}])`,
      `Product Evaluated: ${leftElem.label} ∘ ${rightElem.label} = ${productElem.label}`,
    ].join('\n');
  }, [nVal, dihedral, activeElement, leftElem, rightElem, productElem]);

  const exportCSV = useMemo(() => {
    return rowsToCSV(
      ['∘', ...dihedral.elements.map((e) => e.label)],
      dihedral.elements.map((rowEl, i) => [
        rowEl.label,
        ...dihedral.cayleyTable[i].map((resIdx) => dihedral.elements[resIdx].label),
      ])
    );
  }, [dihedral]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Dihedral Group Explorer (Dₙ)"
        description="Explore the symmetry group of a regular n-gon with 2n elements: n rotations rᵏ and n reflections srᵏ satisfying rⁿ = e, s² = e, srs = r⁻¹."
        formulaTex="D_n = \{e, r, \dots, r^{n-1}, s, sr, \dots, sr^{n-1}\}, \quad |D_n| = 2n"
      />

      {/* Group Selector */}
      <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 flex flex-wrap items-center justify-between gap-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-[#94A3B8] mr-1">
            Polygon Symmetry Group:
          </span>
          {PRESET_NS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => selectN(n)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-mono-math font-medium transition-all whitespace-nowrap ${
                nVal === n
                  ? 'bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-[#F8FAFC] shadow-sm shadow-[#7C3AED]/25'
                  : 'border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/60 text-slate-700 dark:text-[#F8FAFC] hover:border-purple-500 dark:hover:border-[#22D3EE]'
              }`}
            >
              D_{n} (order {2 * n})
            </button>
          ))}
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <label htmlFor="dihedral-custom-n" className="text-xs text-slate-500 dark:text-[#94A3B8] whitespace-nowrap">
              Custom n (3–12):
            </label>
            <input
              id="dihedral-custom-n"
              type="text"
              inputMode="numeric"
              value={customNInput}
              onChange={(e) => {
                const raw = e.target.value;
                setCustomNInput(raw);
                setCustomError(null);
                const v = Number(raw.trim());
                if (/^\d+$/.test(raw.trim()) && v >= 3 && v <= 12) {
                  selectN(v);
                }
              }}
              onKeyDown={(e) => e.key === 'Enter' && applyCustomN()}
              className="w-16 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-[#334155] bg-white dark:bg-[#0B1120] text-slate-900 dark:text-[#F8FAFC] font-mono-math text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-[#22D3EE]"
            />
            <button
              type="button"
              onClick={applyCustomN}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/60 text-xs font-medium text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-50 dark:hover:bg-[#0B1120] hover:border-purple-400 dark:hover:border-[#22D3EE] whitespace-nowrap transition-colors"
            >
              Apply
            </button>
          </div>
          {customError && (
            <span role="alert" className="text-xs text-red-600 dark:text-[#FCA5A5]">{customError}</span>
          )}
        </div>
      </div>

      {/* Interactive Polygon Stage + Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 flex flex-col items-center justify-between transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
          <div className="w-full flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-[#F8FAFC]">
                Regular {nVal}-gon Symmetry Stage
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                Active element:{' '}
                <span
                  className={`font-mono-math font-semibold ${
                    activeElement.isReflection
                      ? 'text-purple-600 dark:text-[#C4B5FD]'
                      : 'text-cyan-700 dark:text-[#22D3EE]'
                  }`}
                >
                  {activeElement.label}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveIndex(0)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/60 text-xs font-medium text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-50 dark:hover:bg-[#0B1120] inline-flex items-center gap-1 whitespace-nowrap transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset (e)</span>
            </button>
          </div>

          <div className="w-full flex justify-center my-2 rounded-lg bg-slate-50/70 dark:bg-[#0B1120]/80 border border-slate-200/80 dark:border-[#334155] p-2">
            <svg
              viewBox="0 0 320 320"
              className="w-64 h-64 sm:w-72 sm:h-72"
              role="img"
              aria-label={`Interactive regular ${nVal}-gon showing symmetry ${activeElement.label}`}
            >
              <line
                x1={160}
                y1={24}
                x2={160}
                y2={296}
                strokeDasharray="4 4"
                className="stroke-slate-300 dark:stroke-[#475569]"
                strokeWidth={1.5}
              />
              <text x={166} y={32} className="text-[10px] font-mono-math fill-slate-400 dark:fill-[#94A3B8]">
                axis s
              </text>

              <polygon
                points={polygonGeometry.pointsAttr}
                className={
                  activeElement.isReflection
                    ? 'fill-purple-500/15 stroke-purple-500 dark:fill-[#7C3AED]/20 dark:stroke-[#7C3AED]'
                    : 'fill-cyan-500/15 stroke-cyan-600 dark:fill-[#22D3EE]/15 dark:stroke-[#22D3EE]'
                }
                strokeWidth={2.5}
              />

              <line
                x1={polygonGeometry.vertices[0].x}
                y1={polygonGeometry.vertices[0].y}
                x2={polygonGeometry.vertices[1].x}
                y2={polygonGeometry.vertices[1].y}
                stroke="#F59E0B"
                strokeWidth={3.5}
                strokeLinecap="round"
              />

              {polygonGeometry.vertices.map((v) => (
                <g key={v.vertexLabel}>
                  <circle
                    cx={v.x}
                    cy={v.y}
                    r={v.vertexLabel === 1 ? 8 : 6}
                    className={
                      v.vertexLabel === 1
                        ? 'fill-amber-500 dark:fill-[#F59E0B] stroke-white dark:stroke-[#0B1120]'
                        : activeElement.isReflection
                          ? 'fill-purple-600 dark:fill-[#7C3AED] stroke-white dark:stroke-[#0B1120]'
                          : 'fill-cyan-600 dark:fill-[#22D3EE] stroke-white dark:stroke-[#0B1120]'
                    }
                    strokeWidth={2}
                  />
                  <text
                    x={v.lx}
                    y={v.ly}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="text-xs font-mono-math font-semibold fill-slate-900 dark:fill-[#F8FAFC]"
                  >
                    {v.vertexLabel}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="w-full flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-slate-100 dark:border-[#334155]">
            <button
              type="button"
              onClick={() => applyGenerator(1)}
              className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 dark:bg-[#22D3EE] dark:hover:bg-[#38BDF8] text-white dark:text-[#0B1120] text-xs font-semibold transition-colors whitespace-nowrap"
            >
              Compose r (Rotate +{Math.round(360 / nVal)}°)
            </button>
            <button
              type="button"
              onClick={() => applyGenerator(nVal)}
              className="px-3.5 py-2 rounded-lg bg-[#7C3AED] hover:bg-[#8B5CF6] text-[#F8FAFC] text-xs font-semibold transition-colors whitespace-nowrap"
            >
              Compose s (Reflect)
            </button>
          </div>
        </div>

        {/* Properties, Centre, Element Picker, Interactive Product */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 space-y-5 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-4 border-b border-slate-100 dark:border-[#334155]">
            <div>
              <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Group Order</div>
              <div className="font-mono-math text-lg font-semibold text-slate-900 dark:text-[#F8FAFC]">
                |D_{nVal}| = {dihedral.order}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Identity</div>
              <div className="font-mono-math text-lg font-semibold text-purple-600 dark:text-[#22D3EE]">
                e (r⁰)
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Centre Z(D_{nVal})</div>
              <div className="font-mono-math text-sm font-semibold text-slate-900 dark:text-[#F8FAFC] mt-1">
                {'{ '}
                {dihedral.centreLabels.join(', ')}
                {' }'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Abelian?</div>
              <div className="mt-1">
                <StatusIndicator
                  status={dihedral.isAbelian}
                  label={dihedral.isAbelian ? 'Abelian' : 'Non-Abelian'}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-500 dark:text-[#94A3B8]">
              Select Element in D_{nVal} (Rotations & Reflections)
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {dihedral.rotations.map((el) => (
                  <button
                    key={el.index}
                    type="button"
                    onClick={() => setActiveIndex(el.index)}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono-math border transition-colors ${
                      activeIndex === el.index
                        ? 'bg-cyan-600 border-cyan-600 text-white dark:bg-[#22D3EE] dark:border-[#22D3EE] dark:text-[#0B1120] font-semibold'
                        : 'border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/60 text-slate-700 dark:text-[#F8FAFC] hover:border-cyan-500 dark:hover:border-[#22D3EE]'
                    }`}
                  >
                    {el.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {dihedral.reflections.map((el) => (
                  <button
                    key={el.index}
                    type="button"
                    onClick={() => setActiveIndex(el.index)}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono-math border transition-colors ${
                      activeIndex === el.index
                        ? 'bg-[#7C3AED] border-[#7C3AED] text-[#F8FAFC] font-semibold'
                        : 'border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/60 text-slate-700 dark:text-[#F8FAFC] hover:border-purple-500 dark:hover:border-[#7C3AED]'
                    }`}
                  >
                    {el.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active element details */}
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#334155] grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Element Type</div>
              <div className="font-medium text-slate-900 dark:text-[#F8FAFC]">
                {activeElement.isReflection ? 'Reflection' : 'Rotation'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Order O({activeElement.label})</div>
              <div className="font-mono-math font-semibold text-purple-600 dark:text-[#22D3EE]">
                {activeElement.order}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Inverse ({activeElement.label})⁻¹</div>
              <div className="font-mono-math font-semibold text-slate-900 dark:text-[#F8FAFC]">
                {activeElement.inverseLabel}
              </div>
            </div>
          </div>

          {/* Interactive Dihedral Product Calculator */}
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#334155] space-y-3">
            <div className="text-xs font-semibold text-slate-700 dark:text-[#F8FAFC]">
              Interactive Binary Product Calculator (<MathTex tex="g_1 \circ g_2" />)
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <select
                value={leftElem.index}
                onChange={(e) => setLeftOpIdx(Number(e.target.value))}
                aria-label="Left dihedral operand"
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-[#334155] bg-white dark:bg-[#172554] font-mono-math text-xs text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-[#22D3EE]"
              >
                {dihedral.elements.map((el) => (
                  <option key={el.index} value={el.index}>
                    {el.label}
                  </option>
                ))}
              </select>
              <span className="font-mono-math text-slate-500 dark:text-[#94A3B8]">∘</span>
              <select
                value={rightElem.index}
                onChange={(e) => setRightOpIdx(Number(e.target.value))}
                aria-label="Right dihedral operand"
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-[#334155] bg-white dark:bg-[#172554] font-mono-math text-xs text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-[#22D3EE]"
              >
                {dihedral.elements.map((el) => (
                  <option key={el.index} value={el.index}>
                    {el.label}
                  </option>
                ))}
              </select>
              <span className="font-mono-math text-slate-500 dark:text-[#94A3B8]">=</span>
              <span className="px-3 py-1 rounded-md bg-purple-50 dark:bg-[#7C3AED]/25 border border-purple-200 dark:border-[#7C3AED]/60 font-mono-math font-semibold text-purple-700 dark:text-[#22D3EE] text-xs">
                {productElem.label}
              </span>
              <button
                type="button"
                onClick={() => setActiveIndex(productElem.index)}
                className="ml-auto px-2.5 py-1 rounded-md border border-slate-200 dark:border-[#334155] dark:bg-[#172554] text-xs text-slate-700 dark:text-[#F8FAFC] hover:border-purple-500 dark:hover:border-[#22D3EE] whitespace-nowrap transition-colors"
              >
                Preview on {nVal}-gon
              </button>
            </div>
            <div className="text-xs overflow-x-auto text-slate-700 dark:text-[#F8FAFC]">
              <MathTex tex={productDerivationTex} />
            </div>
          </div>
        </div>
      </div>

      {/* Step-by-Step Solution */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-[#F8FAFC]">
            Dihedral Group Proofs
          </h2>
          <ExportBar
            reportTitle={`Dihedral Group D_${nVal} Analysis`}
            reportFilename={`dihedral_D${nVal}.md`}
            reportContent={exportReport}
            csvFilename={`cayley_D${nVal}.csv`}
            csvContent={exportCSV}
          />
        </div>
        <StepSolutionCard
          heading={`Step-by-Step Relations & Order Derivation in D_${nVal}`}
          steps={solutionSteps}
          conclusionTex={`|D_{${nVal}}| = ${dihedral.order},\\quad Z(D_{${nVal}}) = \\{${dihedral.centreLabels.join(', ')}\\}`}
        />
      </div>

      {/* Cayley Table */}
      <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 space-y-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
        <h2 className="text-base font-semibold text-slate-900 dark:text-[#F8FAFC]">
          Cayley Table of D_{nVal} ({dihedral.order} × {dihedral.order})
        </h2>
        <div className="overflow-x-auto">
          <table className="border-collapse text-xs font-mono-math w-max min-w-full">
            <thead>
              <tr>
                <th className="p-2 border border-slate-200 dark:border-[#334155] bg-slate-100 dark:bg-[#0B1120] text-slate-700 dark:text-[#94A3B8]">
                  ∘
                </th>
                {dihedral.elements.map((el) => (
                  <th
                    key={el.index}
                    className={`p-2 border border-slate-200 dark:border-[#334155] ${
                      el.index === 0
                        ? 'bg-purple-50 dark:bg-[#7C3AED]/25 text-purple-700 dark:text-[#22D3EE]'
                        : 'bg-slate-50 dark:bg-[#0B1120] text-slate-700 dark:text-[#F8FAFC]'
                    }`}
                  >
                    {el.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dihedral.elements.map((rowEl, i) => (
                <tr key={rowEl.index}>
                  <th
                    className={`p-2 border border-slate-200 dark:border-[#334155] ${
                      i === 0
                        ? 'bg-purple-50 dark:bg-[#7C3AED]/25 text-purple-700 dark:text-[#22D3EE]'
                        : 'bg-slate-50 dark:bg-[#0B1120] text-slate-700 dark:text-[#F8FAFC]'
                    }`}
                  >
                    {rowEl.label}
                  </th>
                  {dihedral.cayleyTable[i].map((resIdx, j) => (
                    <td
                      key={j}
                      className={`p-2 border border-slate-200 dark:border-[#334155] text-center ${
                        resIdx === 0
                          ? 'bg-emerald-50/70 dark:bg-[#10B981]/18 text-emerald-700 dark:text-[#10B981] font-semibold'
                          : 'text-slate-700 dark:text-[#F8FAFC]'
                      }`}
                    >
                      {dihedral.elements[resIdx].label}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
