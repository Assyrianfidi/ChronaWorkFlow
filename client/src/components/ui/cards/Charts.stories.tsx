import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { UsersOverTimeCard, SalesOverviewCard } from "./Charts";

const meta: Meta = {
  title: "Enterprise/Charts",
};

export default meta;

type Story = StoryObj;

export const UsersOverTime: Story = {
  render: () => (
    <div className="p-6 max-w-xl">
      <UsersOverTimeCard />
    </div>
  ),
};

export const SalesOverview: Story = {
  render: () => (
    <div className="p-6 max-w-xl">
      <SalesOverviewCard />
    </div>
  ),
};
