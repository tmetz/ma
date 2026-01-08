// Track contribution periods
let periodCount = 0;

// Initialize the calculator
document.addEventListener('DOMContentLoaded', function() {
    // Add initial contribution period
    addContributionPeriod();
    
    // Set up event listeners
    document.getElementById('addPeriodBtn').addEventListener('click', addContributionPeriod);
    document.getElementById('calculatorForm').addEventListener('submit', calculateGrowth);
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
        <div class="input-group">
            <label for="periodName-${periodCount}" class="sr-only">Period Name</label>
            <input type="text" id="periodName-${periodCount}" placeholder="Period Name (Optional)">
            <small>Give this period a custom name (e.g., "Early Career", "Peak Earnings", "Retirement")</small>
        </div>
        <div class="contribution-row">
            <div class="input-group">
                <label for="duration-${periodCount}">Duration (Years)</label>
                <input type="number" id="duration-${periodCount}" min="0" step="0.1" value="10" required>
            </div>
            <div class="input-group">
                <label for="taxDeferred-${periodCount}">Tax-Deferred ($/month)</label>
                <input type="number" id="taxDeferred-${periodCount}" min="0" step="0.01" value="0" required>
            </div>
            <div class="input-group">
                <label for="taxFree-${periodCount}">Tax-Free ($/month)</label>
                <input type="number" id="taxFree-${periodCount}" min="0" step="0.01" value="0" required>
            </div>
            <div class="input-group">
                <label for="taxable-${periodCount}">Taxable ($/month)</label>
                <input type="number" id="taxable-${periodCount}" min="0" step="0.01" value="0" required>
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

// Calculate compound growth with monthly contributions
function calculateCompoundGrowth(principal, monthlyContribution, annualRate, years) {
    const monthlyRate = annualRate / 100 / 12;
    const months = years * 12;
    
    // Calculate final balance with compound interest and monthly contributions
    let balance = principal;
    let totalContributions = 0;
    
    for (let month = 0; month < months; month++) {
        // Add monthly contribution
        balance += monthlyContribution;
        totalContributions += monthlyContribution;
        
        // Apply monthly growth
        balance *= (1 + monthlyRate);
    }
    
    return {
        finalBalance: balance,
        totalContributions: totalContributions,
        growth: balance - principal - totalContributions
    };
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
    
    // Initialize running balances
    let taxDeferredBalance = taxDeferredStart;
    let taxFreeBalance = taxFreeStart;
    let taxableBalance = taxableStart;
    
    let taxDeferredTotalContributions = 0;
    let taxFreeTotalContributions = 0;
    let taxableTotalContributions = 0;
    
    let totalYears = 0;
    
    // Track period-by-period results
    const periodResults = [];
    
    // Process each contribution period
    const periods = document.querySelectorAll('.contribution-period');
    periods.forEach(period => {
        const periodId = period.id.split('-')[1];
        
        const periodName = document.getElementById(`periodName-${periodId}`).value || `Period ${periodId}`;
        const duration = parseFloat(document.getElementById(`duration-${periodId}`).value);
        const taxDeferredContribution = parseFloat(document.getElementById(`taxDeferred-${periodId}`).value);
        const taxFreeContribution = parseFloat(document.getElementById(`taxFree-${periodId}`).value);
        const taxableContribution = parseFloat(document.getElementById(`taxable-${periodId}`).value);
        
        // Calculate growth for tax-deferred account
        const taxDeferredResult = calculateCompoundGrowth(
            taxDeferredBalance,
            taxDeferredContribution,
            taxDeferredRate,
            duration
        );
        taxDeferredBalance = taxDeferredResult.finalBalance;
        taxDeferredTotalContributions += taxDeferredResult.totalContributions;
        
        // Calculate growth for tax-free account
        const taxFreeResult = calculateCompoundGrowth(
            taxFreeBalance,
            taxFreeContribution,
            taxFreeRate,
            duration
        );
        taxFreeBalance = taxFreeResult.finalBalance;
        taxFreeTotalContributions += taxFreeResult.totalContributions;
        
        // Calculate growth for taxable account
        const taxableResult = calculateCompoundGrowth(
            taxableBalance,
            taxableContribution,
            taxableRate,
            duration
        );
        taxableBalance = taxableResult.finalBalance;
        taxableTotalContributions += taxableResult.totalContributions;
        
        totalYears += duration;
        
        // Store period results
        periodResults.push({
            periodNumber: periodResults.length + 1,
            periodName: periodName,
            duration: duration,
            cumulativeYears: totalYears,
            taxDeferred: taxDeferredBalance,
            taxFree: taxFreeBalance,
            taxable: taxableBalance,
            total: taxDeferredBalance + taxFreeBalance + taxableBalance
        });
    });
    
    // Calculate growth (final balance - starting balance - contributions)
    const taxDeferredGrowth = taxDeferredBalance - taxDeferredStart - taxDeferredTotalContributions;
    const taxFreeGrowth = taxFreeBalance - taxFreeStart - taxFreeTotalContributions;
    const taxableGrowth = taxableBalance - taxableStart - taxableTotalContributions;
    
    // Display results
    displayResults({
        taxDeferred: {
            final: taxDeferredBalance,
            start: taxDeferredStart,
            contributions: taxDeferredTotalContributions,
            growth: taxDeferredGrowth
        },
        taxFree: {
            final: taxFreeBalance,
            start: taxFreeStart,
            contributions: taxFreeTotalContributions,
            growth: taxFreeGrowth
        },
        taxable: {
            final: taxableBalance,
            start: taxableStart,
            contributions: taxableTotalContributions,
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
    document.getElementById('taxDeferredGrowth').textContent = formatCurrency(results.taxDeferred.growth);
    
    // Tax-free results
    document.getElementById('taxFreeResult').textContent = formatCurrency(results.taxFree.final);
    document.getElementById('taxFreeStart').textContent = formatCurrency(results.taxFree.start);
    document.getElementById('taxFreeContributions').textContent = formatCurrency(results.taxFree.contributions);
    document.getElementById('taxFreeGrowth').textContent = formatCurrency(results.taxFree.growth);
    
    // Taxable results
    document.getElementById('taxableResult').textContent = formatCurrency(results.taxable.final);
    document.getElementById('taxableStart').textContent = formatCurrency(results.taxable.start);
    document.getElementById('taxableContributions').textContent = formatCurrency(results.taxable.contributions);
    document.getElementById('taxableGrowth').textContent = formatCurrency(results.taxable.growth);
    
    // Total results
    const totalFinal = results.taxDeferred.final + results.taxFree.final + results.taxable.final;
    const totalStart = results.taxDeferred.start + results.taxFree.start + results.taxable.start;
    const totalContributions = results.taxDeferred.contributions + results.taxFree.contributions + results.taxable.contributions;
    const totalGrowth = results.taxDeferred.growth + results.taxFree.growth + results.taxable.growth;
    
    document.getElementById('totalResult').textContent = formatCurrency(totalFinal);
    document.getElementById('totalStart').textContent = formatCurrency(totalStart);
    document.getElementById('totalContributions').textContent = formatCurrency(totalContributions);
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
                    <th>Period Name</th>
                    <th>Years in Period</th>
                    <th>Cumulative Years</th>
                    <th class="amount">Tax-Deferred</th>
                    <th class="amount">Tax-Free</th>
                    <th class="amount">Taxable</th>
                    <th class="amount">Total Balance</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    periodResults.forEach(period => {
        tableHTML += `
            <tr>
                <td class="period-number">${period.periodName}</td>
                <td>${period.duration.toFixed(1)} years</td>
                <td>${period.cumulativeYears.toFixed(1)} years</td>
                <td class="amount">${formatCurrency(period.taxDeferred)}</td>
                <td class="amount">${formatCurrency(period.taxFree)}</td>
                <td class="amount">${formatCurrency(period.taxable)}</td>
                <td class="amount"><strong>${formatCurrency(period.total)}</strong></td>
            </tr>
        `;
    });
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    tableContainer.innerHTML = tableHTML;
}
