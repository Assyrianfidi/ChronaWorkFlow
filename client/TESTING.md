# Testing Guide for AccuBooks

## Overview

This guide covers the testing strategy, tools, and best practices for the AccuBooks application.

## Testing Structure

### Unit Tests
- Location: `src/**/*.test.tsx` or `src/**/*.spec.tsx`
- Framework: Jest + React Testing Library
- Coverage: Target 80%+ coverage

### Integration Tests
- Location: `src/**/integration/*.test.tsx`
- Framework: Jest + React Testing Library
- Focus: Component interactions and API integration

### E2E Tests
- Location: `tests/e2e/`
- Framework: Playwright
- Focus: User workflows and critical paths

### Accessibility Tests
- Location: `src/**/a11y/*.test.tsx`
- Framework: Jest + axe-core
- Focus: WCAG compliance

### Performance Tests
- Location: `src/**/performance/*.test.tsx`
- Framework: Jest + custom performance utilities
- Focus: Render times and memory usage

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

### Coverage Report
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```

## Test Utilities

### Mock Data
```typescript
import { createMockUser, createMockInvoice } from '@/utils/test-utils';

const user = createMockUser({ name: 'Custom User' });
const invoice = createMockInvoice({ amount: 5000 });
```

### Render with Providers
```typescript
import { renderWithProviders } from '@/utils/test-utils';

renderWithProviders(<MyComponent />, { initialState: { user: mockUser } });
```

### Form Testing
```typescript
import { fillForm, submitForm } from '@/utils/test-utils';

await fillForm(screen.getByRole('form'), { name: 'John Doe', email: 'john@example.com' });
await submitForm(screen.getByRole('form'));
```

### API Mocking
```typescript
import { createMockFetch } from '@/utils/test-utils';

const mockFetch = createMockFetch([
  { data: { users: [] }, status: 200 },
  { data: { error: 'Not found' }, status: 404 }
]);

global.fetch = mockFetch;
```

## Test Examples

### Component Test
```typescript
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Test
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { UserForm } from './UserForm';
import { createMockFetch } from '@/utils/test-utils';

describe('UserForm Integration', () => {
  it('submits form successfully', async () => {
    const mockFetch = createMockFetch([
      { data: { id: '1', name: 'John Doe' }, status: 201 }
    ]);
    global.fetch = mockFetch;

    render(<UserForm />);
    
    await fillForm(screen.getByRole('form'), { name: 'John Doe', email: 'john@example.com' });
    await submitForm(screen.getByRole('form'));

    await waitFor(() => {
      expect(screen.getByText('User created successfully')).toBeInTheDocument();
    });
  });
});
```

### Accessibility Test
```typescript
import { render, axe } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<MyComponent />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## Best Practices

### 1. Test Structure
- Use `describe` blocks to group related tests
- Use `it` or `test` for individual test cases
- Write descriptive test names
- Arrange-Act-Assert pattern

### 2. Assertions
- Use specific matchers from `@testing-library/jest-dom`
- Test behavior, not implementation
- Use `waitFor` for async operations
- Mock external dependencies

### 3. Mock Data
- Use factory functions for consistent test data
- Avoid hardcoded test data
- Use realistic but simple data
- Clean up mocks between tests

### 4. Component Testing
- Test from user's perspective
- Use `screen` for queries
- Prefer accessible queries (getByRole, getByLabelText)
- Test error states and edge cases

### 5. API Testing
- Mock fetch/API calls
- Test loading states
- Test error handling
- Use realistic response data

## Coverage Requirements

### Global Coverage
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

### Component Coverage
- Branches: 85%
- Functions: 85%
- Lines: 85%
- Statements: 85%

### Utility Coverage
- Branches: 90%
- Functions: 90%
- Lines: 90%
- Statements: 90%

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Push to main/develop branches
- Before deployment

### Test Pipeline
1. Linting
2. Type checking
3. Unit tests
4. Integration tests
5. Coverage report
6. Accessibility tests
7. Security audit
8. Build
9. E2E tests

## Debugging Tests

### Debug Mode
```bash
npm test -- --debug
```

### Single Test
```bash
npm test -- --testNamePattern="specific test name"
```

### Update Snapshots
```bash
npm test -- --updateSnapshot
```

## Performance Testing

### Render Performance
```typescript
import { measureRenderTime } from '@/utils/test-utils';

const { average, max } = await measureRenderTime(<MyComponent />);
expect(average).toBeLessThan(100); // 100ms threshold
```

### Memory Testing
```typescript
it('should not leak memory', () => {
  const { unmount } = render(<MyComponent />);
  unmount();
  // Check for memory leaks
});
```

## Troubleshooting

### Common Issues
1. **Act warnings**: Use `waitFor` instead of direct assertions
2. **Mock not working**: Check mock setup and cleanup
3. **Coverage low**: Add tests for uncovered branches
4. **Async tests**: Use proper async/await patterns

### Getting Help
- Check Jest documentation
- Review React Testing Library guides
- Consult team testing standards
- Use debugging tools

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [Playwright](https://playwright.dev/)
- [Accessibility Testing](https://www.deque.com/axe/)
- [Performance Testing](https://web.dev/performance/)

---

Remember: Good tests lead to reliable code! 🧪