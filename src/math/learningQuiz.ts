/**
 * Interactive Learning Mode Question Bank & Algorithmic Generator
 * Every answer is computed directly by the verified mathematical engine.
 */

import {
  analyzeAbelianGroup,
  classifyAbelianGroups,
  computeAbelianElementOrder,
} from './abelianGroups';
import { analyzeAlgebraicStructure, buildCyclicMultiplicationStructure } from './cayleyAndProperties';
import { buildDihedralGroup } from './dihedralGroups';
import { eulerPhi } from './numberTheory';
import {
  analyzePermutation,
  composePermutations,
  parsePermutationInput,
  symmetricGroupParitySummary,
} from './permutations';
import { SectionId } from '../types/navigation';

export interface QuizQuestion {
  id: string;
  topic: string;
  relatedSection: SectionId;
  promptText: string;
  promptTex?: string;
  options: string[];
  correctIndex: number;
  explanationText: string;
  explanationTex: string;
}

function buildOptions(correct: string, distractors: string[]): { options: string[]; correctIndex: number } {
  const unique = Array.from(new Set([correct, ...distractors])).slice(0, 4);
  // Deterministic shuffle based on string hash so options aren't always index 0
  const sorted = [...unique].sort((a, b) => {
    const ha = a.split('').reduce((s, ch) => s * 31 + ch.charCodeAt(0), 7);
    const hb = b.split('').reduce((s, ch) => s * 31 + ch.charCodeAt(0), 7);
    return (ha % 97) - (hb % 97);
  });
  return {
    options: sorted,
    correctIndex: sorted.indexOf(correct),
  };
}

export function generateLearningQuizSet(round = 0): QuizQuestion[] {
  // Vary parameters cleanly by round so students can practice fresh problems
  const directPairs: [number, number, number, number][] = [
    [1, 2, 2, 3],
    [2, 3, 4, 6],
    [1, 2, 4, 6],
    [2, 4, 6, 8],
  ];
  const [a1, a2, m1, m2] = directPairs[round % directPairs.length];
  const ordRes = computeAbelianElementOrder([a1, a2], [m1, m2]);

  const phiTargets = [12, 15, 18, 20];
  const phiN = phiTargets[round % phiTargets.length];
  const phiRes = eulerPhi(phiN);

  const clsTargets = [72, 24, 36, 48];
  const clsN = clsTargets[round % clsTargets.length];
  const clsRes = classifyAbelianGroups(clsN);

  const dihedralTargets = [6, 8, 5, 4];
  const dn = dihedralTargets[round % dihedralTargets.length];
  const dGroup = buildDihedralGroup(dn);

  const permPairs: [number, string, string][] = [
    [4, '(1 2 3)', '(2 3 4)'],
    [4, '(1 2)', '(1 3 4)'],
    [5, '(1 3 5)', '(1 2)(3 4)'],
    [4, '(1 4)(2 3)', '(1 2 3 4)'],
  ];
  const [sn, sStr, tStr] = permPairs[round % permPairs.length];
  const sPerm = parsePermutationInput(sStr, sn);
  const tPerm = parsePermutationInput(tStr, sn);
  const compRes = analyzePermutation(composePermutations(sPerm, tPerm));

  const s5Summary = symmetricGroupParitySummary(5);
  const z4Mul = analyzeAlgebraicStructure(buildCyclicMultiplicationStructure(4));
  const v4 = analyzeAbelianGroup([2, 2]);

  const q1Opts = buildOptions(String(ordRes.order), [
    String(ordRes.order + 1),
    String(Math.max(1, Math.floor(ordRes.order / 2))),
    String(m1 * m2),
  ]);

  const q2Opts = buildOptions(String(phiRes.phi), [
    String(phiRes.phi + 2),
    String(Math.max(1, phiRes.phi - 1)),
    String(phiN - 1),
  ]);

  const q3Opts = buildOptions(String(clsRes.totalClasses), [
    String(clsRes.totalClasses + 1),
    String(Math.max(1, clsRes.totalClasses - 2)),
    String(clsRes.totalClasses + 3),
  ]);

  const q4Opts = buildOptions(compRes.cycleNotation, [
    analyzePermutation(composePermutations(tPerm, sPerm)).cycleNotation === compRes.cycleNotation
      ? '(1 2)(3 4)'
      : analyzePermutation(composePermutations(tPerm, sPerm)).cycleNotation,
    '(1 2 3 4)',
    'e',
  ]);

  const q5Opts = buildOptions(
    `|D_${dn}| = ${dGroup.order}, |Z(D_${dn})| = ${dGroup.centreLabels.length}`,
    [
      `|D_${dn}| = ${dn}, |Z(D_${dn})| = 1`,
      `|D_${dn}| = ${dGroup.order}, |Z(D_${dn})| = ${dn}`,
      `|D_${dn}| = ${dGroup.order + 2}, |Z(D_${dn})| = 2`,
    ]
  );

  const q6Opts = buildOptions(`${s5Summary.evenCount} even permutations`, [
    `${s5Summary.totalPermutations} even permutations`,
    `24 even permutations`,
    `30 even permutations`,
  ]);

  const q7Opts = buildOptions(
    'No — every element has order 1 or 2, so none has order 4',
    [
      'Yes — (1, 1) generates the entire group',
      'Yes — because |Z_2 × Z_2| = 4 and every group of order 4 is cyclic',
      'No — because Z_2 × Z_2 is non-Abelian',
    ]
  );

  const q8Opts = buildOptions(
    `Not a group (${z4Mul.inverses.detail})`,
    [
      'Cyclic group of order 4',
      'Abelian non-cyclic group isomorphic to V_4',
      'Non-associative quasigroup',
    ]
  );

  return [
    {
      id: 'q-order',
      topic: 'Direct Product Element Order',
      relatedSection: 'element-order',
      promptText: `What is the order of (${a1}, ${a2}) in Z_${m1} × Z_${m2}?`,
      promptTex: `O((${a1}, ${a2})) \\text{ in } \\mathbb{Z}_{${m1}} \\times \\mathbb{Z}_{${m2}} = \\;?`,
      ...q1Opts,
      explanationText: ordRes.explanation,
      explanationTex: `${ordRes.coordinateBreakdown
        .map((c) => `O(${c.value}) = \\frac{${c.modulus}}{\\gcd(${c.modulus},${c.value})} = ${c.coordinateOrder}`)
        .join(',\\; ')} \\implies \\operatorname{lcm}(${ordRes.coordinateBreakdown
        .map((c) => c.coordinateOrder)
        .join(', ')}) = ${ordRes.order}`,
    },
    {
      id: 'q-phi',
      topic: "Euler's Phi & Generators",
      relatedSection: 'generators',
      promptText: `How many generators does the cyclic group Z_${phiN} have?`,
      promptTex: `\\varphi(${phiN}) = |\\{a \\in \\mathbb{Z}_{${phiN}} : \\gcd(a, ${phiN}) = 1\\}| = \\;?`,
      ...q2Opts,
      explanationText: phiRes.steps.join(' '),
      explanationTex: `${phiRes.formulaExpression} = ${phiRes.formulaEvaluation}`,
    },
    {
      id: 'q-classify',
      topic: 'Abelian Group Classification',
      relatedSection: 'classification',
      promptText: `How many non-isomorphic finite Abelian groups exist of order ${clsN}?`,
      promptTex: `\\text{Number of Abelian isomorphism classes of order } ${clsN} \\; (${clsRes.primeFactorizationText})`,
      ...q3Opts,
      explanationText: `By the Fundamental Theorem of Finite Abelian Groups: ${clsRes.steps.join(' ')}`,
      explanationTex: `\\prod p(e_i) = ${clsRes.partitionCounts.map((pc) => `p(${pc.exponent})`).join(' \\cdot ')} = ${clsRes.totalClasses}`,
    },
    {
      id: 'q-perm',
      topic: 'Permutation Composition',
      relatedSection: 'permutations',
      promptText: `Using right-to-left composition (σ ∘ τ)(x) = σ(τ(x)) in S_${sn}, compute ${sStr} ∘ ${tStr}.`,
      promptTex: `${sStr} \\circ ${tStr} \\text{ in } S_{${sn}} = \\;?`,
      ...q4Opts,
      explanationText: `Applying ${tStr} first and ${sStr} second yields ${compRes.cycleNotation}, which has order ${compRes.order} and is ${compRes.parity.toLowerCase()}.`,
      explanationTex: `(${sStr} \\circ ${tStr}) = ${compRes.cycleNotation},\\quad O = ${compRes.order}`,
    },
    {
      id: 'q-dihedral',
      topic: 'Dihedral Groups',
      relatedSection: 'dihedral',
      promptText: `Under the polygon-symmetry convention D_n, what are the group order |D_${dn}| and centre order |Z(D_${dn})|?`,
      promptTex: `|D_{${dn}}| \\text{ and } |Z(D_{${dn}})| \\text{ for } n = ${dn}`,
      ...q5Opts,
      explanationText: `D_${dn} consists of ${dn} rotations and ${dn} reflections, giving 2(${dn}) = ${dGroup.order} elements. Its centre is {${dGroup.centreLabels.join(', ')}} because ${dn} is ${dn % 2 === 0 ? 'even' : 'odd'}.`,
      explanationTex: `|D_{${dn}}| = 2(${dn}) = ${dGroup.order},\\quad Z(D_{${dn}}) = \\{${dGroup.centreLabels.join(', ')}\\}`,
    },
    {
      id: 'q-parity',
      topic: 'Even & Odd Permutations',
      relatedSection: 'parity',
      promptText: `How many even permutations belong to the symmetric group S_5 (i.e., |A_5|)?`,
      promptTex: `|A_5| = \\frac{|S_5|}{2} = \\;?`,
      ...q6Opts,
      explanationText: s5Summary.steps.join(' '),
      explanationTex: `|A_5| = \\frac{5!}{2} = \\frac{120}{2} = 60`,
    },
    {
      id: 'q-v4',
      topic: 'Cyclicity & Direct Products',
      relatedSection: 'abelian',
      promptText: 'Is the Klein four-group Z_2 × Z_2 cyclic?',
      promptTex: `\\text{Is } \\mathbb{Z}_2 \\times \\mathbb{Z}_2 \\text{ cyclic?}`,
      ...q7Opts,
      explanationText: `In Z_2 × Z_2, elements have orders ${v4.elements.map((e) => e.order).sort().join(', ')}. Since the exponent is lcm(2, 2) = 2 < 4, no element generates the group.`,
      explanationTex: `\\exp(\\mathbb{Z}_2 \\times \\mathbb{Z}_2) = \\operatorname{lcm}(2, 2) = 2 < 4 = |\\mathbb{Z}_2 \\times \\mathbb{Z}_2|`,
    },
    {
      id: 'q-axioms',
      topic: 'Group Axiom Verification',
      relatedSection: 'properties',
      promptText: 'Which statement accurately describes the algebraic structure (Z_4, ×)?',
      promptTex: `\\text{Does } (\\mathbb{Z}_4, \\times) \\text{ satisfy the group axioms?}`,
      ...q8Opts,
      explanationText: `Closure, associativity, and identity (e = 1) hold, but 0 and 2 lack multiplicative inverses modulo 4.`,
      explanationTex: `0 \\cdot x \\equiv 0 \\not\\equiv 1 \\pmod 4, \\quad 2 \\cdot x \\in \\{0, 2\\} \\not\\equiv 1 \\pmod 4`,
    },
  ];
}
