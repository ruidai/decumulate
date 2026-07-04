// 2026 Post-TCJA Sunset Tax Brackets (Projected Estimates)
export const TAX_BRACKETS = {
  MFJ: [
    { threshold: 0, rate: 0.10 },
    { threshold: 24100, rate: 0.15 },
    { threshold: 98150, rate: 0.25 },
    { threshold: 197950, rate: 0.28 },
    { threshold: 301650, rate: 0.33 },
    { threshold: 538700, rate: 0.35 },
    { threshold: 608650, rate: 0.396 },
  ],
  Single: [
    { threshold: 0, rate: 0.10 },
    { threshold: 12050, rate: 0.15 },
    { threshold: 49075, rate: 0.25 },
    { threshold: 119750, rate: 0.28 },
    { threshold: 183925, rate: 0.33 },
    { threshold: 400400, rate: 0.35 },
    { threshold: 400401, rate: 0.396 },
  ],
};

export const STANDARD_DEDUCTION = {
  MFJ: 16400, // Includes personal exemptions for 2 people returning post-sunset
  Single: 8200, // Plus personal exemption
};

export const LTCG_BRACKETS = {
  MFJ: [
    { threshold: 0, rate: 0.00 },
    { threshold: 96700, rate: 0.15 },
    { threshold: 600050, rate: 0.20 },
  ],
  Single: [
    { threshold: 0, rate: 0.00 },
    { threshold: 48350, rate: 0.15 },
    { threshold: 533400, rate: 0.20 },
  ],
};

// RMD Uniform Lifetime Table (Approximate divisors starting at age 73)
// Age 73 is the current RMD start age for most.
export const RMD_TABLE: Record<number, number> = {
  73: 26.5,
  74: 25.5,
  75: 24.6,
  76: 23.7,
  77: 22.9,
  78: 22.0,
  79: 21.1,
  80: 20.2,
  81: 19.4,
  82: 18.5,
  83: 17.7,
  84: 16.8,
  85: 16.0,
  86: 15.2,
  87: 14.4,
  88: 13.7,
  89: 12.9,
  90: 12.2,
  91: 11.5,
  92: 10.8,
  93: 10.1,
  94: 9.5,
  95: 8.9,
  96: 8.4,
  97: 7.8,
  98: 7.3,
  99: 6.8,
  100: 6.4,
};

export const DEFAULT_PARAMS = {
  currentAge: 45,
  retirementAge: 65,
  filingStatus: 'MFJ' as const,
  currentBrokerageBalance: 500000,
  currentTraditionalBalance: 1500000,
  currentRothBalance: 0,
  currentIncome: 250000,
  annualSpending: 120000,
  inflationRate: 0.03,
  marketGrowthRate: 0.07,
  gapYearStartAge: 55,
  gapYearDuration: 3,
  gapYearIncome: 0,
  annualRothConversion: 100000,
  incomeIncreaseRate: 0.03,
  enableGapYear: true,
  avoidEarlyPenalty: true,
  ssStartAge: 67,
  ssAnnualBenefit: 45000,
  currentBrokerageBasis: 250000, // Default to 50% basis
  qualifiedDividendRate: 0.0116,
  ordinaryDividendRate: 0.0002,
  traditional401kContribution: 23000,
  megaBackdoorRothAmount: 46000,
};
