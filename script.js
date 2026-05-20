// Track contribution periods
let periodCount = 0;
const RMD_UNIFORM_LIFETIME_DIVISORS = {
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
    101: 6.0,
    102: 5.6,
    103: 5.2,
    104: 4.9,
    105: 4.6,
    106: 4.3,
    107: 4.1,
    108: 3.9,
    109: 3.7,
    110: 3.5,
    111: 3.4,
    112: 3.3,
    113: 3.1,
    114: 3.0,
    115: 2.9,
    116: 2.8,
    117: 2.7,
    118: 2.5,
    119: 2.3,
    120: 2.0
};

function getRmdDivisor(age) {
    if (RMD_UNIFORM_LIFETIME_DIVISORS[age]) {
        return RMD_UNIFORM_LIFETIME_DIVISORS[age];
    }

    const maxDefinedAge = 120;
    return RMD_UNIFORM_LIFETIME_DIVISORS[maxDefinedAge];
}

function calculateRmdPeriodRequirements(startingBalance, monthlyContribution, monthlyWithdrawal, annualRate, durationYears, compoundFrequency, startingAge) {
    if (durationYears <= 0) {
        return {
            minAnnualRmd: 0,
            maxAnnualRmd: 0,
            averageAnnualRmd: 0,
            annualRmds: [],
            yearsEvaluated: 0
        };
    }

    const fullYears = Math.floor(durationYears);
    const fractionalYear = durationYears - fullYears;
    const yearsEvaluated = fractionalYear > 0 ? fullYears + 1 : fullYears;

    let runningBalance = startingBalance;
    let currentAge = startingAge;
    let minAnnualRmd = Number.POSITIVE_INFINITY;
    let maxAnnualRmd = 0;
    let totalAnnualRmd = 0;
    const annualRmds = [];

    for (let yearIndex = 0; yearIndex < yearsEvaluated; yearIndex++) {
        const divisor = getRmdDivisor(currentAge);
        const annualRmd = Math.max(0, runningBalance / divisor);
        annualRmds.push(annualRmd);
        minAnnualRmd = Math.min(minAnnualRmd, annualRmd);
        maxAnnualRmd = Math.max(maxAnnualRmd, annualRmd);
        totalAnnualRmd += annualRmd;

        const isFinalPartialYear = yearIndex === yearsEvaluated - 1 && fractionalYear > 0;
        const segmentYears = isFinalPartialYear ? fractionalYear : 1;
        runningBalance = calculateCompoundGrowth(
            runningBalance,
            monthlyContribution,
            monthlyWithdrawal,
            annualRate,
            segmentYears,
            compoundFrequency
        ).finalBalance;
        currentAge += 1;
    }

    return {
        minAnnualRmd: minAnnualRmd === Number.POSITIVE_INFINITY ? 0 : minAnnualRmd,
        maxAnnualRmd: maxAnnualRmd,
        averageAnnualRmd: yearsEvaluated > 0 ? totalAnnualRmd / yearsEvaluated : 0,
        annualRmds: annualRmds,
        yearsEvaluated: yearsEvaluated
    };
}

function loadSavedCalculationNames(selectedName) {
    const loadSelect = document.getElementById('loadCalculationSelect');
    const prefix = 'calc_';
    const names = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(prefix)) {
            names.push(key.substring(prefix.length));
        }
    }
    loadSelect.innerHTML = '<option value="">Load Calculation...</option>' +
        names.map(n => `<option value="${n}"${n === selectedName ? ' selected' : ''}>${n}</option>`).join('');
}

function serializeCalculatorState() {
    // Save all form fields and periods
    const state = {};
    // Top-level fields
    [
        'taxDeferredBalance', 'taxDeferredRate',
        'taxFreeBalance', 'taxFreeRate',
        'brokerageBalance', 'brokerageRate',
        'savingsBalance', 'savingsRate'
    ].forEach(id => {
        const el = document.getElementById(id);
        state[id] = el ? el.value : null;
    });
    // Compound frequency
    state.compoundFrequency = document.querySelector('input[name="compoundFrequency"]:checked').value;

    // Periods
    state.periods = [];
    document.querySelectorAll('.contribution-period').forEach(period => {
        const periodId = period.id.split('-')[1];
        const periodState = {};
        [
            'periodName', 'grossIncome', 'duration',
            'taxDeferred', 'taxDeferredWithdrawal', 'taxDeferredLumpSum',
            'taxFree', 'taxFreeWithdrawal', 'taxFreeLumpSum',
            'brokerage', 'brokerageWithdrawal', 'brokerageLumpSum',
            'savings', 'savingsWithdrawal', 'savingsLumpSum'
        ].forEach(field => {
            const el = document.getElementById(`${field}-${periodId}`);
            periodState[field] = el ? el.value : null;
        });
        // RMD start checkbox
        const rmdEl = document.getElementById(`startRmd-${periodId}`);
        periodState.startRmd = rmdEl ? rmdEl.checked : false;
        state.periods.push(periodState);
    });
    return state;
}

function deserializeCalculatorState(state) {
    // Restore top-level fields
    [
        'taxDeferredBalance', 'taxDeferredRate',
        'taxFreeBalance', 'taxFreeRate',
        'brokerageBalance', 'brokerageRate',
        'savingsBalance', 'savingsRate'
    ].forEach(id => {
        const el = document.getElementById(id);
        if (el && state[id] !== undefined) el.value = state[id];
    });
    // Compound frequency
    if (state.compoundFrequency) {
        const radio = document.querySelector(`input[name="compoundFrequency"][value="${state.compoundFrequency}"]`);
        if (radio) radio.checked = true;
    }
    // Remove all periods
    document.getElementById('contributionPeriods').innerHTML = '';
    periodCount = 0;
    // Add periods
    (state.periods || []).forEach((period, idx) => {
        addContributionPeriod();
        const periodId = periodCount;
        [
            'periodName', 'grossIncome', 'duration',
            'taxDeferred', 'taxDeferredWithdrawal', 'taxDeferredLumpSum',
            'taxFree', 'taxFreeWithdrawal', 'taxFreeLumpSum',
            'brokerage', 'brokerageWithdrawal', 'brokerageLumpSum',
            'savings', 'savingsWithdrawal', 'savingsLumpSum'
        ].forEach(field => {
            const el = document.getElementById(`${field}-${periodId}`);
            if (el && period[field] !== undefined) el.value = period[field];
        });
        // RMD start checkbox
        const rmdEl = document.getElementById(`startRmd-${periodId}`);
        if (rmdEl) rmdEl.checked = !!period.startRmd;
    });
}

// Initialize the calculator
document.addEventListener('DOMContentLoaded', function() {
    // Add initial contribution period
    addContributionPeriod();

    // Prevent accidental mouse-wheel changes to focused numeric inputs.
    // This avoids subtle step-based shifts like 3000 -> 2999.99.
    document.addEventListener('wheel', (event) => {
        const activeElement = document.activeElement;
        if (
            activeElement &&
            activeElement.tagName === 'INPUT' &&
            activeElement.type === 'number' &&
            event.target === activeElement
        ) {
            activeElement.blur();
        }
    }, { capture: true });
    
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

    // Save/Load/Delete calculation UI
    const saveBtn = document.getElementById('saveCalculationBtn');
    const loadSelect = document.getElementById('loadCalculationSelect');
    const deleteBtn = document.getElementById('deleteCalculationBtn');
    loadSavedCalculationNames();

    saveBtn.addEventListener('click', function() {
        const name = prompt('Enter a name for this calculation:');
        if (!name) return;
        const state = serializeCalculatorState();
        localStorage.setItem('calc_' + name, JSON.stringify(state));
        loadSavedCalculationNames(name);
        alert('Calculation saved as "' + name + '"');
    });

    loadSelect.addEventListener('change', function() {
        const name = loadSelect.value;
        if (!name) return;
        const raw = localStorage.getItem('calc_' + name);
        if (!raw) return;
        const state = JSON.parse(raw);
        deserializeCalculatorState(state);
    });

    deleteBtn.addEventListener('click', function() {
        const name = loadSelect.value;
        if (!name) return;
        if (confirm('Delete calculation "' + name + '"?')) {
            localStorage.removeItem('calc_' + name);
            loadSavedCalculationNames();
            alert('Calculation deleted.');
        }
    });
});

// Add a new contribution period
function addContributionPeriod(insertAfterId = null) {
    periodCount++;
    const periodsContainer = document.getElementById('contributionPeriods');

    const periodDiv = document.createElement('div');
    periodDiv.className = 'contribution-period';
    periodDiv.id = `period-${periodCount}`;

    // Insert/Remove buttons
    let headerButtons = '';
    if (periodCount > 1) {
        headerButtons += `<button type="button" class="btn btn-danger" onclick="removePeriod(${periodCount})">Remove</button>`;
    }
    headerButtons += `<button type="button" class="btn btn-secondary insert-below-btn" onclick="insertPeriodBelow(${periodCount})">Insert Period Below</button>`;

    periodDiv.innerHTML = `
        <div class="contribution-period-header">
            ${headerButtons}
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
        <div class="input-group rmd-checkbox-group">
            <label class="rmd-checkbox-label" for="startRmd-${periodCount}">
                <input type="checkbox" id="startRmd-${periodCount}">
                <span>Begin calculating RMDs at this age</span>
            </label>
            <small>Assumes RMD start age is 75. Once started, RMD checks continue for all later periods using age-based IRS divisors.</small>
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
    
    if (insertAfterId) {
        const afterElem = document.getElementById(`period-${insertAfterId}`);
        if (afterElem && afterElem.nextSibling) {
            periodsContainer.insertBefore(periodDiv, afterElem.nextSibling);
        } else {
            periodsContainer.appendChild(periodDiv);
        }
    } else {
        periodsContainer.appendChild(periodDiv);
    }
}

// Insert a new period below the given period
function insertPeriodBelow(periodId) {
    addContributionPeriod(periodId);
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

// Calculate yearly snapshots for a single period (used for expandable rows)
function getYearlyDetailsForPeriod(periodData, startingBalances, rates, rmdActive, startRmdAge = 75) {
    const yearlyDetails = [];
    let taxDeferredBal = startingBalances.taxDeferred + (periodData.taxDeferredLumpSum || 0);
    let taxFreeBal = startingBalances.taxFree + (periodData.taxFreeLumpSum || 0);
    let brokerageBal = startingBalances.brokerage + (periodData.brokerageLumpSum || 0);
    let savingsBal = startingBalances.savings + (periodData.savingsLumpSum || 0);
    let brokerageCostBasis = startingBalances.brokerageCostBasis + (periodData.brokerageLumpSum || 0);
    
    const years = Math.ceil(periodData.duration);
    let currentAge = startRmdAge;
    
    for (let year = 1; year <= years; year++) {
        // Only calculate full years, skip if we've exceeded the duration
        if (year - 1 >= Math.floor(periodData.duration) && year > Math.ceil(periodData.duration)) break;
        
        // For the last partial year, adjust to the actual fractional amount
        const yearFraction = year <= Math.floor(periodData.duration) ? 1 : (periodData.duration - Math.floor(periodData.duration));
        
        // Annual amounts
        const yearlyTaxDeferredContribution = periodData.taxDeferredContribution * 12 * yearFraction;
        const yearlyTaxDeferredWithdrawal = periodData.taxDeferredWithdrawal * 12 * yearFraction;
        const yearlyTaxFreeContribution = periodData.taxFreeContribution * 12 * yearFraction;
        const yearlyTaxFreeWithdrawal = periodData.taxFreeWithdrawal * 12 * yearFraction;
        const yearlyBrokerageContribution = periodData.brokerageContribution * 12 * yearFraction;
        const yearlyBrokerageWithdrawal = periodData.brokerageWithdrawal * 12 * yearFraction;
        const yearlySavingsContribution = periodData.savingsContribution * 12 * yearFraction;
        const yearlySavingsWithdrawal = periodData.savingsWithdrawal * 12 * yearFraction;
        
        // Update balances with contributions and withdrawals
        taxDeferredBal += yearlyTaxDeferredContribution - yearlyTaxDeferredWithdrawal;
        taxFreeBal += yearlyTaxFreeContribution - yearlyTaxFreeWithdrawal;
        
        // Brokerage gain calculation
        const annualRate = rates.brokerage / 100;
        const brokerageGain = brokerageBal * annualRate;
        brokerageCostBasis = Math.max(0, Math.min(brokerageCostBasis, brokerageBal + brokerageGain));
        const gainRatio = (brokerageBal + brokerageGain) > 0
            ? Math.max(0, brokerageGain / (brokerageBal + brokerageGain))
            : 0;
        const realizedGains = yearlyBrokerageWithdrawal * gainRatio;
        brokerageCostBasis -= Math.max(0, yearlyBrokerageWithdrawal - realizedGains);
        brokerageBal += brokerageGain + yearlyBrokerageContribution - yearlyBrokerageWithdrawal;
        
        // Savings account (no gains calculated in this model)
        savingsBal += yearlySavingsContribution - yearlySavingsWithdrawal;
        
        // Apply growth
        const taxDeferredGrowth = taxDeferredBal * (rates.taxDeferred / 100);
        const taxFreeGrowth = taxFreeBal * (rates.taxFree / 100);
        const savingsGrowth = savingsBal * (rates.savings / 100);
        
        taxDeferredBal += taxDeferredGrowth;
        taxFreeBal += taxFreeGrowth;
        savingsBal += savingsGrowth;
        
        // Calculate RMD for this year if active
        let yearlyRmd = null;
        if (rmdActive) {
            const divisor = getRmdDivisor(currentAge);
            yearlyRmd = taxDeferredBal / divisor;
            currentAge++;
        }
        
        yearlyDetails.push({
            year: year,
            age: currentAge - 1,
            taxDeferred: taxDeferredBal,
            taxFree: taxFreeBal,
            brokerage: brokerageBal,
            savings: savingsBal,
            total: taxDeferredBal + taxFreeBal + brokerageBal + savingsBal,
            rmd: yearlyRmd
        });
    }
    
    return yearlyDetails;
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
    let rmdActive = false;
    let currentRmdAge = 75;
    
    // Track period-by-period results
    const periodResults = [];
    
    // Process each contribution period
    const periods = document.querySelectorAll('.contribution-period');
    periods.forEach(period => {
        const periodId = period.id.split('-')[1];
        
        const periodName = document.getElementById(`periodName-${periodId}`).value || `Period ${periodId}`;
        const duration = parseFloat(document.getElementById(`duration-${periodId}`).value);
        const beginRmdInThisPeriod = document.getElementById(`startRmd-${periodId}`).checked;
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
        
        const openingTaxDeferredBalance = taxDeferredBalance;
        const openingTaxFreeBalance = taxFreeBalance;
        const openingBrokerageBalance = brokerageBalance;
        const openingSavingsBalance = savingsBalance;
        const openingBrokerageCostBasis = brokerageCostBasis;

        if (beginRmdInThisPeriod && !rmdActive) {
            rmdActive = true;
            currentRmdAge = 75;
        }

        // Add lump sums at the start of the period
        taxDeferredBalance += taxDeferredLumpSum;
        taxFreeBalance += taxFreeLumpSum;
        brokerageBalance += brokerageLumpSum;
        savingsBalance += savingsLumpSum;
        brokerageCostBasis += brokerageLumpSum;

        const annualTaxDeferredWithdrawalPlanned = taxDeferredWithdrawal * 12;
        const rmdRequirements = rmdActive
            ? calculateRmdPeriodRequirements(
                openingTaxDeferredBalance,
                taxDeferredContribution,
                taxDeferredWithdrawal,
                taxDeferredRate,
                duration,
                compoundFrequency,
                currentRmdAge
            )
            : null;
        const averageAnnualRmd = rmdRequirements ? rmdRequirements.averageAnnualRmd : null;
        const minAnnualRmd = rmdRequirements ? rmdRequirements.minAnnualRmd : null;
        const maxAnnualRmd = rmdRequirements ? rmdRequirements.maxAnnualRmd : null;
        const rmdShortfall = rmdRequirements
            ? annualTaxDeferredWithdrawalPlanned + 0.01 < rmdRequirements.maxAnnualRmd
            : false;
        
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
        const taxableMonthlyIncome = Math.max(0, grossIncome - taxDeferredContribution + taxDeferredWithdrawal);

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

        if (rmdActive && rmdRequirements) {
            currentRmdAge += rmdRequirements.yearsEvaluated;
        }
        
        // Store period results
        const yearlyRmdAgeAtStart = currentRmdAge;
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
            yearlyRmd: averageAnnualRmd,
            yearlyRmdMin: minAnnualRmd,
            yearlyRmdMax: maxAnnualRmd,
            rmdShortfall: rmdShortfall,
            totalIncome: totalMonthlyIncome,
            yearlyTakeHome: yearlyTakeHome,
            // Data needed for yearly calculations
            periodData: {
                taxDeferredContribution: taxDeferredContribution,
                taxDeferredWithdrawal: taxDeferredWithdrawal,
                taxDeferredLumpSum: taxDeferredLumpSum,
                taxFreeContribution: taxFreeContribution,
                taxFreeWithdrawal: taxFreeWithdrawal,
                taxFreeLumpSum: taxFreeLumpSum,
                brokerageContribution: brokerageContribution,
                brokerageWithdrawal: brokerageWithdrawal,
                brokerageLumpSum: brokerageLumpSum,
                savingsContribution: savingsContribution,
                savingsWithdrawal: savingsWithdrawal,
                savingsLumpSum: savingsLumpSum,
                duration: duration
            },
            startingBalances: {
                taxDeferred: openingTaxDeferredBalance,
                taxFree: openingTaxFreeBalance,
                brokerage: openingBrokerageBalance,
                savings: openingSavingsBalance,
                brokerageCostBasis: openingBrokerageCostBasis
            },
            rates: {
                taxDeferred: taxDeferredRate,
                taxFree: taxFreeRate,
                brokerage: brokerageRate,
                savings: savingsRate
            },
            rmdActive: rmdActive,
            rmdAgeAtStart: yearlyRmdAgeAtStart
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

// Store period results globally so we can access them for expanding
let globalPeriodResults = [];

// Toggle yearly details for a period
function togglePeriodDetails(periodIndex) {
    const period = globalPeriodResults[periodIndex];
    const detailsRow = document.querySelector(`.yearly-details-row[data-period-index="${periodIndex}"]`);
    const expandBtn = document.querySelector(`.period-row[data-period-index="${periodIndex}"] .expand-btn`);
    
    if (!detailsRow) return;
    
    if (detailsRow.classList.contains('hidden')) {
        // Expand
        detailsRow.classList.remove('hidden');
        expandBtn.textContent = '▼';
        
        // Render yearly details if not already rendered
        const container = document.getElementById(`yearly-details-${periodIndex}`);
        if (!container.dataset.rendered) {
            renderYearlyDetails(periodIndex, period, container);
            container.dataset.rendered = 'true';
        }
    } else {
        // Collapse
        detailsRow.classList.add('hidden');
        expandBtn.textContent = '▶';
    }
}

// Render yearly details table
function renderYearlyDetails(periodIndex, period, container) {
    const yearlyDetails = getYearlyDetailsForPeriod(
        period.periodData,
        period.startingBalances,
        period.rates,
        period.rmdActive,
        period.rmdAgeAtStart
    );
    
    let tableHTML = `
        <table class="yearly-details-table">
            <thead>
                <tr>
                    <th>Year</th>
                    <th class="amount">Age</th>
                    <th class="amount">Tax-Deferred</th>
                    <th class="amount">Tax-Free</th>
                    <th class="amount">Brokerage</th>
                    <th class="amount">Savings</th>
                    <th class="amount">Total Balance</th>
                    <th class="amount">RMD Required</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };
    
    yearlyDetails.forEach(year => {
        const rmdDisplay = year.rmd === null ? '—' : formatCurrency(year.rmd);
        tableHTML += `
            <tr>
                <td class="year-cell">${year.year}</td>
                <td class="amount">${year.age}</td>
                <td class="amount">${formatCurrency(year.taxDeferred)}</td>
                <td class="amount">${formatCurrency(year.taxFree)}</td>
                <td class="amount">${formatCurrency(year.brokerage)}</td>
                <td class="amount">${formatCurrency(year.savings)}</td>
                <td class="amount"><strong>${formatCurrency(year.total)}</strong></td>
                <td class="amount">${rmdDisplay}</td>
            </tr>
        `;
    });
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = tableHTML;
}

// Display period-by-period results
function displayPeriodResults(periodResults, formatCurrency) {
    // Store globally for access in toggle function
    globalPeriodResults = periodResults;
    const tableContainer = document.getElementById('periodResultsTable');
    
    if (periodResults.length === 0) {
        tableContainer.innerHTML = '<p>No periods to display</p>';
        return;
    }
    
    let tableHTML = `
        <table class="period-table">
            <thead>
                <tr>
                    <th style="width: 30px;"></th>
                    <th>Period</th>
                    <th class="amount">Cumulative Years</th>
                    <th class="amount">Tax-Deferred</th>
                    <th class="amount">Tax-Free</th>
                    <th class="amount">Taxable</th>
                    <th class="amount">Total Balance</th>
                    <th class="amount rmd-column">RMD Required (Yearly)</th>
                    <th class="amount income-column">Yearly Take-Home</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    periodResults.forEach((period, index) => {
        const rmdDisplay = period.yearlyRmd === null ? '—' : formatCurrency(period.yearlyRmd);
        const rmdTooltip = period.yearlyRmd === null
            ? ''
            : ` title="Min: ${formatCurrency(period.yearlyRmdMin)} | Max: ${formatCurrency(period.yearlyRmdMax)}"`;
        
        const takeHomeTooltip = `Taxable Income: ${formatCurrency(period.yearlyTaxableIncome)} | Tax-Free Income: ${formatCurrency(period.yearlyTaxFreeIncome)}`;

        tableHTML += `
            <tr class="period-row" data-period-index="${index}">
                <td class="expand-cell"><button class="expand-btn" onclick="togglePeriodDetails(${index})" title="Expand to see yearly details">▶</button></td>
                <td class="period-cell">
                    <div class="period-name">${period.periodName}</div>
                    <div class="period-duration">(${period.duration.toFixed(1)} years)</div>
                </td>
                <td class="amount"><div>${period.cumulativeYears.toFixed(1)}</div><div></div></td>
                <td class="amount"><div>${formatCurrency(period.taxDeferred)}</div><div></div></td>
                <td class="amount"><div>${formatCurrency(period.taxFree)}</div><div></div></td>
                <td class="amount"><div>${formatCurrency(period.taxable)}</div><div></div></td>
                <td class="amount"><div><strong>${formatCurrency(period.total)}</strong></div><div></div></td>
                <td class="amount rmd-column ${period.rmdShortfall ? 'rmd-warning' : ''}"><div${rmdTooltip}>${rmdDisplay}</div><div></div></td>
                <td class="amount income-column"><div title="${takeHomeTooltip}"><strong>${formatCurrency(period.yearlyTakeHome)}</strong></div><div></div></td>
            </tr>
            <tr class="yearly-details-row hidden" data-period-index="${index}">
                <td colspan="9">
                    <div class="yearly-details-container" id="yearly-details-${index}"></div>
                </td>
            </tr>
        `;
    });
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    tableContainer.innerHTML = tableHTML;
}
