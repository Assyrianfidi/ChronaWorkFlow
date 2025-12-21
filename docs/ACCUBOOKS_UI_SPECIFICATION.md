# AccuBooks UI Specification - Complete Screen-by-Screen Design

## A. AUTH & GLOBAL

### SCREEN: Login
Purpose: Authenticate users with email/password and SSO options
Layout: Centered card layout with logo, form fields, and footer links
Components: 
- Logo header
- Email input field
- Password input field with visibility toggle
- "Remember me" checkbox
- "Sign in" primary button
- "Forgot password?" link
- SSO buttons (Google, Microsoft, SAML)
- "Don't have an account? Sign up" footer link
Primary Actions: Sign in, Forgot password, SSO authentication
AI Elements: Smart password strength indicator, suspicious login detection alerts
Navigation Path: Direct URL (/login) or redirected from protected routes

### SCREEN: Signup
Purpose: New user registration with company information
Layout: Multi-step form with progress indicator
Components:
- Progress stepper (Account → Company → Plan → Confirmation)
- Email and password fields
- Full name and phone number
- Company name and industry dropdown
- Company size selection
- Plan selection cards (MVP/Pro/Enterprise)
- Terms and conditions checkbox
- "Create account" button
Primary Actions: Create account, Select plan, Previous/Next steps
AI Elements: Industry-specific feature recommendations, plan suggestion based on company size
Navigation Path: /signup from login page or marketing site

### SCREEN: Organization Setup
Purpose: Configure organization settings and initial data
Layout: Split screen with setup wizard on left, preview on right
Components:
- Setup progress tracker
- Business information form (address, tax ID, fiscal year)
- Currency and language selection
- Chart of Accounts template selection
- Bank account connection prompt
- Import data options (QuickBooks, CSV, manual)
- "Complete setup" button
Primary Actions: Save business info, Connect bank, Import data, Complete setup
AI Elements: Account template suggestions based on industry, data mapping for imports
Navigation Path: Post-signup flow or /setup

### SCREEN: Entity Selection
Purpose: Multi-entity organization entity switcher
Layout: Modal overlay with entity grid
Components:
- Modal header with "Switch Entity" title
- Search/filter bar
- Entity cards (name, type, currency, last accessed)
- "Create new entity" button
- Selected entity indicator
- "Switch" and "Cancel" buttons
Primary Actions: Select entity, Create entity, Search entities
AI Elements: Frequently used entities prioritized, entity health indicators
Navigation Path: Global entity switcher in header

### SCREEN: User Role Selection
Purpose: Select or change user role for current session
Layout: Dropdown menu in header with role options
Components:
- Current role display with avatar
- Role options list (Owner, Accountant, Admin, Employee)
- Role descriptions and permissions
- "Switch role" confirmation
- Role-specific UI preview
Primary Actions: Select role, View permissions, Confirm switch
AI Elements: Role suggestions based on activity patterns, context-aware role switching
Navigation Path: Header avatar dropdown

### SCREEN: Global Search / Command Palette
Purpose: Universal search and quick actions
Layout: Modal overlay with search input and results
Components:
- Search input with keyboard shortcut hint (Cmd+K)
- Search results tabs (All, Transactions, Reports, Customers, etc.)
- Quick actions section (Create invoice, Run payroll, etc.)
- Recent searches
- Filter options
- Result preview panel
Primary Actions: Search items, Execute quick actions, Filter results
AI Elements: Natural language query understanding, predictive search, contextual suggestions
Navigation Path: Cmd+K keyboard shortcut or search icon in header

---

## B. DASHBOARD

### SCREEN: Executive Dashboard
Purpose: High-level business overview for executives
Layout: 4-column grid with header and KPI tiles
Components:
- Date range selector
- KPI tiles (Revenue, Profit, Cash, Expenses) with trend indicators
- Revenue chart with comparison view
- Expense breakdown pie chart
- Cash flow statement summary
- Top customers by revenue
- Recent activities feed
- AI insights panel
Primary Actions: Change date range, Drill down into KPIs, Export dashboard
AI Elements: Anomaly alerts, predictive insights, "What contributed to X?" explanations
Navigation Path: Main dashboard (/dashboard)

### SCREEN: Cash Flow Dashboard
Purpose: Detailed cash flow analysis and forecasting
Layout: Split screen with chart on left, details on right
Components:
- Cash flow timeline chart (historical + forecast)
- Cash position indicators
- Inflow/outflow breakdown
- Upcoming payments list
- Bank account balances
- Cash flow scenarios selector
- AI forecast confidence indicator
Primary Actions: Adjust forecast parameters, View payment details, Export cash flow report
AI Elements: Predictive cash flow modeling, scenario analysis, payment timing optimization
Navigation Path: Dashboard → Cash Flow tab

### SCREEN: Alerts & Anomalies Panel
Purpose: Display system alerts and detected anomalies
Layout: Card-based list with severity indicators
Components:
- Alert filters (Critical, Warning, Info)
- Alert cards with severity badges
- Anomaly detection results
- Recommended actions
- Dismiss/Resolve buttons
- Alert history
- AI confidence scores
Primary Actions: Acknowledge alerts, View details, Resolve issues, Export alerts
AI Elements: Anomaly detection, risk scoring, automated resolution suggestions
Navigation Path: Dashboard → Alerts panel or /alerts

### SCREEN: AI CFO Copilot Panel
Purpose: Interactive AI assistant for financial queries
Layout: Chat interface with suggested prompts
Components:
- Chat message area with conversation history
- Input field with send button
- Suggested questions carousel
- Voice input option
- Export conversation button
- Context indicators (current date range, entity)
- AI thinking indicator
Primary Actions: Ask questions, Voice input, Export insights, Clear conversation
AI Elements: Natural language processing, context-aware responses, proactive insights
Navigation Path: Dashboard → AI Copilot tab or /ai-copilot

### SCREEN: KPI Tiles
Purpose: Customizable KPI widget display
Layout: Grid of configurable tiles
Components:
- Tile library (Revenue, Profit, Cash, Expenses, etc.)
- Drag-and-drop tile arrangement
- Tile configuration panels
- Time period selectors
- Comparison options (YoY, MoM, etc.)
- Tile size options
- Export tiles option
Primary Actions: Add/remove tiles, Configure tiles, Rearrange layout, Export view
AI Elements: KPI suggestions, anomaly highlighting, trend explanations
Navigation Path: Dashboard customization mode

### SCREEN: Quick Actions
Purpose: Rapid access to common tasks
Layout: Horizontal scroll of action cards
Components:
- Action cards with icons (Create Invoice, Record Payment, Run Report, etc.)
- Recently used actions
- Favorite actions
- Action search
- Custom action creation
- Keyboard shortcuts display
Primary Actions: Execute actions, Add to favorites, Create custom actions
AI Elements: Contextual action suggestions, usage pattern learning
Navigation Path: Dashboard quick actions bar

---

## C. ACCOUNTING CORE

### SCREEN: Chart of Accounts
Purpose: Manage account hierarchy and details
Layout: Tree view with details panel
Components:
- Account tree with expand/collapse
- Account type filters (Assets, Liabilities, Equity, Revenue, Expense)
- Add/Edit/Delete buttons
- Account details panel (code, name, type, balance, description)
- Import/Export accounts
- Bulk actions toolbar
- Account search
Primary Actions: Add account, Edit account, Delete account, Import/export, Reorganize hierarchy
AI Elements: Account suggestions, duplicate detection, hierarchy optimization
Navigation Path: Accounting → Chart of Accounts

### SCREEN: Transactions Ledger
Purpose: View and manage all transactions
Layout: Table with filters and preview panel
Components:
- Transaction table with sortable columns
- Advanced filters (date range, accounts, amounts, categories)
- Search bar
- Bulk actions toolbar
- Transaction preview panel
- Add/Edit/Delete buttons
- Export options
- Pagination controls
Primary Actions: Add transaction, Edit transaction, Delete transaction, Batch operations, Export
AI Elements: Categorization suggestions, duplicate detection, anomaly flagging
Navigation Path: Accounting → Transactions

### SCREEN: Bank Feeds
Purpose: Manage bank account connections and transactions
Components:
- Connected bank accounts list
- Transaction import queue
- Categorization rules
- Auto-match settings
- Connection status indicators
- Add bank account button
- Import history
- Error handling panel
Primary Actions: Connect bank, Import transactions, Set rules, Resolve errors
AI Elements: Smart categorization, duplicate detection, pattern learning
Navigation Path: Accounting → Bank Feeds

### SCREEN: Reconciliation Screen
Purpose: Reconcile accounts against bank statements
Layout: Split screen with statement on left, transactions on right
Components:
- Account selector
- Statement period selector
- Opening/closing balances
- Matched transactions list
- Unmatched transactions
- Auto-match button
- Manual match interface
- Reconciliation summary
- Complete reconciliation button
Primary Actions: Match transactions, Add transactions, Edit matches, Complete reconciliation
AI Elements: Smart matching suggestions, confidence scoring, exception handling
Navigation Path: Accounting → Reconciliation

### SCREEN: Journal Entries
Purpose: Create and manage manual journal entries
Layout: Form with line items grid
Components:
- Entry header (date, number, description)
- Line items table (account, debit, credit, description)
- Add/remove line buttons
- Balance indicator
- Supporting documents upload
- Entry templates
- Save/Post buttons
- Entry history
Primary Actions: Create entry, Add line items, Attach documents, Save draft, Post entry
AI Elements: Template suggestions, balance checking, account recommendations
Navigation Path: Accounting → Journal Entries

### SCREEN: Closing & Lock Periods
Purpose: Manage accounting period closings and locks
Layout: Calendar view with status indicators
Components:
- Period calendar with status colors
- Lock/unlock period controls
- Closing checklist
- Required tasks tracker
- Closing reports
- Audit trail
- Bulk period operations
- Export closing package
Primary Actions: Lock period, Unlock period, Run closing checklist, View reports
AI Elements: Closing recommendations, task prioritization, deadline alerts
Navigation Path: Accounting → Period Management

---

## D. INVOICING & PAYMENTS

### SCREEN: Invoice List
Purpose: View and manage all invoices
Layout: Table with filters and actions
Components:
- Invoice table with status indicators
- Advanced filters (status, date range, customer, amount)
- Search bar
- Bulk actions (send, delete, export)
- Quick actions (create invoice, create estimate)
- Status badges (Draft, Sent, Paid, Overdue)
- Preview panel
- Payment status indicators
Primary Actions: Create invoice, Send invoice, Record payment, Delete invoice, Export
AI Elements: Payment predictions, overdue risk scoring, sending time optimization
Navigation Path: Invoicing → Invoices

### SCREEN: Invoice Builder
Purpose: Create and edit invoices
Layout: Split screen with form on left, preview on right
Components:
- Customer selector with search
- Invoice header (number, date, due date)
- Line items table (description, quantity, rate, amount)
- Tax calculation section
- Discount and terms fields
- Notes and attachments
- Save/Send buttons
- Template selector
- Preview panel
Primary Actions: Add line items, Calculate taxes, Save draft, Send invoice, Apply template
AI Elements: Line item suggestions, tax optimization, payment terms recommendations
Navigation Path: Invoicing → Create Invoice

### SCREEN: Estimates
Purpose: Create and manage estimates/quotes
Layout: Similar to invoice builder with estimate-specific features
Components:
- Estimate header with validity period
- Line items and pricing
- Terms and conditions
- Convert to invoice button
- Status tracking (Draft, Sent, Accepted, Rejected, Expired)
- Customer approval interface
- Revision history
Primary Actions: Create estimate, Send estimate, Convert to invoice, Track status
AI Elements: Win probability prediction, pricing suggestions, follow-up timing
Navigation Path: Invoicing → Estimates

### SCREEN: Recurring Billing
Purpose: Manage recurring invoice templates
Layout: List view with schedule details
Components:
- Recurring template list
- Schedule configuration (frequency, end date)
- Customer assignment
- Line items and pricing
- Next run date display
- Pause/resume controls
- Usage tracking
- Invoice preview
Primary Actions: Create template, Edit schedule, Pause/resume, Preview next invoice
AI Elements: Schedule optimization, churn prediction, usage analysis
Navigation Path: Invoicing → Recurring

### SCREEN: Payments & Settlements
Purpose: Track and manage incoming payments
Layout: Table with payment details and reconciliation
Components:
- Payment table with method indicators
- Bank deposit matching
- Fee calculation display
- Refund processing
- Payment reconciliation
- Export for accounting
- Payment method analytics
Primary Actions: Record payment, Process refund, Match to deposit, Export payments
AI Elements: Payment method optimization, fee analysis, deposit timing
Navigation Path: Invoicing → Payments

### SCREEN: Bill Pay
Purpose: Manage outgoing payments and bills
Layout: Workflow-based bill management
Components:
- Bill inbox and queue
- Bill approval workflow
- Payment scheduling
- Vendor management
- Duplicate detection
- Payment method selection
- Cash flow impact preview
Primary Actions: Add bill, Approve bill, Schedule payment, Pay bill
AI Elements: Duplicate detection, payment optimization, cash flow analysis
Navigation Path: Invoicing → Bill Pay

### SCREEN: Receivables Aging
Purpose: Track outstanding invoices and collections
Layout: Aging buckets with customer details
Components:
- Aging buckets (Current, 1-30, 31-60, 61-90, 90+)
- Customer aging details
- Collection workflow
- Payment reminders
- Credit limit monitoring
- Write-off recommendations
- Collection analytics
Primary Actions: Send reminders, Update notes, Write off, Review credit limits
AI Elements: Collection probability scoring, reminder optimization, write-off recommendations
Navigation Path: Invoicing → Aging Report

---

## E. PAYROLL & HR

### SCREEN: Payroll Runs
Purpose: Execute and manage payroll processing
Layout: Step-by-step wizard with review screens
Components:
- Pay period selector
- Employee hours review
- Deductions and taxes calculation
- Payroll preview
- Approval workflow
- Payment processing
- Payroll register
- Tax filing preparation
Primary Actions: Calculate payroll, Review hours, Approve payroll, Process payments
AI Elements: Anomaly detection in hours, tax optimization, compliance checking
Navigation Path: Payroll → Run Payroll

### SCREEN: Employee Directory
Purpose: Manage employee information and records
Layout: Grid/list view with employee cards
Components:
- Employee search and filters
- Employee cards with key info
- Department organization
- Employment status indicators
- Compensation details
- Document management
- Bulk operations
- Import/export employees
Primary Actions: Add employee, Edit employee, Terminate employee, Update compensation
AI Elements: Duplicate detection, compliance alerts, retention risk analysis
Navigation Path: Payroll → Employees

### SCREEN: Time Tracking
Purpose: Track and approve employee time
Layout: Calendar/timesheet interface
Components:
- Timesheet entry forms
- Time approval workflow
- Project/job costing allocation
- Overtime calculation
- Time off requests
- Attendance tracking
- Mobile time clock
- Time analytics
Primary Actions: Enter time, Approve time, Request time off, View analytics
AI Elements: Anomaly detection, overtime prediction, project allocation optimization
Navigation Path: Payroll → Time Tracking

### SCREEN: Payroll Approvals
Purpose: Review and approve payroll-related items
Layout: Queue-based approval interface
Components:
- Approval queue with filters
- Item details and context
- Approval/reject actions
- Comment and notes
- Delegation options
- Approval history
- Bulk approvals
- Notification settings
Primary Actions: Approve items, Reject items, Delegate approvals, Add comments
AI Elements: Priority scoring, anomaly flagging, approval recommendations
Navigation Path: Payroll → Approvals

### SCREEN: Tax Filings
Purpose: Manage payroll tax compliance and filings
Layout: Dashboard with filing calendar
Components:
- Tax filing calendar
- Filing requirements tracker
- Tax form generation
- E-filing interface
- Payment scheduling
- Compliance alerts
- Tax agency contacts
- Filing history
Primary Actions: Generate forms, Schedule payments, File taxes, View compliance
AI Elements: Compliance monitoring, payment optimization, deadline alerts
Navigation Path: Payroll → Tax Filings

### SCREEN: Payroll Analytics
Purpose: Analyze payroll costs and trends
Layout: Dashboard with charts and metrics
Components:
- Payroll cost trends
- Department cost analysis
- Overtime analytics
- Turnover metrics
- Compensation benchmarks
- Budget vs actual
- Employee productivity
- Export reports
Primary Actions: View reports, Filter data, Export analytics, Set alerts
AI Elements: Cost optimization suggestions, turnover prediction, benchmarking
Navigation Path: Payroll → Analytics

---

## F. REPORTING & ANALYTICS

### SCREEN: Standard Reports
Purpose: Generate and view standard financial reports
Layout: Report library with preview
Components:
- Report categories (Financial, Sales, Tax, etc.)
- Report templates gallery
- Date range selectors
- Parameter configuration
- Preview panel
- Export options (PDF, Excel, CSV)
- Schedule reports
- Favorite reports
Primary Actions: Generate report, Configure parameters, Export, Schedule
AI Elements: Parameter suggestions, anomaly highlighting in reports
Navigation Path: Reports → Standard Reports

### SCREEN: Custom Report Builder
Purpose: Create custom financial reports
Layout: Drag-and-drop builder with preview
Components:
- Data source selector
- Field library
- Drag-and-drop canvas
- Calculation builder
- Filter and grouping tools
- Formatting options
- Preview panel
- Save/share templates
Primary Actions: Add fields, Create calculations, Set filters, Format report, Save template
AI Elements: Field suggestions, calculation recommendations, layout optimization
Navigation Path: Reports → Custom Builder

### SCREEN: Dashboards
Purpose: Create and view custom dashboards
Layout: Widget-based dashboard builder
Components:
- Widget library
- Drag-and-drop canvas
- Widget configuration panels
- Data source connectors
- Filter controls
- Sharing options
- Template gallery
- Real-time data indicators
Primary Actions: Add widgets, Configure widgets, Share dashboard, Save template
AI Elements: Widget suggestions, layout optimization, data refresh timing
Navigation Path: Reports → Dashboards

### SCREEN: AI-Generated Insights
Purpose: View AI-powered financial insights
Layout: Card-based insight feed
Components:
- Insight cards with categories
- Confidence scores
- Action recommendations
- Trend explanations
- Anomaly alerts
- Export insights
- Feedback mechanism
- Historical insights
Primary Actions: View details, Take action, Export insights, Provide feedback
AI Elements: Natural language explanations, predictive insights, recommendations
Navigation Path: Reports → AI Insights

### SCREEN: Export & Sharing
Purpose: Manage report exports and sharing
Layout: File management interface
Components:
- Export history
- Sharing permissions
- Distribution lists
- Export settings
- Scheduled exports
- Access logs
- Branding options
- Delivery methods
Primary Actions: Export reports, Share reports, Schedule exports, Manage permissions
AI Elements: Delivery optimization, format recommendations, audience analysis
Navigation Path: Reports → Export & Sharing

---

## G. AUTOMATION & AI

### SCREEN: Workflow Builder
Purpose: Create IF/THEN automation rules
Layout: Visual workflow editor
Components:
- Trigger library (events, schedules, conditions)
- Action library (create, update, notify, integrate)
- Visual flow canvas
- Rule testing interface
- Activity monitoring
- Template gallery
- Performance metrics
Primary Actions: Create workflow, Add triggers, Add actions, Test workflow, Activate
AI Elements: Workflow suggestions, optimization recommendations, error prediction
Navigation Path: Automation → Workflows

### SCREEN: AI Recommendations Center
Purpose: View and act on AI-powered recommendations
Layout: Card-based recommendation feed
Components:
- Recommendation cards with impact scores
- Category filters (efficiency, cost savings, growth)
- Implementation steps
- Success probability
- Historical recommendations
- Feedback system
- Bulk actions
Primary Actions: Implement recommendation, View details, Provide feedback, Dismiss
AI Elements: Personalized recommendations, impact scoring, success prediction
Navigation Path: Automation → AI Recommendations

### SCREEN: Anomaly Detection
Purpose: Monitor and investigate detected anomalies
Layout: Alert dashboard with investigation tools
Components:
- Anomaly timeline
- Severity indicators
- Investigation checklist
- Related transactions view
- Pattern analysis
- Resolution tracking
- False positive feedback
- Export findings
Primary Actions: Investigate anomaly, Resolve issue, Mark false positive, Export report
AI Elements: Pattern recognition, root cause analysis, prevention suggestions
Navigation Path: Automation → Anomaly Detection

### SCREEN: Forecasting & Scenarios
Purpose: Create financial forecasts and scenarios
Layout: Interactive modeling interface
Components:
- Forecast parameters
- Scenario builder
- Assumption inputs
- Visual projections
- Sensitivity analysis
- Comparison tools
- Export scenarios
- Historical accuracy
Primary Actions: Create forecast, Build scenario, Adjust assumptions, Compare scenarios
AI Elements: Predictive modeling, scenario optimization, sensitivity analysis
Navigation Path: Automation → Forecasting

### SCREEN: Close Checklist Automation
Purpose: Manage automated month-end close processes
Layout: Checklist with automation status
Components:
- Close task checklist
- Automation status indicators
- Task dependencies
- Progress tracking
- Issue resolution
- Historical close times
- Optimization suggestions
- Export close package
Primary Actions: Run automation, Review tasks, Resolve issues, Optimize process
AI Elements: Task optimization, bottleneck identification, time prediction
Navigation Path: Automation → Close Management

---

## H. ENTERPRISE & ADMIN

### SCREEN: Multi-Entity Management
Purpose: Manage multiple business entities
Layout: Entity grid with consolidated views
Components:
- Entity cards with key metrics
- Consolidated reporting options
- Intercompany transaction tools
- Entity hierarchy
- Currency management
- Consolidation rules
- Entity permissions
- Performance comparison
Primary Actions: Add entity, Configure consolidation, Manage permissions, View reports
AI Elements: Consolidation optimization, performance benchmarking, risk analysis
Navigation Path: Admin → Entities

### SCREEN: Intercompany Transactions
Purpose: Manage transactions between entities
Layout: Transaction workflow with matching
Components:
- Intercompany transaction queue
- Matching interface
- Elimination rules
- Currency conversion
- Approval workflow
- Audit trail
- Reporting tools
- Reconciliation
Primary Actions: Create transaction, Match entries, Set elimination rules, Approve
AI Elements: Matching suggestions, elimination optimization, compliance checking
Navigation Path: Admin → Intercompany

### SCREEN: User Roles & Permissions
Purpose: Configure user access and permissions
Layout: Role-based permission matrix
Components:
- Role library with templates
- Permission matrix grid
- User assignment interface
- Permission inheritance
- Access logs
- Role templates
- Bulk operations
- Compliance reports
Primary Actions: Create role, Assign permissions, Add users, Review access
AI Elements: Permission recommendations, access pattern analysis, security alerts
Navigation Path: Admin → Roles & Permissions

### SCREEN: Audit Logs
Purpose: View system activity and change history
Layout: Filterable activity log
Components:
- Activity timeline
- Advanced filters
- Change details
- User activity patterns
- Export logs
- Retention management
- Compliance reports
- Anomaly detection
Primary Actions: View logs, Filter activity, Export data, Investigate changes
AI Elements: Pattern recognition, anomaly detection, compliance monitoring
Navigation Path: Admin → Audit Logs

### SCREEN: Compliance Center
Purpose: Monitor regulatory compliance
Layout: Dashboard with compliance metrics
Components:
- Compliance score dashboard
- Requirement tracker
- Document management
- Audit preparation
- Regulation updates
- Risk assessment
- Reporting tools
- Certification tracking
Primary Actions: Review compliance, Upload documents, Prepare audits, Track requirements
AI Elements: Compliance monitoring, risk assessment, requirement prioritization
Navigation Path: Admin → Compliance

### SCREEN: Security Settings
Purpose: Configure system security policies
Layout: Tabbed security configuration
Components:
- Authentication settings
- Password policies
- Session management
- API security
- Data encryption
- Access controls
- Security monitoring
- Incident response
Primary Actions: Configure policies, Review security, Manage access, Monitor threats
AI Elements: Security recommendations, threat detection, policy optimization
Navigation Path: Admin → Security

---

## I. INTEGRATIONS & PLATFORM

### SCREEN: App Marketplace
Purpose: Browse and install third-party integrations
Layout: App store interface with categories
Components:
- App categories and search
- App cards with ratings
- Installation wizard
- Configuration interface
- Usage analytics
- Billing information
- Support resources
- Developer tools
Primary Actions: Browse apps, Install app, Configure integration, Manage subscriptions
AI Elements: App recommendations, compatibility checking, usage optimization
Navigation Path: Integrations → Marketplace

### SCREEN: API Keys
Purpose: Manage API access credentials
Layout: Key management interface
Components:
- API key list with status
- Create key wizard
- Permission scopes
- Usage analytics
- Rate limiting
- Key rotation
- Webhook configuration
- Documentation links
Primary Actions: Create key, Configure permissions, Monitor usage, Rotate keys
AI Elements: Usage optimization, security recommendations, anomaly detection
Navigation Path: Integrations → API Keys

### SCREEN: Webhooks
Purpose: Configure webhook endpoints and events
Layout: Event subscription manager
Components:
- Webhook endpoint list
- Event subscription builder
- Payload configuration
- Delivery logs
- Retry settings
- Security options
- Testing tools
- Monitoring dashboard
Primary Actions: Create webhook, Subscribe to events, Test delivery, Monitor logs
AI Elements: Event recommendations, delivery optimization, failure prediction
Navigation Path: Integrations → Webhooks

### SCREEN: Plugin Manager
Purpose: Manage custom plugins and extensions
Layout: Plugin lifecycle manager
Components:
- Plugin library
- Installation interface
- Configuration panels
- Update management
- Dependency management
- Performance monitoring
- Debug tools
- Documentation
Primary Actions: Install plugin, Configure plugin, Update plugin, Debug issues
AI Elements: Plugin recommendations, compatibility checking, performance optimization
Navigation Path: Integrations → Plugins

### SCREEN: Data Imports
Purpose: Import data from external sources
Layout: Multi-step import wizard
Components:
- Source selection (QuickBooks, CSV, etc.)
- Field mapping interface
- Data validation
- Import preview
- Error handling
- Progress tracking
- Import history
- Cleanup tools
Primary Actions: Select source, Map fields, Validate data, Execute import
AI Elements: Smart field mapping, duplicate detection, data cleansing
Navigation Path: Integrations → Import Data

---

## Global Navigation & Layout

### Header Components:
- Logo and home link
- Entity switcher
- Global search (Cmd+K)
- Notification center
- User avatar with role switcher
- Help and support

### Sidebar Navigation:
- Dashboard
- Accounting
  - Chart of Accounts
  - Transactions
  - Bank Feeds
  - Reconciliation
  - Journal Entries
- Invoicing
  - Invoices
  - Estimates
  - Recurring
  - Payments
  - Bill Pay
- Payroll
  - Run Payroll
  - Employees
  - Time Tracking
  - Tax Filings
- Reports
  - Standard Reports
  - Custom Builder
  - Dashboards
  - AI Insights
- Automation
  - Workflows
  - AI Recommendations
  - Anomaly Detection
- Admin (role-based)
  - Entities
  - Users & Roles
  - Security
  - Audit Logs
- Integrations
  - Marketplace
  - API Keys
  - Webhooks

### Responsive Design:
- Desktop: Full sidebar with expanded navigation
- Tablet: Collapsible sidebar with icon-only mode
- Mobile: Bottom navigation bar with hamburger menu

### Design System:
- Colors: Primary blue (#0066CC), Success green (#00A652), Warning orange (#FF6B35), Error red (#DC3545)
- Typography: Inter font family, system font stack
- Spacing: 8px grid system
- Components: Consistent button styles, card layouts, form elements
- Icons: Heroicons or Feather icons
- Dark mode: Full dark theme support

### Accessibility:
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode
- Focus indicators
- ARIA labels and descriptions
