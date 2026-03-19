// Track contribution periods
let periodCount = 0;

// Initialize the calculator
document.addEventListener('DOMContentLoaded', function() {
    // Add initial contribution period
    addContributionPeriod();
    
    // Set up event listeners
    document.getElementById('addPeriodBtn').addEventListener('click', addContributionPeriod);
    document.getElementById('calculatorForm').addEventListener('submit', calculateGrowth);
    
    // Ensure page stays at top after initial load (using requestAnimationFrame ensures it runs after all browser auto-behaviors)
    requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        // Blur any focused element
        if (document.activeElement) {
            document.activeElement.blur();
        }
    });
});

// Add a new contribution period
function addContributionPeriod() {
    periodCount++;
    const periodsContainer = document.getElementById('contributionPeriods');
    
    const periodDiv = document.createElement('div');
    periodDiv.className = 'contribution-period';
    periodDiv.id = `period-${periodCount}`;
    
    periodDiv.innerHTML = `
        <div class="contribution-period-header">
            ${periodCount > 1 ? `<button type="button" class="btn btn-danger" onclick="removePeriod(${periodCount})">Remove</button>` : ''}
        </div>
        <div class="period-basics-row">
            <div class="input-group">
                <label for="periodName-${periodCount}">Time Period Name</label>
                <input type="text" id="periodName-${periodCount}" placeholder="Period Name (Optional)" maxlength="10">
                <small>Give this period a custom name (e.g., "Early Career", "Peak Earnings", "Retirement")</small>
            </div>
            <div class="input-group">                
                <label for="grossIncome-${periodCount}">Gross Income ($/month)</label>
                <input type="number" id="grossIncome-${periodCount}" min="0" step="0.01" value="0">
                <small>Income from employment, social security, etc.</small>
            </div>
            <div class="input-group">                <label for="duration-${periodCount}">Duration (Years)</label>
                <input type="number" id="duration-${periodCount}" min="0" step="0.1" value="10" required>
            </div>
        </div>
        <div class="account-groups">
            <div class="account-group tax-deferred-group">
                <h5>Tax-Deferred</h5>
                <div class="input-group">
                    <label for="taxDeferred-${periodCount}">Contribution ($/month)</label>
                    <input type="number" id="taxDeferred-${periodCount}" min="0" step="0.01" value="0" required>
                </div>
                <div class="input-group">
                    <label for="taxDeferredWithdrawal-${periodCount}">Withdrawal ($/month)</label>
                    <input type="number" id="taxDeferredWithdrawal-${periodCount}" min="0" step="0.01" value="0" required>
                </div>
            </div>
            <div class="account-group tax-free-group">
                <h5>Tax-Free</h5>
                <div class="input-group">
                    <label for="taxFree-${periodCount}">Contribution ($/month)</label>
                    <input type="number" id="taxFree-${periodCount}" min="0" step="0.01" value="0" required>
                </div>
                <div class="input-group">
                    <label for="taxFreeWithdrawal-${periodCount}">Withdrawal ($/month)</label>
                    <input type="number" id="taxFreeWithdrawal-${periodCount}" min="0" step="0.01" value="0" required>
                </div>
            </div>
            <div class="account-group taxable-group">
                <h5>Brokerage</h5>
                <div class="input-group">
                    <label for="brokerage-${periodCount}">Contribution ($/month)</label>
                    <input type="number" id="brokerage-${periodCount}" min="0" step="0.01" value="0" required>
                </div>
                <div class="input-group">
                    <label for="brokerageWithdrawal-${periodCount}">Withdrawal ($/month)</label>
                    <input type="number" id="brokerageWithdrawal-${periodCount}" min="0" step="0.01" value="0" required>
                </div>
            </div>
            <div class="account-group taxable-group">
                <h5>Savings</h5>
                <div class="input-group">
                    <label for="savings-${periodCount}">Contribution ($/month)</label>
                    <input type="number" id="savings-${periodCount}" min="0" step="0.01" value="0" required>
                </div>
                <div class="input-group">
                    <label for="savingsWithdrawal-${periodCount}">Withdrawal ($/month)</label>
                    <input type="number" id="savingsWithdrawal-${periodCount}" min="0" step="0.01" value="0" required>
                </div>
            </div>
        </div>
        <div class="lump-sum-section">
            <button type="button" class="lump-sum-toggle" onclick="toggleLumpSum(${periodCount})">
                <span class="toggle-icon">▶</span> Add Lump Sum Contributions (Optional)
            </button>
            <div class="lump-sum-inputs" id="lumpSumInputs-${periodCount}" style="display: none;">
                <p class="lump-sum-description">Enter one-time amounts to add at the start of this period (e.g., inheritance, home sale proceeds).</p>
                <div class="lump-sum-grid">
                    <div class="input-group">
                        <label for="taxDeferredLumpSum-${periodCount}">Tax-Deferred Lump Sum ($)</label>
                        <input type="number" id="taxDeferredLumpSum-${periodCount}" min="0" step="0.01" value="0">
                    </div>
                    <div class="input-group">
                        <label for="taxFreeLumpSum-${periodCount}">Tax-Free Lump Sum ($)</label>
                        <input type="number" id="taxFreeLumpSum-${periodCount}" min="0" step="0.01" value="0">
                    </div>
                    <div class="input-group">
                        <label for="brokerageLumpSum-${periodCount}">Brokerage Lump Sum ($)</label>
                        <input type="number" id="brokerageLumpSum-${periodCount}" min="0" step="0.01" value="0">
                    </div>
                    <div class="input-group">
                        <label for="savingsLumpSum-${periodCount}">Savings Lump Sum ($)</label>
                        <input type="number" id="savingsLumpSum-${periodCount}" min="0" step="0.01" value="0">
                    </div>
                </div>
            </div>
        </div>
    `;
    
    periodsContainer.appendChild(periodDiv);
}

// Remove a contribution period
function removePeriod(periodId) {
    const periodElement = document.getElementById(`period-${periodId}`);
    if (periodElement) {
        periodElement.remove();
    }
}

// Toggle lump sum section visibility
function toggleLumpSum(periodId) {
    const lumpSumInputs = document.getElementById(`lumpSumInputs-${periodId}`);
    const button = lumpSumInputs.previousElementSibling;
    const icon = button.querySelector('.toggle-icon');
    
    if (lumpSumInputs.style.display === 'none') {
        lumpSumInputs.style.display = 'block';
        icon.textContent = '▼';
    } else {
        lumpSumInputs.style.display = 'none';
        icon.textContent = '▶';
    }
}

// Calculate compound growth with monthly contributions and withdrawals
function calculateCompoundGrowth(principal, monthlyContribution, monthlyWithdrawal, annualRate, years, compoundFrequency, initialCostBasis = null) {
    const trackCostBasis = typeof initialCostBasis === 'number';
    let costBasis = trackCostBasis ? initialCostBasis : 0;
    let realizedLongTermCapitalGains = 0;
    
    if (compoundFrequency === 'annually') {
        // Annual compounding
        const rate = annualRate / 100;
        let balance = principal;
        let totalContributions = 0;
        let totalWithdrawals = 0;
        
        for (let year = 0; year < years; year++) {
            // Add annual contribution first.
            const yearlyContribution = monthlyContribution * 12;
            const yearlyWithdrawal = monthlyWithdrawal * 12;
            balance += yearlyContribution;
            totalContributions += yearlyContribution;

            if (trackCostBasis) {
                costBasis += yearlyContribution;

                // For taxable accounts, taxable gains can only be realized from existing invested balance.
                const availableBalance = Math.max(0, balance);
                const withdrawalAppliedForTax = Math.min(yearlyWithdrawal, availableBalance);
                const gainRatio = availableBalance > 0
                    ? Math.max(0, (availableBalance - costBasis) / availableBalance)
                    : 0;
                const realizedGains = withdrawalAppliedForTax * gainRatio;
                const basisReduction = withdrawalAppliedForTax - realizedGains;

                realizedLongTermCapitalGains += realizedGains;
                costBasis = Math.max(0, costBasis - basisReduction);
                balance -= yearlyWithdrawal;
                totalWithdrawals += yearlyWithdrawal;
            } else {
                balance -= yearlyWithdrawal;
                totalWithdrawals += yearlyWithdrawal;
            }
            
            // Apply annual growth
            balance *= (1 + rate);
        }
        
        // Handle fractional years
        const fractionalYear = years - Math.floor(years);
        if (fractionalYear > 0) {
            const partialYearContribution = monthlyContribution * 12 * fractionalYear;
            const partialYearWithdrawal = monthlyWithdrawal * 12 * fractionalYear;
            balance += partialYearContribution;
            totalContributions += partialYearContribution;

            if (trackCostBasis) {
                costBasis += partialYearContribution;

                const availableBalance = Math.max(0, balance);
                const withdrawalAppliedForTax = Math.min(partialYearWithdrawal, availableBalance);
                const gainRatio = availableBalance > 0
                    ? Math.max(0, (availableBalance - costBasis) / availableBalance)
                    : 0;
                const realizedGains = withdrawalAppliedForTax * gainRatio;
                const basisReduction = withdrawalAppliedForTax - realizedGains;

                realizedLongTermCapitalGains += realizedGains;
                costBasis = Math.max(0, costBasis - basisReduction);
                balance -= partialYearWithdrawal;
                totalWithdrawals += partialYearWithdrawal;
            } else {
                balance -= partialYearWithdrawal;
                totalWithdrawals += partialYearWithdrawal;
            }

            balance *= Math.pow(1 + rate, fractionalYear);
        }

        const result = {
            finalBalance: balance,
            totalContributions: totalContributions,
            totalWithdrawals: totalWithdrawals,
            growth: balance - principal - totalContributions + totalWithdrawals
        };

        if (trackCostBasis) {
            result.finalCostBasis = Math.max(0, Math.min(costBasis, balance));
            result.realizedLongTermCapitalGains = realizedLongTermCapitalGains;
        }

        return result;
    } else {
        // Monthly compounding (default)
        const monthlyRate = annualRate / 100 / 12;
        const months = years * 12;
        
        let balance = principal;
        let totalContributions = 0;
        let totalWithdrawals = 0;
        
        for (let month = 0; month < months; month++) {
            // Add monthly contribution first.
            balance += monthlyContribution;
            totalContributions += monthlyContribution;

            if (trackCostBasis) {
                costBasis += monthlyContribution;

                const availableBalance = Math.max(0, balance);
                const withdrawalAppliedForTax = Math.min(monthlyWithdrawal, availableBalance);
                const gainRatio = availableBalance > 0
                    ? Math.max(0, (availableBalance - costBasis) / availableBalance)
                    : 0;
                const realizedGains = withdrawalAppliedForTax * gainRatio;
                const basisReduction = withdrawalAppliedForTax - realizedGains;

                realizedLongTermCapitalGains += realizedGains;
                costBasis = Math.max(0, costBasis - basisReduction);
                balance -= monthlyWithdrawal;
                totalWithdrawals += monthlyWithdrawal;
            } else {
                balance -= monthlyWithdrawal;
                totalWithdrawals += monthlyWithdrawal;
            }
            
            // Apply monthly growth
            balance *= (1 + monthlyRate);
        }

        const result = {
            finalBalance: balance,
            totalContributions: totalContributions,
            totalWithdrawals: totalWithdrawals,
            growth: balance - principal - totalContributions + totalWithdrawals
        };

        if (trackCostBasis) {
            result.finalCostBasis = Math.max(0, Math.min(costBasis, balance));
            result.realizedLongTermCapitalGains = realizedLongTermCapitalGains;
        }

        return result;
    }
}

// Main calculation function
function calculateGrowth(event) {
    event.preventDefault();
    
    // Get starting balances
    const taxDeferredStart = parseFloat(document.getElementById('taxDeferredBalance').value);
    const taxFreeStart = parseFloat(document.getElementById('taxFreeBalance').value);
    const brokerageStart = parseFloat(document.getElementById('brokerageBalance').value);
    const savingsStart = parseFloat(document.getElementById('savingsBalance').value);
    const taxableStart = brokerageStart + savingsStart;
    
    // Get growth rates
    const taxDeferredRate = parseFloat(document.getElementById('taxDeferredRate').value);
    const taxFreeRate = parseFloat(document.getElementById('taxFreeRate').value);
    const brokerageRate = parseFloat(document.getElementById('brokerageRate').value);
    const savingsRate = parseFloat(document.getElementById('savingsRate').value);
    
    // Get compound frequency
    const compoundFrequency = document.querySelector('input[name="compoundFrequency"]:checked').value;
    
    // Initialize running balances
    let taxDeferredBalance = taxDeferredStart;
    let taxFreeBalance = taxFreeStart;
    let brokerageBalance = brokerageStart;
    let savingsBalance = savingsStart;
    let brokerageCostBasis = brokerageStart;
    
    let taxDeferredTotalContributions = 0;
    let taxFreeTotalContributions = 0;
    let brokerageTotalContributions = 0;
    let savingsTotalContributions = 0;
    
    let taxDeferredTotalWithdrawals = 0;
    let taxFreeTotalWithdrawals = 0;
    let brokerageTotalWithdrawals = 0;
    let savingsTotalWithdrawals = 0;
    
    let totalYears = 0;
    
    // Track period-by-period results
    const periodResults = [];
    
    // Process each contribution period
    const periods = document.querySelectorAll('.contribution-period');
    periods.forEach(period => {
        const periodId = period.id.split('-')[1];
        
        const periodName = document.getElementById(`periodName-${periodId}`).value || `Period ${periodId}`;
        const duration = parseFloat(document.getElementById(`duration-${periodId}`).value);
        const grossIncome = parseFloat(document.getElementById(`grossIncome-${periodId}`).value) || 0;
        const taxDeferredContribution = parseFloat(document.getElementById(`taxDeferred-${periodId}`).value);
        const taxDeferredWithdrawal = parseFloat(document.getElementById(`taxDeferredWithdrawal-${periodId}`).value);
        const taxDeferredLumpSum = parseFloat(document.getElementById(`taxDeferredLumpSum-${periodId}`).value) || 0;
        const taxFreeContribution = parseFloat(document.getElementById(`taxFree-${periodId}`).value);
        const taxFreeWithdrawal = parseFloat(document.getElementById(`taxFreeWithdrawal-${periodId}`).value);
        const taxFreeLumpSum = parseFloat(document.getElementById(`taxFreeLumpSum-${periodId}`).value) || 0;
        const brokerageContribution = parseFloat(document.getElementById(`brokerage-${periodId}`).value);
        const brokerageWithdrawal = parseFloat(document.getElementById(`brokerageWithdrawal-${periodId}`).value);
        const brokerageLumpSum = parseFloat(document.getElementById(`brokerageLumpSum-${periodId}`).value) || 0;
        const savingsContribution = parseFloat(document.getElementById(`savings-${periodId}`).value);
        const savingsWithdrawal = parseFloat(document.getElementById(`savingsWithdrawal-${periodId}`).value);
        const savingsLumpSum = parseFloat(document.getElementById(`savingsLumpSum-${periodId}`).value) || 0;
        
        // Add lump sums at the start of the period
        taxDeferredBalance += taxDeferredLumpSum;
        taxFreeBalance += taxFreeLumpSum;
        brokerageBalance += brokerageLumpSum;
        savingsBalance += savingsLumpSum;
        brokerageCostBasis += brokerageLumpSum;
        
        // Calculate growth for tax-deferred account
        const taxDeferredResult = calculateCompoundGrowth(
            taxDeferredBalance,
            taxDeferredContribution,
            taxDeferredWithdrawal,
            taxDeferredRate,
            duration,
            compoundFrequency
        );
        taxDeferredBalance = taxDeferredResult.finalBalance;
        taxDeferredTotalContributions += taxDeferredResult.totalContributions;
        taxDeferredTotalWithdrawals += taxDeferredResult.totalWithdrawals;
        
        // Calculate growth for tax-free account
        const taxFreeResult = calculateCompoundGrowth(
            taxFreeBalance,
            taxFreeContribution,
            taxFreeWithdrawal,
            taxFreeRate,
            duration,
            compoundFrequency
        );
        taxFreeBalance = taxFreeResult.finalBalance;
        taxFreeTotalContributions += taxFreeResult.totalContributions;
        taxFreeTotalWithdrawals += taxFreeResult.totalWithdrawals;
        
        // Calculate growth for bucket 3 brokerage account
        const brokerageResult = calculateCompoundGrowth(
            brokerageBalance,
            brokerageContribution,
            brokerageWithdrawal,
            brokerageRate,
            duration,
            compoundFrequency,
            brokerageCostBasis
        );
        brokerageBalance = brokerageResult.finalBalance;
        brokerageTotalContributions += brokerageResult.totalContributions;
        brokerageTotalWithdrawals += brokerageResult.totalWithdrawals;
        brokerageCostBasis = brokerageResult.finalCostBasis;

        // Calculate growth for bucket 3 savings account
        const savingsResult = calculateCompoundGrowth(
            savingsBalance,
            savingsContribution,
            savingsWithdrawal,
            savingsRate,
            duration,
            compoundFrequency
        );
        savingsBalance = savingsResult.finalBalance;
        savingsTotalContributions += savingsResult.totalContributions;
        savingsTotalWithdrawals += savingsResult.totalWithdrawals;
        
        totalYears += duration;
        
        // Calculate income breakdown
        // Taxable ordinary income = gross income - tax-deferred contributions + tax-deferred withdrawals
        // (tax-deferred contributions reduce taxable income since they're pre-tax)
        const taxableMonthlyIncome = grossIncome - taxDeferredContribution + taxDeferredWithdrawal;

        // Brokerage gains realized by withdrawals are treated as long-term capital gains.
        const annualLongTermCapitalGains = duration > 0
            ? brokerageResult.realizedLongTermCapitalGains / duration
            : 0;
        // Tax-free income = tax-free withdrawals
        const taxFreeMonthlyIncome = taxFreeWithdrawal;
        const annualOrdinaryTaxableIncome = taxableMonthlyIncome * 12;
        const annualBrokerageWithdrawal = duration > 0 ? brokerageResult.totalWithdrawals / duration : 0;
        const annualSavingsWithdrawal = duration > 0 ? savingsResult.totalWithdrawals / duration : 0;
        const annualBrokeragePrincipalWithdrawal = Math.max(0, annualBrokerageWithdrawal - annualLongTermCapitalGains);
        const annualTaxFreeIncome = (taxFreeMonthlyIncome * 12) + annualSavingsWithdrawal + annualBrokeragePrincipalWithdrawal;
        const totalMonthlyIncome = (annualOrdinaryTaxableIncome + annualLongTermCapitalGains + annualTaxFreeIncome) / 12;
        
        // Calculate yearly take-home pay
        const annualTaxableIncome = annualOrdinaryTaxableIncome + annualLongTermCapitalGains;
        const federalTax = calculateFederalTax(annualOrdinaryTaxableIncome);
        const federalLongTermCapitalGainsTax = calculateLongTermCapitalGainsTax(
            annualOrdinaryTaxableIncome,
            annualLongTermCapitalGains
        );
        const marylandStateTax = calculateMarylandStateTax(annualTaxableIncome);
        const frederickCountyTax = calculateFrederickCountyTax(annualTaxableIncome);
        const totalTax = federalTax + federalLongTermCapitalGainsTax + marylandStateTax + frederickCountyTax;
        const yearlyTakeHome = (annualTaxableIncome + annualTaxFreeIncome) - totalTax;

        const taxableBalance = brokerageBalance + savingsBalance;
        
        // Store period results
        periodResults.push({
            periodNumber: periodResults.length + 1,
            periodName: periodName,
            duration: duration,
            cumulativeYears: totalYears,
            taxDeferred: taxDeferredBalance,
            taxFree: taxFreeBalance,
            taxable: taxableBalance,
            total: taxDeferredBalance + taxFreeBalance + taxableBalance,
            yearlyTaxableIncome: annualTaxableIncome,
            yearlyTaxFreeIncome: annualTaxFreeIncome,
            totalIncome: totalMonthlyIncome,
            yearlyTakeHome: yearlyTakeHome
        });
    });
    
    const taxableBalance = brokerageBalance + savingsBalance;
    const taxableTotalContributions = brokerageTotalContributions + savingsTotalContributions;
    const taxableTotalWithdrawals = brokerageTotalWithdrawals + savingsTotalWithdrawals;

    // Calculate growth (final balance - starting balance - contributions + withdrawals)
    const taxDeferredGrowth = taxDeferredBalance - taxDeferredStart - taxDeferredTotalContributions + taxDeferredTotalWithdrawals;
    const taxFreeGrowth = taxFreeBalance - taxFreeStart - taxFreeTotalContributions + taxFreeTotalWithdrawals;
    const brokerageGrowth = brokerageBalance - brokerageStart - brokerageTotalContributions + brokerageTotalWithdrawals;
    const savingsGrowth = savingsBalance - savingsStart - savingsTotalContributions + savingsTotalWithdrawals;
    const taxableGrowth = taxableBalance - taxableStart - taxableTotalContributions + taxableTotalWithdrawals;
    
    // Display results
    displayResults({
        taxDeferred: {
            final: taxDeferredBalance,
            start: taxDeferredStart,
            contributions: taxDeferredTotalContributions,
            withdrawals: taxDeferredTotalWithdrawals,
            growth: taxDeferredGrowth
        },
        taxFree: {
            final: taxFreeBalance,
            start: taxFreeStart,
            contributions: taxFreeTotalContributions,
            withdrawals: taxFreeTotalWithdrawals,
            growth: taxFreeGrowth
        },
        taxable: {
            final: taxableBalance,
            start: taxableStart,
            contributions: taxableTotalContributions,
            withdrawals: taxableTotalWithdrawals,
            growth: taxableGrowth,
            brokerage: {
                final: brokerageBalance,
                growth: brokerageGrowth
            },
            savings: {
                final: savingsBalance,
                growth: savingsGrowth
            }
        },
        totalYears: totalYears,
        periodResults: periodResults
    });
}

// Display results
function displayResults(results) {
    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };
    
    // Tax-deferred results
    document.getElementById('taxDeferredResult').textContent = formatCurrency(results.taxDeferred.final);
    document.getElementById('taxDeferredStart').textContent = formatCurrency(results.taxDeferred.start);
    document.getElementById('taxDeferredContributions').textContent = formatCurrency(results.taxDeferred.contributions);
    document.getElementById('taxDeferredWithdrawals').textContent = formatCurrency(results.taxDeferred.withdrawals);
    document.getElementById('taxDeferredGrowth').textContent = formatCurrency(results.taxDeferred.growth);
    
    // Tax-free results
    document.getElementById('taxFreeResult').textContent = formatCurrency(results.taxFree.final);
    document.getElementById('taxFreeStart').textContent = formatCurrency(results.taxFree.start);
    document.getElementById('taxFreeContributions').textContent = formatCurrency(results.taxFree.contributions);
    document.getElementById('taxFreeWithdrawals').textContent = formatCurrency(results.taxFree.withdrawals);
    document.getElementById('taxFreeGrowth').textContent = formatCurrency(results.taxFree.growth);
    
    // Taxable results
    document.getElementById('taxableResult').textContent = formatCurrency(results.taxable.final);
    document.getElementById('taxableStart').textContent = formatCurrency(results.taxable.start);
    document.getElementById('taxableContributions').textContent = formatCurrency(results.taxable.contributions);
    document.getElementById('taxableWithdrawals').textContent = formatCurrency(results.taxable.withdrawals);
    document.getElementById('taxableGrowth').textContent = formatCurrency(results.taxable.growth);
    document.getElementById('brokerageResult').textContent = formatCurrency(results.taxable.brokerage.final);
    document.getElementById('brokerageGrowth').textContent = formatCurrency(results.taxable.brokerage.growth);
    document.getElementById('savingsResult').textContent = formatCurrency(results.taxable.savings.final);
    document.getElementById('savingsGrowth').textContent = formatCurrency(results.taxable.savings.growth);
    
    // Total results
    const totalFinal = results.taxDeferred.final + results.taxFree.final + results.taxable.final;
    const totalStart = results.taxDeferred.start + results.taxFree.start + results.taxable.start;
    const totalContributions = results.taxDeferred.contributions + results.taxFree.contributions + results.taxable.contributions;
    const totalWithdrawals = results.taxDeferred.withdrawals + results.taxFree.withdrawals + results.taxable.withdrawals;
    const totalGrowth = results.taxDeferred.growth + results.taxFree.growth + results.taxable.growth;
    
    document.getElementById('totalResult').textContent = formatCurrency(totalFinal);
    document.getElementById('totalStart').textContent = formatCurrency(totalStart);
    document.getElementById('totalContributions').textContent = formatCurrency(totalContributions);
    document.getElementById('totalWithdrawals').textContent = formatCurrency(totalWithdrawals);
    document.getElementById('totalGrowth').textContent = formatCurrency(totalGrowth);
    document.getElementById('totalYears').textContent = results.totalYears.toFixed(1);
    
    // Display period-by-period results
    displayPeriodResults(results.periodResults, formatCurrency);
    
    // Show results section
    document.getElementById('results').classList.remove('hidden');
    
    // Scroll to results
    document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Display period-by-period results
function displayPeriodResults(periodResults, formatCurrency) {
    const tableContainer = document.getElementById('periodResultsTable');
    
    if (periodResults.length === 0) {
        tableContainer.innerHTML = '<p>No periods to display</p>';
        return;
    }
    
    let tableHTML = `
        <table class="period-table">
            <thead>
                <tr>
                    <th>Period</th>
                    <th>Cumulative Years</th>
                    <th class="amount">Tax-Deferred</th>
                    <th class="amount">Tax-Free</th>
                    <th class="amount">Taxable</th>
                    <th class="amount">Total Balance</th>
                    <th class="amount income-column">Taxable Income (Yearly)</th>
                    <th class="amount income-column">Tax-Free Income (Yearly)</th>
                    <th class="amount income-column">Yearly Take-Home</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    periodResults.forEach(period => {
        tableHTML += `
            <tr>
                <td class="period-cell">
                    <div class="period-name">${period.periodName}</div>
                    <div class="period-duration">(${period.duration.toFixed(1)} years)</div>
                </td>
                <td><div>${period.cumulativeYears.toFixed(1)} years</div><div></div></td>
                <td class="amount"><div>${formatCurrency(period.taxDeferred)}</div><div></div></td>
                <td class="amount"><div>${formatCurrency(period.taxFree)}</div><div></div></td>
                <td class="amount"><div>${formatCurrency(period.taxable)}</div><div></div></td>
                <td class="amount"><div><strong>${formatCurrency(period.total)}</strong></div><div></div></td>
                <td class="amount income-column"><div>${formatCurrency(period.yearlyTaxableIncome)}</div><div></div></td>
                <td class="amount income-column"><div>${formatCurrency(period.yearlyTaxFreeIncome)}</div><div></div></td>
                <td class="amount income-column"><div><strong>${formatCurrency(period.yearlyTakeHome)}</strong></div><div></div></td>
            </tr>
        `;
    });
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    tableContainer.innerHTML = tableHTML;
}
