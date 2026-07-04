export type FilingStatus = 'MFJ' | 'Single';

export interface OneTimeEvent {
  id: string;
  age: number;
  amount: number; // positive for inflow, negative for expense
  name: string;
  type: 'expense' | 'inflow';
}

export interface SimulationParams {
  currentAge: number;
  retirementAge: number;
  filingStatus: FilingStatus;
  currentBrokerageBalance: number;
  currentTraditionalBalance: number;
  currentRothBalance: number;
  currentIncome: number;
  annualSpending: number; // in today's dollars
  inflationRate: number;
  marketGrowthRate: number; // e.g., 0.07 for 7%
  gapYearStartAge: number;
  gapYearDuration: number;
  gapYearIncome: number; // W-2 income during gap years
  annualRothConversion: number; // Amount to convert each gap year
  incomeIncreaseRate: number; // Annual increase in W-2 income
  enableGapYear: boolean; // Whether to apply gap year strategy
  avoidEarlyPenalty: boolean; // Whether to prioritize avoiding early withdrawal penalties
  ssStartAge: number;
  ssAnnualBenefit: number; // in today's dollars
  currentBrokerageBasis: number; // For capital gains calculation
  qualifiedDividendRate: number; // Annual yield of qualified dividends
  ordinaryDividendRate: number; // Annual yield of ordinary dividends
  traditional401kContribution: number;
  megaBackdoorRothAmount: number;
  events: OneTimeEvent[];
}

export interface YearData {
  age: number;
  year: number;
  brokerageBalance: number;
  traditionalBalance: number;
  rothBalance: number;
  income: number;
  spending: number;
  taxPaid: number;
  ordinaryTaxPaid: number;
  taxableIncome: number; // Gross taxable income before deductions
  rmdAmount: number;
  ssIncome: number;
  totalBalance: number;
  conversionAmount: number;
  withdrawnFromBrokerage: number;
  withdrawnFromTraditional: number;
  withdrawnFromRoth: number;
  earlyWithdrawalPenalty: number;
  isGapYear: boolean;
  isRetired: boolean;
  filingStatus: FilingStatus;
  effectiveRate: number;
  marginalRate: number;
  inflationRef: number;
  purchasingPower: number;
  capitalGainsTaxPaid: number;
  taxableCapitalGains: number;
  dividendTaxPaid: number;
  qualifiedDividends: number;
  ordinaryDividends: number;
  isConverting: boolean;
  traditional401kContribution: number;
  megaRothContribution: number;
  events: OneTimeEvent[];
}

export interface SimulationResult {
  years: YearData[];
  totalTaxPaid: number;
  totalRmdPaid: number;
  finalBalance: number;
}
