import type { Meta, StoryObj } from "@storybook/react";
import { NotificationSystem } from './NotificationSystem.js';

const meta: Meta<typeof NotificationSystem> = {
  title: "Adaptive/NotificationSystem",
  component: NotificationSystem,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div style={{ height: "400px", position: "relative" }}>
        <div style={{ padding: "20px" }}>
          <p>Notification System Demo</p>
          <p>Notifications will appear in the top-right corner.</p>
          <button>Trigger Notification</button>
        </div>
      </div>
    ),
  },
};

export const WithContent: Story = {
  args: {
    children: (
      <div style={{ height: "400px", position: "relative" }}>
        <div style={{ padding: "20px" }}>
          <h2>Application Interface</h2>
          <p>This is a sample application interface.</p>
          <div style={{ marginTop: "20px" }}>
            <button style={{ marginRight: "10px" }}>Save Changes</button>
            <button style={{ marginRight: "10px" }}>Delete Item</button>
            <button>Export Data</button>
          </div>
        </div>
      </div>
    ),
  },
};
