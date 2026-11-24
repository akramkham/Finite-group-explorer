import React, { useEffect, useMemo, useState } from 'react';
import { BookText, CheckCircle2, FileCode2, Info, Play, RotateCcw, ShieldCheck, XCircle } from 'lucide-react';
import { MathTestCaseResult, runAllMathTests } from '../../math/mathTests';
import { NAV_ITEMS } from '../../types/navigation';
import { rowsToCSV } from '../../utils/exportResults';
import { ExportBar } from '../ui/ExportBar';
import { MathTex } from '../ui/MathTex';
import { SectionHeader } from '../ui/SectionHeader';

interface ProjectProfile {
  studentName: string;
  studentId: string;
  courseName: string;
  supervisorName: string;
  institutionName: string;
  academicTerm: string;
}

const DEFAULT_PROFILE: ProjectProfile = {
  studentName: '',
  studentId: '',
  courseName: 'Abstract Algebra',
  supervisorName: '',
  institutionName: '',
  academicTerm: '',
};

const STORAGE_KEY = 'finite_group_explorer_profile_v1';

export const AboutSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'docs' | 'tests'>('overview');
  const [profile, setProfile] = useState<ProjectProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...DEFAULT_PROFILE, ...JSON.parse(saved) };
    } catch {
      // ignore storage errors
    }
    return DEFAULT_PROFILE;
  });

  const [testResults, setTestResults] = useState<MathTestCaseResult[]>(() => runAllMathTests());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // ignore storage errors
    }
  }, [profile]);

  const passedCount = testResults.filter((t) => t.passed).length;

  const testReportText = useMemo(() => {
    return [
      `Finite Group Explorer — Mathematical Verification Suite`,
      `Summary: ${passedCount}/${testResults.length} assertions passed`,
      '',
      ...testResults.map(
        (t) => `[${t.passed ? 'PASS' : 'FAIL'}] ${t.id}: ${t.name} (expected: ${t.expected} | actual: ${t.actual})`
      ),
    ].join('\n');
  }, [testResults, passedCount]);

  const testCSV = useMemo(() => {
    return rowsToCSV(
      ['Test_ID', 'Theorem_or_Assertion', 'Expected', 'Actual', 'Status'],
      testResults.map((t) => [t.id, t.name, t.expected, t.actual, t.passed ? 'Pass' : 'Fail'])
    );
  }, [testResults]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="About Project & Documentation"
        description="Project specification, editable academic attribution, algebraic conventions documentation, and live mathematical verification test suite."
        formulaTex="\forall G \in \{\mathbb{Z}_n, \prod \mathbb{Z}_{n_i}, S_n, D_n, U(n)\}:\; \text{Axioms Verified Client-Side}"
      />

      {/* Section Tabs */}
      <div className="inline-flex flex-wrap items-center p-1 rounded-lg bg-slate-100 dark:bg-[#0B1120] border border-slate-200 dark:border-[#334155] gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-md transition-all inline-flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-white dark:bg-[#7C3AED] text-slate-900 dark:text-[#F8FAFC] shadow-sm'
              : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
          }`}
        >
          <Info className="w-4 h-4" />
          <span>Overview &amp; Author Details</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('docs')}
          className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-md transition-all inline-flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'docs'
              ? 'bg-white dark:bg-[#7C3AED] text-slate-900 dark:text-[#F8FAFC] shadow-sm'
              : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
          }`}
        >
          <BookText className="w-4 h-4" />
          <span>Technical Documentation</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('tests')}
          className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-md transition-all inline-flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'tests'
              ? 'bg-white dark:bg-[#7C3AED] text-slate-900 dark:text-[#F8FAFC] shadow-sm'
              : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Verification Suite ({passedCount}/{testResults.length})</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & AUTHOR DETAILS */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-6 space-y-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-[#F8FAFC]">
              Project Specification
            </h2>
            <dl className="divide-y divide-slate-100 dark:divide-[#334155] text-sm">
              <div className="py-3 grid grid-cols-3 gap-3">
                <dt className="text-slate-500 dark:text-[#94A3B8] font-medium">Project Name</dt>
                <dd className="col-span-2 font-semibold text-slate-900 dark:text-[#22D3EE]">
                  Finite Group Explorer
                </dd>
              </div>
              <div className="py-3 grid grid-cols-3 gap-3">
                <dt className="text-slate-500 dark:text-[#94A3B8] font-medium">Project Title</dt>
                <dd className="col-span-2 text-slate-800 dark:text-[#F8FAFC]">
                  Finite Abelian, Permutation &amp; Dihedral Group Explorer
                </dd>
              </div>
              <div className="py-3 grid grid-cols-3 gap-3">
                <dt className="text-slate-500 dark:text-[#94A3B8] font-medium">Category</dt>
                <dd className="col-span-2 text-slate-800 dark:text-[#F8FAFC]">
                  Abstract Algebra / Mathematical Computing
                </dd>
              </div>
              <div className="py-3 grid grid-cols-3 gap-3">
                <dt className="text-slate-500 dark:text-[#94A3B8] font-medium">Purpose</dt>
                <dd className="col-span-2 text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                  To provide a university-grade interactive environment for exploring finite groups, performing symbolic &amp; modular computations with full step-by-step proofs, teaching abstract algebra, and visualizing subgroup lattices.
                </dd>
              </div>
              <div className="py-3 grid grid-cols-3 gap-3">
                <dt className="text-slate-500 dark:text-[#94A3B8] font-medium">Architecture</dt>
                <dd className="col-span-2 text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                  100% client-side TypeScript computational algebra engine decoupled from React UI views, paired with KaTeX mathematical typesetting, interactive SVG geometry, and Recharts visualizations.
                </dd>
              </div>
            </dl>
          </div>

          <div className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-6 space-y-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-[#F8FAFC]">
                  Author &amp; Course Details (Editable)
                </h2>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                  Enter your university, student, and supervisor details before presenting. Saved locally in your browser.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setProfile(DEFAULT_PROFILE)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/60 text-xs font-medium text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-50 dark:hover:bg-[#0B1120] inline-flex items-center gap-1 whitespace-nowrap transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-600 dark:text-[#94A3B8]">
                  Student Name
                </label>
                <input
                  type="text"
                  value={profile.studentName}
                  onChange={(e) => setProfile((p) => ({ ...p, studentName: e.target.value }))}
                  placeholder="Enter student name"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#334155] bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-[#F8FAFC] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8]/60 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-[#22D3EE]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-600 dark:text-[#94A3B8]">
                  Student / Roll ID
                </label>
                <input
                  type="text"
                  value={profile.studentId}
                  onChange={(e) => setProfile((p) => ({ ...p, studentId: e.target.value }))}
                  placeholder="Enter ID"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#334155] bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-[#F8FAFC] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8]/60 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-[#22D3EE]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-600 dark:text-[#94A3B8]">
                  Course / Subject
                </label>
                <input
                  type="text"
                  value={profile.courseName}
                  onChange={(e) => setProfile((p) => ({ ...p, courseName: e.target.value }))}
                  placeholder="Abstract Algebra"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#334155] bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-[#F8FAFC] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8]/60 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-[#22D3EE]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-600 dark:text-[#94A3B8]">
                  Instructor / Supervisor
                </label>
                <input
                  type="text"
                  value={profile.supervisorName}
                  onChange={(e) => setProfile((p) => ({ ...p, supervisorName: e.target.value }))}
                  placeholder="Enter supervisor name"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#334155] bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-[#F8FAFC] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8]/60 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-[#22D3EE]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-600 dark:text-[#94A3B8]">
                  University / Department
                </label>
                <input
                  type="text"
                  value={profile.institutionName}
                  onChange={(e) => setProfile((p) => ({ ...p, institutionName: e.target.value }))}
                  placeholder="Enter university / department"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#334155] bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-[#F8FAFC] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8]/60 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-[#22D3EE]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-600 dark:text-[#94A3B8]">
                  Academic Term / Year
                </label>
                <input
                  type="text"
                  value={profile.academicTerm}
                  onChange={(e) => setProfile((p) => ({ ...p, academicTerm: e.target.value }))}
                  placeholder="e.g. Fall 2026"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#334155] bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-[#F8FAFC] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8]/60 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-[#22D3EE]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TECHNICAL DOCUMENTATION */}
      {activeTab === 'docs' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-6 space-y-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-purple-600 dark:text-[#22D3EE]" />
                <h2 className="text-base font-semibold text-slate-900 dark:text-[#F8FAFC]">
                  Mathematical Conventions &amp; Axioms
                </h2>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#334155] space-y-1.5">
                  <div className="font-semibold text-slate-900 dark:text-[#F8FAFC]">
                    1. Symmetric Group Composition Convention
                  </div>
                  <p>
                    Permutations act as bijections on <MathTex tex="\{1, 2, \dots, n\}" /> using standard right-to-left function composition:
                  </p>
                  <div className="overflow-x-auto pt-1 text-slate-900 dark:text-[#22D3EE]">
                    <MathTex tex="(\sigma \circ \tau)(x) = \sigma(\tau(x)), \qquad |S_n| = n!, \qquad |A_n| = \frac{n!}{2} \;(n \ge 2)" />
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#334155] space-y-1.5">
                  <div className="font-semibold text-slate-900 dark:text-[#F8FAFC]">
                    2. Dihedral Group Notation (Geometry Convention)
                  </div>
                  <p>
                    <MathTex tex="D_n" /> denotes the full rigid symmetry group of a regular <MathTex tex="n" />-gon of order <MathTex tex="2n" />, generated by counterclockwise rotation <MathTex tex="r" /> and axis reflection <MathTex tex="s" />:
                  </p>
                  <div className="overflow-x-auto pt-1 text-slate-900 dark:text-[#22D3EE]">
                    <MathTex tex="r^n = e, \quad s^2 = e, \quad srs = r^{-1}, \quad |Z(D_n)| = \begin{cases} 2 & n \text{ even} \\ 1 & n \text{ odd} \end{cases}" />
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#334155] space-y-1.5">
                  <div className="font-semibold text-slate-900 dark:text-[#F8FAFC]">
                    3. Finite Abelian Classification &amp; Orders
                  </div>
                  <p>
                    Every finite Abelian group of order <MathTex tex="n = \prod p_i^{e_i}" /> splits into <MathTex tex="\prod p(e_i)" /> isomorphism classes expressed in both elementary divisors and invariant factors <MathTex tex="d_1 \mid d_2 \mid \dots \mid d_m" />.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-6 space-y-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
              <h2 className="text-base font-semibold text-slate-900 dark:text-[#F8FAFC]">
                Computational Bounds &amp; Verification Methodology
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                <p>
                  <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">Exact Client-Side Engine:</span> All group operations run deterministically in integer arithmetic inside the browser without external APIs or floating-point rounding.
                </p>
                <p>
                  <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">Exhaustive Axiom Verification:</span> In the Group Properties Analyzer and Cayley Table Generator, associativity checks evaluate all <MathTex tex="m^3" /> triples exhaustively up to order 50 (125,000 triples), closure checks all <MathTex tex="m^2" /> entries, and non-groups like <MathTex tex="(\mathbb{Z}_4, \times)" /> and <MathTex tex="(\mathbb{Z}_5, -)" /> explicitly produce witness counterexamples.
                </p>
                <p>
                  <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">Independent Cross-Checks:</span> Automated verification tests (18–22) verify analytical formulas against independent brute-force addition loops, Euler divisor sums <MathTex tex="\sum_{d \mid n} \varphi(d) = n" />, Vandermonde determinant parity signs, and geometric vertex mappings.
                </p>
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#334155] text-xs font-mono-math text-slate-700 dark:text-[#22D3EE] space-y-1">
                  <div>• Element table enumeration limit: |G| ≤ 256</div>
                  <div>• Cayley matrix rendering limit: |G| ≤ 36 (direct products), n ≤ 24 (Z_n), n ≤ 10 (D_n), n ≤ 4 (S_n)</div>
                  <div>• Subgroup lattice diagram limit: n ≤ 120</div>
                  <div>• Symmetric group exhaustive enumeration limit: n ≤ 6 (|S_6| = 720)</div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-6 space-y-3 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
            <h2 className="text-base font-semibold text-slate-900 dark:text-[#F8FAFC]">
              Module Architecture (All 14 Modules)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-[#0B1120] text-xs text-slate-500 dark:text-[#94A3B8]">
                    <th className="py-2 px-3 font-medium">#</th>
                    <th className="py-2 px-3 font-medium">Module</th>
                    <th className="py-2 px-3 font-medium">Category</th>
                    <th className="py-2 px-3 font-medium">Mathematical Scope</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#334155]">
                  {NAV_ITEMS.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-[#0B1120]/50 transition-colors">
                      <td className="py-2 px-3 font-mono-math text-slate-500 dark:text-[#22D3EE]">{idx + 1}</td>
                      <td className="py-2 px-3 font-medium text-slate-900 dark:text-[#F8FAFC]">{item.label}</td>
                      <td className="py-2 px-3 text-xs text-slate-500 dark:text-[#C4B5FD]">{item.group}</td>
                      <td className="py-2 px-3 text-slate-600 dark:text-[#94A3B8]">{item.shortDesc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE VERIFICATION SUITE */}
      {activeTab === 'tests' && (
        <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-6 space-y-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-[#F8FAFC]">
                Mathematical Accuracy Verification Suite
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                {passedCount}/{testResults.length} automated mathematical assertions and independent cross-checks passing in-browser
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ExportBar
                reportTitle="Finite Group Explorer Verification Suite"
                reportFilename="verification_suite_results.md"
                reportContent={testReportText}
                csvFilename="verification_suite_results.csv"
                csvContent={testCSV}
              />
              <button
                type="button"
                onClick={() => setTestResults(runAllMathTests())}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#8B5CF6] hover:to-[#7C3AED] text-[#F8FAFC] text-xs font-medium shadow-sm shadow-[#7C3AED]/25 inline-flex items-center gap-1.5 whitespace-nowrap transition-all"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Re-run All Tests</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-[#0B1120] text-xs text-slate-500 dark:text-[#94A3B8]">
                  <th className="py-2.5 px-3 font-medium">Test</th>
                  <th className="py-2.5 px-3 font-medium">Theorem / Assertion</th>
                  <th className="py-2.5 px-3 font-medium">Expected</th>
                  <th className="py-2.5 px-3 font-medium">Computed Result</th>
                  <th className="py-2.5 px-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#334155]">
                {testResults.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-[#0B1120]/50 transition-colors">
                    <td className="py-2.5 px-3 font-mono-math font-semibold text-slate-900 dark:text-[#22D3EE] whitespace-nowrap">
                      {t.id}
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 dark:text-[#F8FAFC]">{t.name}</td>
                    <td className="py-2.5 px-3 font-mono-math text-slate-600 dark:text-[#94A3B8]">
                      {t.expected}
                    </td>
                    <td className="py-2.5 px-3 font-mono-math text-slate-900 dark:text-[#F8FAFC]">
                      {t.actual}
                    </td>
                    <td className="py-2.5 px-3">
                      {t.passed ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-[#10B981]">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Pass</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 dark:text-[#EF4444]">
                          <XCircle className="w-4 h-4" />
                          <span>Fail</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
