# AccuBooks Navigation System

## Overview
The AccuBooks application features a comprehensive navigation system with multiple navigation patterns to support different user needs and contexts.

## Navigation Components

### 1. Main Navigation (`Navigation.tsx`)
- **Purpose**: Primary navigation bar at the top of the application
- **Features**:
  - Responsive design with mobile menu
  - Role-specific dashboard dropdown
  - User profile and logout functionality
  - Full keyboard navigation support
  - ARIA labels for accessibility

### 2. Sidebar Navigation (`SidebarNavigation.tsx`)
- **Purpose**: Secondary navigation for detailed page layouts
- **Features**:
  - Grouped navigation items
  - Role-specific dashboard links
  - Active state indicators
  - Collapsible design

### 3. Breadcrumb Navigation (`BreadcrumbNavigation.tsx`)
- **Purpose**: Contextual navigation showing current page hierarchy
- **Features**:
  - Automatic breadcrumb generation
  - Clickable breadcrumb links
  - Semantic HTML structure

### 4. Layout Component (`Layout.tsx`)
- **Purpose**: Wrapper component that combines all navigation elements
- **Features**:
  - Dynamic page titles and meta descriptions
  - Error boundary integration
  - Optional breadcrumb display

## Route Structure

### Public Routes
- `/` - Redirects to dashboard
- `/auth/signin` - Sign in page
- `/auth/signup` - Sign up page
- `/unauthorized` - Unauthorized access page
- `/404` - Not found page

### Protected Routes
- `/dashboard` - Main dashboard
- `/customers` - Customer management
- `/invoices` - Invoice management
- `/reports` - Report generation
- `/inventory` - Inventory management
- `/transactions` - Transaction management
- `/payroll` - Payroll management
- `/reconciliation` - Account reconciliation
- `/vendors` - Vendor management
- `/settings` - Application settings
- `/profile` - User profile

### Role-Specific Dashboards
- `/dashboard/cfo` - CFO dashboard
- `/dashboard/controller` - Controller dashboard
- `/dashboard/project-manager` - Project Manager dashboard
- `/dashboard/accountant` - Accountant dashboard

### Dynamic Routes
- `/customers/:id` - Customer detail page
- `/invoices/:id` - Invoice detail page
- `/reports/:id` - Report detail page
- `/inventory/:id` - Inventory item detail
- `/transactions/:id` - Transaction detail
- `/vendors/:id` - Vendor detail page

## Accessibility Features

### ARIA Labels
- All navigation links have descriptive ARIA labels
- Navigation landmarks are properly identified
- Screen reader announcements for navigation changes

### Keyboard Navigation
- Full keyboard support for all navigation elements
- Tab order follows logical sequence
- Focus indicators are clearly visible

### Semantic HTML
- Proper use of `<nav>` elements
- Heading hierarchy for navigation structure
- List elements for navigation groups

## Responsive Design

### Desktop Navigation
- Horizontal navigation bar
- Dropdown menus for role-specific features
- Hover states and transitions

### Mobile Navigation
- Hamburger menu for small screens
- Full-screen mobile navigation
- Touch-friendly tap targets

## Usage Examples

### Basic Layout with Navigation
```tsx
import Layout from '@/components/Layout';

const MyPage = () => {
  return (
    <Layout title="My Page" description="Page description">
      <div className="p-6">
        <h1>Page Content</h1>
        <p>Your page content here</p>
      </div>
    </Layout>
  );
};
```

### Layout Without Breadcrumbs
```tsx
<Layout title="Simple Page" showBreadcrumb={false}>
  <div>Content without breadcrumbs</div>
</Layout>
```

### Standalone Navigation Component
```tsx
import Navigation from '@/components/Navigation';

const CustomLayout = () => {
  return (
    <div>
      <Navigation />
      <main>Custom content</main>
    </div>
  );
};
```

## Performance Features

- **Code Splitting**: Routes are lazy-loaded for better performance
- **Memoization**: Navigation components use React.memo
- **Efficient Rerendering**: Navigation state is optimized
- **Bundle Size**: Navigation components are tree-shakeable

## Best Practices

1. **Use Layout Component**: Always wrap pages in the Layout component
2. **Descriptive Titles**: Provide meaningful page titles and descriptions
3. **Route Protection**: Ensure sensitive routes are properly protected
4. **Breadcrumb Context**: Use breadcrumbs for deep page hierarchies
5. **Mobile Testing**: Test navigation on all screen sizes
6. **Accessibility Testing**: Verify screen reader compatibility

## Troubleshooting

### Common Issues
- **Navigation not updating**: Check if Layout component is used
- **Mobile menu not working**: Verify JavaScript is enabled
- **Breadcrumbs missing**: Ensure showBreadcrumb prop is true
- **Role dashboards not showing**: Check user role assignment

### Debug Tips
- Use browser dev tools to inspect navigation elements
- Check console for navigation-related errors
- Verify route definitions match navigation links
- Test with different user roles and permissions
