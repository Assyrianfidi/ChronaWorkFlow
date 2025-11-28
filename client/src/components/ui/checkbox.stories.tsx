import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'UI/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
    required: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: 'terms',
  },
  render: (args) => (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" {...args} />
      <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        Accept terms and conditions
      </label>
    </div>
  ),
};

export const Checked: Story = {
  args: {
    id: 'checked',
    checked: true,
  },
  render: (args) => (
    <div className="flex items-center space-x-2">
      <Checkbox id="checked" {...args} />
      <label htmlFor="checked" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        Already checked
      </label>
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    id: 'disabled',
    disabled: true,
  },
  render: (args) => (
    <div className="flex items-center space-x-2">
      <Checkbox id="disabled" {...args} />
      <label htmlFor="disabled" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        Disabled option
      </label>
    </div>
  ),
};

export const DisabledChecked: Story = {
  args: {
    id: 'disabled-checked',
    disabled: true,
    checked: true,
  },
  render: (args) => (
    <div className="flex items-center space-x-2">
      <Checkbox id="disabled-checked" {...args} />
      <label htmlFor="disabled-checked" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        Disabled and checked
      </label>
    </div>
  ),
};

export const Multiple: Story = {
  render: () => (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Checkbox id="option1" />
        <label htmlFor="option1" className="text-sm font-medium">Option 1</label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="option2" defaultChecked />
        <label htmlFor="option2" className="text-sm font-medium">Option 2</label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="option3" disabled />
        <label htmlFor="option3" className="text-sm font-medium">Option 3 (disabled)</label>
      </div>
    </div>
  ),
};
