const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const vm = require('node:vm');

function createCalculator() {
    const elements = new Map();
    const frequency = { value: 'monthly' };

    function createElement() {
        let html = '';
        let value = '';
        return {
            children: [],
            checked: false,
            classList: { remove() {} },
            scrollIntoView() {},
            get value() { return value; },
            set value(next) { value = String(next); },
            get innerHTML() { return html; },
            set innerHTML(next) {
                html = next;
                this.children = [];
                for (const match of next.matchAll(/<[\w-]+\b([^>]*\bid="([^"]+)"[^>]*)>/g)) {
                    const element = createElement();
                    element.value = match[1].match(/\bvalue="([^"]*)"/)?.[1] ?? '';
                    elements.set(match[2], element);
                }
            },
            appendChild(child) { this.children.push(child); }
        };
    }

    const page = createElement();
    page.innerHTML = readFileSync(`${__dirname}/index.html`, 'utf8');
    const document = {
        addEventListener() {},
        createElement,
        getElementById: id => elements.get(id),
        querySelector: () => frequency,
        querySelectorAll: selector => {
            assert.equal(selector, '.contribution-period');
            return elements.get('contributionPeriods').children;
        }
    };
    const calculator = vm.createContext({ document });
    vm.runInContext(readFileSync(`${__dirname}/taxes.js`, 'utf8'), calculator);
    vm.runInContext(readFileSync(`${__dirname}/script.js`, 'utf8'), calculator);
    calculator.addContributionPeriod();

    return {
        calculator,
        elements,
        frequency,
        set(id, value) { elements.get(id).value = value; },
        calculate() {
            calculator.calculateGrowth({ preventDefault() {} });
            return vm.runInContext('globalPeriodResults', calculator);
        }
    };
}

test('period table starts with original balances before lump sums and keeps period indexes unchanged', () => {
    const app = createCalculator();
    app.set('taxDeferredBalance', 1000);
    app.set('taxFreeBalance', 2000);
    app.set('brokerageBalance', 3000);
    app.set('savingsBalance', 4000);
    app.set('startingDebt', 12000);
    app.set('taxDeferredLumpSum-1', 500);
    app.set('taxFreeLumpSum-1', 600);
    app.set('brokerageLumpSum-1', 700);
    app.set('savingsLumpSum-1', 800);
    app.calculator.addContributionPeriod();

    const periods = app.calculate();
    const html = app.elements.get('periodResultsTable').innerHTML;
    const startRow = html.match(/<tbody>\s*<tr class="start-row">([\s\S]*?)<\/tr>/);
    assert.ok(startRow, 'START must be the first body row');
    const cells = Array.from(startRow[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g),
        match => match[1].replace(/<[^>]*>/g, '').trim());
    assert.deepEqual(cells, ['', 'START', '0', '$1,000.00', '$2,000.00', '$7,000.00', '-$2,000.00', '—', '—']);
    assert.doesNotMatch(startRow[1], /expand-btn|togglePeriodDetails/);
    assert.equal(periods.length, 2);
    for (let index = 0; index < periods.length; index++) {
        assert.match(html, new RegExp(`<tr class="period-row" data-period-index="${index}">`));
        assert.match(html, new RegExp(`onclick="togglePeriodDetails\\(${index}\\)"`));
        assert.match(html, new RegExp(`id="yearly-details-${index}"`));
    }
});

test('debt supports pay-down, accrual, simultaneous flows, partial years, and a zero floor', () => {
    const { calculator } = createCalculator();
    const cases = [
        [5000, 100, 0, 1, 3800],
        [5000, 0, 100, 1, 6200],
        [5000, 200, 50, 1, 3200],
        [5000, 1000, 100, 1, 0],
        [0, 100, 50, 1, 0],
        [0, 50, 100, 1, 600],
        [5000, 100, 0, 0.1, 4880],
        [5000, 100, 50, 0, 5000]
    ];
    for (const [start, payDown, accrue, years, expected] of cases) {
        assert.equal(calculator.calculateDebtBalance(start, payDown, accrue, years), expected);
    }
});

for (const frequency of ['monthly', 'annually']) {
    test(`debt carries across periods and matches yearly net worth with ${frequency} compounding`, () => {
        const app = createCalculator();
        app.frequency.value = frequency;
        app.set('startingDebt', 5000);
        app.set('savingsBalance', 1000);
        app.set('savingsRate', 0);
        app.set('duration-1', 1);
        app.set('debtPayDown-1', 1000);
        app.set('debtAccrue-1', 100);
        app.calculator.addContributionPeriod();
        app.set('duration-2', 0.5);
        app.set('debtAccrue-2', 200);
        app.calculator.addContributionPeriod();
        app.set('duration-3', 1.5);
        app.set('debtPayDown-3', 50);
        app.set('debtAccrue-3', 100);

        const periods = app.calculate();
        assert.deepEqual(Array.from(periods, period => period.debt), [0, 1200, 2100]);
        assert.deepEqual(Array.from(periods, period => period.total), [1000, -200, -1100]);
        for (const period of periods) {
            const years = app.calculator.getYearlyDetailsForPeriod(
                period.periodData, period.startingBalances, period.rates,
                period.rmdActive, period.rmdAgeAtStart, period.compoundFrequency
            );
            assert.equal(years.at(-1).debt, period.debt);
            assert.equal(years.at(-1).total, period.total);
        }

        assert.match(app.elements.get('periodResultsTable').innerHTML, />Net Worth</);
        assert.doesNotMatch(app.elements.get('periodResultsTable').innerHTML, /Total Balance/);
        const container = {};
        app.calculator.renderYearlyDetails(2, periods[2], container);
        assert.match(container.innerHTML, />Debt</);
        assert.match(container.innerHTML, />Net Worth</);
        assert.match(container.innerHTML, /<td class="amount debt-amount">-\$2,100<\/td>/);
        assert.match(container.innerHTML, /-\$1,100/);
        app.calculator.renderYearlyDetails(0, periods[0], container);
        assert.match(container.innerHTML, /<td class="amount debt-amount">\$0<\/td>/);
        assert.equal(app.elements.get('totalResult').textContent, '-$1,100.00');
        assert.equal(app.elements.get('totalStart').textContent, '-$4,000.00');
    });
}

test('net worth summary handles no debt and paid-off debt without changing investment growth', () => {
    const app = createCalculator();
    app.set('savingsBalance', 1000);
    app.set('savingsRate', 0);
    app.set('duration-1', 1);
    app.calculate();
    assert.equal(app.elements.get('totalResult').textContent, '$1,000.00');
    assert.equal(app.elements.get('totalStart').textContent, '$1,000.00');
    const growth = app.elements.get('totalGrowth').textContent;

    app.set('startingDebt', 600);
    app.set('debtPayDown-1', 100);
    const periods = app.calculate();
    assert.equal(periods[0].debt, 0);
    assert.equal(app.elements.get('totalResult').textContent, '$1,000.00');
    assert.equal(app.elements.get('totalStart').textContent, '$400.00');
    assert.equal(app.elements.get('totalGrowth').textContent, growth);
});

test('debt does not change asset growth, income, taxes, or RMDs', () => {
    const app = createCalculator();
    app.set('taxDeferredBalance', 100000);
    app.set('brokerageBalance', 10000);
    app.set('savingsBalance', 1000);
    app.set('grossIncome-1', 5000);
    app.set('taxDeferredWithdrawal-1', 100);
    app.set('duration-1', 2);
    app.elements.get('startRmd-1').checked = true;
    const baseline = app.calculate()[0];
    app.set('startingDebt', 100000);
    app.set('debtPayDown-1', 250);
    app.set('debtAccrue-1', 50);
    const withDebt = app.calculate()[0];
    assert.equal(withDebt.debt, 95200);
    assert.equal(withDebt.total, baseline.total - 95200);
    for (const field of [
        'taxDeferred', 'taxFree', 'taxable', 'yearlyTaxableIncome',
        'yearlyTaxFreeIncome', 'yearlyTakeHome', 'yearlyRmd', 'rmdShortfall'
    ]) {
        assert.equal(withDebt[field], baseline[field], field);
    }
});

test('debt fields round-trip in saved state and older saves reset debt to zero', () => {
    const app = createCalculator();
    app.set('startingDebt', 12345);
    app.set('debtPayDown-1', 500);
    app.set('debtAccrue-1', 25);
    app.calculator.addContributionPeriod();
    app.set('debtPayDown-2', 200);
    app.set('debtAccrue-2', 100);
    const saved = app.calculator.serializeCalculatorState();
    assert.equal(saved.startingDebt, '12345');
    assert.equal(saved.periods[0].debtPayDown, '500');
    assert.equal(saved.periods[1].debtAccrue, '100');
    app.calculator.deserializeCalculatorState(saved);
    assert.deepEqual(app.calculator.serializeCalculatorState(), saved);

    delete saved.startingDebt;
    for (const period of saved.periods) {
        delete period.debtPayDown;
        delete period.debtAccrue;
    }
    app.calculator.deserializeCalculatorState(saved);
    const restored = app.calculator.serializeCalculatorState();
    assert.equal(restored.startingDebt, '0');
    for (const period of restored.periods) {
        assert.equal(period.debtPayDown, '0');
        assert.equal(period.debtAccrue, '0');
    }
    assert.equal(app.calculate()[0].debt, 0);
});
