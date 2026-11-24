/**
 * Automated Mathematical Accuracy Test Suite
 * Verifies all core theorems, group orders, generators, permutations,
 * dihedral relations, classifications, and non-group counterexamples.
 */

import {
  analyzeAbelianGroup,
  buildCyclicSubgroupLattice,
  classifyAbelianGroups,
  computeAbelianElementOrder,
} from './abelianGroups';
import {
  analyzeAlgebraicStructure,
  buildCyclicMultiplicationStructure,
  buildCyclicSubtractionStructure,
  buildDirectProductStructure,
} from './cayleyAndProperties';
import { buildDihedralGroup } from './dihedralGroups';
import { eulerPhi } from './numberTheory';
import {
  analyzePermutation,
  composePermutations,
  generateSymmetricGroup,
  parsePermutationInput,
  symmetricGroupParitySummary,
} from './permutations';

export interface MathTestCaseResult {
  id: string;
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
}

export function runAllMathTests(): MathTestCaseResult[] {
  const results: MathTestCaseResult[] = [];

  // Test 1: Z2 × Z2 has four elements
  {
    const g = analyzeAbelianGroup([2, 2]);
    results.push({
      id: 'Test 1',
      name: 'Z2 × Z2 order and element count',
      expected: '4 elements',
      actual: `${g.elements.length} elements (order = ${g.order})`,
      passed: g.order === 4 && g.elements.length === 4,
    });
  }

  // Test 2: Element orders in Z2 × Z2 are 1, 2, 2, 2
  {
    const g = analyzeAbelianGroup([2, 2]);
    const orders = g.elements.map((e) => e.order).sort((a, b) => a - b);
    results.push({
      id: 'Test 2',
      name: 'Element orders in Z2 × Z2',
      expected: '1, 2, 2, 2',
      actual: orders.join(', '),
      passed: orders.length === 4 && orders[0] === 1 && orders[1] === 2 && orders[2] === 2 && orders[3] === 2,
    });
  }

  // Test 3: Z2 × Z2 has no element of order 4
  {
    const g = analyzeAbelianGroup([2, 2]);
    const hasOrder4 = g.elements.some((e) => e.order === 4);
    results.push({
      id: 'Test 3',
      name: 'Z2 × Z2 has no element of order 4 (non-cyclic)',
      expected: '0 elements of order 4, isCyclic = false',
      actual: `${g.elements.filter((e) => e.order === 4).length} elements of order 4, isCyclic = ${g.isCyclic}`,
      passed: !hasOrder4 && !g.isCyclic,
    });
  }

  // Test 4: Order of (1,2) in Z2 × Z3 is 6
  {
    const res = computeAbelianElementOrder([1, 2], [2, 3]);
    results.push({
      id: 'Test 4',
      name: 'Order of (1, 2) in Z2 × Z3',
      expected: '6',
      actual: `${res.order}`,
      passed: res.order === 6,
    });
  }

  // Test 5: Order of (2,3) in Z4 × Z6 is 2
  {
    const res = computeAbelianElementOrder([2, 3], [4, 6]);
    results.push({
      id: 'Test 5',
      name: 'Order of (2, 3) in Z4 × Z6',
      expected: '2',
      actual: `${res.order}`,
      passed: res.order === 2,
    });
  }

  // Test 6: Order of (1,2) in Z4 × Z6 is 12
  {
    const res = computeAbelianElementOrder([1, 2], [4, 6]);
    results.push({
      id: 'Test 6',
      name: 'Order of (1, 2) in Z4 × Z6',
      expected: '12',
      actual: `${res.order}`,
      passed: res.order === 12,
    });
  }

  // Test 7: Generators of Z4 are 1 and 3
  {
    const g = analyzeAbelianGroup([4]);
    const gens = g.generators.map((e) => Number(e.label)).sort((a, b) => a - b);
    results.push({
      id: 'Test 7',
      name: 'Generators of Z4',
      expected: '1, 3',
      actual: gens.join(', '),
      passed: gens.length === 2 && gens[0] === 1 && gens[1] === 3,
    });
  }

  // Test 8: φ(4) = 2
  {
    const phi4 = eulerPhi(4);
    results.push({
      id: 'Test 8',
      name: "Euler's totient φ(4)",
      expected: '2',
      actual: `${phi4.phi}`,
      passed: phi4.phi === 2,
    });
  }

  // Test 9: Number of even permutations in S5 is 60
  {
    const s5 = symmetricGroupParitySummary(5);
    results.push({
      id: 'Test 9',
      name: 'Even permutations in S5 (|A5|)',
      expected: '60 (verified over 120 permutations)',
      actual: `${s5.evenCount} (verifiedByEnumeration = ${s5.verifiedByEnumeration})`,
      passed: s5.evenCount === 60 && s5.oddCount === 60 && s5.verifiedByEnumeration,
    });
  }

  // Test 10: D6 has 12 elements and D8 has 16 elements
  {
    const d6 = buildDihedralGroup(6);
    const d8 = buildDihedralGroup(8);
    // Verify s * r * s = r^(-1) in D6: s is index 6, r is index 1, r^5 is index 5
    const sIdx = 6;
    const rIdx = 1;
    const srsIdx = d6.cayleyTable[d6.cayleyTable[sIdx][rIdx]][sIdx];
    const rInvIdx = d6.elements[rIdx].inverseIndex;
    results.push({
      id: 'Test 10',
      name: 'Dihedral orders |D6| = 12, |D8| = 16, and relation srs = r^(-1)',
      expected: '|D6| = 12, |D8| = 16, srs = r^5',
      actual: `|D6| = ${d6.order}, |D8| = ${d8.order}, srs = ${d6.elements[srsIdx].label}`,
      passed: d6.order === 12 && d8.order === 16 && srsIdx === rInvIdx,
    });
  }

  // Test 11: Six isomorphism classes of finite Abelian groups of order 72
  {
    const cls = classifyAbelianGroups(72);
    const allVerify72 = cls.classes.every((c) => c.verifiedOrder === 72);
    results.push({
      id: 'Test 11',
      name: 'Abelian group classification of order 72',
      expected: '6 isomorphism classes, all verified order 72',
      actual: `${cls.totalClasses} classes, all verified = ${allVerify72}`,
      passed: cls.totalClasses === 6 && allVerify72,
    });
  }

  // Test 12: Permutation composition & parity check
  {
    const sigma = parsePermutationInput('(1 2 3)', 4);
    const tau = parsePermutationInput('(2 3 4)', 4);
    const comp = analyzePermutation(composePermutations(sigma, tau));
    // (1 2 3) ∘ (2 3 4): 1->1->2, 2->3->1, 3->4->4, 4->2->3 => (1 2)(3 4)
    results.push({
      id: 'Test 12',
      name: 'Permutation composition (1 2 3) ∘ (2 3 4) in S4',
      expected: '(1 2)(3 4), order 2, Even',
      actual: `${comp.cycleNotation}, order ${comp.order}, ${comp.parity}`,
      passed: comp.cycleNotation === '(1 2)(3 4)' && comp.order === 2 && comp.parity === 'Even',
    });
  }

  // Test 13: Group Properties Analyzer rejects non-groups
  {
    const z4Mul = analyzeAlgebraicStructure(buildCyclicMultiplicationStructure(4));
    const z5Sub = analyzeAlgebraicStructure(buildCyclicSubtractionStructure(5));
    const v4 = analyzeAlgebraicStructure(buildDirectProductStructure([2, 2]));
    results.push({
      id: 'Test 13',
      name: 'Axiom verifier distinguishes groups from non-groups',
      expected: '(Z4,×) non-group, (Z5,-) non-associative, (Z2×Z2,+) group',
      actual: `(Z4,×):${z4Mul.isGroup.status}, (Z5,-):${z5Sub.associativity.status}, V4:${v4.isGroup.status}`,
      passed:
        z4Mul.isGroup.status === 'not_satisfied' &&
        z5Sub.associativity.status === 'not_satisfied' &&
        v4.isGroup.status === 'satisfied',
    });
  }

  // Test 14: Cyclic subgroup lattice of Z12
  {
    const lat = buildCyclicSubgroupLattice(12);
    results.push({
      id: 'Test 14',
      name: 'Cyclic subgroup lattice of Z12 (divisors of 12)',
      expected: '6 subgroups, 7 Hasse covering edges',
      actual: `${lat.nodes.length} subgroups, ${lat.edges.length} edges`,
      passed: lat.nodes.length === 6 && lat.edges.length === 7,
    });
  }

  // Test 15: Trivial group edge cases (n = 1)
  {
    const phi1 = eulerPhi(1);
    const cls1 = classifyAbelianGroups(1);
    const lat1 = buildCyclicSubgroupLattice(1);
    const z1 = analyzeAbelianGroup([1]);
    results.push({
      id: 'Test 15',
      name: 'Trivial group edge cases (n = 1)',
      expected: 'φ(1)=1, 1 class, 1 subgroup, Z1 cyclic order 1',
      actual: `φ(1)=${phi1.phi}, ${cls1.totalClasses} class, ${lat1.nodes.length} node, |Z1|=${z1.order}`,
      passed:
        phi1.phi === 1 &&
        cls1.totalClasses === 1 &&
        lat1.nodes.length === 1 &&
        z1.order === 1 &&
        z1.isCyclic,
    });
  }

  // Test 16: Dihedral centre parity (odd vs even n) and U(8) units group
  {
    const d5 = buildDihedralGroup(5);
    const d6 = buildDihedralGroup(6);
    const u8 = analyzeAlgebraicStructure(
      buildDirectProductStructure([2, 2])
    );
    results.push({
      id: 'Test 16',
      name: 'Dihedral centre Z(D5)={e}, Z(D6)={e,r^3} and V4 verification',
      expected: 'Z(D5)={e}, Z(D6)={e, r^3}, V4 order 4',
      actual: `Z(D5)={${d5.centreLabels.join(',')}}, Z(D6)={${d6.centreLabels.join(',')}}, |V4|=${u8.order}`,
      passed:
        d5.centreLabels.length === 1 &&
        d5.centreLabels[0] === 'e' &&
        d6.centreLabels.length === 2 &&
        d6.centreLabels.includes('r^3') &&
        u8.isGroup.status === 'satisfied' &&
        u8.isCyclic.status === 'not_satisfied',
    });
  }

  // Test 17: Non-disjoint cycle parsing, negative modular coordinate normalization, and invalid input rejection
  {
    const comp = analyzePermutation(parsePermutationInput('(1 2)(2 3)', 3));
    const negOrder = computeAbelianElementOrder([-1, 5], [4, 6]); // (-1 mod 4 = 3, 5 mod 6 = 5) -> lcm(4, 6) = 12
    let rejectedInvalid = false;
    try {
      parsePermutationInput('(1 9)', 3);
    } catch {
      rejectedInvalid = true;
    }
    results.push({
      id: 'Test 17',
      name: 'Non-disjoint cycles, negative coordinates, and invalid input rejection',
      expected: '(1 2)(2 3)=(1 2 3), O((-1,5) in Z4×Z6)=12, invalid throws',
      actual: `${comp.cycleNotation}, O=${negOrder.order}, rejected=${rejectedInvalid}`,
      passed:
        comp.cycleNotation === '(1 2 3)' &&
        negOrder.order === 12 &&
        rejectedInvalid,
    });
  }

  // Test 18: Independent brute-force repeated-addition order check vs GCD/LCM formula across Z_4 × Z_6 and Z_18
  {
    const bruteTupleOrder = (tuple: number[], moduli: number[]): number => {
      let curr = [...tuple];
      let k = 1;
      while (curr.some((v) => v !== 0) && k <= 200) {
        curr = curr.map((v, idx) => (v + tuple[idx]) % moduli[idx]);
        k++;
      }
      return k;
    };

    const g4x6 = analyzeAbelianGroup([4, 6]);
    const g18 = analyzeAbelianGroup([18]);
    const all4x6Match = g4x6.elements.every(
      (el) => el.order === bruteTupleOrder(el.tuple, [4, 6])
    );
    const all18Match = g18.elements.every(
      (el) => el.order === bruteTupleOrder(el.tuple, [18])
    );

    results.push({
      id: 'Test 18',
      name: 'Independent brute-force order match across all elements of Z4×Z6 and Z18',
      expected: '100% agreement on all 24 + 18 = 42 elements',
      actual: `Z4×Z6 match=${all4x6Match}, Z18 match=${all18Match}`,
      passed: all4x6Match && all18Match,
    });
  }

  // Test 19: Independent Euler divisor-sum identity Σ_{d|n} φ(d) = n for n = 1..30
  {
    let allHold = true;
    for (let n = 1; n <= 30; n++) {
      let sum = 0;
      for (let d = 1; d <= n; d++) {
        if (n % d === 0) sum += eulerPhi(d).phi;
      }
      if (sum !== n) {
        allHold = false;
        break;
      }
    }
    results.push({
      id: 'Test 19',
      name: 'Euler divisor-sum identity Σ_{d|n} φ(d) = n for n = 1..30',
      expected: 'Identity holds for all 30 integers',
      actual: allHold ? '30/30 verified' : 'Mismatch detected',
      passed: allHold,
    });
  }

  // Test 20: Order distribution sum conservation Σ count(d) = |G| across Z4×Z6, D6, D8, and S4
  {
    const sum4x6 = analyzeAbelianGroup([4, 6]).orderDistribution.reduce((s, x) => s + x.count, 0);
    const d6 = buildDihedralGroup(6);
    const d8 = buildDihedralGroup(8);
    const s4 = symmetricGroupParitySummary(4);

    results.push({
      id: 'Test 20',
      name: 'Order distribution conservation Σ count = |G| for Z4×Z6, D6, D8, S4',
      expected: '24, 12, 16, 24',
      actual: `${sum4x6}, ${d6.elements.length}, ${d8.elements.length}, ${s4.evenCount + s4.oddCount}`,
      passed:
        sum4x6 === 24 &&
        d6.elements.length === 12 &&
        d8.elements.length === 16 &&
        s4.evenCount + s4.oddCount === 24,
    });
  }

  // Test 21: Independent vertex-mapping composition check vs algebraic Dihedral Cayley table in D6 (144 pairs)
  {
    const d6 = buildDihedralGroup(6);
    let matches = 0;
    for (let i = 0; i < d6.order; i++) {
      for (let j = 0; j < d6.order; j++) {
        const mapI = d6.elements[i].vertexMapping; // 1-based vertex image
        const mapJ = d6.elements[j].vertexMapping;
        // (i ∘ j)(v) = mapI[mapJ[v] - 1]
        const composed = mapJ.map((slotJ) => mapI[slotJ - 1]);
        const expectedIdx = d6.cayleyTable[i][j];
        const tableMapping = d6.elements[expectedIdx].vertexMapping;
        if (composed.every((val, v) => val === tableMapping[v])) {
          matches++;
        }
      }
    }
    results.push({
      id: 'Test 21',
      name: 'Independent vertex-action composition vs D6 Cayley table (all 144 products)',
      expected: '144/144 products match geometric vertex action',
      actual: `${matches}/144 matched`,
      passed: matches === 144,
    });
  }

  // Test 22: Independent sign product Π (σ(j)-σ(i))/(j-i) matches inversion parity across all 120 elements of S5
  {
    const s5 = symmetricGroupParitySummary(5);
    const allS5 = generateSymmetricGroup(5);
    let agreed = 0;
    let evenByVandermonde = 0;
    for (const perm of allS5) {
      const img = perm.image;
      let prodSign = 1;
      for (let i = 0; i < img.length; i++) {
        for (let j = i + 1; j < img.length; j++) {
          prodSign *= Math.sign((img[j] - img[i]) / (j - i));
        }
      }
      if (prodSign === 1) evenByVandermonde++;
      if (prodSign === perm.sign) {
        agreed++;
      }
    }
    results.push({
      id: 'Test 22',
      name: 'Independent Vandermonde product sign vs inversion parity across all 120 elements of S5',
      expected: '120/120 sign agreement and 60 even permutations',
      actual: `${agreed}/120 agreed, ${evenByVandermonde} even permutations (|A5|=${s5.evenCount})`,
      passed: s5.evenCount === 60 && evenByVandermonde === 60 && agreed === 120,
    });
  }

  return results;
}
