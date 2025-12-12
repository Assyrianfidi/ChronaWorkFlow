# Storybook Setup Guide

## Overview

This project uses Storybook 8.6.14 for component development and documentation. The setup includes comprehensive stories for UI components, forms, and layout components.

## Installation

```bash
npm install
```

## Running Storybook

```bash
npm run storybook
```

This will start Storybook on `http://localhost:6006`

## Building Storybook

```bash
npm run build-storybook
```

## Available Stories

### UI Components

- **Button** - Various button styles and states
- **Card** - Card layouts with headers, content, and footers
- **Input** - Input fields with different types and states
- **Badge** - Status badges and indicators
- **Dialog** - Modal dialogs with triggers and content
- **Dropdown Menu** - Context menus and dropdowns
- **Alert** - Alert messages with different variants
- **Avatar** - User avatars with fallbacks
- **Checkbox** - Checkbox inputs with different states
- **EnterpriseButton** - Enhanced button components with animations

### Layout Components

- **Layout** - Main application layout with navigation
- **ErrorBoundary** - Error boundary with fallback UI
- **ProtectedRoute** - Route protection with auth states
- **ThemeProvider** - Theme context provider

### Form Components

- **ReportForm** - Comprehensive report creation form with validation

### Report Components

- **ReportList** - List view for reports
- **ReportView** - Detailed report view

## Component Stories Structure

Each story file includes:

- **Meta configuration** - Component metadata and controls
- **Default story** - Basic component usage
- **Variant stories** - Different states and configurations
- **Interactive examples** - Components with user interactions

## Testing Stories

Stories can be tested using:

```bash
npm run test:coverage
```

## Configuration Files

### `.storybook/main.ts`

- Storybook configuration with Vite framework
- Addons for docs, a11y, interactions, and essentials
- Auto-documentation setup

### `.storybook/preview.ts`

- Global decorators for theme and auth providers
- CSS imports for styling
- Control configurations

## Adding New Stories

1. Create a `*.stories.tsx` file next to your component
2. Import the component and Storybook types
3. Define the meta configuration
4. Create story variants

Example:

```typescript
import type { Meta, StoryObj } from "@storybook/react";
import { MyComponent } from "./MyComponent";

const meta: Meta<typeof MyComponent> = {
  title: "Components/MyComponent",
  component: MyComponent,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // component props
  },
};
```

## Troubleshooting

### Common Issues

1. **Missing Context Providers**
   - Components requiring auth or theme context are wrapped with mock providers
   - Check `.storybook/preview.ts` for provider setup

2. **Import Path Issues**
   - Use relative imports for components
   - Ensure UI components are imported from `../ui/`

3. **Duplicate Stories**
   - Ensure story files are in component directories, not in `/stories`
   - Check for duplicate story IDs

### Performance Tips

- Use decorators for common setup
- Mock complex dependencies
- Keep stories focused on specific use cases

## Accessibility

Storybook includes accessibility testing via the `@storybook/addon-a11y` addon. Tests run automatically and can be viewed in the Accessibility tab for each story.

## Playwright Integration

Playwright Chromium is installed for visual testing and browser automation. Configure tests in your test files using Playwright APIs.

## Environment Variables

Set up any required environment variables in a `.env` file:

```env
VITE_API_URL=http://localhost:3000
```

## Contributing

When adding new components:

1. Create the component with proper TypeScript types
2. Add comprehensive stories covering all use cases
3. Test with different screen sizes and accessibility settings
4. Update this README if adding new story categories

## Current Status

✅ **Setup Complete**

- Storybook 8.6.14 configured
- 15+ component stories created
- Mock providers implemented
- Playwright Chromium installed
- Accessibility testing enabled

✅ **Components with Stories**

- All UI components (Button, Card, Input, Badge, Dialog, etc.)
- Layout components (Layout, ErrorBoundary, ProtectedRoute, ThemeProvider)
- Form components (ReportForm)
- Report components (ReportList, ReportView)

🚀 **Ready for Development**

- Run `npm run storybook` to start development
- All stories should render without errors
- Accessibility tests pass for all components
