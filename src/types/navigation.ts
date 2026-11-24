export type SectionId =
  | 'dashboard'
  | 'abelian'
  | 'classification'
  | 'cayley'
  | 'element-order'
  | 'generators'
  | 'permutations'
  | 'parity'
  | 'dihedral'
  | 'euler-phi'
  | 'properties'
  | 'visualizations'
  | 'guided-examples'
  | 'about';

export interface NavItem {
  id: SectionId;
  label: string;
  group: 'Overview' | 'Abelian & Number Theory' | 'Symmetry & Permutations' | 'Analysis & Learning';
  shortDesc: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    group: 'Overview',
    shortDesc: 'Overview, recent calculations, and formula reference',
  },
  {
    id: 'abelian',
    label: 'Abelian Group Explorer',
    group: 'Abelian & Number Theory',
    shortDesc: 'Cyclic groups Z_n, direct products, and subgroup lattices',
  },
  {
    id: 'classification',
    label: 'Group Classification',
    group: 'Abelian & Number Theory',
    shortDesc: 'Fundamental Theorem of Finite Abelian Groups',
  },
  {
    id: 'element-order',
    label: 'Element Order Calculator',
    group: 'Abelian & Number Theory',
    shortDesc: 'Cyclic and direct product orders via GCD & LCM',
  },
  {
    id: 'generators',
    label: 'Generator Calculator',
    group: 'Abelian & Number Theory',
    shortDesc: 'Generators of Z_n and φ(n) verification',
  },
  {
    id: 'euler-phi',
    label: 'Euler Phi Calculator',
    group: 'Abelian & Number Theory',
    shortDesc: 'Prime factorization, φ(n), and coprimes',
  },
  {
    id: 'permutations',
    label: 'Permutation Explorer',
    group: 'Symmetry & Permutations',
    shortDesc: 'Two-line notation, disjoint cycles, and composition in S_n',
  },
  {
    id: 'parity',
    label: 'Even & Odd Analyzer',
    group: 'Symmetry & Permutations',
    shortDesc: 'Inversion counts, parity, and alternating group counts',
  },
  {
    id: 'dihedral',
    label: 'Dihedral Group Explorer',
    group: 'Symmetry & Permutations',
    shortDesc: 'Polygon symmetries D_n, rotations, reflections, and Z(D_n)',
  },
  {
    id: 'cayley',
    label: 'Cayley Table Generator',
    group: 'Analysis & Learning',
    shortDesc: 'Interactive operation tables with CSV export',
  },
  {
    id: 'properties',
    label: 'Group Properties Analyzer',
    group: 'Analysis & Learning',
    shortDesc: 'Independent verification of group axioms and centre',
  },
  {
    id: 'visualizations',
    label: 'Mathematical Visualizations',
    group: 'Analysis & Learning',
    shortDesc: 'Charts for orders, generators, parity, and subgroup lattices',
  },
  {
    id: 'guided-examples',
    label: 'Guided Examples',
    group: 'Analysis & Learning',
    shortDesc: 'Eight fully worked abstract algebra proofs and verifications',
  },
  {
    id: 'about',
    label: 'About Project',
    group: 'Analysis & Learning',
    shortDesc: 'Project documentation, editable metadata, and unit test suite',
  },
];

export interface RecentCalculation {
  id: string;
  section: SectionId;
  moduleName: string;
  inputSummary: string;
  resultSummary: string;
  timestamp: string;
}

export interface ModulePresetPayload {
  nonce: number;
  abelian?: { mode: 'cyclic' | 'product'; input: string };
  classification?: { n: string };
  elementOrder?: { moduli: string; element: string };
  generators?: { n: string };
  eulerPhi?: { n: string };
  permutations?: { n: number; sigma: string; tau: string };
  parity?: { n: number; perm: string };
  dihedral?: { n: number };
  cayley?: {
    family: 'zn_add' | 'zn_mul' | 'units_mul' | 'direct_product' | 'dihedral' | 'symmetric';
    param: string;
  };
  properties?: { preset: 'z4_add' | 'z4_mul' | 'u8_mul' | 'v4' | 'd3' | 'z5_sub' | 'custom3' };
  guidedTab?: 'examples' | 'quiz' | 'demo';
}
