/**
 * Beginner Onboarding Flow
 * Comprehensive step-by-step guide for new users
 */

import { OnboardingFlow } from "../OnboardingEngine";

export const beginnerFlow: OnboardingFlow = {
  id: "beginner-getting-started",
  name: "Getting Started with AccuBooks",
  description: "Learn the basics of AccuBooks and set up your first account",
  targetAudience: "beginner",
  category: "getting-started",
  steps: [
    {
      id: "welcome",
      title: "Welcome to AccuBooks!",
      description:
        "Let's get you started with the basics of modern accounting software.",
      type: "modal",
      skippable: false,
      required: true,
      audience: "beginner",
      priority: 1,
      estimatedTime: 30,
      content: (
        <div className="welcome-content">
          <div className="welcome-icon">🎉</div>
          <h3>Welcome to Your New Accounting System!</h3>
          <p>
            AccuBooks is designed to make accounting simple and intuitive for
            small businesses.
          </p>

          <div className="welcome-features">
            <div className="feature-item">
              <div className="feature-icon">💰</div>
              <div className="feature-text">
                <h4>Track Income & Expenses</h4>
                <p>Monitor your cash flow in real-time</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📊</div>
              <div className="feature-text">
                <h4>Generate Reports</h4>
                <p>Professional reports for tax and business insights</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">👥</div>
              <div className="feature-text">
                <h4>Manage Customers</h4>
                <p>Keep track of clients and vendors</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🔒</div>
              <div className="feature-text">
                <h4>Stay Compliant</h4>
                <p>Tax-ready reports and compliance tools</p>
              </div>
            </div>
          </div>

          <div className="welcome-time-estimate">
            <span className="time-icon">⏱️</span>
            <span>This tour will take approximately 15 minutes</span>
          </div>
        </div>
      ),
    },
    {
      id: "account-setup",
      title: "Set Up Your Business Profile",
      description:
        "First, let's configure your business information for accurate reports.",
      target: ".business-profile-section",
      position: "right",
      type: "tooltip",
      skippable: false,
      required: true,
      audience: "beginner",
      priority: 2,
      estimatedTime: 120,
      action: {
        type: "click",
        target: ".edit-profile-button",
      },
      validation: {
        type: "element_clicked",
        target: ".edit-profile-button",
      },
      resources: [
        {
          title: "Business Setup Guide",
          url: "/help/business-setup",
          type: "article",
        },
      ],
    },
    {
      id: "dashboard-overview",
      title: "Your Dashboard Command Center",
      description:
        "This is your dashboard - here you can see your business health at a glance.",
      target: ".dashboard-container",
      position: "bottom",
      type: "tooltip",
      skippable: true,
      required: true,
      audience: "beginner",
      priority: 3,
      estimatedTime: 45,
      content: (
        <div className="dashboard-overview-content">
          <h4>Key Dashboard Features:</h4>
          <ul>
            <li>
              <strong>KPI Cards:</strong> Real-time metrics like revenue,
              expenses, and profit
            </li>
            <li>
              <strong>Quick Actions:</strong> Add transactions, invoices, and
              customers
            </li>
            <li>
              <strong>Recent Activity:</strong> See your latest transactions and
              updates
            </li>
            <li>
              <strong>Charts & Graphs:</strong> Visual insights into your
              business performance
            </li>
          </ul>
        </div>
      ),
      action: {
        type: "hover",
        target: ".dashboard-kpi-card:first-child",
      },
    },
    {
      id: "understand-kpis",
      title: "Understanding Your KPIs",
      description:
        "KPIs (Key Performance Indicators) help you track your business health.",
      target: ".kpi-cards-container",
      position: "top",
      type: "interactive",
      skippable: true,
      required: true,
      audience: "beginner",
      priority: 4,
      estimatedTime: 90,
      content: (
        <div className="kpi-explanation">
          <h4>Important KPIs to Track:</h4>
          <div className="kpi-list">
            <div className="kpi-item">
              <span className="kpi-name">Revenue</span>
              <span className="kpi-desc">
                Total money coming into your business
              </span>
            </div>
            <div className="kpi-item">
              <span className="kpi-name">Expenses</span>
              <span className="kpi-desc">Money going out for operations</span>
            </div>
            <div className="kpi-item">
              <span className="kpi-name">Net Profit</span>
              <span className="kpi-desc">
                Revenue minus expenses - your bottom line
              </span>
            </div>
            <div className="kpi-item">
              <span className="kpi-name">Cash Flow</span>
              <span className="kpi-desc">
                Available cash for daily operations
              </span>
            </div>
          </div>
          <p className="kpi-tip">
            💡 <strong>Tip:</strong> Check these KPIs weekly to stay on top of
            your finances!
          </p>
        </div>
      ),
      validation: {
        type: "custom",
        handler: async () => {
          // Check if user has interacted with at least one KPI card
          const cards = document.querySelectorAll(".dashboard-kpi-card");
          return cards.length > 0;
        },
      },
    },
    {
      id: "first-transaction",
      title: "Record Your First Transaction",
      description:
        "Let's record your first income or expense. This is the core of bookkeeping.",
      target: ".add-transaction-button",
      position: "left",
      type: "interactive",
      skippable: false,
      required: true,
      audience: "beginner",
      priority: 5,
      estimatedTime: 120,
      content: (
        <div className="transaction-guide">
          <h4>Every Transaction Matters!</h4>
          <p>Accurate bookkeeping starts with recording every transaction.</p>

          <div className="transaction-types">
            <div className="transaction-type">
              <div className="type-icon">📈</div>
              <h5>Income</h5>
              <p>Money you receive from sales, services, or other sources</p>
            </div>
            <div className="transaction-type">
              <div className="type-icon">📉</div>
              <h5>Expense</h5>
              <p>Money you spend on supplies, rent, utilities, etc.</p>
            </div>
          </div>

          <div className="transaction-tips">
            <h5>💡 Best Practices:</h5>
            <ul>
              {/* @ts-ignore */}
              <li>Record transactions as soon as they happen</li>
              <li>Use clear, descriptive names</li>
              <li>Attach receipts when possible</li>
              <li>Categorize correctly for tax purposes</li>
            </ul>
          </div>
        </div>
      ),
      action: {
        type: "click",
        target: ".add-transaction-button",
      },
      validation: {
        type: "element_clicked",
        target: ".add-transaction-button",
      },
    },
    {
      id: "transaction-form",
      title: "Filling Out Transaction Details",
      description: "Let's fill in the important details for accurate tracking.",
      target: ".transaction-form",
      position: "right",
      type: "interactive",
      skippable: false,
      required: true,
      audience: "beginner",
      priority: 6,
      estimatedTime: 180,
      content: (
        <div className="form-guide">
          <h4>Transaction Form Fields:</h4>
          <div className="field-explanations">
            <div className="field-item">
              <strong>Date:</strong> When the transaction occurred
            </div>
            <div className="field-item">
              <strong>Amount:</strong> How much money was involved
            </div>
            <div className="field-item">
              <strong>Category:</strong> Type of income/expense for tax
              reporting
            </div>
            <div className="field-item">
              <strong>Description:</strong> What this transaction was for
            </div>
            <div className="field-item">
              <strong>Customer/Vendor:</strong> Who paid you or who you paid
            </div>
          </div>

          <div className="form-example">
            <h5>Example:</h5>
            <div className="example-form">
              <div className="form-field">
                <label>Date:</label>
                <span>Today</span>
              </div>
              <div className="form-field">
                <label>Amount:</label>
                <span>$500.00</span>
              </div>
              <div className="form-field">
                <label>Category:</label>
                <span>Services Income</span>
              </div>
              <div className="form-field">
                <label>Description:</label>
                <span>Website design project</span>
              </div>
            </div>
          </div>
        </div>
      ),
      validation: {
        type: "custom",
        handler: async () => {
          // Check if form has been filled out
          const amountField = document.querySelector(
            "#transaction-amount",
          ) as HTMLInputElement;
          const categoryField = document.querySelector(
            "#transaction-category",
          ) as HTMLSelectElement;
          const descriptionField = document.querySelector(
            "#transaction-description",
          ) as HTMLInputElement;

          return !!(
            amountField?.value &&
            categoryField?.value &&
            descriptionField?.value
          );
        },
      },
    },
    {
      id: "save-transaction",
      title: "Save Your Transaction",
      description: "Great! Now let's save this transaction to your records.",
      target: ".save-transaction-button",
      position: "top",
      type: "interactive",
      skippable: false,
      required: true,
      audience: "beginner",
      priority: 7,
      estimatedTime: 30,
      action: {
        type: "click",
        target: ".save-transaction-button",
      },
      validation: {
        type: "element_clicked",
        target: ".save-transaction-button",
      },
    },
    {
      id: "navigation-basics",
      title: "Navigate Like a Pro",
      description:
        "Learn how to move around AccuBooks efficiently using the sidebar.",
      target: ".navigation-sidebar",
      position: "right",
      type: "tooltip",
      skippable: true,
      required: true,
      audience: "beginner",
      priority: 8,
      estimatedTime: 60,
      content: (
        <div className="navigation-guide">
          <h4>Main Navigation Areas:</h4>
          <div className="nav-sections">
            <div className="nav-section">
              <strong>Dashboard:</strong> Your main overview
            </div>
            <div className="nav-section">
              <strong>Transactions:</strong> All income and expenses
            </div>
            <div className="nav-section">
              <strong>Customers:</strong> Client management
            </div>
            <div className="nav-section">
              <strong>Reports:</strong> Business insights and tax reports
            </div>
            <div className="nav-section">
              <strong>Settings:</strong> Configure your account
            </div>
          </div>

          <div className="nav-shortcuts">
            <h5>⌨️ Keyboard Shortcuts:</h5>
            <div className="shortcut-item">
              <kbd>Ctrl</kbd> + <kbd>K</kbd> - Quick search
            </div>
            <div className="shortcut-item">
              <kbd>Ctrl</kbd> + <kbd>T</kbd> - New transaction
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "customers-section",
      title: "Managing Customers",
      description:
        "Keep track of who you do business with in the Customers section.",
      target: ".customers-menu-item",
      position: "right",
      type: "interactive",
      skippable: true,
      required: false,
      audience: "beginner",
      priority: 9,
      estimatedTime: 90,
      content: (
        <div className="customers-guide">
          <h4>Why Track Customers?</h4>
          <ul>
            <li>Send professional invoices</li>
            <li>Track payment history</li>
            <li>Manage customer relationships</li>
            <li>Generate customer-specific reports</li>
          </ul>

          <div className="customer-benefits">
            <h5>🌟 Benefits:</h5>
            <ul>
              <li>Faster invoicing with saved customer info</li>
              <li>See who owes you money</li>
              <li>Identify your best customers</li>
            </ul>
          </div>
        </div>
      ),
      action: {
        type: "click",
        target: ".customers-menu-item",
      },
      validation: {
        type: "element_clicked",
        target: ".customers-menu-item",
      },
    },
    {
      id: "reports-overview",
      title: "Understanding Reports",
      description:
        "Reports help you make informed business decisions and prepare for taxes.",
      target: ".reports-section",
      position: "top",
      type: "tooltip",
      skippable: true,
      required: false,
      audience: "beginner",
      priority: 10,
      estimatedTime: 90,
      content: (
        <div className="reports-guide">
          <h4>Essential Reports:</h4>
          <div className="report-types">
            <div className="report-type">
              <h5>📊 Profit & Loss</h5>
              <p>See your revenue, expenses, and profit over time</p>
            </div>
            <div className="report-type">
              <h5>💰 Cash Flow</h5>
              <p>Track money coming in and going out</p>
            </div>
            <div className="report-type">
              <h5>📋 Balance Sheet</h5>
              <p>Your business assets, liabilities, and equity</p>
            </div>
            <div className="report-type">
              <h5>🧾 Tax Summary</h5>
              <p>Tax-ready reports for filing season</p>
            </div>
          </div>

          <div className="report-tip">
            💡 <strong>Pro Tip:</strong> Review your Profit & Loss report
            monthly to spot trends!
          </div>
        </div>
      ),
    },
    {
      id: "mobile-app",
      title: "AccuBooks on the Go",
      description:
        "Don't forget our mobile app for recording transactions anywhere!",
      target: ".mobile-app-banner",
      position: "bottom",
      type: "tooltip",
      skippable: true,
      required: false,
      audience: "beginner",
      priority: 11,
      estimatedTime: 30,
      content: (
        <div className="mobile-app-info">
          <h4>📱 Mobile Features:</h4>
          <ul>
            <li>Take photos of receipts</li>
            <li>Record expenses on the spot</li>
            <li>View dashboard and reports</li>
            <li>Send invoices from anywhere</li>
          </ul>

          <div className="app-download">
            <p>Download from:</p>
            <div className="app-stores">
              <button className="app-store-btn">App Store</button>
              <button className="google-play-btn">Google Play</button>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "next-steps",
      title: "You're All Set! What's Next?",
      description:
        "Congratulations! You've learned the basics. Here's how to continue growing.",
      type: "modal",
      skippable: false,
      required: true,
      audience: "beginner",
      priority: 12,
      estimatedTime: 60,
      content: (
        <div className="completion-content">
          <div className="completion-icon">🎉</div>
          <h2>Congratulations, You\'re Ready!</h2>
          <p>
            You\'ve successfully learned the basics of AccuBooks. Here\'s what
            to do next:
          </p>

          <div className="next-steps-list">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Record Regular Transactions</h4>
                <p>Make it a habit to record transactions daily or weekly</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Review Your Dashboard</h4>
                <p>Check your KPIs weekly to monitor business health</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Explore Advanced Features</h4>
                <p>Try out reports, customer management, and mobile app</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Get Help When Needed</h4>
                <p>Access our help center and video tutorials anytime</p>
              </div>
            </div>
          </div>

          <div className="resources-section">
            <h4>📚 Additional Resources:</h4>
            <div className="resource-links">
              <a href="/help/video-tutorials" className="resource-link">
                <span className="resource-icon">🎥</span>
                <div className="resource-info">
                  <h5>Video Tutorials</h5>
                  <p>Step-by-step video guides</p>
                </div>
              </a>
              <a href="/help/blog" className="resource-link">
                <span className="resource-icon">📝</span>
                <div className="resource-info">
                  <h5>Blog & Tips</h5>
                  <p>Accounting best practices</p>
                </div>
              </a>
              <a href="/help/support" className="resource-link">
                <span className="resource-icon">💬</span>
                <div className="resource-info">
                  <h5>Support Center</h5>
                  <p>Get help from our team</p>
                </div>
              </a>
            </div>
          </div>

          <div className="completion-actions">
            <button className="explore-more-btn">Explore More Features</button>
            <button className="start-using-btn">Start Using AccuBooks</button>
          </div>
        </div>
      ),
      resources: [
        {
          title: "Video Tutorial Library",
          url: "/help/video-tutorials",
          type: "video",
        },
        {
          title: "Accounting Best Practices",
          url: "/help/accounting-tips",
          type: "article",
        },
        {
          title: "Support Center",
          url: "/help/support",
          type: "documentation",
        },
      ],
    },
  ],
  estimatedDuration: 15,
  prerequisites: [],
  tags: ["beginner", "essentials", "quick-start", "comprehensive"],
  version: "1.0.0",
};

export default beginnerFlow;
