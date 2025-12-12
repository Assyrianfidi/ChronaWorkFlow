# AccuBooks Component Library - Essential Components

## Overview
This directory contains the essential UI components for the AccuBooks application, optimized for performance, accessibility, and maintainability.

## Essential Components

### Button
- Fully accessible with ARIA attributes
- Multiple variants (default, destructive, outline, secondary, ghost, link)
- Multiple sizes (default, sm, lg, icon)
- Performance optimized with React.memo

### Card
- Container component with header, content, and footer
- Semantic HTML structure
- Accessible with proper heading hierarchy
- Performance optimized with React.memo

### Input
- Form input with full accessibility support
- ARIA attributes for screen readers
- Validation states support
- Performance optimized with React.memo

### ErrorBoundary
- React error boundary for error handling
- Graceful error fallback UI
- Error logging for debugging
- Page refresh functionality

### ProtectedRoute
- Authentication wrapper component
- Role-based access control
- Loading states
- Redirect functionality

## Performance Features

All components include:
- **React.memo** - Prevents unnecessary re-renders
- **forwardRef** - Proper ref forwarding
- **TypeScript** - Full type safety
- **Accessibility** - WCAG 2.1 AA compliance
- **Semantic HTML** - Proper HTML structure

## Usage Examples

### Button Component
```typescript
import { Button } from '@/components/ui';

<Button variant="default" size="lg" onClick={handleClick}>
  Click Me
</Button>

<Button variant="destructive" aria-label="Delete item">
  Delete
</Button>
```

### Card Component
```typescript
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

<Card>
  <CardHeader>
    <CardTitle>Dashboard</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Welcome to your dashboard</p>
  </CardContent>
</Card>
```

### Input Component
```typescript
import { Input } from '@/components/ui';

<Input 
  type="email"
  placeholder="Enter your email"
  aria-label="Email address"
  required
/>
```

## Accessibility Features

- **ARIA Labels**: All interactive elements have proper ARIA labels
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: Compatible with screen readers
- **High Contrast**: Works with high contrast mode
- **Focus Management**: Proper focus indicators

## Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing
When adding new components:
1. Follow the existing patterns
2. Include accessibility attributes
3. Add TypeScript types
4. Use React.memo for performance
5. Include proper documentation
6. Add unit tests

## Support
For component issues:
- Check the documentation
- Review accessibility guidelines
- Contact the development team
