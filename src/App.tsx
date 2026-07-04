import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  AreaChart, Area, BarChart, Bar, ReferenceLine, ReferenceArea,
  PieChart, Pie, Cell, ReferenceDot
} from 'recharts';
import { 
  Calculator, Info, TrendingUp, ShieldAlert, Wallet, Calendar, 
  ChevronRight, HelpCircle, ArrowRight, DollarSign, 
  Users, Briefcase, GraduationCap, ChevronLeft, MousePointer2,
  History, Layers, Heart, Key, ShieldCheck,
  Plus, Trash2, Zap, ArrowDownToLine, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { SimulationParams, SimulationResult, YearData, OneTimeEvent } from './types';
import { DEFAULT_PARAMS, TAX_BRACKETS, STANDARD_DEDUCTION } from './constants';
import { runSimulation, calculateTax } from './lib/simulation';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

const TooltipPortal = ({ content, targetRect }: { content: string, targetRect: DOMRect }) => {
  return createPortal(
    <div 
      className="fixed z-[9999] px-3 py-2 bg-[#141414] text-white text-[10px] rounded-lg shadow-2xl pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 w-48 text-center leading-tight border border-white/10"
      style={{ 
        left: targetRect.left + targetRect.width / 2, 
        top: targetRect.top - 4
      }}
    >
      {content}
    </div>,
    document.body
  );
};

const AppTooltip = ({ content, children }: { content: string, children: React.ReactNode }) => {
  const [show, setShow] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const handleEnter = () => {
    if (ref.current) {
      setRect(ref.current.getBoundingClientRect());
      setShow(true);
    }
  };

  return (
    <div 
      ref={ref}
      onMouseEnter={handleEnter}
      onMouseLeave={() => setShow(false)}
      className="inline-flex items-center"
    >
      {children}
      {show && rect && <TooltipPortal content={content} targetRect={rect} />}
    </div>
  );
};

const NumericInput = ({ 
  value, 
  onChange, 
  label, 
  tooltip, 
  prefix = "$",
  indicatorColor,
  indicatorStyle = "solid",
  className = "" 
}: { 
  value: number, 
  onChange: (val: number) => void, 
  label?: React.ReactNode, 
  tooltip?: string,
  prefix?: string,
  indicatorColor?: string,
  indicatorStyle?: "solid" | "hollow",
  className?: string
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Synchronize local string with prop only when not focused
  useEffect(() => {
    if (!isFocused) {
      setInputValue(new Intl.NumberFormat('en-US').format(value));
    }
  }, [value, isFocused]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    // Update local string immediately so cursor doesn't jump
    setInputValue(rawValue);

    // Parse numeric value for the parent state
    const numericString = rawValue.replace(/,/g, '');
    const parsed = parseFloat(numericString);
    
    if (!isNaN(parsed)) {
      onChange(parsed);
    } else if (numericString === "" || numericString === "$") {
      onChange(0);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Cleanup formatting on blur
    setInputValue(new Intl.NumberFormat('en-US').format(value));
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  return (
    <div className={className}>
      {label && (
        <div className="flex items-center gap-1.5 mb-1">
          {indicatorColor && (
            <div 
              className={cn(
                "w-2.5 h-2.5 rounded-full shrink-0",
                indicatorStyle === "hollow" ? "bg-transparent border-2 border-dotted" : ""
              )}
              style={{ 
                backgroundColor: indicatorStyle === "solid" ? indicatorColor : undefined,
                borderColor: indicatorColor
              }}
            />
          )}
          <label className="block text-xs font-medium">{label}</label>
          {tooltip && (
            <AppTooltip content={tooltip}>
              <Info className="w-3 h-3 text-[#141414]/30 cursor-help" />
            </AppTooltip>
          )}
        </div>
      )}
      <div className="relative group">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#141414]/30 font-medium pointer-events-none group-focus-within:text-[#141414]">
            {prefix}
          </span>
        )}
        <input 
          type="text" 
          value={inputValue}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleInputChange}
          className={cn(
            "w-full bg-[#F5F5F4] border-none rounded-lg py-2 text-sm focus:ring-2 focus:ring-[#141414] transition-all",
            prefix ? "pl-6 pr-3" : "px-3"
          )}
          placeholder="0"
        />
      </div>
    </div>
  );
};

const MobileDetailSection = ({ data }: { data: YearData | null }) => {
  return (
    <div className="mt-3 pt-3 border-t border-[#141414]/5 min-h-[180px]">
      {data ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#141414]/40">Age {data.age}</span>
              <span className="text-xs font-bold">{data.year}</span>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#141414]/40">Total Assets</span>
              <p className="text-sm font-bold text-[#F27D26]">{formatCurrency(data.totalBalance)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <div className="p-1.5 bg-[#141414]/5 rounded-lg overflow-hidden flex flex-col">
              <div className="flex items-center gap-1 mb-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#141414]" />
                <p className="text-[7px] text-[#141414]/50 uppercase tracking-wider">Trad</p>
              </div>
              <p className="text-[9px] font-bold truncate">{formatCurrency(data.traditionalBalance)}</p>
            </div>
            <div className="p-1.5 bg-[#F27D26]/5 rounded-lg overflow-hidden flex flex-col">
              <div className="flex items-center gap-1 mb-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#F27D26]" />
                <p className="text-[7px] text-[#F27D26]/50 uppercase tracking-wider">Roth</p>
              </div>
              <p className="text-[9px] font-bold text-[#F27D26] truncate">{formatCurrency(data.rothBalance)}</p>
            </div>
            <div className="p-1.5 bg-[#6366F1]/5 rounded-lg overflow-hidden flex flex-col">
              <div className="flex items-center gap-1 mb-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1]" />
                <p className="text-[7px] text-[#6366F1]/50 uppercase tracking-wider">Brok</p>
              </div>
              <p className="text-[9px] font-bold text-[#6366F1] truncate">{formatCurrency(data.brokerageBalance)}</p>
            </div>
            <div className="p-1.5 bg-transparent rounded-lg overflow-hidden border-2 border-dotted border-[#141414]/20 flex flex-col">
              <div className="flex items-center gap-1 mb-0.5">
                <div className="w-1.5 h-1.5 rounded-full border border-dotted border-[#141414]" />
                <p className="text-[7px] text-[#141414]/50 uppercase tracking-wider">Purchasing Power</p>
              </div>
              <p className="text-[9px] font-bold text-[#141414]/60 truncate">$1 = ${data.purchasingPower.toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-2 border-t border-[#141414]/5">
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-[#141414]/50">Income</span>
              <span className="text-[9px] font-bold">{formatCurrency(data.income + data.rmdAmount + data.withdrawnFromTraditional + data.ssIncome + data.qualifiedDividends + data.ordinaryDividends + (data.events?.filter((e: any) => e.type === 'inflow').reduce((acc: number, e: any) => acc + Math.abs(e.amount), 0) || 0))}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-[#141414]/50">Spending</span>
              <span className="text-[9px] font-bold text-[#F27D26]">{formatCurrency(data.spending)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-[#141414]/50">Taxes</span>
                <span className="text-[9px] font-bold text-red-500">{formatCurrency(data.taxPaid)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 ml-2 opacity-60">
                <span className="text-[8px] font-medium text-[#141414]/40">Ord: {formatCurrency(data.ordinaryTaxPaid)}</span>
                {data.capitalGainsTaxPaid > 0 && <span className="text-[8px] font-medium text-[#141414]/40">LTCG: {formatCurrency(data.capitalGainsTaxPaid)}</span>}
                {data.earlyWithdrawalPenalty > 0 && (
                  <span className="text-[8px] font-bold text-red-500/80 flex items-center gap-0.5">
                    <ShieldAlert className="w-2 h-2" />
                    Pen: {formatCurrency(data.earlyWithdrawalPenalty)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-[#141414]/50 font-bold">Net</span>
              <span className={`text-[9px] font-bold ${data.income + data.rmdAmount + data.withdrawnFromTraditional + data.ssIncome + data.qualifiedDividends + data.ordinaryDividends + (data.events?.filter((e: any) => e.type === 'inflow').reduce((acc: number, e: any) => acc + Math.abs(e.amount), 0) || 0) - data.spending - data.taxPaid >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {formatCurrency(data.income + data.rmdAmount + data.withdrawnFromTraditional + data.ssIncome + data.qualifiedDividends + data.ordinaryDividends + (data.events?.filter((e: any) => e.type === 'inflow').reduce((acc: number, e: any) => acc + Math.abs(e.amount), 0) || 0) - data.spending - data.taxPaid)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-[#141414]/40 italic">Eff. Rate</span>
              <span className="text-[9px] font-bold text-[#141414]/60">{data.effectiveRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-[#141414]/40 italic">Marginal</span>
              <span className="text-[9px] font-bold text-[#141414]/60">{data.marginalRate.toFixed(0)}%</span>
            </div>
          </div>

          {data.events && data.events.length > 0 && (
            <div className="pt-2 border-t border-[#141414]/5 space-y-1">
              <p className="text-[8px] font-bold text-[#141414]/40 uppercase tracking-widest mb-1">Yearly Events</p>
              {data.events.map(e => (
                <div key={e.id} className="flex justify-between items-center p-1.5 bg-[#141414]/5 rounded-lg">
                  <div className="flex items-center gap-1">
                    {e.type === 'expense' ? <ArrowDownToLine className="w-2.5 h-2.5 text-red-500" /> : <Zap className="w-2.5 h-2.5 text-green-600" />}
                    <span className="text-[9px] font-bold truncate max-w-[80px]">{e.name}</span>
                  </div>
                  <span className={cn("text-[8px] font-bold", e.amount < 0 ? "text-red-500" : "text-green-600")}>
                    {formatCurrency(Math.abs(e.amount))}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-[#141414]/5 space-y-1">
            {data.traditional401kContribution > 0 && (
              <div className="flex justify-between items-center text-[7px] text-[#141414]/50">
                <span>Trad. 401k Contribution</span>
                <span className="font-bold">{formatCurrency(data.traditional401kContribution)}</span>
              </div>
            )}
            {data.megaRothContribution > 0 && (
              <div className="flex justify-between items-center text-[7px] text-[#F27D26]/70">
                <span>Mega Backdoor Roth</span>
                <span className="font-bold">{formatCurrency(data.megaRothContribution)}</span>
              </div>
            )}
            {(() => {
              const netSavings = data.income + data.rmdAmount + data.withdrawnFromTraditional + data.ssIncome + data.qualifiedDividends + data.ordinaryDividends + (data.events?.filter((e: any) => e.type === 'inflow').reduce((acc: number, e: any) => acc + Math.abs(e.amount), 0) || 0) - data.spending - data.taxPaid;
              const brokerageSurplus = Math.max(0, netSavings - (data.megaRothContribution || 0));
              
              if (netSavings >= 0) {
                return brokerageSurplus > 0 ? (
                  <div className="flex justify-between items-center text-[7px] text-[#6366F1]/70">
                    <span>Brokerage Investment</span>
                    <span className="font-bold">{formatCurrency(brokerageSurplus)}</span>
                  </div>
                ) : null;
              }
              
              return (
                <p className="text-[8px] text-[#141414]/40 italic leading-tight mt-1">
                  Gap funded via: {[
                    data.withdrawnFromBrokerage > 0 ? "Brokerage" : null,
                    data.withdrawnFromTraditional > 0 ? "Traditional" : null,
                    data.withdrawnFromRoth > 0 ? "Roth" : null
                  ].filter(Boolean).join(" → ")}
                </p>
              );
            })()}
            {data.earlyWithdrawalPenalty > 0 && (
              <div className="mt-1 flex items-center gap-1 text-red-500">
                <ShieldAlert className="w-2 h-2" />
                <span className="text-[8px] font-bold uppercase tracking-wider">Penalty: {formatCurrency(data.earlyWithdrawalPenalty)}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center bg-[#141414]/5 rounded-lg border border-dashed border-[#141414]/10">
          <div className="text-center">
            <MousePointer2 className="w-4 h-4 text-[#141414]/20 mx-auto mb-1" />
            <p className="text-[10px] text-[#141414]/40 italic">Tap chart for details</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [params, setParams] = useState<SimulationParams>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const initialParams = { ...DEFAULT_PARAMS, events: [] };
    
    Object.keys(DEFAULT_PARAMS).forEach((key) => {
      const val = urlParams.get(key);
      if (val !== null) {
        if (key === 'events') {
          try {
            initialParams.events = JSON.parse(decodeURIComponent(val));
          } catch (e) {
            initialParams.events = [];
          }
          return;
        }
        const defaultValue = DEFAULT_PARAMS[key as keyof SimulationParams];
        if (typeof defaultValue === 'number') {
          const parsed = parseFloat(val);
          if (!isNaN(parsed)) {
            (initialParams as any)[key] = parsed;
          }
        } else if (typeof defaultValue === 'boolean') {
          (initialParams as any)[key] = val === 'true';
        } else {
          (initialParams as any)[key] = val;
        }
      }
    });
    
    return initialParams as SimulationParams;
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'education' | 'methodology' | 'legacy'>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab === 'dashboard' || tab === 'education' || tab === 'methodology' || tab === 'legacy') return tab as any;
    
    // Default to education on mobile, dashboard on desktop
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'education';
    }
    return 'dashboard';
  });

  const [legacyAge, setLegacyAge] = useState<number>(100);
  const [heirBaseIncome, setHeirBaseIncome] = useState<number>(100000);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [hoveredData, setHoveredData] = useState<any>(null);
  const [lockedAge, setLockedAge] = useState<number | null>(null);
  const [editingEvent, setEditingEvent] = useState<{ age: number } | null>(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getXAxisTicks = (data: any[], isMobile: boolean) => {
    if (!data || data.length === 0) return undefined;
    const minAge = data[0].age;
    const maxAge = data[data.length - 1].age;
    const range = maxAge - minAge;
    
    // Heuristic for available pixel width
    const estimatedWidth = isMobile ? windowWidth - 80 : (windowWidth - 420);
    const pxPerYear = estimatedWidth / range;

    let step = 1;
    if (pxPerYear < 25) step = 5;
    if (pxPerYear < 8) step = 10;

    const ticks = [];
    for (let age = minAge; age <= maxAge; age++) {
      if ((age - minAge) % step === 0) {
        ticks.push(age);
      }
    }
    // Ensure end age is visible
    if (ticks[ticks.length - 1] !== maxAge && pxPerYear > 5) {
      ticks.push(maxAge);
    }
    return ticks;
  };

  const results = useMemo(() => runSimulation(params), [params]);

  const defaultYearData = useMemo(() => 
    results.years.find(y => y.age === params.currentAge) || results.years[0]
  , [results.years, params.currentAge]);

  // Sync hoveredData with lockedAge or fallback to default
  useEffect(() => {
    if (lockedAge !== null) {
      const data = results.years.find(y => y.age === lockedAge);
      if (data) setHoveredData(data);
    } else if (!hoveredData || !results.years.some(y => y.age === hoveredData.age)) {
      setHoveredData(defaultYearData);
    }
  }, [lockedAge, results.years, defaultYearData]);

  useEffect(() => {
    const urlParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (key === 'events') {
        urlParams.set(key, encodeURIComponent(JSON.stringify(value)));
      } else {
        urlParams.set(key, String(value));
      }
    });
    urlParams.set('tab', activeTab);
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    window.history.replaceState(null, '', newUrl);
  }, [params, activeTab]);

  const EventModal = () => {
    if (!editingEvent) return null;
    const yearData = results.years.find(y => y.age === editingEvent.age);
    const existingEvents = params.events.filter(e => e.age === editingEvent.age);
    
    const [eventName, setEventName] = useState("");
    const [eventAmount, setEventAmount] = useState(100000);
    const [eventType, setEventType] = useState<'expense' | 'inflow'>('expense');

    const yearsDiff = editingEvent.age - params.currentAge;
    const inflationAdjusted = eventAmount / Math.pow(1 + params.inflationRate, yearsDiff);

    const handleAdd = () => {
      if (eventAmount <= 0) return;
      const newEvent: OneTimeEvent = {
        id: Math.random().toString(36).substr(2, 9),
        age: editingEvent.age,
        name: eventName || (eventType === 'expense' ? 'Large Expense' : 'Inflow'),
        amount: eventType === 'expense' ? -eventAmount : eventAmount,
        type: eventType
      };
      setParams(prev => ({ ...prev, events: [...prev.events, newEvent] }));
      setEditingEvent(null);
    };

    const handleRemove = (id: string) => {
      setParams(prev => ({ ...prev, events: prev.events.filter(e => e.id !== id) }));
    };

    return createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setEditingEvent(null)}
          className="absolute inset-0 bg-[#141414]/40 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#141414]/10"
        >
          <div className="p-6 pb-4 border-b border-[#141414]/5 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold tracking-tight">Financial Event</h3>
              <p className="text-sm text-[#141414]/50">Plan for Age {editingEvent.age} ({yearData?.year})</p>
            </div>
            <button 
              onClick={() => setEditingEvent(null)}
              className="p-2 hover:bg-[#141414]/5 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-[#141414]/40" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex p-1 bg-[#141414]/5 rounded-xl gap-1">
              <button 
                onClick={() => setEventType('expense')}
                className={cn(
                  "flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2",
                  eventType === 'expense' ? "bg-white text-[#141414] shadow-sm" : "text-[#141414]/40 hover:text-[#141414]/60"
                )}
              >
                <ArrowDownToLine className="w-3.5 h-3.5" /> Expense
              </button>
              <button 
                onClick={() => setEventType('inflow')}
                className={cn(
                  "flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2",
                  eventType === 'inflow' ? "bg-white text-green-600 shadow-sm" : "text-[#141414]/40 hover:text-[#141414]/60"
                )}
              >
                <Zap className="w-3.5 h-3.5" /> Inflow
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-1.5">Event Name (Optional)</label>
                <input 
                  type="text"
                  placeholder="e.g. World Cruise, Son's Wedding, Inheritance"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full bg-[#F5F5F4] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#141414]"
                />
              </div>
              <div className="space-y-1.5">
                <NumericInput 
                  label="Amount"
                  value={eventAmount}
                  onChange={setEventAmount}
                  className="w-full"
                />
                {yearsDiff > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141414]/5 rounded-lg border border-[#141414]/5">
                    <Info className="w-3.5 h-3.5 text-[#141414]/40" />
                    <p className="text-[10px] font-medium text-[#141414]/50">
                      Equal to ~<span className="font-bold text-[#141414]">{formatCurrency(inflationAdjusted)}</span> in today's dollars (at {(params.inflationRate * 100).toFixed(1)}% inflation)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {existingEvents.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-[#141414]/5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">Active Events at this Age</p>
                {existingEvents.map(e => (
                  <div key={e.id} className="flex items-center justify-between p-3 bg-[#141414]/5 rounded-xl">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">{e.name}</span>
                      <span className={cn("text-[10px] font-medium", e.amount < 0 ? "text-red-500" : "text-green-600")}>
                        {formatCurrency(Math.abs(e.amount))} {e.amount < 0 ? 'Expense' : 'Inflow'}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleRemove(e.id)}
                      className="p-2 hover:bg-red-50 text-red-400 hover:text-red-500 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 pt-0">
            <button 
              onClick={handleAdd}
              className="w-full bg-[#141414] text-white py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Event
            </button>
          </div>
        </motion.div>
      </div>,
      document.body
    );
  };

  const firstPenaltyAge = useMemo(() => results.years.find(y => y.earlyWithdrawalPenalty > 0)?.age, [results]);

  const handleParamChange = (key: keyof SimulationParams, value: any) => {
    setParams(prev => {
      const newParams = { ...prev, [key]: value };
      
      // Helper to estimate FRA benefit (at age 67)
      const getFRABenefit = (income: number) => Math.min(48000, income * 0.35);
      
      // Helper to get age multiplier (FRA = 67)
      const getAgeMultiplier = (age: number) => {
        if (age === 67) return 1.0;
        if (age < 67) {
          // ~6.67% reduction per year for first 3 years, then ~5%
          const yearsEarly = 67 - age;
          const reduction = yearsEarly <= 3 ? yearsEarly * 0.0667 : (3 * 0.0667) + (yearsEarly - 3) * 0.05;
          return 1.0 - reduction;
        } else {
          // 8% increase per year
          return 1.0 + (age - 67) * 0.08;
        }
      };

      // Smart default for Social Security benefit when income or age changes
      if (key === 'currentIncome' || key === 'ssStartAge') {
        const income = key === 'currentIncome' ? value : prev.currentIncome;
        const age = key === 'ssStartAge' ? value : prev.ssStartAge;
        
        const fraBenefit = getFRABenefit(income);
        const multiplier = getAgeMultiplier(age);
        const estimatedBenefit = fraBenefit * multiplier;
        
        newParams.ssAnnualBenefit = Math.round(estimatedBenefit / 500) * 500;
      }
      
      return newParams;
    });
  };

  const getInputValue = (val: number) => (isNaN(val) ? '' : val);

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-[#F5F5F4] text-[#141414] font-sans flex flex-col md:flex-row">
      {/* Mobile Carousel - Always at top on mobile */}
      <div className="md:hidden bg-[#F5F5F4] border-b border-[#141414]/10 shadow-sm">
        <div className="relative h-[480px] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={carouselIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full p-4"
            >
              {carouselIndex === 0 && (
                <div className="bg-white p-4 rounded-2xl border border-[#141414]/5 shadow-sm h-full flex flex-col">
                  <div className="mb-2">
                    <h3 className="text-sm font-bold tracking-tight">Projected Asset Balances</h3>
                    <p className="text-[10px] text-[#141414]/50">Growth over time</p>
                  </div>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <LineChart 
                        data={results.years}
                        onMouseMove={(e: any) => {
                          if (e && e.activeLabel) {
                            const dataPoint = results.years.find(y => y.age === e.activeLabel);
                            if (dataPoint) setHoveredData(dataPoint);
                          }
                        }}
                        onClick={(e: any) => {
                          if (e && e.activeLabel) {
                            const dataPoint = results.years.find(y => y.age === e.activeLabel);
                            if (dataPoint) setHoveredData(dataPoint);
                          }
                        }}
                        onTouchMove={(e: any) => {
                          if (e && e.activeLabel) {
                            const dataPoint = results.years.find(y => y.age === e.activeLabel);
                            if (dataPoint) setHoveredData(dataPoint);
                          }
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#14141410" />
                        <XAxis 
                          dataKey="age" 
                          type="number" 
                          domain={['dataMin', 'dataMax']} 
                          ticks={getXAxisTicks(results.years, true)}
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fontSize: 10}} 
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} tickFormatter={(v) => `$${v/1000000}M`} />
                        {params.enableGapYear && (
                          <ReferenceArea 
                            {...({
                              x1: params.gapYearStartAge - 0.5,
                              x2: params.gapYearStartAge + params.gapYearDuration - 0.5,
                              stroke: "none",
                              fill: "#F27D26",
                              fillOpacity: 0.05
                            } as any)}
                          />
                        )}
                        <ReferenceLine x={73} stroke="#141414" strokeDasharray="3 3" opacity={0.3} label={{ value: 'RMD', position: 'insideTopLeft', fontSize: 8, fill: '#141414' }} />
                        <Line type="monotone" dataKey="traditionalBalance" stroke="#141414" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="rothBalance" stroke="#F27D26" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="brokerageBalance" stroke="#6366F1" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {<MobileDetailSection data={hoveredData} />}
                </div>
              )}
              {carouselIndex === 1 && (
                <div className="grid grid-cols-2 gap-3 h-full">
                  <div className="bg-white p-4 rounded-2xl border border-[#141414]/5 shadow-sm flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-[#141414]/50 mb-1">
                      <ShieldAlert className="w-3 h-3" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Total RMD</span>
                    </div>
                    <div className="text-lg font-bold">{formatCurrency(results.totalRmdPaid)}</div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-[#141414]/5 shadow-sm flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-[#141414]/50 mb-1">
                      <DollarSign className="w-3 h-3" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Total Tax</span>
                    </div>
                    <div className="text-lg font-bold">{formatCurrency(results.totalTaxPaid)}</div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-[#141414]/5 shadow-sm flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-[#141414]/50 mb-1">
                      <Wallet className="w-3 h-3" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Final Bal</span>
                    </div>
                    <div className="text-lg font-bold">{formatCurrency(results.finalBalance)}</div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-[#141414]/5 shadow-sm flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-[#141414]/50 mb-1">
                      <Calendar className="w-3 h-3" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">RMD Start</span>
                    </div>
                    <div className="text-lg font-bold">Age 73</div>
                  </div>
                </div>
              )}
              {carouselIndex === 2 && (
                <div className="bg-white p-4 rounded-2xl border border-[#141414]/5 shadow-sm h-full flex flex-col">
                  <h3 className="text-sm font-bold tracking-tight mb-2">Annual Tax Obligation</h3>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <BarChart 
                        data={results.years}
                        onMouseMove={(e: any) => {
                          if (e && e.activeLabel) {
                            const dataPoint = results.years.find(y => y.age === e.activeLabel);
                            if (dataPoint) setHoveredData(dataPoint);
                          }
                        }}
                        onClick={(e: any) => {
                          if (e && e.activeLabel) {
                            const dataPoint = results.years.find(y => y.age === e.activeLabel);
                            if (dataPoint) setHoveredData(dataPoint);
                          }
                        }}
                        onTouchMove={(e: any) => {
                          if (e && e.activeLabel) {
                            const dataPoint = results.years.find(y => y.age === e.activeLabel);
                            if (dataPoint) setHoveredData(dataPoint);
                          }
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#14141410" />
                        <Tooltip 
                          cursor={{ fill: '#141414', fillOpacity: 0.04 }}
                          content={() => null}
                        />
                        <XAxis 
                          dataKey="age" 
                          type="number" 
                          domain={['dataMin', 'dataMax']} 
                          ticks={getXAxisTicks(results.years, true)}
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fontSize: 10}} 
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} tickFormatter={(v) => `$${v/1000}k`} />
                        {params.enableGapYear && (
                          <ReferenceArea 
                            {...({
                              x1: params.gapYearStartAge - 0.5,
                              x2: params.gapYearStartAge + params.gapYearDuration - 0.5,
                              stroke: "none",
                              fill: "#F27D26",
                              fillOpacity: 0.05
                            } as any)}
                          />
                        )}
                        <ReferenceLine x={73} stroke="#141414" strokeDasharray="3 3" opacity={0.3} label={{ value: 'RMD', position: 'insideTopLeft', fontSize: 8, fill: '#141414' }} />
                        <Bar dataKey="taxPaid" fill="#141414" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {<MobileDetailSection data={hoveredData} />}
                </div>
              )}
              {carouselIndex === 3 && (
                <div className="bg-white p-4 rounded-2xl border border-[#141414]/5 shadow-sm h-full flex flex-col">
                  <h3 className="text-sm font-bold tracking-tight mb-2">RMD Impact</h3>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <LineChart 
                        data={results.years.filter(y => y.age >= 70)}
                        onMouseMove={(e: any) => {
                          if (e && e.activeLabel) {
                            const dataPoint = results.years.find(y => y.age === e.activeLabel);
                            if (dataPoint) setHoveredData(dataPoint);
                          }
                        }}
                        onClick={(e: any) => {
                          if (e && e.activeLabel) {
                            const dataPoint = results.years.find(y => y.age === e.activeLabel);
                            if (dataPoint) setHoveredData(dataPoint);
                          }
                        }}
                        onTouchMove={(e: any) => {
                          if (e && e.activeLabel) {
                            const dataPoint = results.years.find(y => y.age === e.activeLabel);
                            if (dataPoint) setHoveredData(dataPoint);
                          }
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#14141410" />
                        <XAxis 
                          dataKey="age" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fontSize: 10}} 
                          ticks={getXAxisTicks(results.years.filter(y => y.age >= 70), true)}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} tickFormatter={(v) => `$${v/1000}k`} />
                        <ReferenceLine x={73} stroke="#141414" strokeDasharray="3 3" opacity={0.3} label={{ value: 'RMD', position: 'insideTopLeft', fontSize: 8, fill: '#141414' }} />
                        <Line type="monotone" dataKey="rmdAmount" stroke="#F27D26" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  {<MobileDetailSection data={hoveredData} />}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Carousel Controls */}
          <button 
            onClick={() => setCarouselIndex(prev => (prev === 0 ? 3 : prev - 1))}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow-md z-10"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setCarouselIndex(prev => (prev === 3 ? 0 : prev + 1))}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow-md z-10"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
            {[0, 1, 2, 3].map(i => (
              <button
                key={i}
                onClick={() => setCarouselIndex(i)}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all",
                  carouselIndex === i ? "bg-[#141414] w-3" : "bg-[#141414]/20"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar - Inputs */}
      <aside className="w-full md:w-80 md:h-full md:overflow-y-auto bg-white border-r border-[#141414]/10 p-6">
        <div className="flex items-center gap-2 mb-8">
          <Calculator className="w-6 h-6 text-[#141414]" />
          <h1 className="text-xl font-bold tracking-tight">Decumulate</h1>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#141414]/50 mb-4">Personal Info</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Current Age</label>
                <input 
                  type="number" 
                  value={getInputValue(params.currentAge)} 
                  onChange={(e) => handleParamChange('currentAge', parseInt(e.target.value))}
                  className="w-full bg-[#F5F5F4] border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#141414]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Retirement Age</label>
                <input 
                  type="number" 
                  value={getInputValue(params.retirementAge)} 
                  onChange={(e) => handleParamChange('retirementAge', parseInt(e.target.value))}
                  className="w-full bg-[#F5F5F4] border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#141414]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Filing Status</label>
                <select 
                  value={params.filingStatus} 
                  onChange={(e) => handleParamChange('filingStatus', e.target.value)}
                  className="w-full bg-[#F5F5F4] border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#141414]"
                >
                  <option value="MFJ">Married Filing Jointly</option>
                  <option value="Single">Single</option>
                </select>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#141414]/50 mb-4">Balances & Income</h2>
            <div className="space-y-4">
              <NumericInput 
                value={params.currentBrokerageBalance}
                onChange={(val) => handleParamChange('currentBrokerageBalance', val)}
                label="Brokerage Balance"
                indicatorColor="#6366F1"
                tooltip="This represents your taxable investment account. Withdrawals from this account are subject to long-term capital gains tax based on your cost basis."
              />
              <NumericInput 
                value={params.currentBrokerageBasis}
                onChange={(val) => handleParamChange('currentBrokerageBasis', val)}
                label="Brokerage Cost Basis"
                tooltip="The total amount you invested into the brokerage account. Only the gains (balance minus basis) are taxed when you withdraw."
              />
              <NumericInput 
                value={params.currentTraditionalBalance}
                onChange={(val) => handleParamChange('currentTraditionalBalance', val)}
                label="Traditional 401k/IRA"
                indicatorColor="#141414"
              />
              <NumericInput 
                value={params.currentRothBalance}
                onChange={(val) => handleParamChange('currentRothBalance', val)}
                label="Roth 401k/IRA"
                indicatorColor="#F27D26"
              />
              <NumericInput 
                value={params.currentIncome}
                onChange={(val) => handleParamChange('currentIncome', val)}
                label="Current Annual Income"
                tooltip="Your gross annual W-2 wages. This grows by the 'Income Increase %' until retirement or gap years."
              />
              <div>
                <label className="block text-xs font-medium mb-1">Annual Income Increase (%)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={getInputValue(params.incomeIncreaseRate * 100)} 
                  onChange={(e) => handleParamChange('incomeIncreaseRate', parseFloat(e.target.value) / 100)}
                  className="w-full bg-[#F5F5F4] border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#141414]"
                />
              </div>
              <NumericInput 
                value={params.annualSpending}
                onChange={(val) => handleParamChange('annualSpending', val)}
                label="Annual Spending (Today's $)"
              />
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#141414]/50">Gap Year and Roth Strategy</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={params.enableGapYear}
                  onChange={(e) => handleParamChange('enableGapYear', e.target.checked)}
                  className="w-4 h-4 rounded border-[#141414]/20 text-[#141414] focus:ring-[#141414]"
                />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#141414]">Enable</span>
              </label>
            </div>
            <div className={cn("space-y-4 transition-opacity duration-200", !params.enableGapYear && "opacity-40 pointer-events-none")}>
              <div>
                <label className="block text-xs font-medium mb-1">Gap Year or Roth Conv. Start Age</label>
                <input 
                  type="number" 
                  value={getInputValue(params.gapYearStartAge)} 
                  onChange={(e) => handleParamChange('gapYearStartAge', parseInt(e.target.value))}
                  className="w-full bg-[#F5F5F4] border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#141414]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Duration (Years)</label>
                <input 
                  type="number" 
                  value={getInputValue(params.gapYearDuration)} 
                  onChange={(e) => handleParamChange('gapYearDuration', parseInt(e.target.value))}
                  className="w-full bg-[#F5F5F4] border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#141414]"
                />
              </div>
              <NumericInput 
                value={params.gapYearIncome}
                onChange={(val) => handleParamChange('gapYearIncome', val)}
                label="W-2 Income During Gap"
              />
              <NumericInput 
                value={params.annualRothConversion}
                onChange={(val) => handleParamChange('annualRothConversion', val)}
                label="Annual Roth Conversion"
              />
            </div>
          </section>

          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#141414]/50 mb-4">Social Security</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <AppTooltip content="Filing before Full Retirement Age (67) reduces benefits; filing after increases them by 8% per year up to age 70.">
                    <label className="block text-xs font-medium cursor-help border-b border-dotted border-[#141414]/10">SS Start Age</label>
                  </AppTooltip>
                </div>
                <input 
                  type="number" 
                  value={getInputValue(params.ssStartAge)} 
                  onChange={(e) => handleParamChange('ssStartAge', parseInt(e.target.value))}
                  className="w-full bg-[#F5F5F4] border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#141414]"
                />
              </div>
              <NumericInput 
                value={params.ssAnnualBenefit}
                onChange={(val) => handleParamChange('ssAnnualBenefit', val)}
                label="Annual Benefit (Today's $)"
                tooltip="Estimated as 35% of your current income (capped at $48k) at Full Retirement Age (67), then adjusted for your selected start age."
              />
              <p className="text-[9px] text-[#141414]/40 mt-1 italic">Smart default based on income and start age.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#141414]/50 mb-4">Market & Inflation</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium">Market Scenario</label>
                  <span className={cn(
                    "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                    params.marketGrowthRate <= 0.05 ? "bg-slate-200 text-slate-700" :
                    params.marketGrowthRate <= 0.08 ? "bg-emerald-100 text-emerald-700" :
                    "bg-orange-100 text-orange-700"
                  )}>
                    {params.marketGrowthRate <= 0.05 ? "Conservative" :
                     params.marketGrowthRate <= 0.08 ? "Moderate" :
                     "High Growth"} ({(params.marketGrowthRate * 100).toFixed(1)}%)
                  </span>
                </div>
                <input 
                  type="range"
                  min="0.03"
                  max="0.10"
                  step="0.001"
                  value={params.marketGrowthRate}
                  onChange={(e) => handleParamChange('marketGrowthRate', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-[#141414]/10 rounded-lg appearance-none cursor-pointer accent-[#141414] mb-1"
                />
                <div className="flex justify-between text-[8px] font-bold text-[#141414]/30 uppercase tracking-tighter">
                  <span>3% Min</span>
                  <span>Moderate</span>
                  <span>10% Max</span>
                </div>
              </div>
              <NumericInput 
                value={params.inflationRate * 100}
                onChange={(val) => handleParamChange('inflationRate', val / 100)}
                label="Inflation Rate (%)"
                prefix=""
                indicatorColor="#141414"
                indicatorStyle="hollow"
              />
            </div>
          </section>

          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#141414]/50 mb-4">Advanced Options</h2>
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="pt-0.5">
                  <input 
                    type="checkbox" 
                    checked={params.avoidEarlyPenalty}
                    onChange={(e) => handleParamChange('avoidEarlyPenalty', e.target.checked)}
                    className="w-4 h-4 rounded border-[#141414]/20 text-[#141414] focus:ring-[#141414]"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium group-hover:text-[#141414] transition-colors">Avoid 401k Early Penalty</span>
                    <AppTooltip content="If enabled, the engine will prioritize Roth withdrawals before Traditional ones if you are under 59.5, in order to avoid the 10% federal early withdrawal penalty.">
                      <HelpCircle className="w-3 h-3 text-[#141414]/30 cursor-help" />
                    </AppTooltip>
                  </div>
                  <p className="text-[9px] text-[#141414]/40 mt-0.5 leading-relaxed">Prioritizes Roth assets before Traditional ones when under age 59.5.</p>
                </div>
              </label>

              <NumericInput 
                value={params.qualifiedDividendRate * 100}
                onChange={(val) => handleParamChange('qualifiedDividendRate', val / 100)}
                label="Qualified Dividend Yield (%)"
                prefix=""
                tooltip="The portion of your brokerage investments that pays qualified dividends (taxed at LTCG rates). For a broad US market ETF like VTI, this is typically around 1.16%."
              />

              <NumericInput 
                value={params.ordinaryDividendRate * 100}
                onChange={(val) => handleParamChange('ordinaryDividendRate', val / 100)}
                label="Ordinary Dividend/Interest Yield (%)"
                prefix=""
                tooltip="The portion of your brokerage investments that pays ordinary dividends or interest (taxed at regular income rates). For a broad market fund, this is typically around 0.02%."
              />

              <div className="pt-2 border-t border-[#141414]/5 space-y-4">
                <NumericInput 
                  value={params.traditional401kContribution}
                  onChange={(val) => handleParamChange('traditional401kContribution', val)}
                  label="Annual Trad. 401k Contribution"
                  tooltip="The amount you contribute to your Traditional 401k each working year. This reduces your taxable income today. Default is the 2024 IRS limit."
                />

                <NumericInput 
                  value={params.megaBackdoorRothAmount}
                  onChange={(val) => handleParamChange('megaBackdoorRothAmount', val)}
                  label="Mega Backdoor Roth Amount"
                  tooltip="The additional amount you save to a Roth account via the Mega Backdoor strategy after reaching your 401k limit. Default is approximate remaining IRS total contribution space."
                />
              </div>
            </div>
          </section>

          <section className="pt-6 border-t border-[#141414]/10">
            <div className="bg-[#F5F5F4] p-4 rounded-xl flex items-start gap-3">
              <ShieldAlert className="w-4 h-4 text-[#141414]/40 mt-0.5" />
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#141414]/60">Privacy First</h4>
                <p className="text-[10px] text-[#141414]/40 leading-relaxed mt-1">
                  Your financial data is processed entirely in your browser. No information is ever saved to a server or shared with third parties.
                </p>
              </div>
            </div>
          </section>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:h-full md:overflow-y-auto p-4 md:p-8">
        <nav className="sticky top-0 z-40 bg-[#F5F5F4]/80 backdrop-blur-md flex gap-4 md:gap-8 mb-8 border-b border-[#141414]/10 overflow-x-auto whitespace-nowrap scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pt-4">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              "hidden md:block pb-4 text-[10px] md:text-sm font-bold uppercase tracking-widest transition-colors shrink-0",
              activeTab === 'dashboard' ? "text-[#141414] border-b-2 border-[#141414]" : "text-[#141414]/40 hover:text-[#141414]"
            )}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab(prev => prev === 'education' ? 'dashboard' : 'education')}
            className={cn(
              "pb-4 text-[10px] md:text-sm font-bold uppercase tracking-widest transition-colors shrink-0",
              activeTab === 'education' ? "text-[#141414] border-b-2 border-[#141414]" : "text-[#141414]/40 hover:text-[#141414]"
            )}
          >
            Education
          </button>
          <button 
            onClick={() => setActiveTab(prev => prev === 'methodology' ? 'dashboard' : 'methodology')}
            className={cn(
              "pb-4 text-[10px] md:text-sm font-bold uppercase tracking-widest transition-colors shrink-0",
              activeTab === 'methodology' ? "text-[#141414] border-b-2 border-[#141414]" : "text-[#141414]/40 hover:text-[#141414]"
            )}
          >
            Methodology
          </button>
          <button 
            onClick={() => setActiveTab(prev => prev === 'legacy' ? 'dashboard' : 'legacy')}
            className={cn(
              "pb-4 text-[10px] md:text-sm font-bold uppercase tracking-widest transition-colors shrink-0",
              activeTab === 'legacy' ? "text-[#141414] border-b-2 border-[#141414]" : "text-[#141414]/40 hover:text-[#141414]"
            )}
          >
            Legacy
          </button>
        </nav>

        <div className="flex flex-col gap-8">
          {/* Dashboard Content - Hidden on mobile as it's in the carousel, but shown on desktop */}
          <div className={cn("space-y-8", activeTab === 'dashboard' ? "block" : "hidden")}>
            <div className="hidden md:block space-y-8">
              {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-[#141414]/5 shadow-sm">
                <div className="flex items-center gap-2 text-[#141414]/50 mb-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Timeline</span>
                </div>
                <div className="text-2xl font-bold">{73 - params.currentAge} Years</div>
                <p className="text-xs text-[#141414]/40 mt-1">Until RMD age (73)</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-[#141414]/5 shadow-sm">
                <div className="flex items-center gap-2 text-[#141414]/50 mb-2">
                  <ShieldAlert className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Total RMD Paid</span>
                </div>
                <div className="text-2xl font-bold">{formatCurrency(results.totalRmdPaid)}</div>
                <p className="text-xs text-[#141414]/40 mt-1">Projected total RMDs from age 73+</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-[#141414]/5 shadow-sm">
                <div className="flex items-center gap-2 text-[#141414]/50 mb-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Total Taxes Paid</span>
                </div>
                <div className="text-2xl font-bold">{formatCurrency(results.totalTaxPaid)}</div>
                <p className="text-xs text-[#141414]/40 mt-1">Lifetime federal tax obligation</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-[#141414]/5 shadow-sm">
                <div className="flex items-center gap-2 text-[#141414]/50 mb-2">
                  <Wallet className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Final Balance</span>
                </div>
                <div className="text-2xl font-bold">{formatCurrency(results.finalBalance)}</div>
                <p className="text-xs text-[#141414]/40 mt-1">Estimated legacy at age 100</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-8">
              <div className="bg-white p-8 rounded-2xl border border-[#141414]/5 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-lg font-bold tracking-tight">Projected Asset Balances</h3>
                    <p className="text-sm text-[#141414]/50">Growth of Brokerage, Traditional, and Roth accounts over time.</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#141414]" />
                      <span className="text-xs font-medium">Traditional</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#F27D26]" />
                      <span className="text-xs font-medium">Roth</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#6366F1]" />
                      <span className="text-xs font-medium">Brokerage</span>
                    </div>
                  </div>
                </div>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <LineChart 
                      data={results.years}
                      onMouseMove={(e: any) => {
                        if (lockedAge === null && e && e.activeLabel) {
                          const dataPoint = results.years.find(y => y.age === e.activeLabel);
                          if (dataPoint) setHoveredData(dataPoint);
                        }
                      }}
                      onClick={(e: any) => {
                        if (e && e.activeLabel) {
                          setLockedAge(prev => prev === e.activeLabel ? null : e.activeLabel);
                        }
                      }}
                      onMouseLeave={() => {
                        if (lockedAge === null) setHoveredData(defaultYearData);
                      }}
                      onTouchMove={(e: any) => {
                        if (lockedAge === null && e && e.activeLabel) {
                          const dataPoint = results.years.find(y => y.age === e.activeLabel);
                          if (dataPoint) setHoveredData(dataPoint);
                        }
                      }}
                      onTouchEnd={() => {
                        if (lockedAge === null) setHoveredData(defaultYearData);
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#14141410" />
                      <XAxis 
                        dataKey="age" 
                        type="number" 
                        domain={['dataMin', 'dataMax']} 
                        ticks={getXAxisTicks(results.years, false)}
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 12}} 
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} tickFormatter={(v) => `$${v/1000000}M`} />
                      {params.enableGapYear && (
                        <ReferenceArea 
                          {...({
                            x1: params.gapYearStartAge - 0.5,
                            x2: params.gapYearStartAge + params.gapYearDuration - 0.5,
                            stroke: "none",
                            fill: "#F27D26",
                            fillOpacity: 0.05,
                            label: { value: 'Roth Years', position: 'top', fontSize: 10, fill: '#F27D26', fontWeight: 'bold' }
                          } as any)}
                        />
                      )}
                      <ReferenceLine 
                        x={params.ssStartAge} 
                        stroke="#059669" 
                        strokeDasharray="3 3" 
                        label={{ value: 'SS Start', position: 'insideTopLeft', fontSize: 10, fill: '#059669', fontWeight: 'bold' }} 
                      />
                      <ReferenceLine 
                        x={73} 
                        stroke="#141414" 
                        strokeDasharray="3 3" 
                        label={{ value: 'RMD Start', position: 'insideTopLeft', fontSize: 10, fill: '#141414', fontWeight: 'bold' }} 
                      />
                      <Line type="monotone" dataKey="traditionalBalance" stroke="#141414" strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="rothBalance" stroke="#F27D26" strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="brokerageBalance" stroke="#6366F1" strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="inflationRef" stroke="#141414" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                      {lockedAge !== null && (
                        <ReferenceLine 
                          x={lockedAge} 
                          stroke="#141414" 
                          strokeWidth={2} 
                          strokeOpacity={0.8}
                        />
                      )}
                      {params.events.map(event => (
                        <ReferenceLine
                          key={event.id}
                          x={event.age}
                          stroke={event.type === 'expense' ? '#EF4444' : '#059669'}
                          strokeOpacity={hoveredData?.age === event.age ? 0.8 : 0.4}
                          strokeWidth={hoveredData?.age === event.age ? 3 : 2}
                        />
                      ))}
                      {params.events.map(event => {
                        const dataPoint = results.years.find(y => y.age === event.age);
                        if (!dataPoint) return null;
                        const isHovered = hoveredData?.age === event.age;
                        return (
                          <ReferenceDot
                            key={event.id}
                            x={event.age}
                            y={dataPoint.totalBalance}
                            r={isHovered ? 8 : 6}
                            fill={event.type === 'expense' ? '#EF4444' : '#059669'}
                            stroke="white"
                            strokeWidth={2}
                            label={isHovered ? {
                              value: `${event.name}: ${formatCurrency(Math.abs(event.amount))}`,
                              position: 'top',
                              fill: event.type === 'expense' ? '#EF4444' : '#059669',
                              fontSize: 12,
                              fontWeight: 'bold',
                              offset: 15
                            } : undefined}
                          />
                        );
                      })}
                      {firstPenaltyAge && (
                        <ReferenceLine 
                          x={firstPenaltyAge} 
                          stroke="#EF4444" 
                          strokeDasharray="3 3"
                          label={(props: any) => {
                            const { viewBox } = props;
                            return (
                              <g className="cursor-help" title="Early Withdrawal Penalty Detected: A 10% federal penalty is applied to Traditional withdrawals before age 59.5.">
                                <circle cx={viewBox.x} cy={viewBox.y + viewBox.height - 15} r="10" fill="#EF4444" />
                                <text x={viewBox.x} y={viewBox.y + viewBox.height - 10} textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">!</text>
                              </g>
                            );
                          }}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-8 pt-8 border-t border-[#141414]/5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-bold tracking-tight">Annual Tax Obligation</h4>
                      <p className="text-[10px] text-[#141414]/40 font-bold uppercase tracking-widest">Federal tax breakdown by age</p>
                    </div>
                  </div>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <BarChart 
                        data={results.years}
                        onMouseMove={(e: any) => {
                          if (lockedAge === null && e && e.activeLabel) {
                            const dataPoint = results.years.find(y => y.age === e.activeLabel);
                            if (dataPoint) setHoveredData(dataPoint);
                          }
                        }}
                        onClick={(e: any) => {
                          if (e && e.activeLabel) {
                            setLockedAge(prev => prev === e.activeLabel ? null : e.activeLabel);
                          }
                        }}
                        onMouseLeave={() => {
                          if (lockedAge === null) setHoveredData(defaultYearData);
                        }}
                        onTouchMove={(e: any) => {
                          if (lockedAge === null && e && e.activeLabel) {
                            const dataPoint = results.years.find(y => y.age === e.activeLabel);
                            if (dataPoint) setHoveredData(dataPoint);
                          }
                        }}
                        onTouchEnd={() => {
                          if (lockedAge === null) setHoveredData(defaultYearData);
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#14141410" />
                        <Tooltip 
                          cursor={{ fill: '#141414', fillOpacity: 0.04 }}
                          content={() => null}
                        />
                        <XAxis 
                          dataKey="age" 
                          type="number" 
                          domain={['dataMin', 'dataMax']} 
                          ticks={getXAxisTicks(results.years, false)}
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fontSize: 10}} 
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} tickFormatter={(v) => `$${v/1000}k`} />
                        {lockedAge !== null && (
                          <ReferenceLine 
                            x={lockedAge} 
                            stroke="#141414" 
                            strokeWidth={2} 
                            strokeOpacity={0.8}
                          />
                        )}
                        {params.enableGapYear && (
                          <ReferenceArea 
                            {...({
                              x1: params.gapYearStartAge - 0.5,
                              x2: params.gapYearStartAge + params.gapYearDuration - 0.5,
                              stroke: "none",
                              fill: "#F27D26",
                              fillOpacity: 0.05,
                              label: { value: 'Roth Years', position: 'top', fontSize: 10, fill: '#F27D26', fontWeight: 'bold' }
                            } as any)}
                          />
                        )}
                        <Bar dataKey="taxPaid" fill="#141414" radius={[2, 2, 0, 0]} name="Tax Paid" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Detail Section Below Chart (Desktop) */}
                <div className="mt-8 pt-8 border-t border-[#141414]/5 min-h-[320px] relative">
                  {hoveredData && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {/* Column 1: Point In Time & Balances */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-1">Point In Time</span>
                            <span className="text-xl font-bold">Age {hoveredData.age} ({hoveredData.year})</span>
                          </div>
                          
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setLockedAge(lockedAge === hoveredData.age ? null : hoveredData.age)}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
                                lockedAge === hoveredData.age 
                                  ? "bg-[#141414] text-white" 
                                  : "bg-[#141414]/5 text-[#141414]/40 hover:text-[#141414]/60"
                              )}
                            >
                              <MousePointer2 className="w-3 h-3" />
                              {lockedAge === hoveredData.age ? "Pinned" : "Pin Year"}
                            </button>
                            
                            <button 
                              onClick={() => setEditingEvent({ age: hoveredData.age })}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#141414]/5 text-[#141414]/40 hover:text-[#141414] hover:bg-[#141414]/10 text-[10px] font-bold uppercase tracking-widest transition-all"
                            >
                              <Plus className="w-3 h-3" />
                              {(() => {
                                const count = params.events.filter(e => e.age === hoveredData.age).length;
                                return count > 0 ? `${count} ${count === 1 ? 'EVENT' : 'EVENTS'}` : "Plan Event";
                              })()}
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          <div className="p-3 bg-[#141414]/5 rounded-xl border border-[#141414]/5">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-2.5 h-2.5 rounded-full bg-[#141414]" />
                              <p className="text-[10px] font-bold text-[#141414]/40 uppercase tracking-wider">Traditional</p>
                            </div>
                            <p className="text-lg font-bold">{formatCurrency(hoveredData.traditionalBalance)}</p>
                          </div>
                          <div className="p-3 bg-[#F27D26]/5 rounded-xl border border-[#F27D26]/10">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-2.5 h-2.5 rounded-full bg-[#F27D26]" />
                              <p className="text-[10px] font-bold text-[#F27D26]/40 uppercase tracking-wider">Roth</p>
                            </div>
                            <p className="text-lg font-bold text-[#F27D26]">{formatCurrency(hoveredData.rothBalance)}</p>
                          </div>
                          <div className="p-3 bg-[#6366F1]/5 rounded-xl border border-[#6366F1]/10">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-2.5 h-2.5 rounded-full bg-[#6366F1]" />
                              <p className="text-[10px] font-bold text-[#6366F1]/40 uppercase tracking-wider">Brokerage</p>
                            </div>
                            <p className="text-lg font-bold text-[#6366F1]">{formatCurrency(hoveredData.brokerageBalance)}</p>
                          </div>
                          <div className="p-3 bg-transparent rounded-xl border-2 border-dotted border-[#141414]/10">
                            <div className="flex items-center gap-1.5 mb-1">
                              <div className="w-2.5 h-2.5 rounded-full border-2 border-dotted border-[#141414]" />
                              <AppTooltip content="Shows how much $1.00 today will buy in the future. As prices rise, your money's value decreases.">
                                <p className="text-[10px] font-bold text-[#141414]/40 uppercase tracking-wider cursor-help border-b border-dotted border-[#141414]/10">Purchasing Power</p>
                              </AppTooltip>
                            </div>
                            <p className="text-lg font-bold text-[#141414]/60">$1.00 today = ${hoveredData.purchasingPower.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Column 2: Annual Inflows */}
                      <div className="space-y-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-1">Annual Inflows</span>
                          <span className="text-xl font-bold">Income Summary</span>
                        </div>
                        <div className="space-y-3">
                          <div className="flex flex-col py-3 border-b border-[#141414]/10">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-bold text-[#141414]">Total Gross Income</span>
                              <span className="text-sm font-black text-[#141414]">{formatCurrency(hoveredData.income + hoveredData.rmdAmount + hoveredData.withdrawnFromTraditional + hoveredData.ssIncome + hoveredData.qualifiedDividends + hoveredData.ordinaryDividends + (hoveredData.events?.filter((e: any) => e.type === 'inflow').reduce((acc: number, e: any) => acc + Math.abs(e.amount), 0) || 0))}</span>
                            </div>
                            
                            <div className="bg-[#141414]/5 p-3 rounded-xl space-y-2">
                              {hoveredData.income > 0 && (
                                <div className="flex justify-between items-center text-[11px]">
                                  <span className="text-[#141414]/50 font-bold uppercase tracking-tight flex items-center gap-2">
                                    <Briefcase className="w-3 h-3 text-[#141414]/30" /> W-2 Salary
                                  </span>
                                  <span className="font-bold">{formatCurrency(hoveredData.income)}</span>
                                </div>
                              )}
                              {hoveredData.ssIncome > 0 && (
                                <div className="flex justify-between items-center text-[11px]">
                                  <span className="text-[#141414]/50 font-bold uppercase tracking-tight flex items-center gap-2">
                                    <Users className="w-3 h-3 text-[#141414]/30" /> Social Security
                                  </span>
                                  <span className="font-bold">{formatCurrency(hoveredData.ssIncome)}</span>
                                </div>
                              )}
                              {(hoveredData.rmdAmount > 0 || hoveredData.withdrawnFromTraditional > 0) && (
                                <div className="flex justify-between items-center text-[11px]">
                                  <span className="text-[#141414]/50 font-bold uppercase tracking-tight flex items-center gap-2">
                                    <History className="w-3 h-3 text-[#141414]/30" /> Retirement Distributions
                                  </span>
                                  <span className="font-bold">{formatCurrency(hoveredData.rmdAmount + hoveredData.withdrawnFromTraditional)}</span>
                                </div>
                              )}
                              {(hoveredData.qualifiedDividends > 0 || hoveredData.ordinaryDividends > 0) && (
                                <div className="flex justify-between items-center text-[11px]">
                                  <span className="text-[#141414]/50 font-bold uppercase tracking-tight flex items-center gap-2">
                                    <TrendingUp className="w-3 h-3 text-[#141414]/30" /> Dividends & Interest
                                  </span>
                                  <span className="font-bold">{formatCurrency(hoveredData.qualifiedDividends + hoveredData.ordinaryDividends)}</span>
                                </div>
                              )}
                              {hoveredData.events?.filter((e: any) => e.type === 'inflow').map((e: any) => (
                                <div key={e.id} className="flex justify-between items-center text-[11px] text-green-600">
                                  <span className="font-bold uppercase tracking-tight flex items-center gap-2">
                                    <Zap className="w-3 h-3 text-green-600/30" /> {e.name}
                                  </span>
                                  <span className="font-black">{formatCurrency(Math.abs(e.amount))}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Column 3: Annual Outflows & Savings */}
                      <div className="space-y-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-1">Annual Outflows</span>
                          <span className="text-xl font-bold">Spending & Savings</span>
                        </div>
                        <div className="space-y-3">
                          <div className="flex flex-col py-2 border-b border-[#141414]/5">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-[#141414]/60">Total Spending</span>
                              <span className="text-sm font-bold text-[#F27D26]">{formatCurrency(hoveredData.spending)}</span>
                            </div>
                            {hoveredData.events?.filter((e: any) => e.type === 'expense').length > 0 && (
                              <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1">
                                {hoveredData.events?.filter((e: any) => e.type === 'expense').map((e: any) => (
                                  <span key={e.id} className="text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded flex items-center gap-1 font-bold">
                                    <ArrowDownToLine className="w-2.5 h-2.5" /> {e.name}: {formatCurrency(Math.abs(e.amount))}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col py-3 border-b border-[#141414]/10">
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-2">
                                <AppTooltip content="Total annual federal tax obligation (Ordinary + Capital Gains + Penalties).">
                                  <span className="text-sm font-bold text-[#141414] cursor-help border-b border-dotted border-[#141414]/10">Total Taxes Paid</span>
                                </AppTooltip>
                              </div>
                              <span className="text-sm font-black text-red-500">{formatCurrency(hoveredData.taxPaid)}</span>
                            </div>
                            
                            <div className="bg-[#141414]/5 p-3 rounded-xl space-y-2">
                              <div className="flex justify-between items-center text-[11px]">
                                <span className="text-[#141414]/50 font-bold uppercase tracking-tight">Ordinary Income Tax</span>
                                <span className="font-bold">{formatCurrency(hoveredData.ordinaryTaxPaid)}</span>
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-[11px]">
                                  <AppTooltip content="Long-term capital gains and qualified dividends are taxed at lower preferential rates (0%, 15%, or 20%).">
                                    <span className="text-[#141414]/50 font-bold uppercase tracking-tight cursor-help border-b border-dotted border-[#141414]/10">LTCG / Qual. Div Tax</span>
                                  </AppTooltip>
                                  <span className="font-bold">{formatCurrency(hoveredData.capitalGainsTaxPaid)}</span>
                                </div>
                                {hoveredData.capitalGainsTaxPaid === 0 && hoveredData.taxableCapitalGains > 0 && (
                                  <p className="text-[9px] leading-tight text-[#141414]/40 italic ml-2 border-l border-[#141414]/10 pl-2">
                                    {formatCurrency(hoveredData.taxableCapitalGains)} in gains taxed at 0% because your total taxable income sits below the LTCG threshold.
                                  </p>
                                )}
                              </div>
                              {hoveredData.earlyWithdrawalPenalty > 0 && (
                                <div className="flex justify-between items-center text-[11px] text-red-500">
                                  <AppTooltip content="A 10% federal penalty applies to traditional retirement account withdrawals taken before age 59.5.">
                                    <span className="font-black uppercase tracking-tight cursor-help border-b border-dotted border-red-500/20">Early Penalty (10%)</span>
                                  </AppTooltip>
                                  <span className="font-black">{formatCurrency(hoveredData.earlyWithdrawalPenalty)}</span>
                                </div>
                              )}
                              <div className="pt-2 border-t border-[#141414]/5 flex justify-between items-center text-[10px]">
                                <div className="flex items-center gap-4">
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-1">
                                      <span className="text-[#141414]/30 font-black uppercase tracking-widest text-[8px]">Effective</span>
                                    </div>
                                    <AppTooltip content={hoveredData.earlyWithdrawalPenalty > 0 && hoveredData.effectiveRate > hoveredData.marginalRate 
                                      ? `Effective rate (${hoveredData.effectiveRate.toFixed(1)}%) is higher than your marginal bracket because it includes the 10% early withdrawal penalty.`
                                      : "Total tax paid divided by total taxable income."
                                    }>
                                      <span className={cn(
                                        "font-bold transition-colors cursor-help",
                                        hoveredData.earlyWithdrawalPenalty > 0 && hoveredData.effectiveRate > hoveredData.marginalRate ? "text-red-500" : "text-[#141414]/60"
                                      )}>
                                        {hoveredData.effectiveRate.toFixed(1)}%
                                      </span>
                                    </AppTooltip>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[#141414]/30 font-black uppercase tracking-widest text-[8px]">Marginal</span>
                                    <AppTooltip content="The tax bracket of your highest dollar of ordinary income. Does not include penalties or LTCG rates.">
                                      <span className="font-bold text-[#141414]/60 cursor-help">{hoveredData.marginalRate.toFixed(0)}%</span>
                                    </AppTooltip>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-[#141414]/30 font-black uppercase tracking-widest text-[8px] block">Taxable Basis</span>
                                  {(() => {
                                    const yearOffset = hoveredData.age - params.currentAge;
                                    const currentDeduction = STANDARD_DEDUCTION[params.filingStatus] || 0;
                                    const deductionValue = currentDeduction * Math.pow(1 + params.inflationRate, yearOffset);
                                    return (
                                      <AppTooltip content={`The total income amount used to calculate federal taxes after the standard deduction of ${formatCurrency(deductionValue)}. This is estimated by adjusting the current ${params.filingStatus} deduction (${formatCurrency(currentDeduction)}) for ${ (params.inflationRate * 100).toFixed(1)}% annual inflation.`}>
                                        <span className="font-bold text-[#141414]/60 cursor-help border-b border-dotted border-[#141414]/10">{formatCurrency(hoveredData.taxableIncome)}</span>
                                      </AppTooltip>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="pt-2 border-t border-[#141414]/10">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-bold">Net Savings</span>
                              <span className={`text-sm font-bold ${hoveredData.income + hoveredData.ssIncome + hoveredData.rmdAmount + hoveredData.withdrawnFromTraditional + hoveredData.qualifiedDividends + hoveredData.ordinaryDividends + (hoveredData.events?.filter((e: any) => e.type === 'inflow').reduce((acc: number, e: any) => acc + Math.abs(e.amount), 0) || 0) - hoveredData.spending - hoveredData.taxPaid >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {formatCurrency(hoveredData.income + hoveredData.ssIncome + hoveredData.rmdAmount + hoveredData.withdrawnFromTraditional + hoveredData.qualifiedDividends + hoveredData.ordinaryDividends + (hoveredData.events?.filter((e: any) => e.type === 'inflow').reduce((acc: number, e: any) => acc + Math.abs(e.amount), 0) || 0) - hoveredData.spending - hoveredData.taxPaid)}
                              </span>
                            </div>

                            <div className="space-y-1.5 mt-2">
                              {hoveredData.traditional401kContribution > 0 && (
                                <div className="flex justify-between items-center text-xs text-[#141414]/60">
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#141414]" />
                                    <span>Traditional 401(k)</span>
                                  </div>
                                  <span className="font-bold">{formatCurrency(hoveredData.traditional401kContribution)}</span>
                                </div>
                              )}
                              {hoveredData.megaRothContribution > 0 && (
                                <div className="flex justify-between items-center text-xs text-[#F27D26]">
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#F27D26]" />
                                    <span>Mega Backdoor Roth</span>
                                  </div>
                                  <span className="font-bold">{formatCurrency(hoveredData.megaRothContribution)}</span>
                                </div>
                              )}
                              {(() => {
                                const netVal = hoveredData.income + hoveredData.ssIncome + hoveredData.rmdAmount + hoveredData.withdrawnFromTraditional + hoveredData.qualifiedDividends + hoveredData.ordinaryDividends + (hoveredData.events?.filter((e: any) => e.type === 'inflow').reduce((acc: number, e: any) => acc + Math.abs(e.amount), 0) || 0) - hoveredData.spending - hoveredData.taxPaid;
                                const brokSurplus = Math.max(0, netVal - (hoveredData.megaRothContribution || 0));
                                
                                if (netVal >= 0) {
                                  return brokSurplus > 0 ? (
                                    <div className="flex justify-between items-center text-xs text-[#6366F1]">
                                      <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1]" />
                                        <span>Brokerage Investment</span>
                                      </div>
                                      <span className="font-bold">{formatCurrency(brokSurplus)}</span>
                                    </div>
                                  ) : null;
                                }
                                
                                return (
                                  <p className="text-[10px] text-[#141414]/40 italic leading-tight mt-2">
                                    Gap funded via: {[
                                      hoveredData.withdrawnFromBrokerage > 0 ? "Brokerage" : null,
                                      hoveredData.withdrawnFromTraditional > 0 ? "Traditional" : null,
                                      hoveredData.withdrawnFromRoth > 0 ? "Roth" : null
                                    ].filter(Boolean).join(" → ")}
                                  </p>
                                );
                              })()}
                            </div>
                            {hoveredData.earlyWithdrawalPenalty > 0 && (
                              <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-100">
                                <div className="flex items-center gap-1.5 text-red-600 mb-0.5">
                                  <ShieldAlert className="w-3 h-3" />
                                  <span className="text-[9px] font-bold uppercase tracking-wider">Early Penalty Applied</span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] font-bold text-red-600">
                                  <span>10% Federal Penalty:</span>
                                  <span>{formatCurrency(hoveredData.earlyWithdrawalPenalty)}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Planned Events Section removed per user request */}

              <div className="bg-white p-8 rounded-2xl border border-[#141414]/5 shadow-sm">
                <h3 className="text-lg font-bold tracking-tight mb-6">RMD Impact</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <LineChart data={results.years.filter(y => y.age >= 70)}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#14141410" />
                      <XAxis 
                        dataKey="age" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 12}} 
                        ticks={getXAxisTicks(results.years.filter(y => y.age >= 70), false)}
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} tickFormatter={(v) => `$${v/1000}k`} />
                      <ReferenceLine 
                        x={73} 
                        stroke="#141414" 
                        strokeDasharray="3 3" 
                        label={{ value: 'RMD Start', position: 'insideTopLeft', fontSize: 10, fill: '#141414', fontWeight: 'bold' }} 
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(v: number) => formatCurrency(v)}
                      />
                      <Line type="monotone" dataKey="rmdAmount" stroke="#F27D26" strokeWidth={3} dot={false} name="RMD Amount" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-[#141414]/40 mt-4">RMDs are mandatory withdrawals that can push you into higher tax brackets.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Education Content */}
          <div className={cn(
            "space-y-12 pb-20",
            activeTab === 'education' ? "block" : "hidden"
          )}>
            <section>
              <h2 className="text-3xl font-bold tracking-tight mb-6">Strategic Financial Planning</h2>
              <p className="text-lg text-[#141414]/60 leading-relaxed max-w-3xl">
                For high-income earners, the "Tax Bomb" of Required Minimum Distributions (RMDs) is a significant risk. 
                By strategically using gap years and Roth conversions, you can dramatically reduce your lifetime tax burden.
              </p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Understanding RMDs */}
              <div className="bg-white p-8 rounded-3xl border border-[#141414]/5 shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-12 h-12 bg-[#141414]/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#141414] group-hover:text-white transition-colors">
                  <History className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold tracking-tight mb-4">Understanding RMDs</h3>
                <div className="space-y-4 text-[#141414]/60 text-sm leading-relaxed">
                  <p>
                    Required Minimum Distributions (RMDs) are mandatory withdrawals from traditional 401(k) and IRA accounts starting at age 73.
                  </p>
                  <p>
                    If your balances are large, RMDs can exceed your actual spending needs, forcing you into high tax brackets and potentially increasing Medicare premiums (IRMAA).
                  </p>
                </div>
              </div>

              {/* The Roth Conversion Ladder */}
              <div className="bg-white p-8 rounded-3xl border border-[#141414]/5 shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-12 h-12 bg-[#141414]/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#141414] group-hover:text-white transition-colors">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold tracking-tight mb-4">Conversion Strategy</h3>
                <div className="space-y-4 text-[#141414]/60 text-sm leading-relaxed">
                  <p>
                    A Roth conversion involves moving money from a Traditional IRA to a Roth IRA. You pay taxes now to enjoy tax-free growth and no future RMDs.
                  </p>
                  <p>
                    The "Gap Year" strategy leverages low-income years to perform these conversions at the lowest possible tax brackets.
                  </p>
                </div>
              </div>

              {/* Tax Diversification */}
              <div className="bg-white p-8 rounded-3xl border border-[#141414]/5 shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-12 h-12 bg-[#141414]/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#141414] group-hover:text-white transition-colors">
                  <Wallet className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold tracking-tight mb-4">Tax Diversification</h3>
                <div className="space-y-4 text-[#141414]/60 text-sm leading-relaxed">
                  <p>
                    While Traditional accounts look larger on paper, Roth accounts provide "clean" dollars that aren't subject to future tax hikes.
                  </p>
                  <p>
                    By having assets in different "buckets" (Roth, Traditional, Brokerage), you gain maximum flexibility in how you fund your lifestyle.
                  </p>
                </div>
              </div>

              {/* Backdoor Roth IRA */}
              <div className="bg-white p-8 rounded-3xl border border-[#141414]/5 shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-12 h-12 bg-[#141414]/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#141414] group-hover:text-white transition-colors">
                  <Key className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold tracking-tight mb-4">Backdoor Roth IRA</h3>
                <div className="space-y-4 text-[#141414]/60 text-sm leading-relaxed">
                  <p>
                    If your income is too high to contribute directly to a Roth IRA, you can use the "Backdoor" method: contribute to a non-deductible Traditional IRA, then immediately convert it to Roth.
                  </p>
                  <p>
                    This tool helps you visualize how these small annual moves, combined with large "Gap Year" conversions, can shift your entire portfolio's tax profile.
                  </p>
                </div>
              </div>

              {/* Sources of Income */}
              <div className="bg-white p-8 rounded-3xl border border-[#141414]/5 shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-12 h-12 bg-[#141414]/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#141414] group-hover:text-white transition-colors">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold tracking-tight mb-4">Sources of Income</h3>
                <div className="space-y-4 text-[#141414]/60 text-sm leading-relaxed">
                  <p>
                    The simulation tracks three primary income streams: <strong>W-2 Income</strong> (wages), <strong>Social Security</strong>, and <strong>RMDs</strong>.
                  </p>
                  <p>
                    During "Gap Years", W-2 income is replaced by a lower amount, creating a tax window for efficient Roth conversions.
                  </p>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-[#141414]/5 shadow-sm">
                <div className="w-12 h-12 bg-[#141414]/5 rounded-2xl flex items-center justify-center mb-6">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold tracking-tight mb-4">Excess Savings Logic</h3>
                <div className="space-y-4 text-[#141414]/60 text-sm leading-relaxed">
                  <p>
                    When your annual income exceeds your spending and taxes, the simulation automatically saves the surplus. The <strong>Saving Hierarchy</strong> follows standard financial optimization:
                  </p>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li><strong>Traditional 401(k):</strong> Contributions up to your limit reduce your taxable income dollar-for-dollar.</li>
                    <li><strong>Mega Backdoor Roth:</strong> After-tax contributions are shifted into your Roth balance for tax-free growth.</li>
                    <li><strong>Brokerage:</strong> Any remaining surplus is invested in your taxable brokerage account.</li>
                  </ol>
                </div>
              </div>
            </div>

            <section className="pt-12 border-t border-[#141414]/10">
              <h2 className="text-2xl font-bold tracking-tight mb-6">The Trade-off: Taxes vs. Total Wealth</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <p className="text-[#141414]/60 text-sm leading-relaxed">
                    It is a common misconception that minimizing taxes always maximizes wealth. In this simulation, you may notice that increasing your "Gap Years" or conversion amounts can actually lead to a lower final balance. This happens for four primary reasons:
                  </p>
                  <ul className="space-y-4">
                    <li className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#141414]/5 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-tight">The Income Gap</p>
                        <p className="text-[#141414]/60 text-xs leading-relaxed">Choosing to take a "Gap Year" means sacrificing peak-earning W-2 income. The loss of millions in lifetime earnings often far outweighs the thousands saved in taxes.</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#141414]/5 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-tight">Market Drag</p>
                        <p className="text-[#141414]/60 text-xs leading-relaxed">When you pay taxes on a conversion today, that money is removed from your brokerage account. You lose the compound interest that money would have earned over the next 30 years.</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#141414]/5 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-tight">The 59.5 Rule</p>
                        <p className="text-[#141414]/60 text-xs leading-relaxed">Starting gap years too early can force "Early Withdrawals" from Traditional accounts to cover living expenses, triggering a 10% federal penalty that drags down your total capital.</p>
                      </div>
                    </li>
                  </ul>
                </div>
                <div className="bg-[#141414]/5 p-8 rounded-2xl border border-[#141414]/5">
                  <h3 className="text-sm font-bold uppercase tracking-widest mb-4">How to Optimize</h3>
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm">
                      <p className="text-xs font-bold mb-1">"Fill the Bracket"</p>
                      <p className="text-[#141414]/60 text-[11px] leading-relaxed">Don't convert everything at once. Use the simulation to find a conversion amount that keeps your marginal tax rate at or below 22% or 24%.</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm">
                      <p className="text-xs font-bold mb-1">Target RMDs, Not Zero Tax</p>
                      <p className="text-[#141414]/60 text-[11px] leading-relaxed">Your goal is to reduce RMDs enough so they don't push you into a higher bracket at age 73, not necessarily to eliminate them entirely at the cost of your current capital.</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm">
                      <p className="text-xs font-bold mb-1">Watch the "Net Savings"</p>
                      <p className="text-[#141414]/60 text-[11px] leading-relaxed">Hover over the chart during gap years. If your net savings is deeply negative, you are depleting assets too fast. Adjust spending or duration to stabilize the curve.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="pt-12 border-t border-[#141414]/10">
              <div className="bg-white p-8 rounded-2xl border border-[#141414]/5 shadow-sm flex flex-col md:flex-row gap-8 items-center">
                <div className="w-16 h-16 bg-[#F5F5F4] rounded-2xl flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-8 h-8 text-[#141414]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Your Privacy & Data Security</h3>
                  <p className="text-[#141414]/60 text-sm leading-relaxed">
                    We believe financial planning should be private. All calculations are performed locally in your browser. 
                    Your balances, income, and personal details are <strong>never uploaded to a server</strong>, never saved in a database, 
                    and never shared with third parties. When you refresh the page, all entered data is cleared.
                  </p>
                </div>
              </div>
            </section>
          </div>
          
          {/* Legacy Content */}
          {activeTab === 'legacy' && (
            <div className="space-y-12 pb-20">
              <section>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold tracking-tight mb-2">Succession & Legacy</h2>
                    <p className="text-sm text-[#141414]/50">Evaluating the net inheritance value for your beneficiaries.</p>
                  </div>
                  <div className="flex flex-wrap items-end gap-6 h-full">
                    <div className="w-full md:w-64 bg-white p-4 rounded-2xl border border-[#141414]/10 shadow-sm self-stretch flex flex-col justify-center">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#141414]/40" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">Snapshot Age</span>
                        </div>
                        <span className="text-sm font-bold text-[#141414]">{legacyAge}</span>
                      </div>
                      <input 
                        type="range"
                        min={params.currentAge}
                        max={100}
                        value={legacyAge}
                        onChange={(e) => setLegacyAge(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-[#141414]/5 rounded-lg appearance-none cursor-pointer accent-[#141414]"
                      />
                      <div className="flex justify-between mt-2">
                        <span className="text-[8px] font-bold text-[#141414]/30 uppercase">Today</span>
                        <span className="text-[8px] font-bold text-[#141414]/30 uppercase">Age 100</span>
                      </div>
                    </div>

                    <div className="w-full md:w-64 bg-white p-4 rounded-2xl border border-[#141414]/10 shadow-sm self-stretch flex flex-col justify-center">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#141414]/40" />
                          <AppTooltip content="Beneficiary's estimated annual taxable income. Used to calculate their marginal bracket for the required 10-year distribution of Traditional assets.">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 cursor-help border-b border-dotted border-[#141414]/10">Heir Income</span>
                          </AppTooltip>
                        </div>
                        <span className="text-sm font-bold text-[#141414]">{formatCurrency(heirBaseIncome)}</span>
                      </div>
                      <input 
                        type="range"
                        min={0}
                        max={500000}
                        step={5000}
                        value={heirBaseIncome}
                        onChange={(e) => setHeirBaseIncome(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-[#141414]/5 rounded-lg appearance-none cursor-pointer accent-[#141414]"
                      />
                      <div className="flex justify-between mt-2">
                        <span className="text-[8px] font-bold text-[#141414]/30 uppercase">$0</span>
                        <span className="text-[8px] font-bold text-[#141414]/30 uppercase">$500k</span>
                      </div>
                    </div>
                  </div>
                </div>

                {(() => {
                  const targetYear = results.years.find(y => y.age === legacyAge) || results.years[results.years.length - 1];
                  const grossEstate = targetYear.brokerageBalance + targetYear.rothBalance + targetYear.traditionalBalance;
                  
                  // Calculate estimated heir tax rate using 10-year rule
                  // We assume a 10-year equal distribution on top of baseline income
                  const ANNUAL_DISTRIBUTION = targetYear.traditionalBalance / 10;
                  const HEIR_STATUS = 'Single';
                  
                  // Simple tax estimation for the heir
                  const baselineTaxable = Math.max(0, heirBaseIncome - STANDARD_DEDUCTION[HEIR_STATUS]);
                  const combinedTaxable = Math.max(0, heirBaseIncome + ANNUAL_DISTRIBUTION - STANDARD_DEDUCTION[HEIR_STATUS]);
                  
                  // We use inflationFactor=1 for a "today's dollars" estimation of brackets
                  const baseTax = calculateTax(baselineTaxable, HEIR_STATUS, 1).tax;
                  const combinedTax = calculateTax(combinedTaxable, HEIR_STATUS, 1).tax;
                  
                  const annualAdditionalTax = combinedTax - baseTax;
                  const totalEstimatedTax = annualAdditionalTax * 10;
                  const HEIR_TAX_RATE = targetYear.traditionalBalance > 0 ? totalEstimatedTax / targetYear.traditionalBalance : 0.25;
                  
                  const estimatedHeirTax = totalEstimatedTax;
                  const netToHeirs = grossEstate - estimatedHeirTax;

                  // Adaptive analysis logic
                  const conversionYears = results.years.filter(y => y.isConverting);
                  const isCurrentlyConverting = conversionYears.length > 0;
                  const avgConversionRate = isCurrentlyConverting 
                    ? conversionYears.reduce((acc, y) => acc + y.marginalRate, 0) / conversionYears.length 
                    : 0;
                  
                  const isHighRateConversion = isCurrentlyConverting && avgConversionRate > (HEIR_TAX_RATE * 100);
                  const isHugeTradBalance = targetYear.traditionalBalance > 2000000;

                  return (
                    <div className="grid grid-cols-1 gap-8">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-[#141414]/5 shadow-sm">
                          <p className="text-[10px] uppercase tracking-widest text-[#141414]/40 font-bold mb-1">Gross Estate</p>
                          <p className="text-2xl font-bold tabular-nums">
                            {formatCurrency(grossEstate)}
                          </p>
                          <p className="text-[10px] text-[#141414]/40 mt-1">Total assets remaining at age {legacyAge}.</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-[#141414]/5 shadow-sm">
                          <p className="text-[10px] uppercase tracking-widest text-[#141414]/40 font-bold mb-1">Tax Liability for Heirs</p>
                          <p className="text-2xl font-bold tabular-nums text-red-500">
                            {formatCurrency(estimatedHeirTax)}
                          </p>
                          <p className="text-[10px] text-[#141414]/40 mt-1 italic">Est. {(HEIR_TAX_RATE * 100).toFixed(1)}% avg. tax on Traditional IRA assets (10-yr rule).</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-[#141414]/5 shadow-sm">
                          <p className="text-[10px] uppercase tracking-widest text-[#141414]/40 font-bold mb-1">Net to Heirs (True Value)</p>
                          <p className="text-2xl font-bold tabular-nums text-green-600">
                            {formatCurrency(netToHeirs)}
                          </p>
                          <p className="text-[10px] text-[#141414]/40 mt-1">What your beneficiaries actually keep.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white p-8 rounded-2xl border border-[#141414]/5 shadow-sm">
                          <h3 className="text-lg font-bold mb-6">Inheritance Composition (Age {legacyAge})</h3>
                          <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                              <PieChart>
                                <Pie
                                  data={[
                                    { name: 'Brokerage', value: targetYear.brokerageBalance, color: '#6366F1' },
                                    { name: 'Roth', value: targetYear.rothBalance, color: '#F27D26' },
                                    { name: 'Traditional', value: targetYear.traditionalBalance, color: '#141414' },
                                  ]}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={100}
                                  paddingAngle={5}
                                  dataKey="value"
                                >
                                  <Cell fill="#6366F1" />
                                  <Cell fill="#F27D26" />
                                  <Cell fill="#141414" />
                                </Pie>
                                <Tooltip 
                                  formatter={(value: number) => formatCurrency(value)}
                                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid rgba(20,20,20,0.1)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className={cn(
                            "p-6 rounded-2xl border transition-all",
                            isHighRateConversion ? "bg-amber-50 border-amber-200" : "bg-white border-[#141414]/5"
                          )}>
                            <div className="flex items-center gap-3 mb-4">
                              <ShieldAlert className={cn("w-5 h-5", isHighRateConversion ? "text-amber-500" : "text-[#141414]/20")} />
                              <h3 className="font-bold">Adaptive Strategic Feedback</h3>
                            </div>
                            <div className="text-sm text-[#141414]/60 leading-relaxed space-y-3">
                              {isHighRateConversion ? (
                                <>
                                  <p className="text-amber-900 font-medium">Warning: Potential Reverse Arbitrage</p>
                                  <p>
                                    Your current simulation converts assets at an average tax rate of <strong>{avgConversionRate.toFixed(1)}%</strong>. 
                                    However, we estimate your heirs might pay <strong>{(HEIR_TAX_RATE * 100).toFixed(1)}%</strong> on inherited Traditional assets.
                                  </p>
                                  <p>
                                    By paying tax now at a higher rate, you are reducing the "Gross Estate" more than you are saving the heirs in future taxes. This is why your <strong>Net to Heirs</strong> may be lower compared to a no-conversion strategy.
                                  </p>
                                </>
                              ) : isCurrentlyConverting ? (
                                <>
                                  <p className="text-green-700 font-medium">Success: Tax Arbitrage Optimal</p>
                                  <p>
                                    You are converting at an average rate of <strong>{avgConversionRate.toFixed(1)}%</strong>, which is lower than or equal to the estimated <strong>{(HEIR_TAX_RATE * 100).toFixed(1)}%</strong> heir bracket.
                                  </p>
                                  <p>
                                    This "buys" future tax-free growth for your heirs at a discount today, maximizing their final purchasing power.
                                  </p>
                                </>
                              ) : isHugeTradBalance ? (
                                <>
                                  <p className="text-red-700 font-medium">Alert: The Traditional "Tax Bomb"</p>
                                  <p>
                                    With over {formatCurrency(2000000)} in Traditional IRA assets at age {legacyAge}, your heirs face a massive mandatory liquidation under the SECURE Act 10-year rule.
                                  </p>
                                  <p>
                                    Consider Roth conversions to shift this weight into tax-free buckets, even if it slightly reduces the gross number, to shield them from high future marginal brackets.
                                  </p>
                                </>
                              ) : (
                                <p>
                                  Your current plan balances tax-deferred growth with a manageable distribution for heirs. To optimize further, look at the "Arbitrage Gap" between your current tax bracket and your beneficiaries' likely future brackets.
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="bg-[#141414] text-white p-6 rounded-2xl shadow-xl">
                            <div className="flex items-center gap-3 mb-4 font-bold">
                              <Heart className="w-5 h-5 text-red-500" />
                              <h3>Estate Planning Pillars</h3>
                            </div>
                            <div className="space-y-4 text-xs text-white/70 leading-relaxed">
                              <p>
                                <strong className="text-white">Step-Up In Basis:</strong> Brokerage assets receive a "step-up" at death, making all prior gains tax-free for heirs.
                              </p>
                              <p>
                                <strong className="text-white">The 10-Year Rule:</strong> Most heirs must empty Traditional IRAs within 10 years, potentially pushing them into their highest career tax brackets.
                              </p>
                              <p>
                                <strong className="text-white">Roth Flexibility:</strong> Inherited Roth IRAs are tax-free and not subject to RMDs during the 10-year window, allowing for maximum compound growth.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-8 rounded-3xl border border-[#141414]/5 shadow-sm">
                        <div className="flex items-center gap-3 mb-6 font-bold text-xl text-[#141414]">
                          <DollarSign className="w-6 h-6 text-[#141414]/20" />
                          <span>Advisor Perspective: Purchasing Power vs. Balance</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm leading-relaxed text-[#141414]/60">
                          <div className="space-y-4">
                            <p>
                              A lower "Net to Heirs" doesn't always mean a failed strategy. If you pay taxes at 24% today to avoid a 37% hit for your heirs later, you've saved them money in real terms, even if the absolute dollar amount in the account was slightly higher yesterday.
                            </p>
                          </div>
                          <div className="space-y-4">
                            <p>
                              The <strong>effective tax inheritance rate</strong> is the ultimate metric. By shifting from tax-trapped Traditional dollars to "clean" Roth dollars, you provide your family with flexibility and shield them from future legislative tax hikes.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </section>
            </div>
          )}


          {/* Methodology & Disclosures Content */}
          <div className={cn(
            "space-y-12 pb-20",
            activeTab === 'methodology' ? "block" : "hidden"
          )}>
            <section>
              <h2 className="text-3xl font-bold tracking-tight mb-8">Simulation Methodology & Logic</h2>
              <div className="grid grid-cols-1 gap-8">
                <div className="bg-white p-8 rounded-2xl border border-[#141414]/5 shadow-sm">
                  <div className="space-y-12">
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#141414]/5 flex items-center justify-center text-[10px] font-bold">01</div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Predictions & Growth</h4>
                      </div>
                      <ul className="space-y-4 text-sm text-[#141414]/60">
                        <li>
                          <p><strong className="text-[#141414] text-xs uppercase tracking-tight">Income:</strong> W-2 income grows annually by the "Annual Income Increase %" until retirement or gap years.</p>
                        </li>
                        <li>
                          <p><strong className="text-[#141414] text-xs uppercase tracking-tight">Social Security:</strong> Assumes a full work history (since age 23) to estimate benefits. Benefits are adjusted for inflation annually.</p>
                        </li>
                        <li>
                          <p><strong className="text-[#141414] text-xs uppercase tracking-tight">Market:</strong> All account balances grow annually by the "Market Growth Rate %" (compounded).</p>
                        </li>
                        <li>
                          <p><strong className="text-[#141414] text-xs uppercase tracking-tight">Inflation:</strong> Spending needs, tax brackets, and standard deductions are adjusted annually by the "Inflation Rate %".</p>
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#141414]/5 flex items-center justify-center text-[10px] font-bold">02</div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Tax Logic</h4>
                      </div>
                      <ul className="space-y-4 text-sm text-[#141414]/60">
                        <li>
                          <p><strong className="text-[#141414] text-xs uppercase tracking-tight">Brackets:</strong> Uses current 2026 Federal Income Tax brackets (Single/MFJ) as the baseline. These brackets and standard deductions are adjusted annually by the "Inflation Rate %" to prevent "bracket creep" over time.</p>
                        </li>
                        <li>
                          <p><strong className="text-[#141414] text-xs uppercase tracking-tight">SS Tax:</strong> Social Security is taxed based on "Combined Income" (AGI + 50% of SS). Up to 85% of benefits can be taxable.</p>
                        </li>
                        <li>
                          <p><strong className="text-[#141414] text-xs uppercase tracking-tight">Cap. Gains:</strong> Long-term capital gains tax is calculated on brokerage withdrawals based on the account's cost basis. It uses the 0% / 15% / 20% federal LTCG brackets, applied "on top" of ordinary income.</p>
                        </li>
                        <li>
                          <p><strong className="text-[#141414] text-xs uppercase tracking-tight">Dividends:</strong> Brokerage assets generate annual qualified and ordinary dividends. Ordinary dividends are taxed at regular income rates, while qualified dividends use the same "ladder" as LTCG (0%/15%/20%). Dividends are automatically reinvested, increasing the account's cost basis.</p>
                        </li>
                        <li>
                          <p><strong className="text-[#141414] text-xs uppercase tracking-tight">Penalties:</strong> A 10% early withdrawal penalty is applied to Traditional/Roth withdrawals before age 59.5.</p>
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#141414]/5 flex items-center justify-center text-[10px] font-bold">03</div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Net Savings & Funding</h4>
                      </div>
                      <ul className="space-y-4 text-sm text-[#141414]/60">
                        <li>
                          <p><strong className="text-[#141414] text-xs uppercase tracking-tight">Savings:</strong> Any positive net savings (income &gt; spending + taxes) are automatically reinvested into the Brokerage account.</p>
                        </li>
                        <li>
                          <p><strong className="text-[#141414] text-xs uppercase tracking-tight">Funding Priority:</strong> When net savings are negative, the engine pulls from accounts in this order: 1. Brokerage &rarr; 2. Traditional &rarr; 3. Roth. However, if "Avoid Early Penalty" is enabled and the individual is under age 59.5, the engine prioritizes Roth before Traditional to bypass the 10% federal penalty.</p>
                        </li>
                        <li>
                          <p><strong className="text-[#141414] text-xs uppercase tracking-tight">RMDs:</strong> Calculated starting at age 73 using the IRS Uniform Lifetime Table (Divisor decreases annually).</p>
                        </li>
                        <li>
                          <p><strong className="text-[#141414] text-xs uppercase tracking-tight">Conversions:</strong> Roth conversions are treated as taxable income and moved from Traditional to Roth accounts.</p>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="pt-12 border-t border-[#141414]/10">
              <h2 className="text-3xl font-bold tracking-tight mb-8">Simulation Self-Critique & Technical Limitations</h2>
              <div className="grid grid-cols-1 gap-8">
                <div className="bg-white p-8 rounded-2xl border border-[#141414]/5 shadow-sm">
                  <h3 className="text-xl font-bold mb-4">Tax Complexities Not Modeled</h3>
                  <ul className="space-y-4 text-sm text-[#141414]/60">
                    <li className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#F27D26] mt-1.5 shrink-0" />
                      <p><strong>State Income Taxes:</strong> This simulation only considers Federal Income Tax. State taxes (ranging from 0% to 13%+) can significantly impact the net benefit of Roth conversions, especially if moving between high-tax and low-tax states.</p>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#F27D26] mt-1.5 shrink-0" />
                      <p><strong>Net Investment Income Tax (NIIT):</strong> The 3.8% surtax on investment income for high earners (MAGI &gt; $250k MFJ) is not included in the calculation.</p>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#F27D26] mt-1.5 shrink-0" />
                      <p><strong>Internal Gains Distributions:</strong> While the model accounts for annual dividends, it does not model one-off internal capital gains distributions that active funds sometimes generate, creating additional tax drag.</p>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#F27D26] mt-1.5 shrink-0" />
                      <p><strong>Medicare IRMAA:</strong> High income from RMDs or large Roth conversions can trigger Income-Related Monthly Adjustment Amounts (IRMAA), increasing Medicare Part B and D premiums by thousands per year.</p>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#F27D26] mt-1.5 shrink-0" />
                      <p><strong>Qualified Charitable Distributions (QCDs):</strong> The model does not account for the ability to satisfy RMDs via tax-free distributions to charities, which is a common strategy for reducing taxable income.</p>
                    </li>
                  </ul>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-[#141414]/5 shadow-sm">
                  <h3 className="text-xl font-bold mb-4">Structural Assumptions</h3>
                  <ul className="space-y-4 text-sm text-[#141414]/60">
                    <li className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#141414] mt-1.5 shrink-0" />
                      <p><strong>Sequence of Returns Risk:</strong> The model assumes a constant growth rate. A market crash early in retirement (Sequence Risk) can drastically change the outcome, even if the average return matches the simulation.</p>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#141414] mt-1.5 shrink-0" />
                      <p><strong>Inherited IRAs & SECURE Act:</strong> The model does not account for the "10-year rule" for non-spouse beneficiaries, which forces rapid liquidation and potentially high tax rates for heirs.</p>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#141414] mt-1.5 shrink-0" />
                      <p><strong>Health Savings Accounts (HSAs):</strong> The "triple tax advantage" of HSAs is not modeled, though they represent a significant component of many retirement strategies.</p>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#141414] mt-1.5 shrink-0" />
                      <p><strong>Alternative Minimum Tax (AMT):</strong> Complex tax situations involving AMT or specific state-level tax exclusions are beyond the scope of this simplified calculator.</p>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#141414] mt-1.5 shrink-0" />
                      <p><strong>Social Security Provisions:</strong> Complex rules like the Windfall Elimination Provision (WEP) or Government Pension Offset (GPO) are not considered.</p>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="pt-12 border-t border-[#141414]/10">
              <div className="bg-red-50 p-8 rounded-2xl border border-red-100">
                <div className="flex items-center gap-3 mb-4 text-red-700">
                  <ShieldAlert className="w-6 h-6" />
                  <h3 className="text-xl font-bold">Legal Disclaimer & Indemnification</h3>
                </div>
                <div className="space-y-4 text-sm text-red-700/80 leading-relaxed">
                  <p>
                    <strong>NOT FINANCIAL ADVICE:</strong> This tool is provided "AS IS" for educational and illustrative purposes only. The calculations are based on simplified assumptions and should not be used as the sole basis for any financial, tax, or legal decisions. The creator is not a financial advisor, CPA, or attorney.
                  </p>
                  <p>
                    <strong>NO WARRANTIES:</strong> There are no warranties, expressed or implied, regarding the accuracy, completeness, or reliability of the results provided by this simulation. Future market performance, tax laws, and inflation rates are unpredictable. Actual results will vary, potentially significantly, from these projections.
                  </p>
                  <p>
                    <strong>INDEMNIFICATION:</strong> By using this tool, you agree to indemnify, defend, and hold harmless the creator, developers, and hosting services from any and all claims, losses, liabilities, or damages (including legal fees) arising from your use of or reliance on this simulation. You assume full and sole responsibility for your financial decisions and outcomes.
                  </p>
                  <p>
                    <strong>PROFESSIONAL CONSULTATION:</strong> Tax laws are complex, highly individual, and subject to frequent change. Always consult with a qualified tax professional, CPA, or certified financial planner (CFP) before implementing any Roth conversion, gap year, or retirement strategy.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
        <AnimatePresence>
          <EventModal />
        </AnimatePresence>
      </main>
    </div>
  );
}
