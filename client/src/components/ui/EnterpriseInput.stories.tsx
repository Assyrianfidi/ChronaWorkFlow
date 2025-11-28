import type { Meta, StoryObj } from '@storybook/react';
import { EnterpriseInput } from './EnterpriseInput';
import { Eye, EyeOff, AlertCircle, CheckCircle, User, Mail, Lock, Search } from 'lucide-react';

const meta: Meta<typeof EnterpriseInput> = {
  title: 'UI/EnterpriseInput',
  component: EnterpriseInput,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Enterprise-grade input component with advanced features including floating labels, password strength meters, loading states, and comprehensive validation.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    type: { 
      control: 'select',
      options: ['text', 'password', 'email', 'number', 'tel', 'search', 'url']
    },
    error: { control: 'text' },
    helperText: { control: 'text' },
    floatingLabel: { control: 'boolean' },
    icon: { control: 'object' },
    iconPosition: { 
      control: 'select',
      options: ['left', 'right']
    },
    showPasswordToggle: { control: 'boolean' },
    strengthMeter: { control: 'boolean' },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof EnterpriseInput>;

export const Default: Story = {
  args: {
    placeholder: 'Enter your text here...',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Full Name',
    placeholder: 'Enter your full name',
    required: true,
  },
};

export const FloatingLabel: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'Enter your email',
    type: 'email',
    floatingLabel: true,
    required: true,
  },
};

export const WithIcon: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter your username',
    icon: <User className="h-4 w-4" />,
    iconPosition: 'left',
  },
};

export const WithRightIcon: Story = {
  args: {
    label: 'Search',
    placeholder: 'Search users...',
    type: 'search',
    icon: <Search className="h-4 w-4" />,
    iconPosition: 'right',
  },
};

export const PasswordInput: Story = {
  args: {
    label: 'Password',
    placeholder: 'Enter your password',
    type: 'password',
    showPasswordToggle: true,
    strengthMeter: true,
    required: true,
  },
};

export const WithError: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'Enter your email',
    type: 'email',
    error: 'Please enter a valid email address',
    required: true,
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Phone Number',
    placeholder: '(555) 123-4567',
    type: 'tel',
    helperText: 'Include country code for international numbers',
  },
};

export const Loading: Story = {
  args: {
    label: 'Username',
    placeholder: 'Checking availability...',
    loading: true,
    disabled: true,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Read-only Field',
    placeholder: 'This field is disabled',
    value: 'Cannot be edited',
    disabled: true,
  },
};

export const FinancialInput: Story = {
  args: {
    label: 'Amount',
    placeholder: '0.00',
    type: 'number',
    icon: <span className="text-lg">$</span>,
    iconPosition: 'left',
    helperText: 'Enter amount in USD',
  },
};

export const AccountNumber: Story = {
  args: {
    label: 'Account Number',
    placeholder: '1234-5678-9012',
    helperText: 'Format: XXXX-XXXX-XXXX',
    required: true,
  },
};

export const SecureInput: Story = {
  args: {
    label: 'Security Code',
    placeholder: 'Enter security code',
    type: 'password',
    showPasswordToggle: true,
    icon: <Lock className="h-4 w-4" />,
    iconPosition: 'left',
    helperText: 'This is a secure field',
  },
};

export const FormExample: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '400px' }}>
      <EnterpriseInput
        label="Company Name"
        placeholder="Enter your company name"
        icon={<User className="h-4 w-4" />}
        iconPosition="left"
        required
      />
      
      <EnterpriseInput
        label="Email Address"
        placeholder="company@example.com"
        type="email"
        floatingLabel={true}
        icon={<Mail className="h-4 w-4" />}
        iconPosition="left"
        required
      />
      
      <EnterpriseInput
        label="Password"
        placeholder="Enter a strong password"
        type="password"
        showPasswordToggle={true}
        strengthMeter={true}
        icon={<Lock className="h-4 w-4" />}
        iconPosition="left"
        required
      />
      
      <EnterpriseInput
        label="Initial Investment"
        placeholder="0.00"
        type="number"
        icon={<span className="text-lg">$</span>}
        iconPosition="left"
        helperText="Minimum investment: $1,000"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete form example showing various input configurations for financial applications.',
      },
    },
  },
};
