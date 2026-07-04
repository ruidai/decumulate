# Decumulate — Sophisticated Tax-Optimized Retirement Simulator

**Decumulate** is an advanced, high-fidelity financial planning and decumulation-phase simulator designed for individuals, personal finance veterans, and developer-planners. Unlike standard "accumulation" calculators that merely project simple compound growth, **Decumulate** models the complex, multi-variable reality of drawing down wealth, tax bracket filling, and optimizing the multi-decade transition from Pre-Tax, Tax-Free, and Taxable accounts.

Designed with both deep personal finance expertise and modern engineering principles, Decumulate visualizes the interactions of social security taxability, Required Minimum Distributions (RMDs), capital gains stacking, and strategic Roth conversions.

---

## 💡 The Core Thesis of Decumulate

Most financial planning tools treat retirement as a single "end-state." In reality, **decumulation is a far more challenging mathematical problem than accumulation**. 

Between retirement and age 73 lies the **"Roth Conversion Golden Window"**—a period of historically low taxable income where strategic pre-tax to Roth conversions can neutralize future **Required Minimum Distributions (RMD) tax bombs**. Decumulate gives you the precise quantitative sandbox needed to model, run, and master these strategies.

---

## 🛠️ Advanced Financial Planning & Tax Features

Decumulate handles tax calculations with institutional-grade rigor rather than simple flat-rate assumptions.

### 1. Multi-Account Portfolio Engine
The simulator models three distinct asset buckets in parallel with independent growth rates:
*   **Taxable Brokerage:** Tracks separate cost basis and capital appreciation, calculating realistic capital gains tax drag upon liquidations.
*   **Pre-Tax (Traditional 401k / IRA):** Subject to ordinary income tax upon withdrawal and RMD calculations.
*   **Tax-Free (Roth IRA / Roth 401k):** High-growth vehicle allowing tax-free compounding and tax-free distributions.

### 2. Multi-Tiered Ordinary & Capital Gains Tax Stacking
Rather than treating capital gains and ordinary income in isolation, Decumulate implements the exact **IRS Stacking Hierarchy**:
*   The **Standard Deduction** (for either *Single* or *Married Filing Jointly* status) is applied and indexed annually for inflation.
*   Ordinary taxable income (salaries, RMDs, traditional withdrawals, and short-term capital gains/dividends) fills the ordinary brackets first.
*   Long-Term Capital Gains (LTCG) and Qualified Dividends are stacked **on top** of ordinary income, ensuring they are taxed in their correct marginal capital gains brackets (0%, 15%, or 20%).

### 3. Social Security Taxability & "The Tax Torpedo"
The tool mathematically models the **Combined Income Prosperity Test** (often known as the Social Security Tax Torpedo):
$$\text{Combined Income} = \text{Adjusted Gross Income (AGI)} + \text{Ordinary Dividends} + \left(50\% \times \text{Social Security Benefit}\right)$$
Depending on Single or MFJ thresholds ($25k/$32k and $34k/$44k), the model dynamically renders 0%, 50%, or 85% of Social Security benefits as taxable ordinary income. This enables planners to visually identify and avoid the high-marginal-rate cliffs caused by overlapping tax phases.

### 4. Required Minimum Distributions (RMDs)
Starting at age 73, the engine queries the **IRS Uniform Lifetime Table** divisor:
$$\text{RMD Amount} = \frac{\text{Prior Year-End Traditional Balance}}{\text{Uniform Lifetime Divisor}}$$
This forced distribution is injected into ordinary income, letting users observe how massive pre-tax balances can trigger involuntary tax-bracket spikes later in life.

### 5. Automated Heuristic Liquidation Sequencing
When net cash flow is negative, Decumulate executes an intelligent, tax-aware harvesting order:
1.  **Taxable Brokerage:** Draws from brokerage first, dynamically calculating the **Gain Ratio** ($\frac{\text{Balance} - \text{Basis}}{\text{Balance}}$) to isolate capital gains tax liabilities iteratively.
2.  **Early-Withdrawal Penalty Avoidance (Optional):** If checked and under age 59½, the engine intelligently draws from tax-free **Roth balances** first to bypass the IRS 10% early withdrawal penalty. If unchecked, it harvests from **Traditional** assets, calculating and compounding the 10% penalty on the fly.
3.  **Standard Sequencing:** Draws from Traditional (fully taxable) once brokerage is exhausted, and finally depletes Roth as a last resort to allow maximum tax-free compounding time.

### 6. Gap-Year & Roth Conversion Modeling
Model a temporary retirement, partial-work phase, or full "gap-year" window:
*   Inject a lower temporary wage.
*   Execute strategic **annual Roth conversions** to fill lower tax brackets with pre-tax money.
*   The UI highlights these conversion years in an elegant **Conversion Area** overlay directly on your balance sheets and tax paid graphs.

### 7. Cash Flow Surpluses & Backdoor Routing
When annual cash flow is positive (surplus), the system redirects funds:
*   First, up to the **Mega Backdoor Roth** limits into the tax-free Roth bucket.
*   The remaining surplus is swept back into the **Taxable Brokerage** account, dynamically increasing both the overall balance and the cost basis.

### 8. Interactive Events Timeline
Add one-off or recurring customized cash flow milestones (e.g., down-payment for a home, inheritances, medical events, or college tuition payments) at custom ages to stress-test your portfolio's survivability.

---

## 💻 Tech Stack & Architecture

Decumulate is designed as a modular, type-safe Single Page Application:

*   **Runtime Framework:** React 19 & TypeScript 5+
*   **Bundler & Dev Server:** Vite 6
*   **Styling Engine:** Tailwind CSS v4 (using clean display typography, generous negative space, and modern UI primitives)
*   **Visualization Engine:** Recharts (high-performance SVG charting library)
*   **Animations:** Motion (smooth transitions, expandable configurations, and modal dialogs)
*   **Icons:** Lucide React

### Modular Project Layout

```text
├── src/
│   ├── App.tsx          # Main Dashboard and Layout views
│   ├── types.ts         # Strictly defined type interfaces for parameters and results
│   ├── constants.ts     # IRS Tax brackets (Single/MFJ), Standard Deductions, and RMD Divisors
│   ├── main.tsx         # React root initialization
│   ├── index.css        # Tailwind CSS imports and variable custom typography
│   └── lib/
│       └── simulation.ts # Core high-fidelity decumulation mathematical engine
├── package.json         # Dependency configuration
└── metadata.json        # Manifest detailing app capabilities
```

---

## 📈 Adaptive Visual Engineering

A standout frontend feature is Decumulate's **Responsive X-Axis Tick Adapter**:
Standard charting libraries often crowd x-axis labels (ages 30 through 100) on smaller viewports, resulting in unreadable overlapping numbers. Decumulate features a window-resize-aware heuristic engine:
*   On spacious desktop displays: Displays **every single year** or 2-year increments for fine-grained analysis.
*   On medium displays: Automatically collapses to **5-year intervals** (e.g., 35, 40, 45...).
*   On compact mobile screens: Dynamically aggregates down to clean **10-year major milestones**.
*   All chart components render with standard responsive containers (`ResponsiveContainer`) with automatic debounced resize observers.

---

## 🚀 Getting Started

To run Decumulate locally:

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the simulator.

### 3. Compile for Production
To bundle a production-ready build:
```bash
npm run build
```
This output is written to `/dist` as highly-optimized static HTML, JS, and CSS files.

---

## 📄 License

This project is licensed under the MIT License. Feel free to fork, adapt, and build on top of this simulator for your own retirement modeling!
