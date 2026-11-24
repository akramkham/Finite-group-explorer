/**
 * Cayley Table Generator & General Group Properties Analyzer
 * Analyzes arbitrary finite binary operation tables without assuming group axioms.
 */

import { addTuples, enumerateAbelianTuples, formatTuple } from './abelianGroups';
import { buildDihedralGroup } from './dihedralGroups';
import { gcd, mod } from './numberTheory';
import { composePermutations, generateSymmetricGroup } from './permutations';

export type PropertyStatus = 'satisfied' | 'not_satisfied' | 'unable_to_verify';

export interface PropertyCheckResult {
  name: string;
  status: PropertyStatus;
  detail: string;
}

export interface AlgebraicStructure {
  name: string;
  operationSymbol: string;
  elements: string[];
  table: number[][]; // -1 or out-of-range indicates closure failure
  description: string;
}

export interface StructureAnalysis {
  structureName: string;
  order: number;
  closure: PropertyCheckResult;
  associativity: PropertyCheckResult;
  identity: PropertyCheckResult & { identityIndex: number | null };
  inverses: PropertyCheckResult & { inverseIndices: (number | null)[] };
  commutativity: PropertyCheckResult;
  isGroup: PropertyCheckResult;
  isAbelian: PropertyCheckResult;
  isCyclic: PropertyCheckResult & { generators: string[] };
  elementOrders: { element: string; order: number | null }[];
  centre: string[];
}

export function buildCyclicAdditionStructure(n: number): AlgebraicStructure {
  const elements = Array.from({ length: n }, (_, i) => `${i}`);
  const table = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (__, j) => mod(i + j, n))
  );
  return {
    name: `(Z_${n}, +)`,
    operationSymbol: '+',
    elements,
    table,
    description: `Additive cyclic group of integers modulo ${n}.`,
  };
}

export function buildCyclicMultiplicationStructure(n: number): AlgebraicStructure {
  const elements = Array.from({ length: n }, (_, i) => `${i}`);
  const table = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (__, j) => mod(i * j, n))
  );
  return {
    name: `(Z_${n}, ×)`,
    operationSymbol: '×',
    elements,
    table,
    description: `Integers modulo ${n} under multiplication (monoid, not a group for n ≥ 2 since 0 has no inverse).`,
  };
}

export function buildUnitsGroupStructure(n: number): AlgebraicStructure {
  const units: number[] = [];
  for (let k = 1; k < n; k++) {
    if (gcd(k, n) === 1) units.push(k);
  }
  if (units.length === 0) units.push(0); // n = 1 trivial
  const indexMap = new Map(units.map((u, idx) => [u, idx]));
  const elements = units.map((u) => `${u}`);
  const table = units.map((a) =>
    units.map((b) => {
      const prod = n === 1 ? 0 : mod(a * b, n);
      return indexMap.get(prod) ?? -1;
    })
  );
  return {
    name: `(U(${n}), ×)`,
    operationSymbol: '×',
    elements,
    table,
    description: `Multiplicative group of units modulo ${n}, with order φ(${n}) = ${units.length}.`,
  };
}

export function buildCyclicSubtractionStructure(n: number): AlgebraicStructure {
  const elements = Array.from({ length: n }, (_, i) => `${i}`);
  const table = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (__, j) => mod(i - j, n))
  );
  return {
    name: `(Z_${n}, -)`,
    operationSymbol: '-',
    elements,
    table,
    description: `Integers modulo ${n} under subtraction (non-associative, non-commutative).`,
  };
}

export function buildDirectProductStructure(moduli: number[]): AlgebraicStructure {
  const tuples = enumerateAbelianTuples(moduli, 36);
  if (tuples.length === 0) {
    throw new Error('Cayley table generation is capped at order ≤ 36 for readability.');
  }
  const elements = tuples.map(formatTuple);
  const indexMap = new Map(elements.map((lbl, idx) => [lbl, idx]));
  const table = tuples.map((a) =>
    tuples.map((b) => {
      const sum = addTuples(a, b, moduli);
      return indexMap.get(formatTuple(sum)) ?? -1;
    })
  );
  return {
    name: `(${moduli.map((m) => `Z_${m}`).join(' × ')}, +)`,
    operationSymbol: '+',
    elements,
    table,
    description: `Direct product of cyclic groups under coordinate-wise modular addition.`,
  };
}

export function buildDihedralStructure(n: number): AlgebraicStructure {
  const d = buildDihedralGroup(n);
  return {
    name: `D_${n}`,
    operationSymbol: '∘',
    elements: d.elements.map((e) => e.label),
    table: d.cayleyTable,
    description: `Dihedral group of symmetries of a regular ${n}-gon (order ${d.order}).`,
  };
}

export function buildSymmetricGroupStructure(n: number): AlgebraicStructure {
  if (n < 1 || n > 4) {
    throw new Error('Cayley table for S_n is capped at n ≤ 4 (|S_4| = 24).');
  }
  const perms = generateSymmetricGroup(n);
  const elements = perms.map((p) => p.cycleNotation);
  const keyMap = new Map(perms.map((p, idx) => [p.image.join(','), idx]));
  const table = perms.map((a) =>
    perms.map((b) => {
      const comp = composePermutations(a.image, b.image);
      return keyMap.get(comp.join(',')) ?? -1;
    })
  );
  return {
    name: `S_${n}`,
    operationSymbol: '∘',
    elements,
    table,
    description: `Symmetric group of all permutations on ${n} elements (order ${perms.length}).`,
  };
}

/**
 * Verifies every group axiom independently from the operation table.
 * Never assumes an arbitrary structure is a group without checking!
 */
export function analyzeAlgebraicStructure(structure: AlgebraicStructure): StructureAnalysis {
  const { name, elements, table } = structure;
  const m = elements.length;

  // 1. Closure
  let closureOk = m > 0 && table.length === m;
  let closureWitness = '';
  if (closureOk) {
    outerClosure: for (let i = 0; i < m; i++) {
      if (!table[i] || table[i].length !== m) {
        closureOk = false;
        closureWitness = `Row ${i} is incomplete.`;
        break;
      }
      for (let j = 0; j < m; j++) {
        const val = table[i][j];
        if (!Number.isInteger(val) || val < 0 || val >= m) {
          closureOk = false;
          closureWitness = `Operation ${elements[i]} ${structure.operationSymbol} ${elements[j]} falls outside the set.`;
          break outerClosure;
        }
      }
    }
  }
  const closure: PropertyCheckResult = {
    name: 'Closure',
    status: closureOk ? 'satisfied' : 'not_satisfied',
    detail: closureOk
      ? `All ${m * m} entries in the ${m}×${m} table belong to the set.`
      : closureWitness || 'Table is empty or malformed.',
  };

  // 2. Identity (two-sided)
  let identityIndex: number | null = null;
  if (closureOk) {
    for (let e = 0; e < m; e++) {
      let isId = true;
      for (let x = 0; x < m; x++) {
        if (table[e][x] !== x || table[x][e] !== x) {
          isId = false;
          break;
        }
      }
      if (isId) {
        identityIndex = e;
        break;
      }
    }
  }
  const identity: PropertyCheckResult & { identityIndex: number | null } = {
    name: 'Identity Element',
    identityIndex,
    status: !closureOk
      ? 'unable_to_verify'
      : identityIndex !== null
        ? 'satisfied'
        : 'not_satisfied',
    detail: !closureOk
      ? 'Cannot check two-sided identity without closure.'
      : identityIndex !== null
        ? `Unique identity element is e = ${elements[identityIndex]} (row and column match header).`
        : 'No element e satisfies e * x = x * e = x for all x in the set.',
  };

  // 3. Inverses (two-sided, requires identity)
  const inverseIndices: (number | null)[] = new Array(m).fill(null);
  let missingInverseWitness = '';
  let inversesOk = false;
  if (closureOk && identityIndex !== null) {
    inversesOk = true;
    for (let x = 0; x < m; x++) {
      let found: number | null = null;
      for (let y = 0; y < m; y++) {
        if (table[x][y] === identityIndex && table[y][x] === identityIndex) {
          found = y;
          break;
        }
      }
      inverseIndices[x] = found;
      if (found === null) {
        inversesOk = false;
        if (!missingInverseWitness) {
          missingInverseWitness = `Element "${elements[x]}" has no two-sided inverse yielding ${elements[identityIndex]}.`;
        }
      }
    }
  }

  const inverses: PropertyCheckResult & { inverseIndices: (number | null)[] } = {
    name: 'Inverses',
    inverseIndices,
    status:
      !closureOk || identityIndex === null
        ? identityIndex === null && closureOk
          ? 'not_satisfied'
          : 'unable_to_verify'
        : inversesOk
          ? 'satisfied'
          : 'not_satisfied',
    detail: !closureOk
      ? 'Requires closure.'
      : identityIndex === null
        ? 'Requires an identity element before inverses can exist.'
        : inversesOk
          ? `Every element has a unique two-sided inverse yielding ${elements[identityIndex]}.`
          : missingInverseWitness,
  };

  // 4. Associativity (exhaustive up to m <= 50)
  let associativity: PropertyCheckResult;
  if (!closureOk) {
    associativity = {
      name: 'Associativity',
      status: 'unable_to_verify',
      detail: 'Requires closure to evaluate (a * b) * c and a * (b * c).',
    };
  } else if (m > 50) {
    associativity = {
      name: 'Associativity',
      status: 'unable_to_verify',
      detail: `Order ${m} exceeds the exhaustive triple-check limit (m ≤ 50).`,
    };
  } else {
    let assocOk = true;
    let counterexample = '';
    outerAssoc: for (let a = 0; a < m; a++) {
      for (let b = 0; b < m; b++) {
        const ab = table[a][b];
        for (let c = 0; c < m; c++) {
          const left = table[ab][c];
          const bc = table[b][c];
          const right = table[a][bc];
          if (left !== right) {
            assocOk = false;
            const op = structure.operationSymbol;
            counterexample = `Counterexample: (${elements[a]} ${op} ${elements[b]}) ${op} ${elements[c]} = ${elements[left]}, whereas ${elements[a]} ${op} (${elements[b]} ${op} ${elements[c]}) = ${elements[right]}.`;
            break outerAssoc;
          }
        }
      }
    }
    associativity = {
      name: 'Associativity',
      status: assocOk ? 'satisfied' : 'not_satisfied',
      detail: assocOk
        ? `Verified (a * b) * c = a * (b * c) across all ${m}³ = ${(m ** 3).toLocaleString()} triples.`
        : counterexample,
    };
  }

  // 5. Commutativity & Centre
  let commOk = true;
  let commWitness = '';
  const centre: string[] = [];
  if (closureOk) {
    for (let i = 0; i < m; i++) {
      let iCommutesWithAll = true;
      for (let j = 0; j < m; j++) {
        if (table[i][j] !== table[j][i]) {
          commOk = false;
          iCommutesWithAll = false;
          if (!commWitness) {
            const op = structure.operationSymbol;
            commWitness = `Counterexample: ${elements[i]} ${op} ${elements[j]} = ${elements[table[i][j]]} ≠ ${elements[table[j][i]]} = ${elements[j]} ${op} ${elements[i]}.`;
          }
        }
      }
      if (iCommutesWithAll) centre.push(elements[i]);
    }
  }

  const commutativity: PropertyCheckResult = {
    name: 'Commutativity',
    status: !closureOk ? 'unable_to_verify' : commOk ? 'satisfied' : 'not_satisfied',
    detail: !closureOk
      ? 'Requires closure.'
      : commOk
        ? 'Cayley table is symmetric about its main diagonal (a * b = b * a for all a, b).'
        : commWitness,
  };

  // 6. Group verification
  const axioms = [closure.status, associativity.status, identity.status, inverses.status];
  let groupStatus: PropertyStatus;
  if (axioms.includes('not_satisfied')) {
    groupStatus = 'not_satisfied';
  } else if (axioms.every((s) => s === 'satisfied')) {
    groupStatus = 'satisfied';
  } else {
    groupStatus = 'unable_to_verify';
  }

  const isGroup: PropertyCheckResult = {
    name: 'Group Axioms',
    status: groupStatus,
    detail:
      groupStatus === 'satisfied'
        ? `${name} satisfies Closure, Associativity, Identity, and Inverses — it is a verified group of order ${m}.`
        : groupStatus === 'not_satisfied'
          ? `${name} is NOT a group because at least one group axiom fails.`
          : `Unable to verify all group axioms completely.`,
  };

  const isAbelian: PropertyCheckResult = {
    name: 'Abelian Group',
    status:
      groupStatus === 'not_satisfied' || commutativity.status === 'not_satisfied'
        ? 'not_satisfied'
        : groupStatus === 'satisfied' && commutativity.status === 'satisfied'
          ? 'satisfied'
          : 'unable_to_verify',
    detail:
      groupStatus === 'satisfied' && commutativity.status === 'satisfied'
        ? `${name} is an Abelian (commutative) group.`
        : groupStatus !== 'satisfied'
          ? `Cannot be an Abelian group because ${name} does not satisfy all group axioms.`
          : `Group is non-Abelian (${commWitness}).`,
  };

  // 7. Element orders & cyclicity (only meaningful when group axioms are satisfied)
  const elementOrders: { element: string; order: number | null }[] = elements.map((el, idx) => {
    if (groupStatus !== 'satisfied' || identityIndex === null) {
      return { element: el, order: null };
    }
    let curr = idx;
    let ord = 1;
    while (curr !== identityIndex && ord <= m) {
      curr = table[curr][idx];
      ord++;
    }
    return { element: el, order: curr === identityIndex ? ord : null };
  });

  const generators =
    groupStatus === 'satisfied'
      ? elementOrders.filter((eo) => eo.order === m).map((eo) => eo.element)
      : [];

  const isCyclic: PropertyCheckResult & { generators: string[] } = {
    name: 'Cyclic Group',
    generators,
    status:
      groupStatus === 'not_satisfied'
        ? 'not_satisfied'
        : groupStatus === 'unable_to_verify'
          ? 'unable_to_verify'
          : generators.length > 0
            ? 'satisfied'
            : 'not_satisfied',
    detail:
      groupStatus !== 'satisfied'
        ? 'Requires a verified group structure.'
        : generators.length > 0
          ? `Cyclic: generated by ${generators.join(', ')} (each has order ${m}).`
          : `Not cyclic: no element has order ${m}.`,
  };

  return {
    structureName: name,
    order: m,
    closure,
    associativity,
    identity,
    inverses,
    commutativity,
    isGroup,
    isAbelian,
    isCyclic,
    elementOrders,
    centre,
  };
}

/**
 * Exports a Cayley table as RFC-4180 CSV text.
 */
export function cayleyTableToCSV(structure: AlgebraicStructure): string {
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const header = [esc(structure.operationSymbol), ...structure.elements.map(esc)].join(',');
  const rows = structure.elements.map((rowEl, i) => {
    const cells = structure.table[i].map((idx) =>
      idx >= 0 && idx < structure.elements.length ? esc(structure.elements[idx]) : esc('?')
    );
    return [esc(rowEl), ...cells].join(',');
  });
  return [header, ...rows].join('\n');
}
