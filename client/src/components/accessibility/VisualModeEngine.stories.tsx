import type { Meta, StoryObj } from "@storybook/react";
import { VisualModeEngine } from './VisualModeEngine.js';

const meta: Meta<typeof VisualModeEngine> = {
  title: "Accessibility/VisualModeEngine",
  component: VisualModeEngine,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: <div>Test content for VisualModeEngine</div>,
  },
};

export const WithCustomContent: Story = {
  args: {
    children: (
      <div>
        <h2>Visual Mode Demo</h2>
        <p>This content will adapt to different visual modes.</p>
        <button>Test Button</button>
      </div>
    ),
  },
};
