import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { analyzeAbelianGroup, classifyAbelianGroups } from '../../math/abelianGroups';
import { buildDihedralGroup } from '../../math/dihedralGroups';
import { eulerPhi, factorial, gcd } from '../../math/numberTheory';
import { symmetricGroupParitySummary } from '../../math/permutations';
import { rowsToCSV } from '../../utils/exportResults';
import { ExportBar } from '../ui/ExportBar';
import { MathTex } from '../ui/MathTex';
import { SectionHeader } from '../ui/SectionHeader';
import { SubgroupLatticeDiagram } from '../ui/SubgroupLatticeDiagram';

export const VisualizationsSection: React.FC = () => {
  const [selectedOrderGroup, setSelectedOrderGroup] = useState<'z12' | 'v4' | 'z4x6' | 'd6' | 'd8' | 'custom'>('z4x6');
  const [customGroupInput, setCustomGroupInput] = useState('4, 6');
  const [customGroupModuli, setCustomGroupModuli] = useState<number[]>([4, 6]);
  const [customGroupError, setCustomGroupError] = useState<string | null>(null);

  const [latticeN, setLatticeN] = useState(24);
  const [latticeInput, setLatticeInput] = useState('24');
  const [latticeError, setLatticeError] = useState<string | null>(null);

  // Interactive Cyclic Generator Orbit / Star Diagram state
  const [cycleN, setCycleN] = useState(12);
  const [cycleStep, setCycleStep] = useState(5);

  const applyCustomOrderGroup = () => {
    setCustomGroupError(null);
    const parts = customGroupInput
      .split(/[×x,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map(Number);
    if (parts.length === 0 || parts.length > 4 || parts.some((m) => !Number.isInteger(m) || m < 1 || m > 60)) {
      setCustomGroupError('Enter 1–4 positive integers (≤ 60) with product ≤ 256 (e.g. "18" or "3, 6").');
      return;
    }
    const prod = parts.reduce((acc, m) => acc * m, 1);
    if (prod > 256) {
      setCustomGroupError(`Group order ${prod} exceeds 256 enumeration limit.`);
      return;
    }
    setCustomGroupModuli(parts);
    setSelectedOrderGroup('custom');
  };

  const applyLatticeN = () => {
    setLatticeError(null);
    const v = Number(latticeInput.trim());
    if (!Number.isInteger(v) || v < 1 || v > 120) {
      setLatticeError('Enter an integer n between 1 and 120.');
      return;
    }
    setLatticeN(v);
  };

  // 1. Element Order Distribution (computed live)
  const { orderDistData, activeOrderGroupName } = useMemo(() => {
    if (selectedOrderGroup === 'z12') {
      return { orderDistData: analyzeAbelianGroup([12]).orderDistribution, activeOrderGroupName: 'Z_12' };
    }
    if (selectedOrderGroup === 'v4') {
      return { orderDistData: analyzeAbelianGroup([2, 2]).orderDistribution, activeOrderGroupName: 'Z_2 × Z_2' };
    }
    if (selectedOrderGroup === 'z4x6') {
      return { orderDistData: analyzeAbelianGroup([4, 6]).orderDistribution, activeOrderGroupName: 'Z_4 × Z_6' };
    }
    if (selectedOrderGroup === 'custom') {
      const g = analyzeAbelianGroup(customGroupModuli);
      return { orderDistData: g.orderDistribution, activeOrderGroupName: g.groupName };
    }
    const dn = selectedOrderGroup === 'd6' ? 6 : 8;
    const d = buildDihedralGroup(dn);
    const map = new Map<number, number>();
    d.elements.forEach((el) => map.set(el.order, (map.get(el.order) ?? 0) + 1));
    return {
      orderDistData: Array.from(map.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([order, count]) => ({ order, count })),
      activeOrderGroupName: `D_${dn}`,
    };
  }, [selectedOrderGroup, customGroupModuli]);

  // 2. Generator Counts φ(n) vs Order n (n = 1..20)
  const generatorComparisonData = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => {
      const n = i + 1;
      const phi = eulerPhi(n).phi;
      return { n: `Z_${n}`, order: n, generators: phi };
    });
  }, []);

  // 3. Even vs Odd Permutation Counts in S_n (n = 1..6)
  const parityComparisonData = useMemo(() => {
    return [1, 2, 3, 4, 5, 6].map((n) => {
      const s = symmetricGroupParitySummary(n);
      return {
        group: `S_${n}`,
        even: s.evenCount,
        odd: s.oddCount,
      };
    });
  }, []);

  // 4. Abelian Classification Counts for key composite orders
  const classificationChartData = useMemo(() => {
    const orders = [4, 6, 8, 12, 16, 18, 24, 32, 36, 48, 60, 72];
    return orders.map((n) => ({
      order: `n=${n}`,
      classes: classifyAbelianGroups(n).totalClasses,
    }));
  }, []);

  // 5. Group Family Size Comparison (n = 3..6)
  const sizeComparisonData = useMemo(() => {
    return [3, 4, 5, 6].map((n) => ({
      n: `n=${n}`,
      Zn: n,
      Dn: 2 * n,
      Sn: factorial(n),
    }));
  }, []);

  // 6. Cyclic Generator Chord Diagram geometry
  const cycleDiagram = useMemo(() => {
    const cx = 140;
    const cy = 140;
    const R = 104;
    const labelR = 124;
    const step = ((cycleStep % cycleN) + cycleN) % cycleN;
    const g = gcd(cycleN, step);
    const elemOrder = cycleN / g;
    const isGenerator = cycleN === 1 ? step === 0 : g === 1;

    const generatedSet = new Set<number>();
    const generatedSeq: number[] = [0];
    generatedSet.add(0);
    let curr = (0 + step) % cycleN;
    while (curr !== 0 && generatedSeq.length <= cycleN) {
      generatedSet.add(curr);
      generatedSeq.push(curr);
      curr = (curr + step) % cycleN;
    }

    const vertices = Array.from({ length: cycleN }, (_, k) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * k) / cycleN;
      return {
        k,
        x: cx + R * Math.cos(angle),
        y: cy + R * Math.sin(angle),
        lx: cx + labelR * Math.cos(angle),
        ly: cy + labelR * Math.sin(angle),
        inSubgroup: generatedSet.has(k),
      };
    });

    const edges = generatedSeq.map((from) => {
      const to = (from + step) % cycleN;
      return {
        from,
        to,
        x1: vertices[from].x,
        y1: vertices[from].y,
        x2: vertices[to].x,
        y2: vertices[to].y,
      };
    });

    return { vertices, edges, step, g, elemOrder, isGenerator, generatedSeq };
  }, [cycleN, cycleStep]);

  const tooltipStyle = {
    backgroundColor: '#111827',
    border: '1px solid #334155',
    borderRadius: '10px',
    color: '#F8FAFC',
    fontSize: '12px',
  };

  const vizReport = [
    `Active Subgroup Lattice: Z_${latticeN}`,
    `Element Order Distribution (${activeOrderGroupName}): ${orderDistData.map((d) => `O=${d.order}: ${d.count}`).join(', ')}`,
    `Cyclic Step Diagram: ⟨${cycleDiagram.step}⟩ in Z_${cycleN} has order ${cycleDiagram.elemOrder} (${cycleDiagram.isGenerator ? 'Generator' : 'Proper subgroup'})`,
  ].join('\n');

  const vizCSV = rowsToCSV(
    ['Group', 'Element_Order', 'Element_Count'],
    orderDistData.map((d) => [activeOrderGroupName, d.order, d.count])
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Mathematical Visualizations & Subgroup Lattices"
        description="Interactive charts, cyclic subgroup Hasse diagrams, and generator orbit polygons computed directly from the finite group engines."
        formulaTex="\sum_{d \mid n} \varphi(d) = n, \qquad |\langle a \rangle| = \frac{n}{\gcd(n, a)}, \qquad |A_n| = \frac{n!}{2}"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-slate-500 dark:text-[#94A3B8]">
          Copy the element order distribution summary or explore interactive subgroup lattices below.
        </span>
        <ExportBar
          reportTitle={`Mathematical Visualizations (${activeOrderGroupName})`}
          reportFilename="finite_group_visualizations.md"
          reportContent={vizReport}
          csvFilename={`order_distribution_${activeOrderGroupName.replace(/[^a-z0-9]+/gi, '_')}.csv`}
          csvContent={vizCSV}
        />
      </div>

      {/* Interactive Subgroup Lattice */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-[#F8FAFC]">
            Interactive Cyclic Subgroup Lattice
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {[6, 8, 12, 18, 24, 30, 36, 72].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  setLatticeN(val);
                  setLatticeInput(String(val));
                  setLatticeError(null);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-mono-math transition-all ${
                  latticeN === val
                    ? 'bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-[#F8FAFC] shadow-sm shadow-[#7C3AED]/25'
                    : 'border border-slate-200 dark:border-[#334155] dark:bg-[#172554] text-slate-700 dark:text-[#F8FAFC] hover:border-purple-500 dark:hover:border-[#22D3EE]'
                }`}
              >
                Z_{val}
              </button>
            ))}
            <div className="flex items-center gap-1.5 ml-1">
              <input
                type="text"
                inputMode="numeric"
                value={latticeInput}
                onChange={(e) => setLatticeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyLatticeN()}
                aria-label="Custom lattice n"
                className="w-16 px-2 py-1 rounded-md border border-slate-300 dark:border-[#334155] bg-white dark:bg-[#0B1120] text-xs font-mono-math text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-[#22D3EE]"
              />
              <button
                type="button"
                onClick={applyLatticeN}
                className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-[#334155] dark:bg-[#172554] text-xs font-medium text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-50 dark:hover:bg-[#0B1120] hover:border-purple-400 dark:hover:border-[#22D3EE] whitespace-nowrap transition-colors"
              >
                Plot Z_n
              </button>
            </div>
          </div>
        </div>
        {latticeError && (
          <div className="text-xs text-red-600 dark:text-[#FCA5A5]">{latticeError}</div>
        )}
        <SubgroupLatticeDiagram n={latticeN} />
      </div>

      {/* Cyclic Generator Orbit / Star Polygon Diagram */}
      <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 sm:p-6 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="rounded-xl border border-slate-200/80 dark:border-[#334155] bg-slate-50/70 dark:bg-[#0B1120] p-3">
              <svg
                viewBox="0 0 280 280"
                className="w-60 h-60 sm:w-64 sm:h-64"
                role="img"
                aria-label={`Cyclic generator orbit diagram for <${cycleDiagram.step}> in Z_${cycleN}`}
              >
                <circle
                  cx={140}
                  cy={140}
                  r={104}
                  fill="none"
                  stroke="currentColor"
                  className="text-slate-200 dark:text-[#334155]"
                  strokeDasharray="3 4"
                  strokeWidth={1.2}
                />
                {cycleDiagram.edges.map((edge, idx) => (
                  <line
                    key={idx}
                    x1={edge.x1}
                    y1={edge.y1}
                    x2={edge.x2}
                    y2={edge.y2}
                    stroke={cycleDiagram.isGenerator ? '#22D3EE' : '#7C3AED'}
                    strokeWidth={2.2}
                    strokeOpacity={0.88}
                  />
                ))}
                {cycleDiagram.vertices.map((v) => (
                  <g key={v.k}>
                    <circle
                      cx={v.x}
                      cy={v.y}
                      r={v.k === 0 ? 7 : v.inSubgroup ? 5.5 : 4}
                      className={
                        v.k === 0
                          ? 'fill-amber-500 dark:fill-[#F59E0B] stroke-white dark:stroke-[#0B1120]'
                          : v.inSubgroup
                            ? 'fill-cyan-600 dark:fill-[#22D3EE] stroke-white dark:stroke-[#0B1120]'
                            : 'fill-slate-300 dark:fill-[#334155]'
                      }
                      strokeWidth={1.5}
                    />
                    <text
                      x={v.lx}
                      y={v.ly}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className={`text-[11px] font-mono-math ${
                        v.inSubgroup
                          ? 'font-semibold fill-slate-900 dark:fill-[#F8FAFC]'
                          : 'fill-slate-400 dark:fill-[#94A3B8]'
                      }`}
                    >
                      {v.k}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-[#F8FAFC]">
                Cyclic Generator Orbit Visualizer (<MathTex tex={`\\langle ${cycleDiagram.step} \\rangle \\subseteq \\mathbb{Z}_{${cycleN}}`} />)
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
                Traces multiples <MathTex tex="0 \to a \to 2a \to \dots \pmod n" /> on the circle. A single spanning polygon occurs if and only if <MathTex tex="\gcd(a, n) = 1" />.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-600 dark:text-[#94A3B8]">
                  Modulus n: <span className="font-mono-math font-semibold text-slate-900 dark:text-[#F8FAFC]">{cycleN}</span>
                </label>
                <input
                  type="range"
                  min={3}
                  max={24}
                  value={cycleN}
                  onChange={(e) => {
                    const nextN = Number(e.target.value);
                    setCycleN(nextN);
                    if (cycleStep >= nextN) setCycleStep(Math.max(1, nextN - 1));
                  }}
                  className="w-full accent-purple-600 dark:accent-[#22D3EE]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-600 dark:text-[#94A3B8]">
                  Step Element a: <span className="font-mono-math font-semibold text-purple-600 dark:text-[#22D3EE]">{cycleDiagram.step}</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={cycleN - 1}
                  value={cycleDiagram.step}
                  onChange={(e) => setCycleStep(Number(e.target.value))}
                  className="w-full accent-purple-600 dark:accent-[#7C3AED]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-lg bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#334155] text-xs sm:text-sm">
              <div>
                <div className="text-xs text-slate-500 dark:text-[#94A3B8]">GCD</div>
                <div className="font-mono-math font-semibold text-slate-900 dark:text-[#F8FAFC]">
                  gcd({cycleN}, {cycleDiagram.step}) = {cycleDiagram.g}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Subgroup Order</div>
                <div className="font-mono-math font-semibold text-purple-600 dark:text-[#22D3EE]">
                  O({cycleDiagram.step}) = {cycleDiagram.elemOrder}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Status</div>
                <div className={`font-semibold ${cycleDiagram.isGenerator ? 'text-emerald-600 dark:text-[#10B981]' : 'text-purple-600 dark:text-[#C4B5FD]'}`}>
                  {cycleDiagram.isGenerator ? 'Generator of Z_n' : 'Proper Subgroup'}
                </div>
              </div>
            </div>

            <div className="text-xs font-mono-math text-slate-700 dark:text-[#94A3B8] leading-relaxed">
              Orbit: <span className="text-slate-900 dark:text-[#F8FAFC]">{cycleDiagram.generatedSeq.join(' → ')} → 0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Chart 1: Element Order Distribution */}
        <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 space-y-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-[#F8FAFC]">
                Element Order Distribution ({activeOrderGroupName})
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                Frequency of each element order
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ['z12', 'Z₁₂'],
                  ['v4', 'Z₂×Z₂'],
                  ['z4x6', 'Z₄×Z₆'],
                  ['d6', 'D₆'],
                  ['d8', 'D₈'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setSelectedOrderGroup(key);
                    setCustomGroupError(null);
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono-math transition-all ${
                    selectedOrderGroup === key
                      ? 'bg-[#7C3AED] text-[#F8FAFC]'
                      : 'border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/60 text-slate-600 dark:text-[#F8FAFC] hover:border-purple-500 dark:hover:border-[#22D3EE]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={customGroupInput}
              onChange={(e) => setCustomGroupInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyCustomOrderGroup()}
              placeholder="Custom Z_n or direct product e.g. 3, 6"
              className="flex-1 min-w-44 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-[#334155] bg-white dark:bg-[#0B1120] text-xs font-mono-math text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-[#22D3EE]"
            />
            <button
              type="button"
              onClick={applyCustomOrderGroup}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/60 text-xs font-medium text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-50 dark:hover:bg-[#0B1120] hover:border-purple-400 dark:hover:border-[#22D3EE] whitespace-nowrap transition-colors"
            >
              Plot Custom Abelian
            </button>
          </div>
          {customGroupError && (
            <div className="text-xs text-red-600 dark:text-[#FCA5A5]">{customGroupError}</div>
          )}

          <div className="h-64 w-full rounded-lg bg-slate-50/70 dark:bg-[#0B1120]/70 border border-slate-200/70 dark:border-[#334155] p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderDistData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="vizBarCyanPurple" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22D3EE" />
                    <stop offset="100%" stopColor="#7C3AED" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                <XAxis dataKey="order" tick={{ fontSize: 12, fill: '#94A3B8' }} tickFormatter={(v) => `O=${v}`} />
                <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Elements" fill="url(#vizBarCyanPurple)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Generator Counts φ(n) vs Group Order n */}
        <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 space-y-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-[#F8FAFC]">
              Generators of <MathTex tex="\mathbb{Z}_n" /> (<MathTex tex="\varphi(n)" />) vs Group Order (n = 1..20)
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              Peaks occur at prime n where φ(p) = p - 1
            </p>
          </div>
          <div className="h-72 w-full rounded-lg bg-slate-50/70 dark:bg-[#0B1120]/70 border border-slate-200/70 dark:border-[#334155] p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={generatorComparisonData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                <XAxis dataKey="n" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#94A3B8' }} />
                <Line type="monotone" dataKey="order" name="Group Order n" stroke="#94A3B8" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="generators" name="Generators φ(n)" stroke="#22D3EE" strokeWidth={2.5} dot={{ r: 3, fill: '#22D3EE' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Even vs Odd Permutations */}
        <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 space-y-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-[#F8FAFC]">
              Even vs Odd Permutations in S₁ to S₆
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              S₅ splits evenly into 60 even (A₅) and 60 odd permutations
            </p>
          </div>
          <div className="h-64 w-full rounded-lg bg-slate-50/70 dark:bg-[#0B1120]/70 border border-slate-200/70 dark:border-[#334155] p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={parityComparisonData} margin={{ top: 8, right: 12, left: -4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                <XAxis dataKey="group" tick={{ fontSize: 12, fill: '#94A3B8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#94A3B8' }} />
                <Bar dataKey="even" name="Even (A_n)" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="odd" name="Odd" fill="#7C3AED" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Abelian Isomorphism Classes */}
        <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 space-y-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-[#F8FAFC]">
              Abelian Isomorphism Class Counts by Order
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              Computed via ∏ p(eᵢ) · Order 72 yields 6 distinct classes
            </p>
          </div>
          <div className="h-64 w-full rounded-lg bg-slate-50/70 dark:bg-[#0B1120]/70 border border-slate-200/70 dark:border-[#334155] p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classificationChartData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="vizBarPurpleCyan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C3AED" />
                    <stop offset="100%" stopColor="#22D3EE" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                <XAxis dataKey="order" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="classes" name="Isomorphism Classes" fill="url(#vizBarPurpleCyan)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Group Size Growth Comparison */}
      <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 space-y-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-[#F8FAFC]">
            Group Order Growth: Cyclic (Z_n) vs Dihedral (D_n) vs Symmetric (S_n)
          </h3>
          <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
            Comparing linear (n), dihedral (2n), and factorial (n!) group sizes for n = 3 to 6
          </p>
        </div>
        <div className="h-64 w-full rounded-lg bg-slate-50/70 dark:bg-[#0B1120]/70 border border-slate-200/70 dark:border-[#334155] p-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sizeComparisonData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
              <XAxis dataKey="n" tick={{ fontSize: 12, fill: '#94A3B8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#94A3B8' }} />
              <Bar dataKey="Zn" name="|Z_n| = n" fill="#22D3EE" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Dn" name="|D_n| = 2n" fill="#7C3AED" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Sn" name="|S_n| = n!" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
