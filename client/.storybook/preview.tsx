import React, { type ComponentType } from "react";
import type { Preview } from "@storybook/react";
import { ThemeProvider } from "../src/theme";
import { BrowserRouter } from "react-router-dom";

export const decorators = [
  (Story: ComponentType) => (
    <BrowserRouter>
      <ThemeProvider>
        <div className="bg-surface0 min-h-screen p-6">
          <Story />
        </div>
      </ThemeProvider>
    </BrowserRouter>
  ),
];

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    backgrounds: {
      default: "surface0",
      values: [
        { name: "surface0", value: "var(--surface-0)" },
        { name: "surface1", value: "var(--surface-1)" },
      ],
    },
  },
};

export default preview;
