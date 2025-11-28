import type { Meta, StoryObj } from '@storybook/react';
import { 
  EnterpriseKPICard, 
  RevenueKPI, 
  ExpensesKPI, 
  TransactionsKPI, 
  InvoicesKPI, 
  CustomersKPI, 
  AlertsKPI 
} from './EnterpriseKPICard';
import { DollarSign, Users, FileText, CreditCard, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

const meta: Meta<typeof EnterpriseKPICard> = {
  title: 'UI/EnterpriseKPICard',
  component: EnterpriseKPICard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Enterprise-grade KPI cards with advanced features including animations, progress indicators, glassmorphism effects, and comprehensive data visualization.',
      },
    },
  },
  tags: ['autodocs', 'enterprise'],
  argTypes: {
    title: { control: 'text' },
    value: { control: 'text' },
    change: { control: 'number' },
    changeType: { 
      control: 'select',
      options: ['increase', 'decrease', 'neutral']
    },
    trend: { 
      control: 'select',
      options: ['increase', 'decrease', 'neutral']
    },
    color: { 
      control: 'select',
      options: ['primary', 'secondary', 'accent', 'success', 'danger', 'info', 'warning']
    },
    subtitle: { control: 'text' },
    formatValue: { control: 'boolean' },
    showProgress: { control: 'boolean' },
    progressValue: { control: 'number', min: 0, max: 100 },
    description: { control: 'text' },
    animated: { control: 'boolean' },
    glassmorphism: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof EnterpriseKPICard>;

export const Default: Story = {
  args: {
    title: 'Total Revenue',
    value: '$45,678.90',
    change: 12.5,
    changeType: 'increase',
    trend: 'increase',
    icon: <DollarSign className="h-6 w-6" />,
    color: 'success',
    subtitle: 'Monthly total',
    formatValue: true,
  },
};

export const WithProgress: Story = {
  args: {
    title: 'Goal Progress',
    value: '78%',
    change: 8.2,
    changeType: 'increase',
    trend: 'increase',
    icon: <TrendingUp className="h-6 w-6" />,
    color: 'primary',
    subtitle: 'Monthly goal',
    showProgress: true,
    progressValue: 78,
    description: '78% of monthly target achieved',
    animated: true,
  },
};

export const Glassmorphism: Story = {
  args: {
    title: 'Active Users',
    value: '1,234',
    change: 23.4,
    changeType: 'increase',
    trend: 'increase',
    icon: <Users className="h-6 w-6" />,
    color: 'info',
    subtitle: 'Current period',
    description: 'Real-time user count',
    animated: true,
    glassmorphism: true,
  },
};

export const NegativeTrend: Story = {
  args: {
    title: 'Expenses',
    value: '$12,345.67',
    change: -5.2,
    changeType: 'decrease',
    trend: 'decrease',
    icon: <TrendingDown className="h-6 w-6" />,
    color: 'danger',
    subtitle: 'Monthly expenses',
    description: '5.2% increase from last month',
    animated: true,
  },
};

export const NeutralState: Story = {
  args: {
    title: 'Pending Invoices',
    value: '23',
    change: 0,
    changeType: 'neutral',
    trend: 'neutral',
    icon: <FileText className="h-6 w-6" />,
    color: 'warning',
    subtitle: 'Awaiting payment',
    description: 'No change from last week',
  },
};

// Pre-configured KPI components
export const RevenueKPIStory: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
      <RevenueKPI value="$45,678.90" change={12.5} />
      <RevenueKPI value="$52,345.67" change={-3.2} />
      <RevenueKPI value="$38,901.23" change={8.7} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Pre-configured Revenue KPI components with consistent styling and formatting.',
      },
    },
  },
};

export const ExpensesKPIStory: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
      <ExpensesKPI value="$12,345.67" change={5.2} />
      <ExpensesKPI value="$8,901.23" change={-2.1} />
      <ExpensesKPI value="$15,678.90" change={0} />
    </div>
  ),
};

export const TransactionsKPIStory: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
      <TransactionsKPI value="1,234" change={15.3} />
      <TransactionsKPI value="987" change={-8.2} />
      <TransactionsKPI value="1,567" change={22.1} />
    </div>
  ),
};

export const InvoicesKPIStory: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
      <InvoicesKPI value="45" change={12} />
      <InvoicesKPI value="32" change={-5} />
      <InvoicesKPI value="67" change={8} />
    </div>
  ),
};

export const CustomersKPIStory: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
      <CustomersKPI value="5,678" change={123} />
      <CustomersKPI value="4,321" change={-45} />
      <CustomersKPI value="6,789" change={234} />
    </div>
  ),
};

export const AlertsKPIStory: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
      <AlertsKPI value="3" />
      <AlertsKPI value="7" />
      <AlertsKPI value="1" />
    </div>
  ),
};

export const DashboardOverview: Story = {
  render: () => (
    <div style={{ padding: '2rem', backgroundColor: '#f8f9fa' }}>
      <h2 style={{ marginBottom: '2rem', fontSize: '1.5rem', fontWeight: 'bold' }}>Financial Dashboard Overview</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        <RevenueKPI value="$45,678.90" change={12.5} />
        <ExpensesKPI value="$12,345.67" change={5.2} />
        <TransactionsKPI value="1,234" change={15.3} />
        <InvoicesKPI value="45" change={12} />
        <CustomersKPI value="5,678" change={123} />
        <AlertsKPI value="3" />
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Complete dashboard overview using all pre-configured KPI components.',
      },
    },
  },
};
