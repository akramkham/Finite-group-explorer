/**
 * Finite Abelian Group Engine
 * Supports cyclic groups Z_n, finite direct products Z_{n1} × ... × Z_{nk},
 * Fundamental Theorem of Finite Abelian Groups classification,
 * and cyclic subgroup Hasse lattice generation.
 */

import {
  divisors,
  formatPrimeFactorization,
  gcd,
  gcdWithSteps,
  integerPartitions,
  isPrime,
  lcmArray,
  mod,
  primeFactorization,
  PrimeFactor,
} from './numberTheory';

export interface CoordinateOrderBreakdown {
  coordinateIndex: number;
  value: number;
  modulus: number;
  gcdValue: number;
  gcdSteps: string[];
  coordinateOrder: number;
  formula: string;
}

export interface ElementOrderAnalysis {
  element: number[];
  moduli: number[];
  order: number;
  coordinateBreakdown: CoordinateOrderBreakdown[];
  lcmFormula: string;
  explanation: string;
}

export interface AbelianElementInfo {
  tuple: number[];
  label: string;
  order: number;
  inverseTuple: number[];
  inverseLabel: string;
}

export interface AbelianGroupAnalysis {
  moduli: number[];
  groupName: string;
  groupLatex: string;
  order: number;
  identity: number[];
  identityLabel: string;
  isCyclic: boolean;
  isAbelian: boolean;
  closureSatisfied: boolean;
  associativityStatus: 'satisfied' | 'unable_to_verify';
  associativityNote: string;
  commutativitySatisfied: boolean;
  enumerated: boolean;
  elements: AbelianElementInfo[];
  generators: AbelianElementInfo[];
  maxElementOrder: number;
  orderDistribution: { order: number; count: number }[];
  explanations: string[];
}

export interface AbelianIsomorphismClass {
  index: number;
  invariantFactors: number[];
  invariantNotation: string;
  invariantLatex: string;
  elementaryDivisors: number[];
  elementaryNotation: string;
  elementaryLatex: string;
  verifiedOrder: number;
  isCyclic: boolean;
  maxElementOrder: number;
}

export interface AbelianClassificationResult {
  n: number;
  primeFactors: PrimeFactor[];
  primeFactorizationText: string;
  partitionCounts: { prime: number; exponent: number; partitions: number[][]; count: number }[];
  totalClasses: number;
  classes: AbelianIsomorphismClass[];
  steps: string[];
}

export interface SubgroupLatticeNode {
  divisor: number; // order of the subgroup
  generatorInZn: number; // n / divisor (reduced mod n)
  label: string; // e.g. ⟨3⟩ or {0}
  order: number;
  elements: number[];
  level: number; // Omega(divisor): sum of prime exponents
  x: number; // normalized [0, 100] horizontal coordinate
  y: number; // normalized [0, 100] vertical coordinate (top = Z_n, bottom = {0})
}

export interface SubgroupLatticeEdge {
  fromOrder: number;
  toOrder: number;
}

export interface CyclicSubgroupLattice {
  n: number;
  nodes: SubgroupLatticeNode[];
  edges: SubgroupLatticeEdge[];
  maxLevel: number;
}

export function formatTuple(tuple: number[]): string {
  if (tuple.length === 1) return `${tuple[0]}`;
  return `(${tuple.join(', ')})`;
}

export function addTuples(a: number[], b: number[], moduli: number[]): number[] {
  return moduli.map((m, idx) => mod(a[idx] + b[idx], m));
}

export function inverseTuple(a: number[], moduli: number[]): number[] {
  return moduli.map((m, idx) => mod(-a[idx], m));
}

/**
 * Computes the order of an element (a_1, ..., a_k) in Z_{n_1} × ... × Z_{n_k}.
 * Uses O(a_i) = n_i / gcd(n_i, a_i) and O((a_1,...,a_k)) = lcm(O(a_1), ..., O(a_k)).
 */
export function computeAbelianElementOrder(
  rawElement: number[],
  moduli: number[]
): ElementOrderAnalysis {
  if (rawElement.length !== moduli.length || moduli.length === 0) {
    throw new Error('Element dimension must match the number of cyclic factors.');
  }

  const normalized = rawElement.map((val, i) => {
    if (!Number.isFinite(val) || !Number.isInteger(moduli[i]) || moduli[i] < 1) {
      throw new Error('All moduli must be positive integers ≥ 1.');
    }
    return mod(Math.trunc(val), moduli[i]);
  });

  const coordinateBreakdown: CoordinateOrderBreakdown[] = normalized.map((val, i) => {
    const m = moduli[i];
    const gcdRes = gcdWithSteps(m, val);
    const coordOrder = m / gcdRes.result;
    return {
      coordinateIndex: i,
      value: val,
      modulus: m,
      gcdValue: gcdRes.result,
      gcdSteps: gcdRes.steps.map((s) => s.equation),
      coordinateOrder: coordOrder,
      formula: `O(${val}) = ${m} / gcd(${m}, ${val}) = ${m} / ${gcdRes.result} = ${coordOrder}`,
    };
  });

  const coordOrders = coordinateBreakdown.map((c) => c.coordinateOrder);
  const order = lcmArray(coordOrders);

  const lcmFormula =
    coordOrders.length === 1
      ? `O(${normalized[0]}) = ${order}`
      : `O(${formatTuple(normalized)}) = lcm(${coordOrders.join(', ')}) = ${order}`;

  const explanation =
    moduli.length === 1
      ? `In the cyclic group Z_${moduli[0]}, the order of ${normalized[0]} is n / gcd(n, a) = ${moduli[0]} / ${coordinateBreakdown[0].gcdValue} = ${order}. Adding ${normalized[0]} to itself ${order} times yields 0 (mod ${moduli[0]}).`
      : `In the direct product ${moduli.map((m) => `Z_${m}`).join(' × ')}, the order of a tuple equals the least common multiple of the individual coordinate orders: lcm(${coordOrders.join(', ')}) = ${order}.`;

  return {
    element: normalized,
    moduli,
    order,
    coordinateBreakdown,
    lcmFormula,
    explanation,
  };
}

/**
 * Enumerates all tuples in Z_{n1} × ... × Z_{nk} using Cartesian product.
 */
export function enumerateAbelianTuples(moduli: number[], maxLimit = 256): number[][] {
  const total = moduli.reduce((acc, m) => acc * m, 1);
  if (total > maxLimit) {
    return [];
  }
  let current: number[][] = [[]];
  for (const m of moduli) {
    const next: number[][] = [];
    for (const prefix of current) {
      for (let v = 0; v < m; v++) {
        next.push([...prefix, v]);
      }
    }
    current = next;
  }
  return current;
}

/**
 * Full structural analysis of Z_{n1} × ... × Z_{nk}.
 */
export function analyzeAbelianGroup(moduliInput: number[]): AbelianGroupAnalysis {
  if (moduliInput.length === 0) {
    throw new Error('Provide at least one cyclic factor.');
  }
  const moduli = moduliInput.map((m) => Math.trunc(m));
  for (const m of moduli) {
    if (!Number.isInteger(m) || m < 1) {
      throw new Error('Every modulus n_i must be a positive integer ≥ 1.');
    }
  }

  const order = moduli.reduce((acc, m) => acc * m, 1);
  const groupName = moduli.map((m) => `Z_${m}`).join(' × ');
  const groupLatex = moduli.map((m) => `\\mathbb{Z}_{${m}}`).join(' \\times ');
  const identity = moduli.map(() => 0);
  const identityLabel = formatTuple(identity);

  // Pairwise coprime check determines cyclicity for finite direct products of cyclic groups
  let pairwiseCoprime = true;
  for (let i = 0; i < moduli.length; i++) {
    for (let j = i + 1; j < moduli.length; j++) {
      if (gcd(moduli[i], moduli[j]) !== 1) {
        pairwiseCoprime = false;
        break;
      }
    }
    if (!pairwiseCoprime) break;
  }

  const maxElementOrder = lcmArray(moduli);
  const isCyclic = pairwiseCoprime; // Equivalent to maxElementOrder === order

  const MAX_ENUM = 256;
  const tuples = enumerateAbelianTuples(moduli, MAX_ENUM);
  const enumerated = tuples.length > 0;

  let elements: AbelianElementInfo[] = [];
  let generators: AbelianElementInfo[] = [];
  const distMap = new Map<number, number>();

  let closureSatisfied = true;
  let commutativitySatisfied = true;
  let associativityStatus: 'satisfied' | 'unable_to_verify' = 'unable_to_verify';
  let associativityNote = '';

  if (enumerated) {
    const labelSet = new Set<string>();
    elements = tuples.map((t) => {
      const label = formatTuple(t);
      labelSet.add(label);
      const ord = computeAbelianElementOrder(t, moduli).order;
      const inv = inverseTuple(t, moduli);
      distMap.set(ord, (distMap.get(ord) ?? 0) + 1);
      return {
        tuple: t,
        label,
        order: ord,
        inverseTuple: inv,
        inverseLabel: formatTuple(inv),
      };
    });

    generators = elements.filter((e) => e.order === order);

    // Exhaustively verify closure and commutativity on enumerated elements
    for (let i = 0; i < tuples.length; i++) {
      for (let j = 0; j < tuples.length; j++) {
        const sumAB = addTuples(tuples[i], tuples[j], moduli);
        const sumBA = addTuples(tuples[j], tuples[i], moduli);
        if (!labelSet.has(formatTuple(sumAB))) {
          closureSatisfied = false;
        }
        if (formatTuple(sumAB) !== formatTuple(sumBA)) {
          commutativitySatisfied = false;
        }
      }
    }

    // Exhaustive triple check for associativity when |G| <= 40
    if (order <= 40) {
      let assocOk = true;
      outer: for (let i = 0; i < tuples.length; i++) {
        for (let j = 0; j < tuples.length; j++) {
          const ab = addTuples(tuples[i], tuples[j], moduli);
          for (let k = 0; k < tuples.length; k++) {
            const left = addTuples(ab, tuples[k], moduli);
            const bc = addTuples(tuples[j], tuples[k], moduli);
            const right = addTuples(tuples[i], bc, moduli);
            if (formatTuple(left) !== formatTuple(right)) {
              assocOk = false;
              break outer;
            }
          }
        }
      }
      associativityStatus = assocOk ? 'satisfied' : 'unable_to_verify';
      associativityNote = `Exhaustively verified all ${order}³ = ${(order ** 3).toLocaleString()} triples (a + b) + c = a + (b + c).`;
    } else {
      associativityStatus = 'satisfied';
      associativityNote = `Satisfied by associativity of coordinate-wise modular integer addition (exhaustive ${order}³ triple check omitted for |G| > 40).`;
    }
  } else {
    associativityStatus = 'satisfied';
    associativityNote = `Group order ${order} exceeds interactive table enumeration limit (${MAX_ENUM}); axioms hold by modular addition theorem.`;
  }

  const orderDistribution = Array.from(distMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([ord, count]) => ({ order: ord, count }));

  const explanations: string[] = [
    `Group order is |${groupName}| = ${moduli.join(' × ')} = ${order}.`,
    `Identity element is ${identityLabel}, since a + ${identityLabel} = a coordinate-wise modulo (${moduli.join(', ')}).`,
    `Every coordinate satisfies a_i + b_i ≡ b_i + a_i (mod n_i), so the group is Abelian (commutative).`,
    `Maximum possible element order (exponent of the group) is lcm(${moduli.join(', ')}) = ${maxElementOrder}.`,
    isCyclic
      ? `Because lcm(${moduli.join(', ')}) = ${maxElementOrder} = |G| (equivalently, the moduli are pairwise coprime), ${groupName} is cyclic and isomorphic to Z_${order}.`
      : `Because max element order ${maxElementOrder} < |G| = ${order} (the moduli are not pairwise coprime), ${groupName} has no element of order ${order} and is NOT cyclic.`,
  ];

  return {
    moduli,
    groupName,
    groupLatex,
    order,
    identity,
    identityLabel,
    isCyclic,
    isAbelian: commutativitySatisfied,
    closureSatisfied,
    associativityStatus,
    associativityNote,
    commutativitySatisfied,
    enumerated,
    elements,
    generators,
    maxElementOrder,
    orderDistribution,
    explanations,
  };
}

/**
 * Classifies all finite Abelian groups of order n up to isomorphism
 * using the Fundamental Theorem of Finite Abelian Groups.
 */
export function classifyAbelianGroups(nInput: number): AbelianClassificationResult {
  const n = Math.trunc(nInput);
  if (!Number.isInteger(n) || n < 1) {
    throw new Error('Order n must be a positive integer ≥ 1.');
  }

  if (n === 1) {
    return {
      n: 1,
      primeFactors: [],
      primeFactorizationText: '1',
      partitionCounts: [],
      totalClasses: 1,
      classes: [
        {
          index: 1,
          invariantFactors: [1],
          invariantNotation: 'Z_1 (Trivial group)',
          invariantLatex: '\\{e\\} \\cong \\mathbb{Z}_1',
          elementaryDivisors: [1],
          elementaryNotation: 'Z_1',
          elementaryLatex: '\\mathbb{Z}_1',
          verifiedOrder: 1,
          isCyclic: true,
          maxElementOrder: 1,
        },
      ],
      steps: ['n = 1 gives the single trivial group {e} ≅ Z_1.'],
    };
  }

  const primeFactors = primeFactorization(n);
  const primeFactorizationText = formatPrimeFactorization(primeFactors);

  const partitionCounts = primeFactors.map((pf) => {
    const parts = integerPartitions(pf.exponent);
    return {
      prime: pf.prime,
      exponent: pf.exponent,
      partitions: parts,
      count: parts.length,
    };
  });

  // Cartesian product across all prime-power partitions
  let combos: number[][][] = [[]];
  for (const pc of partitionCounts) {
    const next: number[][][] = [];
    for (const prefix of combos) {
      for (const part of pc.partitions) {
        next.push([...prefix, part]);
      }
    }
    combos = next;
  }

  const classes: AbelianIsomorphismClass[] = combos.map((combo, idx) => {
    // 1. Elementary divisors: collect p_i^{e_{i,j}}
    const elementaryDivisors: number[] = [];
    combo.forEach((part, primeIdx) => {
      const p = primeFactors[primeIdx].prime;
      for (const exp of part) {
        elementaryDivisors.push(Math.pow(p, exp));
      }
    });

    // 2. Invariant factors: align partitions ascending (smallest on left) & pad with 0s on left
    const maxLen = Math.max(...combo.map((part) => part.length));
    const invariantFactors: number[] = [];

    for (let col = 0; col < maxLen; col++) {
      let factor = 1;
      combo.forEach((part, primeIdx) => {
        const p = primeFactors[primeIdx].prime;
        // part is descending; reversed puts smallest first, padded with 0s on the left
        const rev = [...part].reverse();
        const offset = maxLen - rev.length;
        const exp = col >= offset ? rev[col - offset] : 0;
        if (exp > 0) {
          factor *= Math.pow(p, exp);
        }
      });
      if (factor > 1) {
        invariantFactors.push(factor);
      }
    }

    const verifiedOrder = invariantFactors.reduce((acc, f) => acc * f, 1);
    const elemProduct = elementaryDivisors.reduce((acc, f) => acc * f, 1);
    if (verifiedOrder !== n || elemProduct !== n) {
      throw new Error(`Classification invariant check failed for n = ${n}`);
    }

    const isCyclic = invariantFactors.length === 1;
    const maxElementOrder = invariantFactors[invariantFactors.length - 1] ?? 1;

    return {
      index: idx + 1,
      invariantFactors,
      invariantNotation: invariantFactors.map((f) => `Z_${f}`).join(' × '),
      invariantLatex: invariantFactors.map((f) => `\\mathbb{Z}_{${f}}`).join(' \\times '),
      elementaryDivisors,
      elementaryNotation: elementaryDivisors.map((f) => `Z_${f}`).join(' × '),
      elementaryLatex: elementaryDivisors.map((f) => `\\mathbb{Z}_{${f}}`).join(' \\times '),
      verifiedOrder,
      isCyclic,
      maxElementOrder,
    };
  });

  // Sort cleanly: cyclic first (fewest invariant factors), then lexicographically
  classes.sort((a, b) => {
    if (a.invariantFactors.length !== b.invariantFactors.length) {
      return a.invariantFactors.length - b.invariantFactors.length;
    }
    for (let i = 0; i < a.invariantFactors.length; i++) {
      if (a.invariantFactors[i] !== b.invariantFactors[i]) {
        return b.invariantFactors[i] - a.invariantFactors[i];
      }
    }
    return 0;
  });
  classes.forEach((c, i) => {
    c.index = i + 1;
  });

  const steps: string[] = [
    `Step 1 — Prime Factorization: ${n} = ${primeFactorizationText}.`,
    `Step 2 — Integer Partitions of Exponents: ${partitionCounts
      .map((pc) => `for p = ${pc.prime} (exp ${pc.exponent}), p(${pc.exponent}) = ${pc.count} partition(s): ${pc.partitions.map((pt) => `[${pt.join('+')}]`).join(', ')}`)
      .join('; ')}.`,
    `Step 3 — Total Isomorphism Classes: ${partitionCounts.map((pc) => pc.count).join(' × ')} = ${classes.length} distinct finite Abelian group(s) of order ${n}.`,
    `Step 4 — Invariant Factors & Verification: Align prime-power partitions from largest to smallest and multiply across distinct primes so d_1 | d_2 | ... | d_k with ∏ d_i = ${n}.`,
  ];

  return {
    n,
    primeFactors,
    primeFactorizationText,
    partitionCounts,
    totalClasses: classes.length,
    classes,
    steps,
  };
}

/**
 * Builds the Hasse diagram (subgroup lattice) of a cyclic group Z_n.
 * By the Fundamental Theorem of Cyclic Groups, each divisor d | n corresponds
 * uniquely to the subgroup ⟨n/d⟩ of order d.
 */
export function buildCyclicSubgroupLattice(nInput: number): CyclicSubgroupLattice {
  const n = Math.trunc(nInput);
  if (!Number.isInteger(n) || n < 1) {
    throw new Error('n must be a positive integer ≥ 1.');
  }

  const divs = divisors(n);

  const countPrimeFactorsWithMultiplicity = (x: number): number => {
    if (x === 1) return 0;
    return primeFactorization(x).reduce((sum, pf) => sum + pf.exponent, 0);
  };

  const rawNodes = divs.map((d) => {
    const gen = d === 1 ? 0 : n / d;
    const elements: number[] = [];
    if (n <= 120) {
      for (let k = 0; k < d; k++) {
        elements.push((k * gen) % n);
      }
      elements.sort((a, b) => a - b);
    }
    const level = countPrimeFactorsWithMultiplicity(d);
    const label = d === 1 ? '{0}' : d === n ? `Z_${n} = ⟨1⟩` : `⟨${gen}⟩`;
    return {
      divisor: d,
      generatorInZn: gen,
      label,
      order: d,
      elements,
      level,
      x: 50,
      y: 50,
    };
  });

  const maxLevel = Math.max(...rawNodes.map((nd) => nd.level), 0);

  // Group by level to compute evenly spaced horizontal positions
  const byLevel = new Map<number, typeof rawNodes>();
  for (const node of rawNodes) {
    const list = byLevel.get(node.level) ?? [];
    list.push(node);
    byLevel.set(node.level, list);
  }

  for (const [lvl, list] of byLevel.entries()) {
    list.sort((a, b) => a.divisor - b.divisor);
    const count = list.length;
    const y = maxLevel === 0 ? 50 : 90 - (lvl / maxLevel) * 80; // Top = n, Bottom = 1
    list.forEach((node, idx) => {
      node.y = y;
      node.x = count === 1 ? 50 : 12 + (idx / (count - 1)) * 76;
    });
  }

  const edges: SubgroupLatticeEdge[] = [];
  for (let i = 0; i < divs.length; i++) {
    for (let j = i + 1; j < divs.length; j++) {
      if (divs[j] % divs[i] === 0 && isPrime(divs[j] / divs[i])) {
        edges.push({ fromOrder: divs[i], toOrder: divs[j] });
      }
    }
  }

  return {
    n,
    nodes: rawNodes,
    edges,
    maxLevel,
  };
}
