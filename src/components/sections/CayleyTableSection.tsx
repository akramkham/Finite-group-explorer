import React, { useEffect, useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import {
  AlgebraicStructure,
  analyzeAlgebraicStructure,
  buildCyclicAdditionStructure,
  buildCyclicMultiplicationStructure,
  buildDihedralStructure,
  buildDirectProductStructure,
  buildSymmetricGroupStructure,
  buildUnitsGroupStructure,
  cayleyTableToCSV,
} from '../../math/cayleyAndProperties';
import { ModulePresetPayload } from '../../types/navigation';
import { ExportBar } from '../ui/ExportBar';
import { SectionHeader, StatusIndicator } from '../ui/SectionHeader';
import { SolutionStep, StepSolutionCard } from '../ui/StepSolutionCard';

interface CayleyTableSectionProps {
  onRecordCalculation: (moduleName: string, inputSummary: string, resultSummary: string) => void;
  preset?: ModulePresetPayload['cayley'] & { nonce: number };
}

type OperationFamily = 'zn_add' | 'zn_mul' | 'units_mul' | 'direct_product' | 'dihedral' | 'symmetric';

function buildStructureFromSpec(fam: OperationFamily, param: string): AlgebraicStructure {
  if (fam === 'direct_product') {
    const parts = param
      .split(/[×x,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0 || parts.some((p) => !/^\d+$/.test(p))) {
      throw new Error('Enter positive integer moduli separated by commas (e.g. "2, 3").');
    }
    const moduli = parts.map(Number);
    if (moduli.some((m) => m < 1)) {
      throw new Error('Every cyclic factor must be an integer ≥ 1.');
    }
    return buildDirectProductStructure(moduli);
  }
  const clean = param.trim();
  if (!/^\d+$/.test(clean)) {
    throw new Error(`"${param}" is not a valid positive integer parameter.`);
  }
  const n = Number(clean);
  if (fam === 'dihedral') {
    if (n < 3 || n > 10) {
      throw new Error('For Dihedral Cayley tables, choose integer 3 ≤ n ≤ 10 (order up to 20).');
    }
    return buildDihedralStructure(n);
  }
  if (fam === 'symmetric') {
    if (n < 1 || n > 4) {
      throw new Error('For S_n Cayley tables, choose integer 1 ≤ n ≤ 4 (|S_4| = 24).');
    }
    return buildSymmetricGroupStructure(n);
  }
  if (n < 1 || n > 24) {
    throw new Error('Choose integer 1 ≤ n ≤ 24 so the Cayley table renders clearly.');
  }
  if (fam === 'zn_add') return buildCyclicAdditionStructure(n);
  if (fam === 'zn_mul') return buildCyclicMultiplicationStructure(n);
  return buildUnitsGroupStructure(n);
}

export const CayleyTableSection: React.FC<CayleyTableSectionProps> = ({
  onRecordCalculation,
  preset,
}) => {
  const [family, setFamily] = useState<OperationFamily>('zn_add');
  const [paramN, setParamN] = useState('6');
  const [productInput, setProductInput] = useState('2, 2');
  const [error, setError] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number } | null>(null);
  const [structure, setStructure] = useState<AlgebraicStructure>(() =>
    buildCyclicAdditionStructure(6)
  );

  const analysis = useMemo(() => analyzeAlgebraicStructure(structure), [structure]);

  const handleGenerate = (overrideFamily?: OperationFamily, overrideVal?: string) => {
    setError(null);
    const activeFam = overrideFamily ?? family;
    const rawParam = overrideVal ?? (activeFam === 'direct_product' ? productInput : paramN);
    try {
      const next = buildStructureFromSpec(activeFam, rawParam);
      setHoveredCell(null);
      setStructure(next);
      const res = analyzeAlgebraicStructure(next);
      onRecordCalculation(
        'Cayley Table Generator',
        next.name,
        `Order ${next.elements.length} · ${res.isGroup.status === 'satisfied' ? 'Valid Group' : 'Not a Group'}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to build Cayley table.');
    }
  };

  useEffect(() => {
    if (!preset) return;
    setFamily(preset.family);
    if (preset.family === 'direct_product') setProductInput(preset.param);
    else setParamN(preset.param);
    setError(null);
    setHoveredCell(null);
    try {
      setStructure(buildStructureFromSpec(preset.family, preset.param));
    } catch {
      // ignore invalid external preset
    }
  }, [preset]);

  const handleReset = () => {
    setFamily('zn_add');
    setParamN('6');
    setProductInput('2, 2');
    setError(null);
    setHoveredCell(null);
    setStructure(buildCyclicAdditionStructure(6));
  };

  const idIdx = analysis.identity.identityIndex;

  const solutionSteps: SolutionStep[] = useMemo(() => {
    const n = structure.elements.length;
    const idLabel = idIdx !== null ? structure.elements[idIdx] : '\\text{none}';
    return [
      {
        title: 'Binary Operation Matrix Entry Rule',
        explanation: `Each row index g_i (left operand) and column index g_j (right operand) computes T_{i,j} = g_i ${structure.operationSymbol} g_j across all ${n} × ${n} = ${n * n} cells.`,
        formulaTex: `T_{i,j} = g_i \\star g_j \\quad (0 \\le i, j < ${n})`,
      },
      {
        title: 'Identity Row & Column Criterion',
        explanation: analysis.identity.detail,
        formulaTex: `e \\star x = x \\star e = x \\;\\forall x \\implies e = ${idLabel === '\\text{none}' ? '\\text{none}' : `\\text{${idLabel}}`}`,
      },
      {
        title: 'Inverses & Latin Square Property',
        explanation: `${analysis.inverses.detail} ${analysis.commutativity.detail}`,
        formulaTex: `g \\star g^{-1} = g^{-1} \\star g = e, \\quad \\text{Abelian} \\iff T = T^T`,
      },
    ];
  }, [structure, analysis, idIdx]);

  const tableCSV = useMemo(() => cayleyTableToCSV(structure), [structure]);
  const tableReport = useMemo(() => {
    return [
      `Cayley Table Report: ${structure.name}`,
      `Order: ${structure.elements.length}`,
      `Closure: ${analysis.closure.detail}`,
      `Associativity: ${analysis.associativity.detail}`,
      `Identity: ${analysis.identity.detail}`,
      `Inverses: ${analysis.inverses.detail}`,
      `Commutativity: ${analysis.commutativity.detail}`,
      `Verdict: ${analysis.isGroup.detail}`,
      '',
      'CSV Table:',
      tableCSV,
    ].join('\n');
  }, [structure, analysis, tableCSV]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Cayley Table Generator"
        description="Generate complete binary operation tables for cyclic groups, modular multiplication, multiplicative units, direct products, dihedral groups, and symmetric groups."
        formulaTex="T_{i,j} = g_i \star g_j"
      />

      {/* Controls */}
      <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 sm:p-6 space-y-5 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-5 space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-[#94A3B8]">
              Group / Operation Type
            </label>
            <select
              value={family}
              onChange={(e) => setFamily(e.target.value as OperationFamily)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-[#334155] bg-white dark:bg-[#0B1120] text-slate-900 dark:text-[#F8FAFC] text-sm focus:outline-none focus:ring-2 focus:ring-[#22D3EE]"
            >
              <option value="zn_add">Cyclic Group Addition (Z_n, +)</option>
              <option value="zn_mul">Modular Multiplication (Z_n, ×)</option>
              <option value="units_mul">Multiplicative Units Group (U(n), ×)</option>
              <option value="direct_product">Direct Product (Z_n₁ × Z_n₂, +)</option>
              <option value="dihedral">Dihedral Group (D_n, ∘)</option>
              <option value="symmetric">Symmetric Group (S_n, ∘)</option>
            </select>
          </div>

          <div className="md:col-span-4 space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-[#94A3B8]">
              {family === 'direct_product'
                ? 'Moduli (comma-separated, |G| ≤ 36)'
                : family === 'dihedral'
                  ? 'Polygon Sides n (3 ≤ n ≤ 10)'
                  : family === 'symmetric'
                    ? 'Degree n (1 ≤ n ≤ 4)'
                    : 'Modulus n (1 ≤ n ≤ 24)'}
            </label>
            <input
              type="text"
              value={family === 'direct_product' ? productInput : paramN}
              onChange={(e) =>
                family === 'direct_product'
                  ? setProductInput(e.target.value)
                  : setParamN(e.target.value)
              }
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-[#334155] bg-white dark:bg-[#0B1120] text-slate-900 dark:text-[#F8FAFC] font-mono-math text-sm focus:outline-none focus:ring-2 focus:ring-[#22D3EE]"
            />
          </div>

          <div className="md:col-span-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleGenerate()}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#8B5CF6] hover:to-[#7C3AED] text-[#F8FAFC] text-sm font-medium transition-all shadow-[0_6px_16px_-6px_rgba(124,58,237,0.65)] whitespace-nowrap"
            >
              Generate Table
            </button>
            <button
              type="button"
              onClick={handleReset}
              aria-label="Reset Cayley table"
              className="p-2.5 rounded-lg border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/70 text-slate-700 dark:text-[#F8FAFC] hover:border-[#7C3AED] dark:hover:border-[#22D3EE]/70 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick examples */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-slate-500 dark:text-[#94A3B8]">Examples:</span>
          <button
            type="button"
            onClick={() => {
              setFamily('direct_product');
              setProductInput('2, 2');
              handleGenerate('direct_product', '2, 2');
            }}
            className="px-2.5 py-1 text-xs font-mono-math rounded-md border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/70 hover:border-[#7C3AED] dark:hover:border-[#22D3EE] text-slate-700 dark:text-[#F8FAFC] transition-colors"
          >
            Z₂ × Z₂
          </button>
          <button
            type="button"
            onClick={() => {
              setFamily('zn_mul');
              setParamN('4');
              handleGenerate('zn_mul', '4');
            }}
            className="px-2.5 py-1 text-xs font-mono-math rounded-md border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/70 hover:border-[#7C3AED] dark:hover:border-[#22D3EE] text-slate-700 dark:text-[#F8FAFC] transition-colors"
          >
            (Z₄, ×) non-group
          </button>
          <button
            type="button"
            onClick={() => {
              setFamily('units_mul');
              setParamN('8');
              handleGenerate('units_mul', '8');
            }}
            className="px-2.5 py-1 text-xs font-mono-math rounded-md border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/70 hover:border-[#7C3AED] dark:hover:border-[#22D3EE] text-slate-700 dark:text-[#F8FAFC] transition-colors"
          >
            (U(8), ×)
          </button>
          <button
            type="button"
            onClick={() => {
              setFamily('dihedral');
              setParamN('3');
              handleGenerate('dihedral', '3');
            }}
            className="px-2.5 py-1 text-xs font-mono-math rounded-md border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/70 hover:border-[#7C3AED] dark:hover:border-[#22D3EE] text-slate-700 dark:text-[#F8FAFC] transition-colors"
          >
            D₃
          </button>
          <button
            type="button"
            onClick={() => {
              setFamily('symmetric');
              setParamN('3');
              handleGenerate('symmetric', '3');
            }}
            className="px-2.5 py-1 text-xs font-mono-math rounded-md border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/70 hover:border-[#7C3AED] dark:hover:border-[#22D3EE] text-slate-700 dark:text-[#F8FAFC] transition-colors"
          >
            S₃
          </button>
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-red-300 dark:border-[#EF4444]/60 bg-red-50 dark:bg-[#EF4444]/15 px-4 py-3 text-sm text-red-700 dark:text-[#FCA5A5]">
            {error}
          </div>
        )}
      </div>

      {/* Axiom Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
          <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Closure</div>
          <div className="mt-1.5">
            <StatusIndicator status={analysis.closure.status} />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
          <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Associativity</div>
          <div className="mt-1.5">
            <StatusIndicator status={analysis.associativity.status} />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
          <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Identity</div>
          <div className="mt-1.5">
            <StatusIndicator
              status={analysis.identity.status}
              label={
                idIdx !== null ? `e = ${structure.elements[idIdx]}` : 'None'
              }
            />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
          <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Commutativity</div>
          <div className="mt-1.5">
            <StatusIndicator status={analysis.commutativity.status} />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
          <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Valid Group?</div>
          <div className="mt-1.5">
            <StatusIndicator
              status={analysis.isGroup.status}
              label={analysis.isGroup.status === 'satisfied' ? 'Yes (Group)' : 'Not a group'}
            />
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 space-y-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-[#F8FAFC]">
              Cayley Table: {structure.name}
            </h2>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              {structure.description} · Highlighted purple row/column indicates identity element.
            </p>
          </div>

          <ExportBar
            reportTitle={`Cayley Table: ${structure.name}`}
            reportFilename={`cayley_${structure.name.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}.md`}
            reportContent={tableReport}
            csvFilename={`cayley_${structure.name.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}.csv`}
            csvContent={tableCSV}
          />
        </div>

        {hoveredCell !== null && (
          <div className="text-xs font-mono-math px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#334155] text-slate-700 dark:text-[#94A3B8]">
            Selected cell: ({structure.elements[hoveredCell.r]}) {structure.operationSymbol} ({structure.elements[hoveredCell.c]}) ={' '}
            <span className="font-semibold text-[#7C3AED] dark:text-[#22D3EE]">
              {structure.elements[structure.table[hoveredCell.r][hoveredCell.c]] ?? '?'}
            </span>
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-[#334155]">
          <table className="border-collapse text-xs font-mono-math w-max min-w-full">
            <thead>
              <tr>
                <th className="p-2.5 border border-slate-200 dark:border-[#334155] bg-slate-100 dark:bg-[#0B1120] text-slate-700 dark:text-[#22D3EE] font-semibold text-center">
                  {structure.operationSymbol}
                </th>
                {structure.elements.map((el, j) => (
                  <th
                    key={j}
                    className={`p-2.5 border border-slate-200 dark:border-[#334155] font-semibold text-center whitespace-nowrap ${
                      j === idIdx
                        ? 'bg-purple-50 dark:bg-[#7C3AED]/25 text-[#7C3AED] dark:text-[#22D3EE]'
                        : 'bg-slate-50 dark:bg-[#0B1120] text-slate-700 dark:text-[#F8FAFC]'
                    }`}
                  >
                    {el}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {structure.elements.map((rowEl, i) => {
                const isIdRow = i === idIdx;
                return (
                  <tr key={i}>
                    <th
                      className={`p-2.5 border border-slate-200 dark:border-[#334155] font-semibold text-center whitespace-nowrap ${
                        isIdRow
                          ? 'bg-purple-50 dark:bg-[#7C3AED]/25 text-[#7C3AED] dark:text-[#22D3EE]'
                          : 'bg-slate-50 dark:bg-[#0B1120] text-slate-700 dark:text-[#F8FAFC]'
                      }`}
                    >
                      {rowEl}
                    </th>
                    {structure.table[i].map((valIdx, j) => {
                      const isIdCol = j === idIdx;
                      const isIdCell = valIdx === idIdx && idIdx !== null;
                      const isHovered = hoveredCell?.r === i || hoveredCell?.c === j;
                      return (
                        <td
                          key={j}
                          onMouseEnter={() => setHoveredCell({ r: i, c: j })}
                          onMouseLeave={() => setHoveredCell(null)}
                          className={`p-2.5 border border-slate-200 dark:border-[#334155] text-center whitespace-nowrap transition-colors ${
                            isIdCell
                              ? 'bg-emerald-50/80 dark:bg-[#10B981]/18 text-emerald-700 dark:text-[#10B981] font-semibold'
                              : isIdRow || isIdCol
                                ? 'bg-purple-50/50 dark:bg-[#7C3AED]/12 text-[#7C3AED] dark:text-[#C4B5FD]'
                                : isHovered
                                  ? 'bg-cyan-50/70 dark:bg-[#22D3EE]/15 text-slate-900 dark:text-[#F8FAFC]'
                                  : 'text-slate-800 dark:text-[#F8FAFC]'
                          }`}
                        >
                          {structure.elements[valIdx] ?? '?'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Inverses summary */}
        <div className="pt-3 border-t border-slate-100 dark:border-[#334155]">
          <div className="text-xs font-medium text-slate-500 dark:text-[#94A3B8] mb-2">
            Element Inverses ({analysis.inverses.detail})
          </div>
          <div className="flex flex-wrap gap-2">
            {structure.elements.map((el, i) => {
              const invI = analysis.inverses.inverseIndices[i];
              return (
                <div
                  key={i}
                  className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-[#0B1120] text-xs font-mono-math text-slate-700 dark:text-[#F8FAFC]"
                >
                  ({el})⁻¹ = {invI !== null ? structure.elements[invI] : 'none'}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <StepSolutionCard
        heading="Structural Interpretation & Axiom Derivation"
        steps={solutionSteps}
        conclusionText={analysis.isGroup.detail}
      />
    </div>
  );
};
