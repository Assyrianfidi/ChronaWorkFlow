import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './alert-dialog';
import { Button } from './button';

const meta: Meta<typeof AlertDialog> = {
  title: 'UI/AlertDialog',
  component: AlertDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A modal dialog that interrupts the user with important content and expects a response.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    defaultOpen: {
      control: 'boolean',
      description: 'Whether the dialog is open by default',
    },
  },
};

export default meta;
type Story = StoryObj<typeof AlertDialog>;

export const Default: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Show Dialog</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your account and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Basic alert dialog with title, description, and action buttons.',
      },
    },
  },
};

export const Destructive: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete Account</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete your account?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete Account
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Destructive action dialog with styled confirmation button.',
      },
    },
  },
};

export const Success: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="default">Complete Setup</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Setup Complete!</AlertDialogTitle>
          <AlertDialogDescription>
            Your account has been successfully configured. You can now start using all the features available to you.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Maybe Later</AlertDialogCancel>
          <AlertDialogAction>Get Started</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Success confirmation dialog for completing a setup process.',
      },
    },
  },
};

export const WithCustomContent: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button>Custom Dialog</Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <span className="text-2xl">📧</span>
            Email Verification Required
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            Please verify your email address to continue. We've sent a verification code to your registered email.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <div className="h-8 w-8 rounded-md border bg-muted flex items-center justify-center text-sm font-mono">
              1
            </div>
            <div className="h-8 w-8 rounded-md border bg-muted flex items-center justify-center text-sm font-mono">
              2
            </div>
            <div className="h-8 w-8 rounded-md border bg-muted flex items-center justify-center text-sm font-mono">
              3
            </div>
            <div className="h-8 w-8 rounded-md border bg-muted flex items-center justify-center text-sm font-mono">
              4
            </div>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Resend Code</AlertDialogCancel>
          <AlertDialogAction>Verify</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Dialog with custom content including verification code input.',
      },
    },
  },
};

export const LongContent: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Terms & Conditions</Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Terms of Service</AlertDialogTitle>
          <AlertDialogDescription className="max-h-60 overflow-y-auto">
            By using our service, you agree to the following terms and conditions. This agreement governs your use of our platform and outlines the responsibilities of both parties.
            
            <br /><br />
            <strong>1. Acceptance of Terms</strong><br />
            By accessing and using this service, you accept and agree to be bound by the terms and provision of this agreement.
            
            <br /><br />
            <strong>2. Use License</strong><br />
            Permission is granted to temporarily download one copy of the materials on our website for personal, non-commercial transitory viewing only.
            
            <br /><br />
            <strong>3. Disclaimer</strong><br />
            The materials on our website are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim all other warranties.
            
            <br /><br />
            <strong>4. Limitations</strong><br />
            In no event shall our company or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit) arising from the use of our website.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Decline</AlertDialogCancel>
          <AlertDialogAction>Accept Terms</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Dialog with scrollable long content for terms and conditions.',
      },
    },
  },
};
