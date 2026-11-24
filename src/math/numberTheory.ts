/**
 * Number Theory Engine for Finite Group Explorer
 * Provides GCD, LCM, prime factorization, Euler's totient φ(n),
 * positive divisors, and modular arithmetic with step-by-step traces.
 */

export interface EuclideanStep {
  a: number;
  b: number;
  quotient: number;
  remainder: number;
  equation: string;
}

export interface GcdResult {
  result: number;
  steps: EuclideanStep[];
}

export interface PrimeFactor {
  prime: number;
  exponent: number;
}

export interface EulerPhiResult {
  n: number;
  phi: number;
  primeFactors: PrimeFactor[];
  coprimes: number[];
  formulaExpression: string;
  formulaEvaluation: string;
  steps: string[];
}

/**
 * Positive modulo in [0, m - 1]
 */
export function mod(a: number, m: number): number {
  if (m <= 0) throw new Error('Modulus must be a positive integer.');
  return ((a % m) + m) % m;
}

/**
 * Greatest Common Divisor via the Euclidean Algorithm, recording every division step.
 */
export function gcdWithSteps(aInput: number, bInput: number): GcdResult {
  let a = Math.abs(Math.trunc(aInput));
  let b = Math.abs(Math.trunc(bInput));
  const steps: EuclideanStep[] = [];

  if (a === 0 && b === 0) {
    return { result: 0, steps: [] };
  }
  if (b === 0) {
    return {
      result: a,
      steps: [{ a, b: 0, quotient: 0, remainder: 0, equation: `gcd(${a}, 0) = ${a}` }],
    };
  }

  while (b !== 0) {
    const quotient = Math.floor(a / b);
    const remainder = a % b;
    steps.push({
      a,
      b,
      quotient,
      remainder,
      equation: `${a} = ${quotient} × ${b} + ${remainder}`,
    });
    a = b;
    b = remainder;
  }

  return { result: a, steps };
}

export function gcd(a: number, b: number): number {
  let x = Math.abs(Math.trunc(a));
  let y = Math.abs(Math.trunc(b));
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

export function lcm(a: number, b: number): number {
  const x = Math.abs(Math.trunc(a));
  const y = Math.abs(Math.trunc(b));
  if (x === 0 || y === 0) return 0;
  return (x / gcd(x, y)) * y;
}

export function lcmArray(nums: number[]): number {
  if (nums.length === 0) return 1;
  return nums.reduce((acc, val) => lcm(acc, val), 1);
}

/**
 * Trial division prime factorization of a positive integer n >= 1.
 */
export function primeFactorization(nInput: number): PrimeFactor[] {
  let n = Math.trunc(nInput);
  if (n < 1) throw new Error('Prime factorization requires a positive integer ≥ 1.');
  if (n === 1) return [];

  const factors: PrimeFactor[] = [];
  let count = 0;
  while (n % 2 === 0) {
    count++;
    n = Math.floor(n / 2);
  }
  if (count > 0) factors.push({ prime: 2, exponent: count });

  let p = 3;
  while (p * p <= n) {
    count = 0;
    while (n % p === 0) {
      count++;
      n = Math.floor(n / p);
    }
    if (count > 0) factors.push({ prime: p, exponent: count });
    p += 2;
  }

  if (n > 1) {
    factors.push({ prime: n, exponent: 1 });
  }

  return factors;
}

export function formatPrimeFactorization(factors: PrimeFactor[]): string {
  if (factors.length === 0) return '1';
  return factors
    .map((f) => (f.exponent === 1 ? `${f.prime}` : `${f.prime}^${f.exponent}`))
    .join(' · ');
}

export function formatPrimeFactorizationLatex(factors: PrimeFactor[]): string {
  if (factors.length === 0) return '1';
  return factors
    .map((f) => (f.exponent === 1 ? `${f.prime}` : `${f.prime}^{${f.exponent}}`))
    .join(' \\cdot ');
}

/**
 * Euler's Totient Function φ(n) using prime factorization:
 * φ(n) = ∏ (p_i^{e_i} - p_i^{e_i - 1}) = n · ∏ (1 - 1/p_i)
 * Also collects coprime integers in {1, ..., n} for practical n (<= 2000).
 */
export function eulerPhi(nInput: number): EulerPhiResult {
  const n = Math.trunc(nInput);
  if (n < 1) throw new Error('Input n must be a positive integer ≥ 1.');

  if (n === 1) {
    return {
      n: 1,
      phi: 1,
      primeFactors: [],
      coprimes: [1],
      formulaExpression: '\\varphi(1) = 1',
      formulaEvaluation: '1',
      steps: ['By definition, φ(1) = 1 since gcd(1, 1) = 1.'],
    };
  }

  const primeFactors = primeFactorization(n);
  let phi = 1;
  const stepParts: string[] = [];
  const texParts: string[] = [];
  const evalParts: string[] = [];

  for (const { prime, exponent } of primeFactors) {
    const pPow = Math.pow(prime, exponent);
    const pPrev = Math.pow(prime, exponent - 1);
    const term = pPow - pPrev;
    phi *= term;
    if (exponent === 1) {
      stepParts.push(`φ(${prime}) = ${prime} - 1 = ${term}`);
      texParts.push(`(${prime} - 1)`);
    } else {
      stepParts.push(`φ(${prime}^${exponent}) = ${prime}^${exponent} - ${prime}^${exponent - 1} = ${pPow} - ${pPrev} = ${term}`);
      texParts.push(`(${prime}^{${exponent}} - ${prime}^{${exponent - 1}})`);
    }
    evalParts.push(`${term}`);
  }

  const coprimes: number[] = [];
  if (n <= 2000) {
    for (let k = 1; k <= n; k++) {
      if (gcd(k, n) === 1) coprimes.push(k);
    }
  }

  const steps = [
    `Prime factorization: ${n} = ${formatPrimeFactorization(primeFactors)}`,
    `Using multiplicativity of φ over coprime prime powers: ${stepParts.join('; ')}`,
    `Product: φ(${n}) = ${evalParts.join(' × ')} = ${phi}`,
  ];
  if (coprimes.length > 0) {
    steps.push(`Verified by counting integers 1 ≤ k ≤ ${n} with gcd(k, ${n}) = 1: count = ${coprimes.length}.`);
  }

  return {
    n,
    phi,
    primeFactors,
    coprimes,
    formulaExpression: `\\varphi(${n}) = ${texParts.join(' \\cdot ')}`,
    formulaEvaluation: `${evalParts.join(' \\times ')} = ${phi}`,
    steps,
  };
}

/**
 * Returns all positive divisors of n sorted in ascending order.
 */
export function divisors(nInput: number): number[] {
  const n = Math.trunc(nInput);
  if (n < 1) return [];
  const small: number[] = [];
  const large: number[] = [];
  for (let d = 1; d * d <= n; d++) {
    if (n % d === 0) {
      small.push(d);
      if (d * d !== n) large.push(n / d);
    }
  }
  return [...small, ...large.reverse()];
}

export function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let d = 3; d * d <= n; d += 2) {
    if (n % d === 0) return false;
  }
  return true;
}

/**
 * Generates integer partitions of m in descending order (e.g. 3 -> [[3], [2,1], [1,1,1]]).
 */
export function integerPartitions(m: number): number[][] {
  if (m === 0) return [[]];
  const results: number[][] = [];

  function backtrack(remaining: number, maxPart: number, current: number[]) {
    if (remaining === 0) {
      results.push([...current]);
      return;
    }
    for (let part = Math.min(remaining, maxPart); part >= 1; part--) {
      current.push(part);
      backtrack(remaining - part, part, current);
      current.pop();
    }
  }

  backtrack(m, m, []);
  return results;
}

export function factorial(n: number): number {
  if (n < 0) throw new Error('Factorial undefined for negative integers.');
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}
