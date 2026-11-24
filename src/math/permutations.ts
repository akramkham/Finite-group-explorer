/**
 * Permutation & Symmetric Group Engine (S_n)
 * Convention:
 * - Permutations act on {1, 2, ..., n} and are stored 0-indexed as [σ(1), σ(2), ..., σ(n)].
 * - Composition (σ ∘ τ)(x) = σ(τ(x)) follows standard right-to-left function composition.
 */

import { factorial, lcmArray } from './numberTheory';

export interface InversionPair {
  i: number;
  j: number;
  sigmaI: number;
  sigmaJ: number;
}

export interface PermutationAnalysis {
  n: number;
  image: number[]; // 1-based values [σ(1), ..., σ(n)]
  twoLineTop: number[];
  twoLineBottom: number[];
  disjointCycles: number[][];
  cycleNotation: string;
  isIdentity: boolean;
  inverse: number[];
  inverseCycleNotation: string;
  order: number;
  orderSteps: string[];
  inversions: InversionPair[];
  inversionCount: number;
  transpositionCount: number;
  parity: 'Even' | 'Odd';
  sign: 1 | -1;
  paritySteps: string[];
}

export function identityPermutation(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i + 1);
}

export function isValidPermutation(arr: number[], n?: number): boolean {
  const len = n ?? arr.length;
  if (arr.length !== len || len < 1) return false;
  const seen = new Set<number>();
  for (const v of arr) {
    if (!Number.isInteger(v) || v < 1 || v > len || seen.has(v)) return false;
    seen.add(v);
  }
  return seen.size === len;
}

/**
 * Parses either cycle notation like "(1 3 2)(4 5)" / "e"
 * or one-line space/comma-separated notation like "3 1 2 5 4".
 */
export function parsePermutationInput(raw: string, n: number): number[] {
  if (!Number.isInteger(n) || n < 1 || n > 12) {
    throw new Error('Set size n must be an integer between 1 and 12.');
  }
  const trimmed = raw.trim();
  if (!trimmed || trimmed === 'e' || trimmed === 'id' || trimmed === '()') {
    return identityPermutation(n);
  }

  // Cycle notation detected by parentheses
  if (trimmed.includes('(') || trimmed.includes(')')) {
    const matches = trimmed.match(/\(([^)]*)\)/g);
    if (!matches) {
      throw new Error('Malformed cycle notation. Example: (1 2 3)(4 5)');
    }
    const stripped = trimmed.replace(/\(([^)]*)\)/g, '').trim();
    if (stripped.length > 0) {
      throw new Error(`Unexpected characters outside cycles: "${stripped}".`);
    }

    // Apply cycles right-to-left: (c1)(c2) means apply c2 first, then c1
    let current = identityPermutation(n);
    for (let idx = matches.length - 1; idx >= 0; idx--) {
      const inner = matches[idx].slice(1, -1).trim();
      if (!inner) continue;
      const nums = inner.split(/[\s,]+/).map((s) => Number(s));
      const seenInCycle = new Set<number>();
      for (const x of nums) {
        if (!Number.isInteger(x) || x < 1 || x > n) {
          throw new Error(`Element "${x}" is outside {1, ..., ${n}}.`);
        }
        if (seenInCycle.has(x)) {
          throw new Error(`Duplicate element ${x} inside a single cycle.`);
        }
        seenInCycle.add(x);
      }
      if (nums.length <= 1) continue;
      const cyclePerm = identityPermutation(n);
      for (let k = 0; k < nums.length; k++) {
        const from = nums[k];
        const to = nums[(k + 1) % nums.length];
        cyclePerm[from - 1] = to;
      }
      current = composePermutations(cyclePerm, current);
    }
    return current;
  }

  // Otherwise parse one-line image notation: "2 3 1" or "2, 3, 1"
  const parts = trimmed.split(/[\s,]+/).filter(Boolean).map(Number);
  if (parts.length !== n) {
    throw new Error(`Expected ${n} integers for S_${n} one-line notation, got ${parts.length}.`);
  }
  if (!isValidPermutation(parts, n)) {
    throw new Error(`One-line input must be a bijection of {1, ..., ${n}} without duplicates.`);
  }
  return parts;
}

/**
 * Standard function composition: (sigma ∘ tau)(x) = sigma(tau(x)).
 * Apply tau first, then sigma.
 */
export function composePermutations(sigma: number[], tau: number[]): number[] {
  if (sigma.length !== tau.length) {
    throw new Error('Permutations must belong to the same symmetric group S_n.');
  }
  return tau.map((val) => sigma[val - 1]);
}

export function inversePermutation(perm: number[]): number[] {
  const inv = new Array<number>(perm.length);
  for (let i = 0; i < perm.length; i++) {
    inv[perm[i] - 1] = i + 1;
  }
  return inv;
}

export function toDisjointCycles(perm: number[]): number[][] {
  const n = perm.length;
  const visited = new Array<boolean>(n).fill(false);
  const cycles: number[][] = [];

  for (let i = 0; i < n; i++) {
    if (visited[i]) continue;
    const cycle: number[] = [];
    let curr = i + 1;
    while (!visited[curr - 1]) {
      visited[curr - 1] = true;
      cycle.push(curr);
      curr = perm[curr - 1];
    }
    if (cycle.length > 1) {
      cycles.push(cycle);
    }
  }
  return cycles;
}

export function formatCycleNotation(cycles: number[][]): string {
  if (cycles.length === 0) return 'e';
  return cycles.map((c) => `(${c.join(' ')})`).join('');
}

export function analyzePermutation(perm: number[]): PermutationAnalysis {
  const n = perm.length;
  if (!isValidPermutation(perm, n)) {
    throw new Error('Invalid permutation array.');
  }

  const twoLineTop = identityPermutation(n);
  const twoLineBottom = [...perm];
  const disjointCycles = toDisjointCycles(perm);
  const cycleNotation = formatCycleNotation(disjointCycles);
  const isIdentity = disjointCycles.length === 0;

  const inverse = inversePermutation(perm);
  const inverseCycleNotation = formatCycleNotation(toDisjointCycles(inverse));

  const cycleLengths = disjointCycles.map((c) => c.length);
  const order = cycleLengths.length === 0 ? 1 : lcmArray(cycleLengths);
  const orderSteps =
    cycleLengths.length === 0
      ? ['The identity permutation e fixes every element, so O(e) = 1.']
      : [
          `Disjoint cycle decomposition: ${cycleNotation}.`,
          `Cycle lengths: ${cycleLengths.join(', ')}.`,
          `Order is the LCM of disjoint cycle lengths: lcm(${cycleLengths.join(', ')}) = ${order}.`,
        ];

  // Count inversions: pairs (i, j) with i < j and perm(i) > perm(j)
  const inversions: InversionPair[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (perm[i] > perm[j]) {
        inversions.push({
          i: i + 1,
          j: j + 1,
          sigmaI: perm[i],
          sigmaJ: perm[j],
        });
      }
    }
  }

  const inversionCount = inversions.length;
  const transpositionCount = disjointCycles.reduce((sum, c) => sum + (c.length - 1), 0);
  const parity: 'Even' | 'Odd' = inversionCount % 2 === 0 ? 'Even' : 'Odd';
  const sign: 1 | -1 = parity === 'Even' ? 1 : -1;

  const paritySteps: string[] = [
    `Method 1 (Inversion Count): Count pairs (i < j) with σ(i) > σ(j). Found ${inversionCount} inversion(s). Since ${inversionCount} is ${inversionCount % 2 === 0 ? 'even' : 'odd'}, σ is ${parity}.`,
    `Method 2 (Transposition Decomposition): Each k-cycle decomposes into (k - 1) transpositions. Total transpositions = ${
      disjointCycles.length === 0
        ? '0'
        : disjointCycles.map((c) => `(${c.length} - 1)`).join(' + ') + ` = ${transpositionCount}`
    }.`,
    `Parity verification: (-1)^${inversionCount} = ${sign} and (-1)^${transpositionCount} = ${transpositionCount % 2 === 0 ? 1 : -1}. Both agree: ${parity} permutation (sgn(σ) = ${sign > 0 ? '+1' : '-1'}).`,
  ];

  return {
    n,
    image: [...perm],
    twoLineTop,
    twoLineBottom,
    disjointCycles,
    cycleNotation,
    isIdentity,
    inverse,
    inverseCycleNotation,
    order,
    orderSteps,
    inversions,
    inversionCount,
    transpositionCount,
    parity,
    sign,
    paritySteps,
  };
}

/**
 * Generates all permutations of S_n via Heap's/backtracking algorithm (capped at n <= 6 so |S_6| = 720).
 */
export function generateSymmetricGroup(n: number): PermutationAnalysis[] {
  if (!Number.isInteger(n) || n < 1 || n > 6) {
    throw new Error('Full S_n enumeration is supported for 1 ≤ n ≤ 6 (up to 720 elements).');
  }
  const results: number[][] = [];
  const used = new Array<boolean>(n).fill(false);
  const current: number[] = [];

  function backtrack() {
    if (current.length === n) {
      results.push([...current]);
      return;
    }
    for (let v = 1; v <= n; v++) {
      if (!used[v - 1]) {
        used[v - 1] = true;
        current.push(v);
        backtrack();
        current.pop();
        used[v - 1] = false;
      }
    }
  }

  backtrack();
  return results.map(analyzePermutation);
}

/**
 * Analytical & verified parity counts for S_n.
 * For n = 1, |S_1| = 1 (1 even, 0 odd).
 * For n >= 2, |A_n| = n! / 2 even and n! / 2 odd.
 */
export function symmetricGroupParitySummary(n: number): {
  n: number;
  totalPermutations: number;
  evenCount: number;
  oddCount: number;
  verifiedByEnumeration: boolean;
  steps: string[];
} {
  if (!Number.isInteger(n) || n < 1 || n > 12) {
    throw new Error('n must be an integer between 1 and 12.');
  }
  const total = factorial(n);
  if (n === 1) {
    return {
      n: 1,
      totalPermutations: 1,
      evenCount: 1,
      oddCount: 0,
      verifiedByEnumeration: true,
      steps: ['In S_1, only the identity permutation e exists, which has 0 inversions (even).'],
    };
  }

  let evenCount = total / 2;
  let oddCount = total / 2;
  let verifiedByEnumeration = false;

  if (n <= 6) {
    const all = generateSymmetricGroup(n);
    evenCount = all.filter((p) => p.parity === 'Even').length;
    oddCount = all.filter((p) => p.parity === 'Odd').length;
    verifiedByEnumeration = true;
  }

  const steps = [
    `Total permutations in S_${n}: |S_${n}| = ${n}! = ${total.toLocaleString()}.`,
    `Because sgn : S_${n} → {+1, -1} is a surjective group homomorphism onto {±1} for n ≥ 2, its kernel A_${n} (the alternating group) has index 2.`,
    `Therefore, |A_${n}| = ${n}! / 2 = ${total.toLocaleString()} / 2 = ${evenCount.toLocaleString()} even permutations, and ${oddCount.toLocaleString()} odd permutations.`,
    verifiedByEnumeration
      ? `Verified exhaustively by checking all ${total.toLocaleString()} elements of S_${n}.`
      : `Verified algebraically via the alternating subgroup index [S_${n} : A_${n}] = 2.`,
  ];

  return {
    n,
    totalPermutations: total,
    evenCount,
    oddCount,
    verifiedByEnumeration,
    steps,
  };
}
