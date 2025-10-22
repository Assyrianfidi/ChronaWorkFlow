# AccuBooks Design Guidelines

## Design Approach: Professional SaaS Utility System

**Selected Approach**: Design System (Utility-Focused)
**Primary References**: QuickBooks Online, Xero, Stripe Dashboard, Linear (for clean data tables)
**Justification**: Accounting software prioritizes data clarity, efficiency, and trust over visual flair. Users need to process financial information quickly and accurately.

## Core Design Principles

1. **Clarity First**: Every number, transaction, and account balance must be instantly readable
2. **Data Density with Breathing Room**: Show comprehensive information without overwhelming
3. **Trust & Stability**: Professional aesthetic that conveys reliability and accuracy
4. **Efficient Workflows**: Minimize clicks for common tasks (create invoice, record payment)

## Color Palette

### Light Mode
- **Primary Brand**: 214 90% 50% (Professional blue - trust and stability)
- **Background**: 0 0% 100% (Pure white)
- **Surface**: 214 20% 97% (Light blue-gray for cards/tables)
- **Border**: 214 15% 88% (Subtle table borders)
- **Text Primary**: 214 25% 15% (Near-black with blue undertone)
- **Text Secondary**: 214 10% 45% (Medium gray for labels)
- **Success**: 142 70% 45% (Financial gains/positive balances)
- **Danger**: 0 70% 50% (Overdue invoices/negative balances)
- **Warning**: 38 95% 50% (Pending items)

### Dark Mode
- **Primary Brand**: 214 85% 60% (Lighter blue for visibility)
- **Background**: 214 15% 8% (Deep blue-black)
- **Surface**: 214 12% 12% (Slightly lighter for cards)
- **Border**: 214 10% 20% (Visible but subtle)
- **Text Primary**: 214 10% 95% (Near-white)
- **Text Secondary**: 214 8% 65% (Medium light gray)
- **Form inputs/text fields**: Surface color with slight border, proper contrast

## Typography

**Font Stack**: Inter (from Google Fonts CDN)
- **Headings**: Inter 600-700 (Semibold to Bold)
- **Body**: Inter 400-500 (Regular to Medium)
- **Data/Numbers**: Inter 500 with tabular-nums for aligned columns
- **Small Print**: Inter 400 at reduced size for meta information

**Hierarchy**:
- Page titles: text-2xl md:text-3xl font-semibold
- Section headers: text-lg font-semibold
- Card titles: text-base font-medium
- Body text: text-sm
- Table data: text-sm font-medium (numbers)
- Labels: text-xs text-secondary

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16
- Component padding: p-4 or p-6
- Section margins: mb-8 or mb-12
- Table cell padding: px-4 py-3
- Form spacing: space-y-4
- Card spacing: p-6

**Grid System**:
- Main dashboard: 12-column responsive grid
- Sidebar navigation: Fixed 240px width (collapsed: 64px icons only)
- Content area: max-w-7xl with px-6 lg:px-8
- Forms: max-w-2xl for focused data entry

## Component Library

### Navigation
- **Sidebar**: Fixed left navigation with icon + label, collapsible
- **Top Bar**: Company switcher, search, notifications, user menu
- **Breadcrumbs**: For nested pages (Accounts > Cash > Transactions)

### Data Display
- **Tables**: Striped rows, hover state, sticky headers, sortable columns
- **Cards**: Elevated with subtle shadow, border-radius of rounded-lg
- **Stats Cards**: Large numbers with trend indicators (↑/↓ with percentage)
- **Account Ledger**: Debits (left-aligned) and Credits (right-aligned) columns

### Forms
- **Input Fields**: Clear labels above, helper text below, validation states
- **Dropdowns**: Native select styled or Headless UI Listbox for complex selections
- **Date Pickers**: Clean calendar interface for transaction dates
- **Multi-step Forms**: Progress indicator for invoice creation, payroll runs

### Interactive Elements
- **Primary Buttons**: Filled with primary color, medium size as default
- **Secondary Buttons**: Outline style with border
- **Danger Actions**: Red outline for delete/void operations with confirmation modals
- **Icon Buttons**: Minimal style for table actions (edit, delete, view)

### Modals & Overlays
- **Dialogs**: Centered, max-w-2xl, with backdrop blur
- **Slide-overs**: Right-side panel for quick actions (record payment, transaction details)
- **Tooltips**: On hover for abbreviated data or help icons

### Reports & Visualizations
- **Simple Charts**: Bar charts for cash flow, line charts for trends (using Chart.js or Recharts)
- **Financial Statements**: Clean table layouts with proper indentation and subtotals
- **KPI Cards**: Bold numbers with comparison to previous period

## Page-Specific Layouts

### Dashboard
- Top row: 4 stat cards (Revenue, Expenses, Profit, Outstanding)
- Mid section: Recent transactions table + Cash flow chart (2-column grid)
- Bottom: Overdue invoices list

### Invoice Management
- List view: Table with columns (Number, Customer, Date, Amount, Status, Actions)
- Create/Edit: Clean form with line items table, calculation sidebar showing subtotal/tax/total
- Detail view: Professional invoice preview with PDF export button

### Chart of Accounts
- Tree structure with expandable account categories
- Balance columns aligned right
- Color coding for account types

### Bank Reconciliation
- Split view: Imported transactions (left) + Matched entries (right)
- Drag-and-drop or click-to-match interaction
- Clear visual distinction between matched/unmatched items

### Reports
- Filter bar at top (date range, account selection)
- Export buttons (PDF, CSV, Excel)
- Print-optimized layouts

## Animations

**Use Sparingly**:
- Page transitions: Simple fade (150ms)
- Dropdown menus: Subtle slide-down (200ms)
- Loading states: Spinner or skeleton screens
- Success feedback: Brief checkmark animation (300ms)
- **Avoid**: Elaborate micro-interactions that distract from data entry

## Icons

**Library**: Heroicons (outline for navigation, solid for emphasis)
**Key Icons**: 
- Dashboard: ChartBarIcon
- Invoices: DocumentTextIcon
- Banking: BanknotesIcon
- Reports: DocumentChartBarIcon
- Settings: CogIcon

## Accessibility & UX

- ARIA labels on all interactive elements
- Keyboard navigation for forms and tables
- Focus indicators visible in both light and dark modes
- High contrast ratios for financial data (WCAG AAA for numbers)
- Consistent dark mode across all inputs, forms, and modals
- Error messages with clear instructions for correction

## Mobile Considerations

- Responsive tables: Horizontal scroll or card stack on mobile
- Simplified navigation: Hamburger menu with full-screen overlay
- Touch-friendly targets: Minimum 44px height for buttons
- Priority content: Show critical financial data first, secondary info below

This design system creates a professional, trustworthy accounting interface that prioritizes data clarity and efficient workflows over decorative elements.