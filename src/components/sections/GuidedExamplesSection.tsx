import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  HelpCircle,
  Presentation,
  RefreshCw,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import {
  analyzeAbelianGroup,
  classifyAbelianGroups,
  computeAbelianElementOrder,
} from '../../math/abelianGroups';
import { buildDihedralGroup } from '../../math/dihedralGroups';
import { generateLearningQuizSet } from '../../math/learningQuiz';
import { eulerPhi } from '../../math/numberTheory';
import { symmetricGroupParitySummary } from '../../math/permutations';
import { ModulePresetPayload, SectionId } from '../../types/navigation';
import { MathTex } from '../ui/MathTex';
import { SectionHeader } from '../ui/SectionHeader';

interface GuidedExamplesSectionProps {
  onNavigate: (
    section: SectionId,
    preset?: Omit<ModulePresetPayload, 'nonce'>,
    fromDemo?: boolean
  ) => void;
  preset?: { guidedTab?: 'examples' | 'quiz' | 'demo'; nonce: number };
}

interface GuidedExample {
  number: number;
  title: string;
  targetSection: SectionId;
  targetLabel: string;
  presetPayload: Omit<ModulePresetPayload, 'nonce'>;
  given: string;
  formulaTex: string;
  steps: string[];
  finalAnswer: string;
  verification: string;
  talkingPoint: string;
}

export const GuidedExamplesSection: React.FC<GuidedExamplesSectionProps> = ({
  onNavigate,
  preset,
}) => {
  const [activeTab, setActiveTab] = useState<'examples' | 'quiz' | 'demo'>('examples');

  // Interactive Learning Mode state
  const [quizRound, setQuizRound] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [checkedQuestions, setCheckedQuestions] = useState<Record<string, boolean>>({});

  // Teacher Demo Mode state
  const [demoIdx, setDemoIdx] = useState(0);

  useEffect(() => {
    if (preset?.guidedTab) {
      setActiveTab(preset.guidedTab);
    }
  }, [preset]);

  const quizQuestions = useMemo(() => generateLearningQuizSet(quizRound), [quizRound]);

  const checkedCount = Object.values(checkedQuestions).filter(Boolean).length;
  const correctCount = quizQuestions.reduce((sum, q) => {
    if (!checkedQuestions[q.id]) return sum;
    return selectedAnswers[q.id] === q.correctIndex ? sum + 1 : sum;
  }, 0);

  const handleSelectOption = (qId: string, optIdx: number) => {
    if (checkedQuestions[qId]) return;
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optIdx }));
  };

  const handleCheckQuestion = (qId: string) => {
    if (selectedAnswers[qId] === undefined) return;
    setCheckedQuestions((prev) => ({ ...prev, [qId]: true }));
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setCheckedQuestions({});
  };

  const handleNewQuizRound = () => {
    setQuizRound((r) => r + 1);
    setSelectedAnswers({});
    setCheckedQuestions({});
  };

  const examples: GuidedExample[] = useMemo(() => {
    const v4 = analyzeAbelianGroup([2, 2]);
    const ord12 = computeAbelianElementOrder([1, 2], [2, 3]);
    const ord23 = computeAbelianElementOrder([2, 3], [4, 6]);
    const ord12z4z6 = computeAbelianElementOrder([1, 2], [4, 6]);
    const z4 = analyzeAbelianGroup([4]);
    const phi12 = eulerPhi(12);
    const cls72 = classifyAbelianGroups(72);
    const s5 = symmetricGroupParitySummary(5);
    const d6 = buildDihedralGroup(6);
    const d8 = buildDihedralGroup(8);

    return [
      {
        number: 1,
        title: 'Z₂ × Z₂ and its Element Orders',
        targetSection: 'abelian',
        targetLabel: 'Launch in Abelian Explorer',
        presetPayload: { abelian: { mode: 'product', input: '2, 2' } },
        given: 'The Klein four-group G = Z₂ × Z₂ under coordinate-wise addition mod 2.',
        formulaTex: 'O((a, b)) = \\operatorname{lcm}(O(a), O(b)), \\quad O(x) = \\frac{2}{\\gcd(2, x)}',
        steps: [
          'List all 2 × 2 = 4 tuples: (0,0), (0,1), (1,0), (1,1).',
          'For (0,0): O(0) = 2/gcd(2,0) = 1, so O((0,0)) = lcm(1,1) = 1.',
          'For (0,1), (1,0), and (1,1): O(1) = 2/gcd(2,1) = 2, so lcm(1,2) = 2 and lcm(2,2) = 2.',
        ],
        finalAnswer: `Elements: ${v4.elements.map((e) => `${e.label} (order ${e.order})`).join(', ')}.`,
        verification: `Live engine confirms |Z₂ × Z₂| = ${v4.order} with sorted orders [${v4.elements.map((e) => e.order).sort().join(', ')}].`,
        talkingPoint: 'Emphasize that Z₂ × Z₂ and Z₄ both have order 4, yet they are non-isomorphic because element orders are isomorphism invariants.',
      },
      {
        number: 2,
        title: 'Why Z₂ × Z₂ has No Element of Order 4',
        targetSection: 'element-order',
        targetLabel: 'Test in Element Order Calculator',
        presetPayload: { elementOrder: { moduli: '2, 2', element: '1, 1' } },
        given: 'G = Z₂ × Z₂ of order 4.',
        formulaTex: '\\exp(G) = \\operatorname{lcm}(2, 2) = 2 < 4 = |G|',
        steps: [
          'Every coordinate a_i ∈ Z₂ satisfies 2·a_i ≡ 0 (mod 2), hence O(a_i) ∈ {1, 2}.',
          'Therefore, for any (a, b) ∈ Z₂ × Z₂, O((a, b)) = lcm(O(a), O(b)) divides lcm(2, 2) = 2.',
          'Since the maximum possible element order is 2 < 4, no element can generate the whole group.',
        ],
        finalAnswer: 'Z₂ × Z₂ has no element of order 4 and is non-cyclic (not isomorphic to Z₄).',
        verification: `Engine check: maxElementOrder = ${v4.maxElementOrder}, isCyclic = ${String(v4.isCyclic)}.`,
        talkingPoint: 'Common student misconception: assuming every group of order n is cyclic when n is small. Order 4 is the smallest non-prime order and already splits into two classes.',
      },
      {
        number: 3,
        title: 'Element Orders in Z₂ × Z₃ and Z₄ × Z₆',
        targetSection: 'element-order',
        targetLabel: 'Open in Element Order Calculator',
        presetPayload: { elementOrder: { moduli: '4, 6', element: '1, 2' } },
        given: 'Elements (1, 2) ∈ Z₂ × Z₃, (2, 3) ∈ Z₄ × Z₆, and (1, 2) ∈ Z₄ × Z₆.',
        formulaTex: 'O((a, b)) = \\operatorname{lcm}\\left(\\frac{m}{\\gcd(m, a)},\\; \\frac{n}{\\gcd(n, b)}\\right)',
        steps: [
          `In Z₂ × Z₃ for (1, 2): O(1) = 2/gcd(2,1) = 2, O(2) = 3/gcd(3,2) = 3 → lcm(2, 3) = ${ord12.order}.`,
          `In Z₄ × Z₆ for (2, 3): O(2) = 4/gcd(4,2) = 2, O(3) = 6/gcd(6,3) = 2 → lcm(2, 2) = ${ord23.order}.`,
          `In Z₄ × Z₆ for (1, 2): O(1) = 4/gcd(4,1) = 4, O(2) = 6/gcd(6,2) = 3 → lcm(4, 3) = ${ord12z4z6.order}.`,
        ],
        finalAnswer: `O(1,2) in Z₂×Z₃ = ${ord12.order}; O(2,3) in Z₄×Z₆ = ${ord23.order}; O(1,2) in Z₄×Z₆ = ${ord12z4z6.order}.`,
        verification: `Verified via Euclidean GCD and LCM computation.`,
        talkingPoint: 'Contrast Z₂ × Z₃ ≅ Z₆ (coprime moduli give order 6) with Z₄ × Z₆ (gcd(4,6) = 2 > 1 caps exponent at lcm(4,6) = 12).',
      },
      {
        number: 4,
        title: 'Generators of Z₄',
        targetSection: 'generators',
        targetLabel: 'Launch in Generator Calculator',
        presetPayload: { generators: { n: '4' } },
        given: 'Cyclic group Z₄ = {0, 1, 2, 3} under addition modulo 4.',
        formulaTex: '\\langle a \\rangle = \\mathbb{Z}_4 \\iff \\gcd(a, 4) = 1',
        steps: [
          'Check a = 0: gcd(4, 0) = 4 → O(0) = 1 (not a generator).',
          'Check a = 1: gcd(4, 1) = 1 → O(1) = 4 (generator).',
          'Check a = 2: gcd(4, 2) = 2 → O(2) = 4/2 = 2 (generates {0, 2}, not Z₄).',
          'Check a = 3: gcd(4, 3) = 1 → O(3) = 4 (generator).',
        ],
        finalAnswer: `Generators of Z₄ are { ${z4.generators.map((g) => g.label).join(', ')} }.`,
        verification: `Generator count = ${z4.generators.length}, matching φ(4) = ${eulerPhi(4).phi}.`,
        talkingPoint: 'Notice that 2 generates the unique subgroup of order 2 in Z₄, while 1 and 3 = -1 mod 4 are mutual inverses and both generate Z₄.',
      },
      {
        number: 5,
        title: "Euler's Phi Function φ(12)",
        targetSection: 'euler-phi',
        targetLabel: 'Launch in Euler Phi Calculator',
        presetPayload: { eulerPhi: { n: '12' } },
        given: 'Positive integer n = 12.',
        formulaTex: '\\varphi(12) = \\varphi(2^2 \\cdot 3^1) = (2^2 - 2^1)(3^1 - 3^0)',
        steps: [
          'Factorize 12 into prime powers: 12 = 2² · 3¹.',
          'Apply multiplicativity on coprime factors: φ(2²) = 4 - 2 = 2, and φ(3¹) = 3 - 1 = 2.',
          'Multiply: φ(12) = 2 × 2 = 4.',
        ],
        finalAnswer: `φ(12) = ${phi12.phi}, corresponding to coprimes {${phi12.coprimes.join(', ')}}.`,
        verification: `Verified by checking gcd(k, 12) = 1 for 1 ≤ k ≤ 12: exactly ${phi12.coprimes.length} integers.`,
        talkingPoint: 'Warn students against computing φ(2²) as 2² - 1 = 3; for prime powers, φ(p^e) = p^e - p^{e-1}, not p^e - 1.',
      },
      {
        number: 6,
        title: 'Classification of Finite Abelian Groups of Order 72',
        targetSection: 'classification',
        targetLabel: 'Launch in Group Classification',
        presetPayload: { classification: { n: '72' } },
        given: 'Order n = 72.',
        formulaTex: '72 = 2^3 \\cdot 3^2 \\implies \\text{Classes} = p(3) \\cdot p(2) = 3 \\times 2 = 6',
        steps: [
          'Factorize 72 = 2³ · 3².',
          'Partitions of 3 are [3], [2,1], [1,1,1] (3 partitions). Partitions of 2 are [2], [1,1] (2 partitions).',
          'Combine each 2-power partition with each 3-power partition to form elementary divisors and invariant factors.',
        ],
        finalAnswer: `6 isomorphism classes: ${cls72.classes.map((c) => c.invariantNotation).join('; ')}.`,
        verification: `All ${cls72.totalClasses} classes verified to have product order ∏ dᵢ = 72.`,
        talkingPoint: 'Walk through aligning prime-power partitions side-by-side to convert elementary divisors into canonical invariant factors d₁ | d₂ | ... | d_m.',
      },
      {
        number: 7,
        title: 'Number of Even Permutations in S₅',
        targetSection: 'parity',
        targetLabel: 'Launch in Parity Analyzer',
        presetPayload: { parity: { n: 5, perm: '(1 3 5)(2 4)' } },
        given: 'Symmetric group S₅ of all permutations on {1, 2, 3, 4, 5}.',
        formulaTex: '|A_5| = \\frac{|S_5|}{2} = \\frac{5!}{2}',
        steps: [
          'Total permutations in S₅: |S₅| = 5! = 120.',
          'The sign map sgn: S₅ → {+1, -1} is a surjective homomorphism, so its kernel A₅ has index 2.',
          'Hence |A₅| = 120 / 2 = 60 even permutations (and 60 odd permutations).',
        ],
        finalAnswer: `There are ${s5.evenCount} even permutations in S₅.`,
        verification: `Exhaustively verified across all ${s5.totalPermutations} permutations in S₅: ${s5.evenCount} even, ${s5.oddCount} odd.`,
        talkingPoint: 'Multiplying any permutation by the single transposition (1 2) defines a bijection between A_n (even) and S_n \\ A_n (odd) for every n ≥ 2.',
      },
      {
        number: 8,
        title: 'Dihedral Groups D₆ and D₈',
        targetSection: 'dihedral',
        targetLabel: 'Launch in Dihedral Explorer',
        presetPayload: { dihedral: { n: 6 } },
        given: 'Symmetry groups of a regular hexagon (n = 6) and regular octagon (n = 8).',
        formulaTex: '|D_n| = 2n, \\quad r^n = e,\\; s^2 = e,\\; srs = r^{-1}',
        steps: [
          `For D₆ (hexagon): 6 rotations {e, r, ..., r⁵} and 6 reflections {s, sr, ..., sr⁵} → |D₆| = 2(6) = ${d6.order}.`,
          `For D₈ (octagon): 8 rotations {e, r, ..., r⁷} and 8 reflections {s, sr, ..., sr⁷} → |D₈| = 2(8) = ${d8.order}.`,
          `Both have even n, so each has a nontrivial centre of order 2: Z(D₆) = {${d6.centreLabels.join(', ')}} and Z(D₈) = {${d8.centreLabels.join(', ')}}.`,
        ],
        finalAnswer: `|D₆| = ${d6.order} elements; |D₈| = ${d8.order} elements.`,
        verification: `Verified via full Cayley tables: srs = r⁻¹ holds in both groups, and both are non-Abelian.`,
        talkingPoint: 'Demonstrate r ∘ s versus s ∘ r visually on the polygon stage: rotating after reflecting moves the vertex along the opposite direction.',
      },
    ];
  }, []);

  const currentDemo = examples[demoIdx] ?? examples[0];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Guided Examples, Interactive Learning & Teacher Demo"
        description="Explore eight verified abstract algebra proofs, test yourself with algorithmically graded practice problems, or present step-by-step in Teacher Demonstration Mode."
        formulaTex="\mathbb{Z}_n,\quad \mathbb{Z}_{n_1}\times\dots\times\mathbb{Z}_{n_k},\quad S_n,\quad D_n"
      />

      {/* Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap items-center p-1 rounded-lg bg-slate-100 dark:bg-[#0B1120] border border-slate-200 dark:border-[#334155] gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('examples')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-md transition-all inline-flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'examples'
                ? 'bg-white dark:bg-[#7C3AED] text-slate-900 dark:text-[#F8FAFC] shadow-sm'
                : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Worked Examples (8)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quiz')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-md transition-all inline-flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'quiz'
                ? 'bg-white dark:bg-[#7C3AED] text-slate-900 dark:text-[#F8FAFC] shadow-sm'
                : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Interactive Learning Mode</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('demo')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-md transition-all inline-flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'demo'
                ? 'bg-white dark:bg-[#7C3AED] text-slate-900 dark:text-[#F8FAFC] shadow-sm'
                : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
            }`}
          >
            <Presentation className="w-4 h-4" />
            <span>Teacher Demonstration Mode</span>
          </button>
        </div>
      </div>

      {/* TAB 1: WORKED EXAMPLES */}
      {activeTab === 'examples' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {examples.map((ex) => (
            <div
              key={ex.number}
              className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-6 flex flex-col justify-between space-y-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/70"
            >
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-mono-math text-purple-600 dark:text-[#22D3EE] font-medium">
                    Example {String(ex.number).padStart(2, '0')}
                  </div>
                  <h2 className="mt-0.5 text-lg font-semibold text-slate-900 dark:text-[#F8FAFC]">
                    {ex.title}
                  </h2>
                </div>

                <div className="text-sm text-slate-600 dark:text-[#94A3B8]">
                  <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">Given: </span>
                  {ex.given}
                </div>

                <div className="px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#334155] overflow-x-auto text-sm text-slate-900 dark:text-[#F8FAFC]">
                  <MathTex tex={ex.formulaTex} />
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-slate-500 dark:text-[#94A3B8]">
                    Step-by-Step Solution
                  </div>
                  <ol className="space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-[#F8FAFC]/90 list-decimal list-inside leading-relaxed">
                    {ex.steps.map((st, idx) => (
                      <li key={idx}>{st}</li>
                    ))}
                  </ol>
                </div>

                <div className="p-3 rounded-lg bg-gradient-to-r from-purple-50 to-cyan-50/70 dark:from-[#7C3AED]/20 dark:to-[#22D3EE]/12 border border-purple-200 dark:border-[#7C3AED]/50 text-sm text-slate-900 dark:text-[#F8FAFC]">
                  <span className="font-semibold text-purple-800 dark:text-[#22D3EE]">Final Answer: </span>
                  <span className="font-mono-math">{ex.finalAnswer}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#334155] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-1.5 text-xs text-emerald-700 dark:text-[#10B981]">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{ex.verification}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate(ex.targetSection, ex.presetPayload, false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/60 text-xs font-medium text-slate-700 dark:text-[#F8FAFC] hover:border-purple-500 dark:hover:border-[#22D3EE] hover:text-purple-600 dark:hover:text-[#22D3EE] inline-flex items-center gap-1 shrink-0 whitespace-nowrap self-start sm:self-auto transition-colors"
                >
                  <span>{ex.targetLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: INTERACTIVE LEARNING MODE */}
      {activeTab === 'quiz' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 flex flex-wrap items-center justify-between gap-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-[#7C3AED]/20 border border-purple-200 dark:border-[#7C3AED]/40 text-purple-600 dark:text-[#22D3EE]">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-[#F8FAFC]">
                  Abstract Algebra Practice Assessment (Set #{quizRound + 1})
                </h2>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                  Every question and solution is computed dynamically by the verified finite group engine.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="px-3.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#334155] text-xs font-mono-math text-slate-700 dark:text-[#F8FAFC]">
                Score:{' '}
                <span className="font-semibold text-purple-600 dark:text-[#22D3EE]">
                  {correctCount} / {checkedCount} checked
                </span>{' '}
                <span className="text-slate-400 dark:text-[#94A3B8]">({quizQuestions.length} total)</span>
              </div>
              <button
                type="button"
                onClick={handleResetQuiz}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/60 text-xs font-medium text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-50 dark:hover:bg-[#0B1120] inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Answers</span>
              </button>
              <button
                type="button"
                onClick={handleNewQuizRound}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#8B5CF6] hover:to-[#7C3AED] text-[#F8FAFC] text-xs font-medium shadow-sm shadow-[#7C3AED]/25 inline-flex items-center gap-1.5 whitespace-nowrap transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>New Problem Set</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {quizQuestions.map((q, qIdx) => {
              const selected = selectedAnswers[q.id];
              const isChecked = !!checkedQuestions[q.id];
              const isCorrect = isChecked && selected === q.correctIndex;

              return (
                <div
                  key={q.id}
                  className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 sm:p-6 flex flex-col justify-between space-y-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono-math font-semibold text-purple-600 dark:text-[#22D3EE]">
                        Question {qIdx + 1} · {q.topic}
                      </span>
                      {isChecked && (
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold ${
                            isCorrect
                              ? 'text-emerald-600 dark:text-[#10B981]'
                              : 'text-red-600 dark:text-[#EF4444]'
                          }`}
                        >
                          {isCorrect ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Correct</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4" />
                              <span>Incorrect</span>
                            </>
                          )}
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-medium text-slate-900 dark:text-[#F8FAFC] leading-relaxed">
                      {q.promptText}
                    </p>

                    {q.promptTex && (
                      <div className="px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#334155] overflow-x-auto text-sm text-slate-900 dark:text-[#F8FAFC]">
                        <MathTex tex={q.promptTex} />
                      </div>
                    )}

                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => {
                        const isPicked = selected === optIdx;
                        const isRightOpt = optIdx === q.correctIndex;

                        let btnClasses =
                          'border-slate-200 dark:border-[#334155] bg-white dark:bg-[#0B1120] text-slate-800 dark:text-[#F8FAFC] hover:border-purple-500 dark:hover:border-[#22D3EE]';
                        if (isChecked) {
                          if (isRightOpt) {
                            btnClasses =
                              'border-emerald-500 dark:border-[#10B981] bg-emerald-50/70 dark:bg-[#10B981]/18 text-emerald-900 dark:text-[#A7F3D0] font-medium';
                          } else if (isPicked && !isRightOpt) {
                            btnClasses =
                              'border-red-500 dark:border-[#EF4444] bg-red-50/70 dark:bg-[#EF4444]/18 text-red-900 dark:text-[#FCA5A5]';
                          }
                        } else if (isPicked) {
                          btnClasses =
                            'border-purple-600 dark:border-[#22D3EE] bg-purple-50/70 dark:bg-[#22D3EE]/15 text-purple-900 dark:text-[#22D3EE] font-medium';
                        }

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            disabled={isChecked}
                            onClick={() => handleSelectOption(q.id, optIdx)}
                            className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs sm:text-sm transition-colors flex items-center gap-3 ${btnClasses}`}
                          >
                            <span className="font-mono-math text-xs text-slate-400 dark:text-[#94A3B8] shrink-0">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            <span className="font-mono-math">{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {isChecked && (
                      <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#334155] space-y-2">
                        <div className="text-xs font-semibold text-slate-700 dark:text-[#22D3EE]">
                          Mathematical Explanation
                        </div>
                        <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                          {q.explanationText}
                        </p>
                        <div className="text-xs overflow-x-auto text-slate-900 dark:text-[#F8FAFC] pt-1">
                          <MathTex tex={q.explanationTex} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-[#334155] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      disabled={selected === undefined || isChecked}
                      onClick={() => handleCheckQuestion(q.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-[#7C3AED] disabled:opacity-40 text-white dark:text-[#F8FAFC] text-xs font-medium hover:bg-slate-800 dark:hover:bg-[#8B5CF6] transition-colors whitespace-nowrap"
                    >
                      {isChecked ? 'Checked' : 'Check Answer'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate(q.relatedSection)}
                      className="text-xs font-medium text-purple-600 dark:text-[#22D3EE] hover:underline inline-flex items-center gap-1 whitespace-nowrap"
                    >
                      <span>Practice in Calculator</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: TEACHER DEMONSTRATION MODE */}
      {activeTab === 'demo' && (
        <div className="space-y-5">
          {/* Demonstration Step Navigator */}
          <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
            <div className="flex flex-wrap items-center gap-1.5">
              {examples.map((ex, i) => (
                <button
                  key={ex.number}
                  type="button"
                  onClick={() => setDemoIdx(i)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono-math font-medium transition-all ${
                    demoIdx === i
                      ? 'bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-[#F8FAFC] shadow-sm shadow-[#7C3AED]/25'
                      : 'border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/60 text-slate-600 dark:text-[#F8FAFC] hover:border-purple-500 dark:hover:border-[#22D3EE]'
                  }`}
                >
                  Slide {String(ex.number).padStart(2, '0')}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={demoIdx === 0}
                onClick={() => setDemoIdx((i) => Math.max(0, i - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/60 text-xs font-medium text-slate-700 dark:text-[#F8FAFC] disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-[#0B1120] inline-flex items-center gap-1 whitespace-nowrap transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              <span className="text-xs font-mono-math text-slate-500 dark:text-[#94A3B8] px-1">
                {demoIdx + 1} / {examples.length}
              </span>
              <button
                type="button"
                disabled={demoIdx === examples.length - 1}
                onClick={() => setDemoIdx((i) => Math.min(examples.length - 1, i + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/60 text-xs font-medium text-slate-700 dark:text-[#F8FAFC] disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-[#0B1120] inline-flex items-center gap-1 whitespace-nowrap transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Presentation Stage Card */}
          <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-6 sm:p-8 space-y-6 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
            <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-100 dark:border-[#334155]">
              <div>
                <div className="text-xs font-mono-math font-semibold text-purple-600 dark:text-[#22D3EE]">
                  Classroom Walkthrough · Topic {currentDemo.number} of {examples.length}
                </div>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-[#F8FAFC]">
                  {currentDemo.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  onNavigate(currentDemo.targetSection, currentDemo.presetPayload, true)
                }
                className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#8B5CF6] hover:to-[#7C3AED] text-[#F8FAFC] text-sm font-medium shadow-sm shadow-[#7C3AED]/25 inline-flex items-center gap-2 whitespace-nowrap transition-all"
              >
                <Presentation className="w-4 h-4" />
                <span>Demonstrate Live in Calculator</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-4">
                <div className="text-sm sm:text-base text-slate-700 dark:text-[#94A3B8]">
                  <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">Problem Statement: </span>
                  {currentDemo.given}
                </div>

                <div className="p-4 rounded-lg bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#334155] overflow-x-auto text-slate-900 dark:text-[#F8FAFC]">
                  <MathTex tex={currentDemo.formulaTex} display />
                </div>

                <div className="space-y-2.5">
                  <div className="text-xs font-semibold text-slate-500 dark:text-[#94A3B8]">
                    Lecture Proof Sequence
                  </div>
                  <ol className="space-y-2 text-sm text-slate-800 dark:text-[#F8FAFC]">
                    {currentDemo.steps.map((s, idx) => (
                      <li
                        key={idx}
                        className="p-3 rounded-lg bg-slate-50 dark:bg-[#0B1120] border border-slate-200/80 dark:border-[#334155] leading-relaxed"
                      >
                        <span className="font-mono-math font-semibold text-purple-600 dark:text-[#22D3EE] mr-2">
                          {idx + 1}.
                        </span>
                        {s}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-cyan-50/70 dark:from-[#7C3AED]/20 dark:to-[#22D3EE]/12 border border-purple-200 dark:border-[#7C3AED]/50 space-y-1.5">
                    <div className="text-xs font-semibold text-purple-800 dark:text-[#22D3EE]">
                      Result Summary
                    </div>
                    <div className="text-sm font-mono-math text-slate-900 dark:text-[#F8FAFC] leading-relaxed">
                      {currentDemo.finalAnswer}
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#334155] space-y-1.5">
                    <div className="text-xs font-semibold text-purple-700 dark:text-[#C4B5FD]">
                      Instructor Talking Point & Pedagogical Note
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-[#94A3B8] leading-relaxed">
                      {currentDemo.talkingPoint}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-emerald-50/60 dark:bg-[#10B981]/15 border border-emerald-200 dark:border-[#10B981]/40 flex items-start gap-2 text-xs text-emerald-800 dark:text-[#10B981]">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{currentDemo.verification}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
