import React, { useMemo } from 'react';
import {
  ArrowRight,
  Binary,
  BookOpen,
  Calculator,
  GraduationCap,
  Grid3X3,
  Layers,
  Orbit,
  Pentagon,
  Presentation,
  ShieldCheck,
  Shuffle,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { analyzeAbelianGroup, classifyAbelianGroups } from '../../math/abelianGroups';
import { ModulePresetPayload, NAV_ITEMS, RecentCalculation, SectionId } from '../../types/navigation';
import { MathTex } from '../ui/MathTex';
import { SectionHeader } from '../ui/SectionHeader';

interface DashboardSectionProps {
  onNavigate: (
    section: SectionId,
    preset?: Omit<ModulePresetPayload, 'nonce'>,
    fromDemo?: boolean
  ) => void;
  recentCalculations: RecentCalculation[];
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({
  onNavigate,
  recentCalculations,
}) => {
  const kleinFour = useMemo(() => analyzeAbelianGroup([2, 2]), []);
  const z4x6 = useMemo(() => analyzeAbelianGroup([4, 6]), []);
  const order72 = useMemo(() => classifyAbelianGroups(72), []);

  const quickCalculators: {
    id: SectionId;
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: 'abelian',
      title: 'Abelian Group Explorer',
      subtitle: 'Cyclic Z_n, direct products & subgroup lattices',
      icon: Layers,
    },
    {
      id: 'classification',
      title: 'Group Classification',
      subtitle: 'Decompose any order n into isomorphism classes',
      icon: Binary,
    },
    {
      id: 'cayley',
      title: 'Cayley Table Generator',
      subtitle: 'Interactive multiplication tables & identity highlights',
      icon: Grid3X3,
    },
    {
      id: 'element-order',
      title: 'Element Order Calculator',
      subtitle: 'GCD & LCM order steps in direct products',
      icon: Calculator,
    },
    {
      id: 'permutations',
      title: 'Permutation Explorer',
      subtitle: 'Cycle notation, composition & inverses in S_n',
      icon: Shuffle,
    },
    {
      id: 'dihedral',
      title: 'Dihedral Group Explorer',
      subtitle: 'Interactive polygon symmetries D_n',
      icon: Pentagon,
    },
  ];

  const formulas = [
    {
      name: 'Cyclic Element Order',
      tex: 'O(a) = \\frac{n}{\\gcd(n, a)} \\quad \\text{in } \\mathbb{Z}_n',
      note: 'An element a generates Z_n if and only if gcd(a, n) = 1.',
    },
    {
      name: 'Direct Product Order',
      tex: 'O((a_1, \\dots, a_k)) = \\operatorname{lcm}\\big(O(a_1), \\dots, O(a_k)\\big)',
      note: 'A finite product Z_{n_1} × ... × Z_{n_k} is cyclic iff factors are pairwise coprime.',
    },
    {
      name: "Euler's Totient Function",
      tex: '\\varphi(n) = n \\prod_{p \\mid n} \\left(1 - \\frac{1}{p}\\right)',
      note: 'Equals the exact number of generators of the cyclic group Z_n.',
    },
    {
      name: 'Dihedral Presentation',
      tex: 'D_n = \\langle r, s \\mid r^n = e,\\; s^2 = e,\\; srs = r^{-1} \\rangle',
      note: 'Symmetry group of a regular n-gon with |D_n| = 2n elements.',
    },
  ];

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Finite Group Explorer"
        description="Finite Abelian, Permutation & Dihedral Group Explorer — an interactive computational workbench for exploring algebraic structures, step-by-step proofs, axiom verification, and geometric symmetries."
        formulaTex="|G| = \sum_{d \mid |G|} |\{g \in G : O(g) = d\}|"
      />

      {/* Quantitative Overview Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
          <div className="text-xs font-medium text-slate-500 dark:text-[#94A3B8]">
            Mathematical Modules
          </div>
          <div className="mt-2 text-3xl font-semibold font-mono-math text-slate-900 dark:text-[#F8FAFC]">
            {NAV_ITEMS.length}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-[#94A3B8]">
            Client-side verified algorithms
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-[#7C3AED]/45 bg-white dark:bg-gradient-to-br dark:from-[#172554] dark:via-[#172554] dark:to-[#7C3AED]/20 p-5 transition-all duration-200 hover:border-[#7C3AED]">
          <div className="text-xs font-medium text-slate-500 dark:text-[#94A3B8]">
            Klein Four-Group (<MathTex tex="\mathbb{Z}_2 \times \mathbb{Z}_2" />)
          </div>
          <div className="mt-2 text-3xl font-semibold font-mono-math text-[#7C3AED] dark:text-[#22D3EE]">
            |{kleinFour.order}|
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-[#94A3B8]">
            Orders: 1, 2, 2, 2 · Non-cyclic
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-[#22D3EE]/35 bg-white dark:bg-gradient-to-br dark:from-[#172554] dark:via-[#172554] dark:to-[#22D3EE]/15 p-5 transition-all duration-200 hover:border-[#22D3EE]">
          <div className="text-xs font-medium text-slate-500 dark:text-[#94A3B8]">
            Abelian Classes (Order 72)
          </div>
          <div className="mt-2 text-3xl font-semibold font-mono-math text-[#7C3AED] dark:text-[#C4B5FD]">
            {order72.totalClasses}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-[#94A3B8]">
            <MathTex tex="72 = 2^3 \cdot 3^2,\; p(3)\cdot p(2) = 6" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
          <div className="text-xs font-medium text-slate-500 dark:text-[#94A3B8]">
            Session Calculations
          </div>
          <div className="mt-2 text-3xl font-semibold font-mono-math text-slate-900 dark:text-[#F8FAFC]">
            {recentCalculations.length}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-[#94A3B8]">
            Live computation history
          </div>
        </div>
      </div>

      {/* Quick Access Calculators */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-[#F8FAFC]">
            Quick Access Calculators
          </h2>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => onNavigate('guided-examples', { guidedTab: 'quiz' })}
              className="text-xs sm:text-sm font-medium text-[#7C3AED] dark:text-[#C4B5FD] hover:text-[#6D28D9] dark:hover:text-[#22D3EE] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Interactive Learning Quiz</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('guided-examples', { guidedTab: 'demo' })}
              className="text-xs sm:text-sm font-medium text-cyan-700 dark:text-[#22D3EE] hover:underline inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Presentation className="w-4 h-4" />
              <span>Teacher Demo Mode</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {quickCalculators.map((calc) => {
            const Icon = calc.icon;
            return (
              <button
                key={calc.id}
                type="button"
                onClick={() => onNavigate(calc.id)}
                className="group text-left rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 hover:border-[#7C3AED] dark:hover:border-[#22D3EE]/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-12px_rgba(124,58,237,0.45)] flex items-start gap-4"
              >
                <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-[#0B1120] border border-purple-100 dark:border-[#334155] text-[#7C3AED] dark:text-[#22D3EE] group-hover:border-[#7C3AED]/60 shrink-0 transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC] group-hover:text-[#7C3AED] dark:group-hover:text-[#22D3EE] transition-colors">
                      {calc.title}
                    </h3>
                    <ArrowRight className="w-4 h-4 text-slate-400 dark:text-[#94A3B8] group-hover:text-[#7C3AED] dark:group-hover:text-[#22D3EE] transition-transform group-hover:translate-x-0.5 shrink-0" />
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-[#94A3B8] leading-relaxed">
                    {calc.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Group Theory Overview + Live Order Distribution Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        <div className="xl:col-span-7 rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-6 flex flex-col justify-between space-y-5 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-[#F8FAFC]">
              Group Theory Structural Overview
            </h2>
            <p className="text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed">
              A finite group <MathTex tex="(G, *)" /> is a finite set equipped with a binary operation satisfying closure, associativity, a two-sided identity element <MathTex tex="e" />, and two-sided inverses for every element.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 dark:border-[#334155]">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">
                <Orbit className="w-4 h-4 text-[#7C3AED] dark:text-[#22D3EE]" />
                <span>Abelian Groups</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] leading-relaxed">
                Commutative groups decompose uniquely into cyclic prime-power building blocks via the Fundamental Theorem.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">
                <Shuffle className="w-4 h-4 text-[#7C3AED] dark:text-[#C4B5FD]" />
                <span>Symmetric Groups</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] leading-relaxed">
                Bijections of <MathTex tex="\{1,\dots,n\}" /> form <MathTex tex="S_n" /> of order <MathTex tex="n!" />, partitioned equally into even and odd permutations for <MathTex tex="n \ge 2" />.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">
                <Pentagon className="w-4 h-4 text-[#F59E0B]" />
                <span>Dihedral Symmetries</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] leading-relaxed">
                Rigid motions of a regular <MathTex tex="n" />-gon form <MathTex tex="D_n" /> with <MathTex tex="n" /> rotations and <MathTex tex="n" /> reflections.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-[#334155] flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('properties')}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#8B5CF6] hover:to-[#7C3AED] text-[#F8FAFC] text-xs font-medium transition-all shadow-[0_6px_18px_-6px_rgba(124,58,237,0.6)] inline-flex items-center gap-2 whitespace-nowrap"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Open Axiom Verifier</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('visualizations')}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/70 text-slate-700 dark:text-[#F8FAFC] text-xs font-medium hover:border-[#7C3AED] dark:hover:border-[#22D3EE]/70 transition-colors inline-flex items-center gap-2 whitespace-nowrap"
            >
              <BookOpen className="w-4 h-4 text-[#7C3AED] dark:text-[#22D3EE]" />
              <span>Subgroup Lattices &amp; Charts</span>
            </button>
          </div>
        </div>

        {/* Live computed chart of Z_4 × Z_6 element order distribution */}
        <div className="xl:col-span-5 rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-6 flex flex-col transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">
                Element Order Distribution in <MathTex tex="\mathbb{Z}_4 \times \mathbb{Z}_6" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                24 elements · Max order lcm(4, 6) = {z4x6.maxElementOrder}
              </p>
            </div>
          </div>
          <div className="h-56 w-full mt-auto rounded-lg bg-slate-50/70 dark:bg-[#0B1120]/70 border border-slate-200/70 dark:border-[#334155] p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={z4x6.orderDistribution} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashOrderGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.9} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
                <XAxis
                  dataKey="order"
                  tick={{ fontSize: 12, fill: '#94A3B8' }}
                  tickFormatter={(v) => `O=${v}`}
                />
                <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                  formatter={(value) => [`${value ?? 0} element(s)`, 'Count']}
                  labelFormatter={(label) => `Element Order ${label}`}
                />
                <Bar dataKey="count" fill="url(#dashOrderGrad)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Formula Reference & Recent Calculations */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-7 rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-6 space-y-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-[#F8FAFC]">
            Mathematical Formula Reference
          </h2>
          <div className="divide-y divide-slate-100 dark:divide-[#334155]">
            {formulas.map((f) => (
              <div key={f.name} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium text-slate-900 dark:text-[#F8FAFC]">{f.name}</div>
                  <div className="text-xs text-slate-500 dark:text-[#94A3B8]">{f.note}</div>
                </div>
                <div className="text-sm text-slate-800 dark:text-[#F8FAFC] bg-slate-50 dark:bg-[#0B1120] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#334155] shrink-0 overflow-x-auto">
                  <MathTex tex={f.tex} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-5 rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-6 space-y-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-[#F8FAFC]">
              Recently Calculated Results
            </h2>
            <span className="text-xs text-slate-500 dark:text-[#22D3EE]">Live log</span>
          </div>

          {recentCalculations.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <p className="text-sm text-slate-600 dark:text-[#94A3B8]">
                No custom calculations logged yet in this session.
              </p>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8]/80">
                Run any calculator to record results here for quick comparison.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-[#334155] max-h-72 overflow-y-auto">
              {recentCalculations.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.section)}
                  className="w-full text-left py-3 first:pt-0 last:pb-0 hover:bg-slate-50 dark:hover:bg-[#0B1120]/55 rounded-md px-2 -mx-2 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-[#94A3B8]">
                    <span className="font-medium text-[#7C3AED] dark:text-[#22D3EE]">{item.moduleName}</span>
                    <span className="font-mono-math">{item.timestamp}</span>
                  </div>
                  <div className="mt-1 text-sm font-medium text-slate-900 dark:text-[#F8FAFC] truncate">
                    {item.inputSummary}
                  </div>
                  <div className="mt-0.5 text-xs font-mono-math text-slate-600 dark:text-[#94A3B8] truncate">
                    {item.resultSummary}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
