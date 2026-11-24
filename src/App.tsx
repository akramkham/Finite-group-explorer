import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  Binary,
  BookOpen,
  Calculator,
  Compass,
  Grid3X3,
  Hash,
  Info,
  KeyRound,
  Layers,
  LayoutDashboard,
  Menu,
  Moon,
  Pentagon,
  Presentation,
  Scale,
  ShieldCheck,
  Shuffle,
  Sun,
  X,
} from 'lucide-react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { AboutSection } from './components/sections/AboutSection';
import { AbelianExplorerSection } from './components/sections/AbelianExplorerSection';
import { CayleyTableSection } from './components/sections/CayleyTableSection';
import { ClassificationSection } from './components/sections/ClassificationSection';
import { DashboardSection } from './components/sections/DashboardSection';
import { DihedralExplorerSection } from './components/sections/DihedralExplorerSection';
import { ElementOrderSection } from './components/sections/ElementOrderSection';
import { EulerPhiSection } from './components/sections/EulerPhiSection';
import { GeneratorSection } from './components/sections/GeneratorSection';
import { GuidedExamplesSection } from './components/sections/GuidedExamplesSection';
import { ParityAnalyzerSection } from './components/sections/ParityAnalyzerSection';
import { PermutationExplorerSection } from './components/sections/PermutationExplorerSection';
import { PropertiesAnalyzerSection } from './components/sections/PropertiesAnalyzerSection';
import { VisualizationsSection } from './components/sections/VisualizationsSection';
import { classifyAbelianGroups, computeAbelianElementOrder } from './math/abelianGroups';
import { symmetricGroupParitySummary } from './math/permutations';
import {
  ModulePresetPayload,
  NAV_ITEMS,
  NavItem,
  RecentCalculation,
  SectionId,
} from './types/navigation';

const SECTION_ICONS: Record<SectionId, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  abelian: Layers,
  classification: Binary,
  cayley: Grid3X3,
  'element-order': Calculator,
  generators: KeyRound,
  permutations: Shuffle,
  parity: Scale,
  dihedral: Pentagon,
  'euler-phi': Hash,
  properties: ShieldCheck,
  visualizations: BarChart3,
  'guided-examples': BookOpen,
  about: Info,
};

const NAV_GROUPS: NavItem['group'][] = [
  'Overview',
  'Abelian & Number Theory',
  'Symmetry & Permutations',
  'Analysis & Learning',
];

export default function App() {
  const [activeSection, setActiveSection] = useState<SectionId>('dashboard');
  const [presetPayload, setPresetPayload] = useState<ModulePresetPayload | null>(null);
  const [demoReturnActive, setDemoReturnActive] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('fge_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore
    }
    return 'dark';
  });

  const [recentCalculations, setRecentCalculations] = useState<RecentCalculation[]>(() => {
    const c1 = computeAbelianElementOrder([1, 2], [4, 6]);
    const c2 = classifyAbelianGroups(72);
    const c3 = symmetricGroupParitySummary(5);
    return [
      {
        id: 'init-1',
        section: 'element-order',
        moduleName: 'Element Order Calculator',
        inputSummary: '(1, 2) in Z_4 × Z_6',
        resultSummary: `O((1, 2)) = lcm(4, 3) = ${c1.order}`,
        timestamp: 'Verified',
      },
      {
        id: 'init-2',
        section: 'classification',
        moduleName: 'Group Classification',
        inputSummary: 'Abelian groups of order 72',
        resultSummary: `${c2.totalClasses} isomorphism classes (${c2.primeFactorizationText})`,
        timestamp: 'Verified',
      },
      {
        id: 'init-3',
        section: 'parity',
        moduleName: 'Even & Odd Analyzer',
        inputSummary: 'Alternating group A_5 ⊂ S_5',
        resultSummary: `${c3.evenCount} even permutations, ${c3.oddCount} odd`,
        timestamp: 'Verified',
      },
    ];
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('fge_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const recordCalculation = useCallback(
    (section: SectionId) => (moduleName: string, inputSummary: string, resultSummary: string) => {
      const now = new Date();
      const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setRecentCalculations((prev) => [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          section,
          moduleName,
          inputSummary,
          resultSummary,
          timestamp,
        },
        ...prev.slice(0, 14),
      ]);
    },
    []
  );

  const navigateTo = useCallback(
    (id: SectionId, preset?: Omit<ModulePresetPayload, 'nonce'>, fromDemo = false) => {
      if (preset) {
        setPresetPayload({ ...preset, nonce: Date.now() + Math.random() });
      }
      setDemoReturnActive(fromDemo && id !== 'guided-examples');
      setActiveSection(id);
      setMobileMenuOpen(false);
      if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    []
  );

  const currentNavItem = NAV_ITEMS.find((item) => item.id === activeSection) ?? NAV_ITEMS[0];

  const renderSection = () => {
    const nonce = presetPayload?.nonce ?? 0;
    switch (activeSection) {
      case 'dashboard':
        return <DashboardSection onNavigate={navigateTo} recentCalculations={recentCalculations} />;
      case 'abelian':
        return (
          <AbelianExplorerSection
            onRecordCalculation={recordCalculation('abelian')}
            preset={presetPayload?.abelian ? { ...presetPayload.abelian, nonce } : undefined}
          />
        );
      case 'classification':
        return (
          <ClassificationSection
            onRecordCalculation={recordCalculation('classification')}
            preset={presetPayload?.classification ? { ...presetPayload.classification, nonce } : undefined}
          />
        );
      case 'cayley':
        return (
          <CayleyTableSection
            onRecordCalculation={recordCalculation('cayley')}
            preset={presetPayload?.cayley ? { ...presetPayload.cayley, nonce } : undefined}
          />
        );
      case 'element-order':
        return (
          <ElementOrderSection
            onRecordCalculation={recordCalculation('element-order')}
            preset={presetPayload?.elementOrder ? { ...presetPayload.elementOrder, nonce } : undefined}
          />
        );
      case 'generators':
        return (
          <GeneratorSection
            onRecordCalculation={recordCalculation('generators')}
            preset={presetPayload?.generators ? { ...presetPayload.generators, nonce } : undefined}
          />
        );
      case 'permutations':
        return (
          <PermutationExplorerSection
            onRecordCalculation={recordCalculation('permutations')}
            preset={presetPayload?.permutations ? { ...presetPayload.permutations, nonce } : undefined}
          />
        );
      case 'parity':
        return (
          <ParityAnalyzerSection
            onRecordCalculation={recordCalculation('parity')}
            preset={presetPayload?.parity ? { ...presetPayload.parity, nonce } : undefined}
          />
        );
      case 'dihedral':
        return (
          <DihedralExplorerSection
            onRecordCalculation={recordCalculation('dihedral')}
            preset={presetPayload?.dihedral ? { ...presetPayload.dihedral, nonce } : undefined}
          />
        );
      case 'euler-phi':
        return (
          <EulerPhiSection
            onRecordCalculation={recordCalculation('euler-phi')}
            preset={presetPayload?.eulerPhi ? { ...presetPayload.eulerPhi, nonce } : undefined}
          />
        );
      case 'properties':
        return (
          <PropertiesAnalyzerSection
            onRecordCalculation={recordCalculation('properties')}
            preset={presetPayload?.properties ? { ...presetPayload.properties, nonce } : undefined}
          />
        );
      case 'visualizations':
        return <VisualizationsSection />;
      case 'guided-examples':
        return (
          <GuidedExamplesSection
            onNavigate={navigateTo}
            preset={presetPayload?.guidedTab ? { guidedTab: presetPayload.guidedTab, nonce } : undefined}
          />
        );
      case 'about':
        return <AboutSection />;
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-200 dark:border-[#334155] shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#22D3EE] text-[#F8FAFC] flex items-center justify-center shrink-0 shadow-[0_0_18px_-4px_rgba(124,58,237,0.65)]">
          <Compass className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold tracking-tight text-slate-900 dark:text-[#F8FAFC] truncate">
            Finite Group Explorer
          </div>
          <div className="text-[11px] text-slate-500 dark:text-[#94A3B8] truncate">
            Abstract Algebra Workbench
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5" aria-label="Main Navigation">
        {NAV_GROUPS.map((group) => {
          const items = NAV_ITEMS.filter((i) => i.group === group);
          return (
            <div key={group} className="space-y-1">
              <div className="px-3 text-[11px] font-semibold text-slate-400 dark:text-[#94A3B8]/80">
                {group}
              </div>
              {items.map((item) => {
                const Icon = SECTION_ICONS[item.id];
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigateTo(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-[13px] font-medium transition-all duration-150 text-left ${
                      isActive
                        ? 'bg-purple-50 text-[#7C3AED] border border-purple-200 dark:bg-gradient-to-r dark:from-[#7C3AED]/25 dark:via-[#7C3AED]/10 dark:to-[#22D3EE]/10 dark:text-[#F8FAFC] dark:border-[#7C3AED]/50 shadow-[0_4px_14px_-6px_rgba(124,58,237,0.45)]'
                        : 'border border-transparent text-slate-600 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#172554]/60 hover:text-slate-900 dark:hover:text-[#F8FAFC]'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-[#7C3AED] dark:text-[#22D3EE]' : 'text-slate-400 dark:text-[#94A3B8]'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-[#334155] text-xs text-slate-500 dark:text-[#94A3B8]">
        <button
          type="button"
          onClick={() => navigateTo('about')}
          className="w-full text-left hover:text-[#7C3AED] dark:hover:text-[#22D3EE] transition-colors"
        >
          14 Modules · Client-Side Verified
        </button>
      </div>
    </div>
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-[#F8FAFC]">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-slate-200 dark:border-[#334155] bg-white dark:bg-[#111827] sticky top-0 h-screen">
          <SidebarContent />
        </aside>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-[#0B1120]/75 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="relative w-72 max-w-[85vw] bg-white dark:bg-[#111827] h-full border-r border-slate-200 dark:border-[#334155] z-10">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="absolute top-4 right-3 p-2 rounded-lg text-slate-500 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#172554]"
              >
                <X className="w-5 h-5" />
              </button>
              <SidebarContent />
            </div>
          </div>
        )}

        {/* Main Content Column */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Top Bar */}
          <header className="sticky top-0 z-30 h-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-[#334155] bg-white/90 dark:bg-[#111827]/95 backdrop-blur-md flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open navigation menu"
                className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 dark:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#172554]"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 text-sm min-w-0">
                <span className="hidden sm:inline text-slate-400 dark:text-[#94A3B8] whitespace-nowrap">
                  Finite Group Explorer
                </span>
                <span className="hidden sm:inline text-slate-300 dark:text-[#334155]">/</span>
                <span className="font-semibold text-slate-900 dark:text-[#F8FAFC] truncate">
                  {currentNavItem.label}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => navigateTo('guided-examples', { guidedTab: 'quiz' })}
                className="hidden md:inline-flex px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/60 text-xs font-medium text-slate-700 dark:text-[#F8FAFC] hover:border-[#7C3AED] dark:hover:border-[#22D3EE]/60 transition-colors whitespace-nowrap"
              >
                Learning Mode
              </button>
              <button
                type="button"
                onClick={() => navigateTo('guided-examples', { guidedTab: 'demo' })}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/60 text-xs font-medium text-slate-700 dark:text-[#F8FAFC] hover:border-[#7C3AED] dark:hover:border-[#7C3AED] transition-colors whitespace-nowrap"
              >
                <Presentation className="w-3.5 h-3.5 text-[#7C3AED] dark:text-[#22D3EE]" />
                <span>Teacher Demo</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                className="p-2 rounded-lg border border-slate-200 dark:border-[#334155] dark:bg-[#0B1120]/60 text-slate-700 dark:text-[#F8FAFC] hover:border-[#7C3AED] dark:hover:border-[#22D3EE]/60 transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-[#22D3EE]" /> : <Moon className="w-4 h-4 text-[#7C3AED]" />}
              </button>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl w-full mx-auto">
            {demoReturnActive && (
              <div className="mb-5 rounded-xl border border-purple-200 dark:border-[#7C3AED]/50 bg-purple-50/70 dark:bg-gradient-to-r dark:from-[#7C3AED]/20 dark:via-[#172554] dark:to-[#22D3EE]/15 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-purple-950 dark:text-[#F8FAFC] font-medium">
                  Teacher Demonstration Mode active — this calculator has been pre-loaded with the live slide example.
                </span>
                <button
                  type="button"
                  onClick={() => navigateTo('guided-examples', { guidedTab: 'demo' })}
                  className="inline-flex items-center gap-1 font-semibold text-[#7C3AED] dark:text-[#22D3EE] hover:underline whitespace-nowrap"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Teacher Demo</span>
                </button>
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
              >
                {renderSection()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </MotionConfig>
  );
}
