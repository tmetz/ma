// Tax calculation functions for Three Bucket Investment Calculator

// Calculate federal income tax for single filer (2024 brackets)
function calculateFederalTax(annualIncome) {
    // 2024 tax brackets for single filers
    const brackets = [
        { limit: 11600, rate: 0.10 },
        { limit: 47150, rate: 0.12 },
        { limit: 100525, rate: 0.22 },
        { limit: 191950, rate: 0.24 },
        { limit: 243725, rate: 0.32 },
        { limit: 609350, rate: 0.35 },
        { limit: Infinity, rate: 0.37 }
    ];
    
    let tax = 0;
    let previousLimit = 0;
    
    for (let i = 0; i < brackets.length; i++) {
        const bracket = brackets[i];
        const taxableInBracket = Math.min(annualIncome, bracket.limit) - previousLimit;
        
        if (taxableInBracket <= 0) {
            break;
        }
        
        tax += taxableInBracket * bracket.rate;
        previousLimit = bracket.limit;
        
        if (annualIncome <= bracket.limit) {
            break;
        }
    }
    
    return tax;
}

// Calculate federal long-term capital gains tax for single filer (2025 thresholds from IRS Topic 409)
function calculateLongTermCapitalGainsTax(ordinaryTaxableIncome, longTermCapitalGains) {
    if (longTermCapitalGains <= 0) {
        return 0;
    }

    // IRS Topic 409 (tax year 2025, single filer)
    const zeroRateLimit = 48350;
    const fifteenRateLimit = 533400;

    let remainingGains = longTermCapitalGains;
    let tax = 0;

    // Fill the 0% band after ordinary taxable income.
    const zeroRateSpace = Math.max(0, zeroRateLimit - ordinaryTaxableIncome);
    const gainsAtZero = Math.min(remainingGains, zeroRateSpace);
    remainingGains -= gainsAtZero;

    // Then fill the 15% band.
    const fifteenBandFloor = Math.max(ordinaryTaxableIncome, zeroRateLimit);
    const fifteenRateSpace = Math.max(0, fifteenRateLimit - fifteenBandFloor);
    const gainsAtFifteen = Math.min(remainingGains, fifteenRateSpace);
    tax += gainsAtFifteen * 0.15;
    remainingGains -= gainsAtFifteen;

    // Any remaining gains are taxed at 20%.
    if (remainingGains > 0) {
        tax += remainingGains * 0.20;
    }

    return tax;
}

// Calculate Maryland state income tax for single filer (2024 brackets)
function calculateMarylandStateTax(annualIncome) {
    // Standard deduction (15% of income, min $1,800, max $2,700)
    let standardDeduction = annualIncome * 0.15;
    standardDeduction = Math.max(1800, Math.min(2700, standardDeduction));
    
    // Taxable income after standard deduction
    const taxableIncome = Math.max(0, annualIncome - standardDeduction);
    
    // 2024 Maryland state tax brackets for single filers
    const brackets = [
        { limit: 100000, rate: 0.0475 },
        { limit: 125000, rate: 0.05 },
        { limit: 150000, rate: 0.0525 },
        { limit: 250000, rate: 0.055 },
        { limit: Infinity, rate: 0.0575 }
    ];
    
    let tax = 0;
    let previousLimit = 0;
    
    for (let i = 0; i < brackets.length; i++) {
        const bracket = brackets[i];
        const taxableInBracket = Math.min(taxableIncome, bracket.limit) - previousLimit;
        
        if (taxableInBracket <= 0) {
            break;
        }
        
        tax += taxableInBracket * bracket.rate;
        previousLimit = bracket.limit;
        
        if (taxableIncome <= bracket.limit) {
            break;
        }
    }
    
    return tax;
}

// Calculate Frederick County, Maryland local tax for single filer
function calculateFrederickCountyTax(annualIncome) {
    // Standard deduction (15% of income, min $1,800, max $2,700)
    let standardDeduction = annualIncome * 0.15;
    standardDeduction = Math.max(1800, Math.min(2700, standardDeduction));
    
    // Taxable income after standard deduction
    const taxableIncome = Math.max(0, annualIncome - standardDeduction);
    
    // Frederick County tax rates for single filers
    if (taxableIncome <= 25000) {
        return taxableIncome * 0.0225;
    } else if (taxableIncome <= 50000) {
        return taxableIncome * 0.0275;
    } else if (taxableIncome <= 150000) {
        return taxableIncome * 0.0296;
    } else {
        return taxableIncome * 0.0320;
    }
}
