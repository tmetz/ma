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
                <h5>Taxable</h5>
                <div class="input-group">
                    <label for="taxable-${periodCount}">Contribution ($/month)</label>
                    <input type="number" id="taxable-${periodCount}" min="0" step="0.01" value="0" required>
                </div>
                <div class="input-group">
                    <label for="taxableWithdrawal-${periodCount}">Withdrawal ($/month)</label>
                    <input type="number" id="taxableWithdrawal-${periodCount}" min="0" step="0.01" value="0" required>
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
                        <label for="taxableLumpSum-${periodCount}">Taxable Lump Sum ($)</label>
                        <input type="number" id="taxableLumpSum-${periodCount}" min="0" step="0.01" value="0">
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
function calculateCompoundGrowth(principal, monthlyContribution, monthlyWithdrawal, annualRate, years, compoundFrequency) {
    const netMonthlyAmount = monthlyContribution - monthlyWithdrawal;
    
    if (compoundFrequency === 'annually') {
        // Annual compounding
        const rate = annualRate / 100;
        let balance = principal;
        let totalContributions = 0;
        let totalWithdrawals = 0;
        
        for (let year = 0; year < years; year++) {
            // Add annual contributions and withdrawals (12 months worth)
            const yearlyContribution = monthlyContribution * 12;
            const yearlyWithdrawal = monthlyWithdrawal * 12;
            balance += yearlyContribution - yearlyWithdrawal;
            totalContributions += yearlyContribution;
            totalWithdrawals += yearlyWithdrawal;
            
            // Apply annual growth
            balance *= (1 + rate);
        }
        
        // Handle fractional years
        const fractionalYear = years - Math.floor(years);
        if (fractionalYear > 0) {
            const partialYearContribution = monthlyContribution * 12 * fractionalYear;
            const partialYearWithdrawal = monthlyWithdrawal * 12 * fractionalYear;
            balance += partialYearContribution - partialYearWithdrawal;
            totalContributions += partialYearContribution;
            totalWithdrawals += partialYearWithdrawal;
            balance *= Math.pow(1 + rate, fractionalYear);
        }
        
        return {
            finalBalance: balance,
            totalContributions: totalContributions,
            totalWithdrawals: totalWithdrawals,
            growth: balance - principal - totalContributions + totalWithdrawals
        };
    } else {
        // Monthly compounding (default)
        const monthlyRate = annualRate / 100 / 12;
        const months = years * 12;
        
        let balance = principal;
        let totalContributions = 0;
        let totalWithdrawals = 0;
        
        for (let month = 0; month < months; month++) {
            // Add monthly contribution and subtract withdrawal
            balance += monthlyContribution - monthlyWithdrawal;
            totalContributions += monthlyContribution;
            totalWithdrawals += monthlyWithdrawal;
            
            // Apply monthly growth
            balance *= (1 + monthlyRate);
        }
        
        return {
            finalBalance: balance,
            totalContributions: totalContributions,
            totalWithdrawals: totalWithdrawals,
            growth: balance - principal - totalContributions + totalWithdrawals
        };
    }
}

// Main calculation function
function calculateGrowth(event) {
    event.preventDefault();
    
    // Get starting balances
    const taxDeferredStart = parseFloat(document.getElementById('taxDeferredBalance').value);
    const taxFreeStart = parseFloat(document.getElementById('taxFreeBalance').value);
    const taxableStart = parseFloat(document.getElementById('taxableBalance').value);
    
    // Get growth rates
    const taxDeferredRate = parseFloat(document.getElementById('taxDeferredRate').value);
    const taxFreeRate = parseFloat(document.getElementById('taxFreeRate').value);
    const taxableRate = parseFloat(document.getElementById('taxableRate').value);
    
    // Get compound frequency
    const compoundFrequency = document.querySelector('input[name="compoundFrequency"]:checked').value;
    
    // Initialize running balances
    let taxDeferredBalance = taxDeferredStart;
    let taxFreeBalance = taxFreeStart;
    let taxableBalance = taxableStart;
    
    let taxDeferredTotalContributions = 0;
    let taxFreeTotalContributions = 0;
    let taxableTotalContributions = 0;
    
    let taxDeferredTotalWithdrawals = 0;
    let taxFreeTotalWithdrawals = 0;
    let taxableTotalWithdrawals = 0;
    
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
        const taxableContribution = parseFloat(document.getElementById(`taxable-${periodId}`).value);
        const taxableWithdrawal = parseFloat(document.getElementById(`taxableWithdrawal-${periodId}`).value);
        const taxableLumpSum = parseFloat(document.getElementById(`taxableLumpSum-${periodId}`).value) || 0;
        
        // Add lump sums at the start of the period
        taxDeferredBalance += taxDeferredLumpSum;
        taxFreeBalance += taxFreeLumpSum;
        taxableBalance += taxableLumpSum;
        
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
        
        // Calculate growth for taxable account
        const taxableResult = calculateCompoundGrowth(
            taxableBalance,
            taxableContribution,
            taxableWithdrawal,
            taxableRate,
            duration,
            compoundFrequency
        );
        taxableBalance = taxableResult.finalBalance;
        taxableTotalContributions += taxableResult.totalContributions;
        taxableTotalWithdrawals += taxableResult.totalWithdrawals;
        
        totalYears += duration;
        
        // Calculate income breakdown
        // Taxable income = gross income - tax-deferred contributions + tax-deferred withdrawals + taxable withdrawals
        // (tax-deferred contributions reduce taxable income since they're pre-tax)
        const taxableMonthlyIncome = grossIncome - taxDeferredContribution + taxDeferredWithdrawal + taxableWithdrawal;
        // Tax-free income = tax-free withdrawals
        const taxFreeMonthlyIncome = taxFreeWithdrawal;
        const totalMonthlyIncome = taxableMonthlyIncome + taxFreeMonthlyIncome;
        
        // Calculate yearly take-home pay
        const annualTaxableIncome = taxableMonthlyIncome * 12;
        const annualTaxFreeIncome = taxFreeMonthlyIncome * 12;
        const federalTax = calculateFederalTax(annualTaxableIncome);
        const marylandStateTax = calculateMarylandStateTax(annualTaxableIncome);
        const frederickCountyTax = calculateFrederickCountyTax(annualTaxableIncome);
        const totalTax = federalTax + marylandStateTax + frederickCountyTax;
        const yearlyTakeHome = (annualTaxableIncome - totalTax) + annualTaxFreeIncome;
        
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
    
    // Calculate growth (final balance - starting balance - contributions + withdrawals)
    const taxDeferredGrowth = taxDeferredBalance - taxDeferredStart - taxDeferredTotalContributions + taxDeferredTotalWithdrawals;
    const taxFreeGrowth = taxFreeBalance - taxFreeStart - taxFreeTotalContributions + taxFreeTotalWithdrawals;
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
            growth: taxableGrowth
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
