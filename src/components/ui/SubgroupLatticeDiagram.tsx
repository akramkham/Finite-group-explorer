import React, { useEffect, useMemo, useState } from 'react';
import { buildCyclicSubgroupLattice, SubgroupLatticeNode } from '../../math/abelianGroups';
import { MathTex } from './MathTex';

interface SubgroupLatticeDiagramProps {
  n: number;
}

export const SubgroupLatticeDiagram: React.FC<SubgroupLatticeDiagramProps> = ({ n }) => {
  const safeN = Math.max(1, Math.min(120, Math.trunc(n)));
  const lattice = useMemo(() => buildCyclicSubgroupLattice(safeN), [safeN]);
  const [selectedOrder, setSelectedOrder] = useState<number>(safeN);

  useEffect(() => {
    setSelectedOrder(safeN);
  }, [safeN]);

  const selectedNode: SubgroupLatticeNode = useMemo(() => {
    return lattice.nodes.find((nd) => nd.divisor === selectedOrder) ?? lattice.nodes[lattice.nodes.length - 1];
  }, [lattice, selectedOrder]);

  const nodeMap = useMemo(() => {
    const m = new Map<number, SubgroupLatticeNode>();
    lattice.nodes.forEach((nd) => m.set(nd.divisor, nd));
    return m;
  }, [lattice]);

  const highlightedEdges = useMemo(() => {
    return new Set(
      lattice.edges
        .filter((e) => e.fromOrder === selectedNode.divisor || e.toOrder === selectedNode.divisor)
        .map((e) => `${e.fromOrder}-${e.toOrder}`)
    );
  }, [lattice.edges, selectedNode]);

  const selectedLatex =
    selectedNode.divisor === 1
      ? '\\{0\\}'
      : selectedNode.divisor === safeN
        ? `\\mathbb{Z}_{${safeN}} = \\langle 1 \\rangle`
        : `\\langle ${selectedNode.generatorInZn} \\rangle`;

  const indexVal = safeN / selectedNode.order;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      <div className="lg:col-span-8 rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-4 sm:p-5 flex flex-col space-y-3 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">
              Subgroup Lattice (Hasse Diagram) of <MathTex tex={`\\mathbb{Z}_{${safeN}}`} />
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              {lattice.nodes.length} subgroup{lattice.nodes.length === 1 ? '' : 's'} · Click any node to inspect its elements, index, and quotient
            </p>
          </div>
          <div className="flex items-center">
            <span className="text-xs font-mono-math text-slate-500 dark:text-[#94A3B8] whitespace-nowrap">
              |Sub(Z_{safeN})| = d({safeN}) = {lattice.nodes.length}
            </span>
          </div>
        </div>

        {/* Color Legend */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 dark:text-[#94A3B8]">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED] ring-2 ring-[#22D3EE]/60 inline-block" />
            <span>Selected H</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] inline-block" />
            <span>Subgroups contained in H</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#22D3EE] inline-block" />
            <span>Supergroups containing H</span>
          </span>
        </div>

        <div className="relative w-full overflow-x-auto rounded-lg bg-slate-50/70 dark:bg-[#0B1120]/70 border border-slate-200/70 dark:border-[#334155] p-2">
          <svg
            viewBox="0 0 600 360"
            className="w-full h-72 sm:h-80 select-none"
            role="img"
            aria-label={`Subgroup lattice Hasse diagram for cyclic group Z_${safeN}`}
          >
            {/* Covering edges */}
            {lattice.edges.map((edge) => {
              const from = nodeMap.get(edge.fromOrder);
              const to = nodeMap.get(edge.toOrder);
              if (!from || !to) return null;
              const isHighlighted = highlightedEdges.has(`${edge.fromOrder}-${edge.toOrder}`);
              return (
                <line
                  key={`${edge.fromOrder}-${edge.toOrder}`}
                  x1={(from.x / 100) * 560 + 20}
                  y1={(from.y / 100) * 300 + 30}
                  x2={(to.x / 100) * 560 + 20}
                  y2={(to.y / 100) * 300 + 30}
                  stroke={isHighlighted ? '#22D3EE' : '#475569'}
                  strokeOpacity={isHighlighted ? 0.95 : 0.4}
                  strokeWidth={isHighlighted ? 2.5 : 1.5}
                />
              );
            })}

            {/* Subgroup nodes */}
            {lattice.nodes.map((node) => {
              const cx = (node.x / 100) * 560 + 20;
              const cy = (node.y / 100) * 300 + 30;
              const isSelected = node.divisor === selectedNode.divisor;
              const isSub = selectedNode.divisor % node.divisor === 0 && node.divisor !== selectedNode.divisor;
              const isSuper = node.divisor % selectedNode.divisor === 0 && node.divisor !== selectedNode.divisor;

              return (
                <g
                  key={node.divisor}
                  transform={`translate(${cx}, ${cy})`}
                  onClick={() => setSelectedOrder(node.divisor)}
                  className="cursor-pointer group"
                >
                  <circle
                    r={isSelected ? 21 : 17}
                    className={
                      isSelected
                        ? 'fill-[#7C3AED] stroke-[#22D3EE]'
                        : isSub
                          ? 'fill-emerald-50 dark:fill-[#10B981]/20 stroke-[#10B981]'
                          : isSuper
                            ? 'fill-cyan-50 dark:fill-[#22D3EE]/20 stroke-[#22D3EE]'
                            : 'fill-slate-50 dark:fill-[#172554] stroke-slate-300 dark:stroke-[#334155] group-hover:stroke-[#7C3AED]'
                    }
                    strokeWidth={isSelected ? 2.6 : 1.6}
                  />
                  <text
                    textAnchor="middle"
                    dy="0.35em"
                    className={`text-[11px] font-mono-math font-medium ${
                      isSelected
                        ? 'fill-[#F8FAFC]'
                        : 'fill-slate-800 dark:fill-[#F8FAFC]'
                    }`}
                  >
                    {node.divisor === 1 ? '{0}' : `⟨${node.generatorInZn}⟩`}
                  </text>
                  <text
                    y={28}
                    textAnchor="middle"
                    className="text-[10px] font-mono-math fill-slate-500 dark:fill-[#94A3B8]"
                  >
                    |{node.divisor}|
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <div className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#172554] p-5 flex flex-col justify-between space-y-4 transition-all duration-200 hover:border-purple-300 dark:hover:border-[#7C3AED]/60">
        <div className="space-y-3">
          <div className="text-xs font-medium text-slate-500 dark:text-[#94A3B8]">
            Selected Subgroup Inspector
          </div>
          <div className="text-lg font-semibold text-slate-900 dark:text-[#F8FAFC] overflow-x-auto">
            <MathTex tex={`H = ${selectedLatex}`} />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-[#334155] text-sm">
            <div>
              <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Subgroup Order</div>
              <div className="font-mono-math font-semibold text-slate-900 dark:text-[#F8FAFC]">
                |H| = {selectedNode.order}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-[#94A3B8]">
                Index <MathTex tex={`[\\mathbb{Z}_{${safeN}} : H]`} />
              </div>
              <div className="font-mono-math font-semibold text-slate-900 dark:text-[#F8FAFC]">
                {indexVal}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Generator</div>
              <div className="font-mono-math font-semibold text-[#7C3AED] dark:text-[#22D3EE]">
                {selectedNode.generatorInZn} (mod {safeN})
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Quotient Group</div>
              <div className="font-semibold text-slate-900 dark:text-[#F8FAFC]">
                <MathTex tex={`\\mathbb{Z}_{${safeN}}/H \\cong \\mathbb{Z}_{${indexVal}}`} />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-[#334155]">
            <div className="text-xs text-slate-500 dark:text-[#94A3B8] mb-1.5">
              Elements ({selectedNode.elements.length})
            </div>
            <div className="font-mono-math text-xs text-slate-800 dark:text-[#F8FAFC] bg-slate-50 dark:bg-[#0B1120] rounded-lg p-3 border border-slate-200 dark:border-[#334155] max-h-28 overflow-y-auto leading-relaxed">
              {selectedNode.elements.length > 0
                ? `{ ${selectedNode.elements.join(', ')} }`
                : `Generated by multiples of ${selectedNode.generatorInZn} mod ${safeN}`}
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 dark:text-[#94A3B8] leading-relaxed">
          By the Fundamental Theorem of Cyclic Groups, <MathTex tex={`\\mathbb{Z}_{${safeN}}`} /> has a unique subgroup of order <MathTex tex="d" /> for every divisor <MathTex tex={`d \\mid ${safeN}`} />, generated by <MathTex tex={`${safeN}/d`} />.
        </div>
      </div>
    </div>
  );
};
