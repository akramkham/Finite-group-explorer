import React, { useEffect, useMemo, useState } from 'react';
import { RotateCcw, ShieldCheck } from 'lucide-react';
import {
  AlgebraicStructure,
  analyzeAlgebraicStructure,
  buildCyclicAdditionStructure,
  buildCyclicMultiplicationStructure,
  buildCyclicSubtractionStructure,
  buildDihedralStructure,
  buildDirectProductStructure,
  buildUnitsGroupStructure,
  cayleyTableToCSV,
} from '../../math/cayleyAndProperties';
import { ModulePresetPayload } from '../../types/navigation';
import { ExportBar } from '../ui/ExportBar';
import { SectionHeader, StatusIndicator } from '../ui/SectionHeader';
import { SolutionStep, StepSolutionCard } from '../ui/StepSolutionCard';

interface PropertiesAnalyzerSectionProps {
  onRecordCalculation: (moduleName: string, inputSummary: string, resultSummary: string) => void;
  preset?: ModulePresetPayload['properties'] & { nonce: number };
}

type PresetId = 'z4_add' | 'z4_mul' | 'u8_mul' | 'v4' | 'd3' | 'z5_sub' | 'custom3';

export const PropertiesAnalyzerSection: React.FC<PropertiesAnalyzerSectionProps> = ({
  onRecordCalculation,
  preset: externalPreset,
}) => {
  const [preset, setPreset] = useState<PresetId>('z4_mul');
  const [customElements, setCustomElements] = useState(['a', 'b', 'c']);
  const [customTable, setCustomTable] = useState<number[][]>([
    [0, 1, 2],
    [1, 2, 0],
    [2, 0, 1],
  ]);

  useEffect(() => {
    if (!externalPreset) return;
    setPreset(externalPreset.preset);
  }, [externalPreset]);

  const structure: AlgebraicStructure = useMemo(() => {
    switch (preset) {
      case 'z4_add':
        return buildCyclicAdditionStructure(4);
      case 'z4_mul':
        return buildCyclicMultiplicationStructure(4);
      case 'u8_mul':
        return buildUnitsGroupStructure(8);
      case 'v4':
        return buildDirectProductStructure([2, 2]);
      case 'd3':
        return buildDihedralStructure(3);
      case 'z5_sub':
        return buildCyclicSubtractionStructure(5);
      case 'custom3':
        return {
          name: 'Custom 3×3 Table',
          operationSymbol: '*',
          elements: customElements,
          table: customTable,
          description: 'User-editable binary operation table on {a, b, c}.',
        };
    }
  }, [preset, customElements, customTable]);

  const analysis = useMemo(() => analyzeAlgebraicStructure(structure), [structure]);

  const handleSelectPreset = (id: PresetId) => {
    setPreset(id);
    const next =
      id === 'z4_add'
        ? buildCyclicAdditionStructure(4)
        : id === 'z4_mul'
          ? buildCyclicMultiplicationStructure(4)
          : id === 'u8_mul'
            ? buildUnitsGroupStructure(8)
            : id === 'v4'
              ? buildDirectProductStructure([2, 2])
              : id === 'd3'
                ? buildDihedralStructure(3)
                : id === 'z5_sub'
                  ? buildCyclicSubtractionStructure(5)
                  : {
                      name: 'Custom 3×3 Table',
                      operationSymbol: '*',
                      elements: customElements,
                      table: customTable,
                      description: 'User-editable binary operation table on {a, b, c}.',
                    };
    const res = analyzeAlgebraicStructure(next);
    onRecordCalculation(
      'Group Properties Analyzer',
      next.name,
      `Group: ${res.isGroup.status} · Abelian: ${res.isAbelian.status}`
    );
  };

  const cycleCustomCell = (r: number, c: number) => {
    setCustomTable((prev) => {
      const copy = prev.map((row) => [...row]);
      const curr = copy[r][c];
      copy[r][c] = curr === 2 ? -1 : curr + 1;
      return copy;
    });
  };

  const propertyRows = [
    analysis.closure,
    analysis.associativity,
    analysis.identity,
    analysis.inverses,
    analysis.commutativity,
    analysis.isGroup,
    analysis.isAbelian,
    analysis.isCyclic,
  ];

  const solutionSteps: SolutionStep[] = useMemo(() => {
    return [
      {
        title: '1. Closure & Associativity Verification',
        explanation: `${analysis.closure.detail} ${analysis.associativity.detail}`,
        formulaTex: '\\forall a,b,c \\in S:\\quad a \\star b \\in S,\\quad (a \\star b) \\star c = a \\star (b \\star c)',
      },
      {
        title: '2. Two-Sided Identity & Inverses',
        explanation: `${analysis.identity.detail} ${analysis.inverses.detail}`,
        formulaTex: '\\exists e \\in S,\\; \\forall x \\in S:\\; e \\star x = x \\star e = x,\\quad x \\star x^{-1} = e',
      },
      {
        title: '3. Commutativity, Centre & Cyclicity',
        explanation: `${analysis.commutativity.detail} Centre Z(S) = {${analysis.centre.join(', ') || '∅'}}. ${analysis.isCyclic.detail}`,
        formulaTex: `Z(S) = \\{${analysis.centre.join(', ') || '\\varnothing'}\\}`,
      },
    ];
  }, [analysis]);

  const exportReport = useMemo(() => {
    return [
      `Axiom Verification Report: ${structure.name}`,
      ...propertyRows.map((p) => `- ${p.name} [${p.status}]: ${p.detail}`),
      `Centre Z(G): { ${analysis.centre.join(', ') || '∅'} }`,
      `Element Orders: ${analysis.elementOrders.map((e) => `O(${e.element})=${e.order ?? 'N/A'}`).join(', ')}`,
    ].join('\n');
  }, [structure.name, propertyRows, analysis]);

  const exportCSV = useMemo(() => {
    return cayleyTableToCSV(structure);
  }, [structure]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Group Properties Analyzer"
        description="Independently verify Closure, Associativity, Identity, Inverses, Commutativity, Cyclicity, and Group Centre Z(G) without assuming any structure is a group."
        formulaTex="Z(G) = \{z \in G : z * g = g * z \;\;\forall g \in G\}"
      />

      {/* Preset & Custom Selector */}
      <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 space-y-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'z4_add' as PresetId, label: '(Z₄, +) · Group' },
              { id: 'z4_mul' as PresetId, label: '(Z₄, ×) · Monoid (Not Group)' },
              { id: 'z5_sub' as PresetId, label: '(Z₅, -) · Non-Associative' },
              { id: 'u8_mul' as PresetId, label: '(U(8), ×) · Units Group' },
              { id: 'v4' as PresetId, label: '(Z₂ × Z₂, +) · Non-Cyclic' },
              { id: 'd3' as PresetId, label: 'D₃ · Non-Abelian' },
              { id: 'custom3' as PresetId, label: 'Custom Editable Table' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectPreset(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  preset === item.id
                    ? 'bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-[#F8FAFC] shadow-sm shadow-[#7C3AED]/25'
                    : 'border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/60 text-slate-700 dark:text-[#F8FAFC] hover:border-purple-500 dark:hover:border-[#22D3EE]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {preset === 'custom3' && (
            <button
              type="button"
              onClick={() => {
                setCustomElements(['a', 'b', 'c']);
                setCustomTable([
                  [0, 1, 2],
                  [1, 2, 0],
                  [2, 0, 1],
                ]);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/60 text-xs font-medium text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-50 dark:hover:bg-[#0B1120] inline-flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Custom Table</span>
            </button>
          )}
        </div>

        <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
          Analyzing <span className="font-semibold text-slate-800 dark:text-[#22D3EE]">{structure.name}</span> — {structure.description}
        </p>
      </div>

      {/* Main Verdict & Axiom Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 space-y-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-[#334155]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-[#22D3EE]" />
                <h2 className="text-base font-semibold text-slate-900 dark:text-[#F8FAFC]">
                  Axiom Verification Report
                </h2>
              </div>
              <StatusIndicator
                status={analysis.isGroup.status}
                label={
                  analysis.isGroup.status === 'satisfied'
                    ? 'Verified Group'
                    : analysis.isGroup.status === 'not_satisfied'
                      ? 'Not a Group'
                      : 'Unable to Verify'
                }
              />
            </div>

            <div className="divide-y divide-slate-100 dark:divide-[#334155]">
              {propertyRows.map((prop) => (
                <div key={prop.name} className="py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="space-y-0.5 max-w-xl">
                    <div className="text-sm font-medium text-slate-900 dark:text-[#F8FAFC]">
                      {prop.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-[#94A3B8] leading-relaxed">
                      {prop.detail}
                    </div>
                  </div>
                  <div className="shrink-0 pt-0.5">
                    <StatusIndicator status={prop.status} />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-[#334155]">
              <ExportBar
                reportTitle={`Group Axiom Report: ${structure.name}`}
                reportFilename={`axioms_${structure.name.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}.md`}
                reportContent={exportReport}
                csvFilename={`operation_table_${structure.name.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}.csv`}
                csvContent={exportCSV}
              />
            </div>
          </div>

          <StepSolutionCard
            heading="Step-by-Step Axiom Proof & Counterexample Check"
            steps={solutionSteps}
            conclusionText={analysis.isGroup.detail}
          />
        </div>

        {/* Interactive Operation Table + Centre & Orders */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 space-y-3 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-[#F8FAFC]">
                Operation Table
              </h2>
              {preset === 'custom3' && (
                <span className="text-xs text-purple-600 dark:text-[#22D3EE]">
                  Click cells to edit (includes ∅ outside set)
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="border-collapse text-xs font-mono-math w-full">
                <thead>
                  <tr>
                    <th className="p-2 border border-slate-200 dark:border-[#334155] bg-slate-100 dark:bg-[#0B1120] text-slate-700 dark:text-[#94A3B8]">
                      {structure.operationSymbol}
                    </th>
                    {structure.elements.map((el, j) => (
                      <th
                        key={j}
                        className="p-2 border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-[#0B1120] text-slate-700 dark:text-[#F8FAFC]"
                      >
                        {el}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {structure.elements.map((rowEl, i) => (
                    <tr key={i}>
                      <th className="p-2 border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-[#0B1120] text-slate-700 dark:text-[#F8FAFC]">
                        {rowEl}
                      </th>
                      {structure.table[i].map((valIdx, j) => {
                        const outOfBounds = valIdx < 0 || valIdx >= structure.elements.length;
                        return (
                          <td
                            key={j}
                            onClick={() => preset === 'custom3' && cycleCustomCell(i, j)}
                            className={`p-2 border border-slate-200 dark:border-[#334155] text-center transition-colors ${
                              preset === 'custom3' ? 'cursor-pointer hover:bg-purple-50 dark:hover:bg-[#7C3AED]/20' : ''
                            } ${
                              outOfBounds
                                ? 'bg-red-50 dark:bg-[#EF4444]/18 text-red-600 dark:text-[#EF4444] font-semibold'
                                : 'text-slate-800 dark:text-[#F8FAFC]'
                            }`}
                          >
                            {outOfBounds ? '∅' : structure.elements[valIdx]}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 space-y-3 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
            <h2 className="text-base font-semibold text-slate-900 dark:text-[#F8FAFC]">
              Group Centre & Element Orders
            </h2>
            <div className="text-xs text-slate-600 dark:text-[#94A3B8]">
              Centre (commuting elements):{' '}
              <span className="font-mono-math font-semibold text-slate-900 dark:text-[#F8FAFC]">
                {analysis.centre.length > 0 ? `{ ${analysis.centre.join(', ')} }` : '∅'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {analysis.elementOrders.map((eo) => (
                <div
                  key={eo.element}
                  className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-[#0B1120] text-xs font-mono-math"
                >
                  <span className="text-slate-600 dark:text-[#94A3B8]">O({eo.element}) = </span>
                  <span className="font-semibold text-purple-600 dark:text-[#22D3EE]">
                    {eo.order !== null ? eo.order : 'N/A'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
