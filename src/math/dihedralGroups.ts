/**
 * Dihedral Group Engine D_n
 * Convention:
 * - D_n is the symmetry group of a regular n-gon, with |D_n| = 2n elements (n >= 3).
 * - Generators r (rotation by 2π/n counterclockwise) and s (reflection across axis through vertex 0).
 * - Relations: r^n = e, s^2 = e, s r s = r^(-1)  (equivalently r s = s r^(-1)).
 * - Elements are indexed 0..2n-1:
 *     0..n-1: rotations e, r, r^2, ..., r^(n-1)
 *     n..2n-1: reflections s, sr, sr^2, ..., sr^(n-1)
 */

import { gcd, mod } from './numberTheory';

export interface DihedralElement {
  index: number;
  isReflection: boolean;
  k: number; // exponent of r in s^j r^k
  label: string;
  latex: string;
  order: number;
  inverseIndex: number;
  inverseLabel: string;
  vertexMapping: number[]; // image of vertices 0..n-1 (1-based display v+1)
}

export interface DihedralGroupData {
  n: number;
  order: number;
  isAbelian: boolean;
  elements: DihedralElement[];
  rotations: DihedralElement[];
  reflections: DihedralElement[];
  cayleyTable: number[][];
  centreIndices: number[];
  centreLabels: string[];
  relations: string[];
}

export function formatDihedralLabel(isReflection: boolean, k: number): string {
  if (!isReflection) {
    if (k === 0) return 'e';
    if (k === 1) return 'r';
    return `r^${k}`;
  }
  if (k === 0) return 's';
  if (k === 1) return 'sr';
  return `sr^${k}`;
}

export function formatDihedralLatex(isReflection: boolean, k: number): string {
  if (!isReflection) {
    if (k === 0) return 'e';
    if (k === 1) return 'r';
    return `r^{${k}}`;
  }
  if (k === 0) return 's';
  if (k === 1) return 'sr';
  return `sr^{${k}}`;
}

/**
 * Multiplies two elements (s^a r^k) ∘ (s^b r^m) using standard right-to-left composition
 * and the relation r s = s r^(-1) (i.e. r^k s = s r^(-k)).
 */
export function multiplyDihedral(
  n: number,
  aRefl: boolean,
  k: number,
  bRefl: boolean,
  m: number
): { isReflection: boolean; k: number } {
  if (!aRefl && !bRefl) {
    // r^k ∘ r^m = r^(k + m)
    return { isReflection: false, k: mod(k + m, n) };
  }
  if (!aRefl && bRefl) {
    // r^k ∘ (s r^m) = (r^k s) r^m = s r^(-k + m)
    return { isReflection: true, k: mod(m - k, n) };
  }
  if (aRefl && !bRefl) {
    // (s r^k) ∘ r^m = s r^(k + m)
    return { isReflection: true, k: mod(k + m, n) };
  }
  // (s r^k) ∘ (s r^m) = s (r^k s) r^m = s^2 r^(m - k) = r^(m - k)
  return { isReflection: false, k: mod(m - k, n) };
}

export function buildDihedralGroup(nInput: number): DihedralGroupData {
  const n = Math.trunc(nInput);
  if (!Number.isInteger(n) || n < 3 || n > 16) {
    throw new Error('Regular polygon side count n must be an integer between 3 and 16.');
  }

  const order = 2 * n;

  const toIndex = (isReflection: boolean, k: number) =>
    (isReflection ? n : 0) + mod(k, n);

  const elements: DihedralElement[] = [];

  for (let idx = 0; idx < order; idx++) {
    const isReflection = idx >= n;
    const k = idx % n;
    const elemOrder = isReflection ? 2 : k === 0 ? 1 : n / gcd(n, k);
    const invIdx = isReflection ? idx : toIndex(false, mod(-k, n));
    const invRefl = invIdx >= n;
    const invK = invIdx % n;

    // Vertex mapping (1-indexed labels 1..n for polygon vertices):
    // r sends vertex v -> (v + 1) mod n
    // s sends vertex v -> (-v) mod n
    // (s^refl r^k)(v) = refl ? -(v + k) mod n : (v + k) mod n
    const vertexMapping = Array.from({ length: n }, (_, v) => {
      const shifted = mod(v + k, n);
      const mapped = isReflection ? mod(-shifted, n) : shifted;
      return mapped + 1;
    });

    elements.push({
      index: idx,
      isReflection,
      k,
      label: formatDihedralLabel(isReflection, k),
      latex: formatDihedralLatex(isReflection, k),
      order: elemOrder,
      inverseIndex: invIdx,
      inverseLabel: formatDihedralLabel(invRefl, invK),
      vertexMapping,
    });
  }

  const cayleyTable: number[][] = Array.from({ length: order }, (_, i) =>
    Array.from({ length: order }, (__, j) => {
      const a = elements[i];
      const b = elements[j];
      const prod = multiplyDihedral(n, a.isReflection, a.k, b.isReflection, b.k);
      return toIndex(prod.isReflection, prod.k);
    })
  );

  // Programmatically compute Centre Z(D_n) from the Cayley table
  const centreIndices: number[] = [];
  for (let i = 0; i < order; i++) {
    let commutesWithAll = true;
    for (let j = 0; j < order; j++) {
      if (cayleyTable[i][j] !== cayleyTable[j][i]) {
        commutesWithAll = false;
        break;
      }
    }
    if (commutesWithAll) centreIndices.push(i);
  }

  const centreLabels = centreIndices.map((idx) => elements[idx].label);
  const isAbelian = centreIndices.length === order;

  const rotations = elements.filter((e) => !e.isReflection);
  const reflections = elements.filter((e) => e.isReflection);

  const relations = [
    `r^${n} = e (n-fold rotational symmetry)`,
    `s^2 = e (reflection is an involution of order 2)`,
    `s r s = r^(-1) = r^${n - 1} (non-abelian conjugation relation for n ≥ 3)`,
  ];

  return {
    n,
    order,
    isAbelian,
    elements,
    rotations,
    reflections,
    cayleyTable,
    centreIndices,
    centreLabels,
    relations,
  };
}
