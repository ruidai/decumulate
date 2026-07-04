import { SimulationParams, SimulationResult, YearData } from '../types';
import { TAX_BRACKETS, STANDARD_DEDUCTION, RMD_TABLE, LTCG_BRACKETS } from '../constants';

export function runSimulation(params: SimulationParams): SimulationResult {
  const sanitize = (v: any) => (typeof v === 'number' && !isNaN(v) ? v : 0);

  const currentAge = Math.max(1, sanitize(params.currentAge));
  const retirementAge = sanitize(params.retirementAge);
  const filingStatus = params.filingStatus;
  const currentBrokerageBalance = sanitize(params.currentBrokerageBalance);
  const currentBrokerageBasis = sanitize(params.currentBrokerageBasis);
  const currentTraditionalBalance = sanitize(params.currentTraditionalBalance);
  const currentRothBalance = sanitize(params.currentRothBalance);
  const currentIncome = sanitize(params.currentIncome);
  const annualSpending = sanitize(params.annualSpending);
  const inflationRate = sanitize(params.inflationRate);
  const marketGrowthRate = sanitize(params.marketGrowthRate);
  const gapYearStartAge = sanitize(params.gapYearStartAge);
  const gapYearDuration = sanitize(params.gapYearDuration);
  const gapYearIncome = sanitize(params.gapYearIncome);
  const annualRothConversion = sanitize(params.annualRothConversion);

  let brokerageBalance = currentBrokerageBalance;
  let brokerageBasis = currentBrokerageBasis;
  let traditionalBalance = currentTraditionalBalance;
  let rothBalance = currentRothBalance;
  let totalTaxPaid = 0;
  let totalRmdPaid = 0;
  const years: YearData[] = [];

  const currentYear = new Date().getFullYear();

  for (let age = currentAge; age <= 100; age++) {
    const yearOffset = age - currentAge;
    const year = currentYear + yearOffset;
    const isRetired = age >= retirementAge;
    const isGapYear = params.enableGapYear && age >= gapYearStartAge && age < gapYearStartAge + gapYearDuration;

    // 1. Calculate Spending (Inflation adjusted)
    let spending = annualSpending * Math.pow(1 + inflationRate, yearOffset);

    // Filter events for this age
    const yearEvents = (params.events || []).filter(e => e.age === age);
    let eventInflow = 0;
    
    yearEvents.forEach(e => {
      if (e.type === 'expense') {
        spending += Math.abs(e.amount);
      } else {
        eventInflow += Math.abs(e.amount);
      }
    });

    // 2. Calculate Income
    let income = 0;
    let actual401kContribution = 0;
    if (!isRetired && !isGapYear) {
      income = currentIncome * Math.pow(1 + params.incomeIncreaseRate, yearOffset);
      actual401kContribution = Math.min(income, params.traditional401kContribution);
      // Traditional 401k reduces taxable income and adds to balance
      traditionalBalance += actual401kContribution;
    } else if (isGapYear) {
      income = gapYearIncome * Math.pow(1 + inflationRate, yearOffset);
    }

    // 3. Social Security Calculation
    let ssIncome = 0;
    if (age >= params.ssStartAge) {
      ssIncome = params.ssAnnualBenefit * Math.pow(1 + inflationRate, yearOffset);
    }

    // 4. RMD Calculation
    let rmdAmount = 0;
    if (age >= 73) {
      const divisor = RMD_TABLE[age] || RMD_TABLE[100];
      rmdAmount = traditionalBalance / divisor;
    }

    // 5. Roth Conversion
    let conversionAmount = 0;
    if (isGapYear) {
      conversionAmount = Math.min(annualRothConversion, traditionalBalance);
    }

    // 6. Tax Calculation (Ordinary Income & Dividends)
    const ordinaryDividends = brokerageBalance * params.ordinaryDividendRate;
    const qualifiedDividends = brokerageBalance * params.qualifiedDividendRate;

    const otherGrossIncome = (income - actual401kContribution) + rmdAmount + conversionAmount + ordinaryDividends;
    const taxableSS = calculateTaxableSS(ssIncome, otherGrossIncome + qualifiedDividends, filingStatus);
    const ordinaryGrossIncome = otherGrossIncome + taxableSS;
    
    const inflationFactor = Math.pow(1 + inflationRate, yearOffset);
    const standardDeduction = (STANDARD_DEDUCTION[filingStatus] || STANDARD_DEDUCTION.MFJ) * inflationFactor;

    // Correct Taxable Income stacking:
    // 1. Total Taxable Income = (Ordinary Gross + Qualified Dividends) - Standard Deduction
    // 2. Ordinary Taxable = max(0, Ordinary Gross - Standard Deduction)
    // 3. Qualified/LTCG Taxable = max(0, totalTaxable - ordinaryTaxable)

    const totalTaxableIncomeStart = Math.max(0, (ordinaryGrossIncome + qualifiedDividends) - standardDeduction);
    const ordinaryTaxableIncome = Math.max(0, ordinaryGrossIncome - standardDeduction);
    const ltcgTaxableIncomeStart = totalTaxableIncomeStart - ordinaryTaxableIncome;

    const { tax: ordinaryTax, marginalRate } = calculateTax(ordinaryTaxableIncome, filingStatus, inflationFactor);

    // Initial tax on qualified dividends (before any capital gains from withdrawals)
    let dividendTax = calculateCapitalGainsTax(ordinaryTaxableIncome, ltcgTaxableIncomeStart, filingStatus, inflationFactor);

    // 7. Cash Flow Management
    // Net cash flow = regular income (after 401k) + SS + RMD + dividends + eventInflow - spending - taxes so far
    let netCashFlow = (income - actual401kContribution) + rmdAmount + ssIncome + ordinaryDividends + qualifiedDividends + eventInflow - spending - ordinaryTax - dividendTax;
    let withdrawnFromBrokerage = 0;
    let withdrawnFromTraditional = 0;
    let withdrawnFromRoth = 0;
    let megaRothContribution = 0;
    let earlyWithdrawalPenalty = 0;
    let extraOrdinaryTax = 0;
    let capitalGainsTax = 0;
    let totalTaxableCapitalGains = ltcgTaxableIncomeStart; // Tracks total taxable LTCG (dividends + gains)
    let finalMarginalRate = marginalRate;

    if (netCashFlow < 0) {
      let neededFromAssets = Math.abs(netCashFlow);

      // A. Withdraw from Brokerage first
      if (brokerageBalance > 0 && neededFromAssets > 0) {
        let attempt = 0;
        const gainRatio = Math.max(0, (brokerageBalance - brokerageBasis) / brokerageBalance);
        
        while (neededFromAssets > 0.01 && brokerageBalance > 0 && attempt < 3) {
          const totalIncomeSoFar = ordinaryTaxableIncome + totalTaxableCapitalGains;
          const estimatedLtcgRate = totalIncomeSoFar > 500000 * inflationFactor ? 0.20 : 
                                   totalIncomeSoFar > 50000 * inflationFactor ? 0.15 : 0;
          
          const divisor = Math.max(0.7, 1 - (gainRatio * estimatedLtcgRate));
          let w = Math.min(brokerageBalance, neededFromAssets / divisor);
          
          const gainInWithdrawal = w * gainRatio;
          
          // New total taxable LTCG includes these new gains
          const newTotalTaxableLtcg = totalTaxableCapitalGains + gainInWithdrawal;
          const totalLtcgTax = calculateCapitalGainsTax(ordinaryTaxableIncome, newTotalTaxableLtcg, filingStatus, inflationFactor);
          const newCgTax = totalLtcgTax - dividendTax - capitalGainsTax;
          
          withdrawnFromBrokerage += w;
          totalTaxableCapitalGains = newTotalTaxableLtcg;
          capitalGainsTax += newCgTax;
          
          const basisWithdrawn = w * (1 - gainRatio);
          brokerageBalance -= w;
          brokerageBasis -= basisWithdrawn;
          
          neededFromAssets = Math.max(0, neededFromAssets + newCgTax - w);
          attempt++;
        }
      }

      // B. Conditional Strategy based on Penalty Avoidance
      if (params.avoidEarlyPenalty && age < 59.5) {
        // Pull from Roth BEFORE Traditional to avoid 10% penalty
        if (neededFromAssets > 0 && rothBalance > 0) {
          const withdrawal = Math.min(rothBalance, neededFromAssets);
          withdrawnFromRoth += withdrawal;
          rothBalance -= withdrawal;
          neededFromAssets -= withdrawal;
        }

        if (neededFromAssets > 0 && traditionalBalance > 0) {
          let attempt = 0;
          while (neededFromAssets > 0.01 && traditionalBalance > 0 && attempt < 3) {
            const penaltyRate = 0.1;
            const divisor = Math.max(0.5, 1 - finalMarginalRate - penaltyRate);
            let withdrawal = Math.min(traditionalBalance, neededFromAssets / divisor);
            
            withdrawnFromTraditional += withdrawal;
            traditionalBalance -= withdrawal;

            const totalOtherGross = otherGrossIncome + withdrawnFromTraditional;
            const totalTaxableSS = calculateTaxableSS(ssIncome, totalOtherGross + qualifiedDividends, filingStatus);
            const totalOrdinaryGross = totalOtherGross + totalTaxableSS;
            const totalOrdinaryTaxable = Math.max(0, totalOrdinaryGross - standardDeduction);
            
            const { tax: totalOrdinaryTax, marginalRate: newMarginalRate } = calculateTax(totalOrdinaryTaxable, filingStatus, inflationFactor);
            
            const newExtraOrdinaryTax = totalOrdinaryTax - ordinaryTax;
            const newPenalty = withdrawnFromTraditional * penaltyRate;
            
            extraOrdinaryTax = newExtraOrdinaryTax;
            earlyWithdrawalPenalty = newPenalty;
            finalMarginalRate = newMarginalRate;
            
            const totalCoveredSoFar = withdrawnFromBrokerage + withdrawnFromTraditional + withdrawnFromRoth - capitalGainsTax - extraOrdinaryTax - earlyWithdrawalPenalty;
            neededFromAssets = Math.max(0, Math.abs(netCashFlow) - totalCoveredSoFar);
            attempt++;
          }
        }
      } else {
        // Standard Strategy: Traditional then Roth (or 59.5+)
        if (neededFromAssets > 0 && traditionalBalance > 0) {
          let attempt = 0;
          while (neededFromAssets > 0.01 && traditionalBalance > 0 && attempt < 3) {
            const penaltyRate = (age < 59.5) ? 0.1 : 0;
            const divisor = Math.max(0.5, 1 - finalMarginalRate - penaltyRate);
            let withdrawal = Math.min(traditionalBalance, neededFromAssets / divisor);
            
            withdrawnFromTraditional += withdrawal;
            traditionalBalance -= withdrawal;

            const totalOtherGross = otherGrossIncome + withdrawnFromTraditional;
            const totalTaxableSS = calculateTaxableSS(ssIncome, totalOtherGross + qualifiedDividends, filingStatus);
            const totalOrdinaryGross = totalOtherGross + totalTaxableSS;
            const totalOrdinaryTaxable = Math.max(0, totalOrdinaryGross - standardDeduction);
            
            const { tax: totalOrdinaryTax, marginalRate: newMarginalRate } = calculateTax(totalOrdinaryTaxable, filingStatus, inflationFactor);
            
            const newExtraOrdinaryTax = totalOrdinaryTax - ordinaryTax;
            const newPenalty = withdrawnFromTraditional * penaltyRate;
            
            extraOrdinaryTax = newExtraOrdinaryTax;
            earlyWithdrawalPenalty = newPenalty;
            finalMarginalRate = newMarginalRate;
            
            const totalCoveredSoFar = withdrawnFromBrokerage + withdrawnFromTraditional + withdrawnFromRoth - capitalGainsTax - extraOrdinaryTax - earlyWithdrawalPenalty;
            neededFromAssets = Math.max(0, Math.abs(netCashFlow) - totalCoveredSoFar);
            attempt++;
          }
        }

        if (neededFromAssets > 0 && rothBalance > 0) {
          const withdrawal = Math.min(rothBalance, neededFromAssets);
          withdrawnFromRoth += withdrawal;
          rothBalance -= withdrawal;
          neededFromAssets -= withdrawal;
        }
      }
    } else {
      // Surplus: Order is Mega Backdoor Roth -> Brokerage
      const surplus = netCashFlow;
      megaRothContribution = Math.min(surplus, params.megaBackdoorRothAmount);
      rothBalance += megaRothContribution;
      
      const remainingSurplus = surplus - megaRothContribution;
      brokerageBalance += remainingSurplus;
      brokerageBasis += remainingSurplus;
    }

    const totalTaxThisYear = ordinaryTax + extraOrdinaryTax + capitalGainsTax + earlyWithdrawalPenalty + dividendTax;
    const grossIncomeForReporting = ordinaryGrossIncome + withdrawnFromTraditional + qualifiedDividends;
    const effectiveRate = grossIncomeForReporting > 0 ? (totalTaxThisYear / grossIncomeForReporting) * 100 : 0;
    
    totalTaxPaid += totalTaxThisYear;
    totalRmdPaid += rmdAmount;

    // 8. Apply Roth Conversion
    traditionalBalance -= conversionAmount;
    rothBalance += conversionAmount;

    // 9. Apply Market Growth
    brokerageBalance *= (1 + marketGrowthRate);
    // Basis does NOT increase with market growth
    traditionalBalance *= (1 + marketGrowthRate);
    rothBalance *= (1 + marketGrowthRate);

    const totalBalance = brokerageBalance + traditionalBalance + rothBalance;
    const initialTotalBalance = currentBrokerageBalance + currentTraditionalBalance + currentRothBalance;
    const inflationRef = initialTotalBalance * (Math.pow(1 + inflationRate, yearOffset) - 1);
    const purchasingPower = 1 / Math.pow(1 + inflationRate, yearOffset);

    years.push({
      age,
      year,
      brokerageBalance,
      traditionalBalance,
      rothBalance,
      totalBalance,
      income,
      spending,
      taxPaid: totalTaxThisYear,
      taxableIncome: Math.max(0, grossIncomeForReporting - standardDeduction),
      rmdAmount,
      ssIncome,
      conversionAmount,
      withdrawnFromBrokerage,
      withdrawnFromTraditional,
      withdrawnFromRoth,
      earlyWithdrawalPenalty,
      isGapYear,
      isRetired,
      filingStatus,
      effectiveRate,
      marginalRate: finalMarginalRate * 100,
      inflationRef,
      purchasingPower,
      ordinaryTaxPaid: ordinaryTax + extraOrdinaryTax,
      capitalGainsTaxPaid: capitalGainsTax + dividendTax,
      taxableCapitalGains: totalTaxableCapitalGains,
      dividendTaxPaid: dividendTax,
      qualifiedDividends,
      ordinaryDividends,
      isConverting: conversionAmount > 0,
      traditional401kContribution: actual401kContribution,
      megaRothContribution,
      events: yearEvents,
    });
  }

  return {
    years,
    totalTaxPaid,
    totalRmdPaid,
    finalBalance: brokerageBalance + traditionalBalance + rothBalance,
  };
}

function calculateTaxableSS(ssIncome: number, otherIncome: number, status: 'MFJ' | 'Single'): number {
  if (ssIncome <= 0) return 0;
  const thresholds = status === 'MFJ' ? [32000, 44000] : [25000, 34000];
  const combinedIncome = otherIncome + (ssIncome * 0.5);
  if (combinedIncome <= thresholds[0]) return 0;
  if (combinedIncome <= thresholds[1]) {
    return Math.min(ssIncome * 0.5, (combinedIncome - thresholds[0]) * 0.5);
  }
  const baseTaxable = Math.min(ssIncome * 0.5, (thresholds[1] - thresholds[0]) * 0.5);
  const extraTaxable = (combinedIncome - thresholds[1]) * 0.85;
  return Math.min(ssIncome * 0.85, baseTaxable + extraTaxable);
}

export function calculateTax(taxableIncome: number, status: 'MFJ' | 'Single', inflationFactor: number): { tax: number, marginalRate: number } {
  const brackets = TAX_BRACKETS[status];
  let tax = 0;
  let marginalRate = 0;
  for (let i = 0; i < brackets.length; i++) {
    const current = brackets[i];
    const next = brackets[i + 1];
    const upperLimit = next ? (next.threshold * inflationFactor) : Infinity;
    const currentThreshold = current.threshold * inflationFactor;
    if (taxableIncome > currentThreshold) {
      const taxableInThisBracket = Math.min(taxableIncome, upperLimit) - currentThreshold;
      const currentRate = current.rate;
      tax += taxableInThisBracket * currentRate;
      marginalRate = currentRate;
    } else {
      break;
    }
  }
  return { tax, marginalRate };
}

function calculateCapitalGainsTax(ordinaryTaxableIncome: number, capitalGains: number, status: 'MFJ' | 'Single', inflationFactor: number): number {
  if (capitalGains <= 0) return 0;
  const brackets = LTCG_BRACKETS[status];
  let tax = 0;
  const totalIncome = ordinaryTaxableIncome + capitalGains;

  for (let i = 0; i < brackets.length; i++) {
    const current = brackets[i];
    const next = brackets[i + 1];
    const bracketThreshold = current.threshold * inflationFactor;
    const nextThreshold = next ? next.threshold * inflationFactor : Infinity;

    // Portion of capital gains that falls into this bracket
    // It must be above the current threshold AND above ordinary income
    const bracketStart = Math.max(bracketThreshold, ordinaryTaxableIncome);
    const bracketEnd = Math.max(bracketStart, Math.min(nextThreshold, totalIncome));

    const amountInBracket = bracketEnd - bracketStart;
    if (amountInBracket > 0) {
      tax += amountInBracket * current.rate;
    }
  }
  return tax;
}
