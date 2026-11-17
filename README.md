# Three-Bucket Investment Growth Calculator

A static web calculator for planning long-term investment growth using the three-bucket strategy. This calculator helps you visualize how different types of investment accounts (tax-deferred, tax-free, and taxable) will grow over time with various contribution periods.

**[Try the calculator here →](https://tammymetz.com/ma/)**

## About the Three-Bucket Strategy

The three-bucket strategy is a tax-optimization method for saving and investing:

1. **Tax-Deferred Bucket** (Traditional 401k, Traditional IRA): Get a tax deduction now, pay taxes in retirement
2. **Tax-Free Bucket** (Roth 401k, Roth IRA): Pay taxes now, enjoy tax-free growth and withdrawals
3. **After Tax/Taxable Bucket** (Regular brokerage accounts): No tax advantages, but maximum flexibility

Learn more at [Money Guy's Three-Bucket Strategy](https://moneyguy.com/article/the-3-bucket-strategy-how-much-should-you-invest-in-each-bucket/)

## Features

- Input starting balances for all three account types
- Set custom growth rates for each account
- Add multiple contribution periods with different monthly amounts
- Track starting debt separately from the buckets, with monthly Pay Down and Accrue amounts in each period
- View net worth (assets minus debt) in period results and expand periods for yearly debt balances
- See detailed breakdowns of contributions, growth, and final balances
- Mobile-responsive design
- Runs entirely in the browser (no backend required)

## Usage

Simply open `index.html` in your web browser or visit the GitHub Pages site.

### Example Scenario

1. Set starting balances (e.g., $10,000 in tax-deferred, $5,000 in Roth)
2. Set expected annual growth rates (typically 7-10%)
3. Add contribution periods:
   - Period 1: $1,000/month for 10 years
   - Period 2: $2,000/month for 5 years
   - Period 3: $0/month for 15 years (retirement phase)
4. Click "Calculate Growth" to see projected balances

### Debt Pay-Down

Enter Starting Debt in Account Settings, then set monthly Pay Down and Accrue amounts in each period's Debt Payoff box. Debt carries forward between periods and stops at $0; excess pay-down is ignored. Partial years prorate the monthly amounts. No interest is added automatically; include any interest in Accrue.

Debt changes do not automatically withdraw from or deposit into investment or savings accounts, and do not change income or tax calculations. Period and yearly Net Worth subtract outstanding debt from assets; Total Portfolio Value remains assets only. Debt settings are saved with calculations, and older saved calculations start with no debt.

## GitHub Pages Setup

This site is configured to run on GitHub Pages. To deploy:

1. Go to your repository Settings
2. Navigate to Pages section
3. Under "Source", select "Deploy from a branch"
4. Select the `main` branch and `/ (root)` folder
5. Click Save

Your calculator will be available at: `https://[username].github.io/[repository-name]/`

## Technologies Used

- HTML5
- CSS3 (with CSS Grid and Flexbox)
- Vanilla JavaScript (no frameworks required)

## Tests

Run `node --test script.test.js` with Node.js to check debt calculations, net worth results, and saved-calculation compatibility.

## Disclaimer

This calculator is for educational purposes only and does not constitute financial advice. Actual investment returns will vary. Consult with a qualified financial advisor for personalized guidance.

## License

MIT License - Feel free to use and modify for your own needs.