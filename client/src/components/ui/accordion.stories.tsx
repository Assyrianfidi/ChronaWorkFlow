import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion';

const meta: Meta<typeof Accordion> = {
  title: 'UI/Accordion',
  component: Accordion,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Collapsible accordion component for organizing content in vertical sections with smooth animations.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: { 
      control: 'select',
      options: ['single', 'multiple']
    },
    collapsible: { control: 'boolean' },
    className: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Accordion>;

export const Default: Story = {
  args: {
    type: 'single',
    collapsible: true,
    className: 'w-full',
  },
  render: (args) => (
    <Accordion {...args} type="single" collapsible className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger>What is AccuBooks?</AccordionTrigger>
        <AccordionContent>
          AccuBooks is a comprehensive financial management platform designed for businesses of all sizes.
          It provides tools for accounting, reporting, and financial analysis.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>How does billing work?</AccordionTrigger>
        <AccordionContent>
          We offer flexible pricing plans based on your business needs. You can choose from monthly
          or annual billing, with discounts available for longer commitments.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Can I cancel anytime?</AccordionTrigger>
        <AccordionContent>
          Yes, you can cancel your subscription at any time. No long-term contracts or cancellation fees.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const Multiple: Story = {
  args: {
    type: 'multiple',
    collapsible: true,
    className: 'w-full',
  },
  render: (args) => (
    <Accordion {...args} type="multiple" className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger>Account Settings</AccordionTrigger>
        <AccordionContent>
          Manage your account preferences, security settings, and personal information.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Billing Information</AccordionTrigger>
        <AccordionContent>
          Update your payment methods, view billing history, and manage subscription plans.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Notification Preferences</AccordionTrigger>
        <AccordionContent>
          Configure how you receive notifications and alerts from the platform.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-4">
        <AccordionTrigger>Data & Privacy</AccordionTrigger>
        <AccordionContent>
          Control your data privacy settings and export your information.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const FinancialFAQ: Story = {
  args: {
    type: 'single',
    collapsible: true,
    className: 'w-full max-w-2xl',
  },
  render: (args) => (
    <Accordion {...args} type="single" className="w-full max-w-2xl">
      <AccordionItem value="revenue">
        <AccordionTrigger>How do I track revenue?</AccordionTrigger>
        <AccordionContent>
          Navigate to the Revenue section in your dashboard. You can add income sources,
          categorize transactions, and generate detailed revenue reports. The system automatically
          calculates totals and provides visual insights.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="expenses">
        <AccordionTrigger>What expense categories are available?</AccordionTrigger>
        <AccordionContent>
          AccuBooks provides standard expense categories including:
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Office Supplies & Equipment</li>
            <li>Marketing & Advertising</li>
            <li>Travel & Entertainment</li>
            <li>Utilities & Rent</li>
            <li>Professional Services</li>
            <li>Insurance & Taxes</li>
          </ul>
          You can also create custom categories specific to your business.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="reports">
        <AccordionTrigger>How often are financial reports updated?</AccordionTrigger>
        <AccordionContent>
          Financial reports are updated in real-time as you enter transactions. You can generate
          reports for any time period:
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Daily summaries</li>
            <li>Weekly overviews</li>
            <li>Monthly statements</li>
            <li>Quarterly reports</li>
            <li>Annual summaries</li>
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};
