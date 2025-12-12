# AccuBooks Form Components Documentation

## Overview
The AccuBooks application features a comprehensive form system with React Hook Form integration, Zod validation, and real-time feedback.

## Form Components

### 1. Base Form Component (`Form.tsx`)
- **Purpose**: Base form wrapper with error/success message handling
- **Features**:
  - Title and description support
  - Error and success message display
  - Loading state indicator
  - Accessibility support

#### Usage:
```tsx
import Form, { FormField, FormActions } from '@/components/forms/Form';

const MyForm = () => {
  return (
    <Form
      title="Form Title"
      description="Form description"
      onSubmit={handleSubmit}
      error={error}
      success={success}
      loading={loading}
    >
      <FormField label="Field Label" error={errorMessage}>
        <Input {...register('field')} />
      </FormField>
      
      <FormActions>
        <Button type="submit">Submit</Button>
        <Button type="button" variant="outline">Cancel</Button>
      </FormActions>
    </Form>
  );
};
```

### 2. CustomerForm (`CustomerForm.tsx`)
- **Purpose**: Customer creation and editing form
- **Features**:
  - React Hook Form integration
  - Zod validation schema
  - Real-time validation feedback
  - Accessibility support

### 3. InvoiceForm (`InvoiceForm.tsx`)
- **Purpose**: Invoice creation and editing form
- **Features**:
  - Date picker integration
  - Status selection
  - Tax calculation support
  - Real-time validation

### 4. UserForm (`UserForm.tsx`)
- **Purpose**: User management form
- **Features**:
  - Role selection
  - Department assignment
  - Email and phone validation

### 5. ReportForm (`ReportForm.tsx`)
- **Purpose**: Report generation configuration
- **Features**:
  - Report type selection
  - Date range configuration
  - JSON parameter support

### 6. ProductForm (`ProductForm.tsx`)
- **Purpose**: Product/inventory management
- **Features**:
  - SKU validation
  - Price and cost tracking
  - Quantity management

### 7. ValidatedInput (`ValidatedForm.tsx`)
- **Purpose**: Enhanced input with real-time validation
- **Features**:
  - Real-time validation feedback
  - Success/error indicators
  - Accessibility support

## Validation System

### 1. Zod Schemas (`validations/index.ts`)
- **Customer Schema**: Name, email, phone, address validation
- **Invoice Schema**: Invoice number, dates, amounts, status
- **User Schema**: User information, role, department
- **Report Schema**: Report configuration and parameters
- **Product Schema**: Product details, pricing, inventory

### 2. Additional Schemas (`validations/additional.ts`)
- **Transaction Schema**: Financial transaction validation
- **Vendor Schema**: Supplier information validation
- **Payroll Schema**: Employee payroll validation
- **Settings Schema**: Application settings validation
- **Contact Form Schema**: Contact form validation
- **Password Change Schema**: Password update validation

### 3. Validation Utilities (`validations/utils.ts`)
- **validateForm**: Form-level validation
- **validateField**: Field-level validation
- **formatValidationErrors**: Error formatting
- **customValidations**: Custom validation rules
- **createFormResolver**: React Hook Form resolver

## Validation Hooks

### 1. useRealTimeValidation
- **Purpose**: Real-time field validation
- **Features**:
  - Field-by-field validation
  - Error tracking
  - Validity tracking

### 2. useFormSubmission
- **Purpose**: Form submission with validation
- **Features**:
  - Pre-submission validation
  - Error handling
  - Success handling
  - Loading states

### 3. useAutoSave
- **Purpose**: Automatic form saving
- **Features**:
  - Local storage persistence
  - Configurable save intervals
  - Load/save functionality

### 4. useFormProgress
- **Purpose**: Form completion tracking
- **Features**:
  - Progress percentage
  - Status tracking
  - Completion detection

## Best Practices

### 1. Form Structure
- Always use the base `Form` component for consistency
- Use `FormField` for proper label/error association
- Implement real-time validation for better UX

### 2. Validation
- Use Zod schemas for type-safe validation
- Implement both field-level and form-level validation
- Provide clear, actionable error messages

### 3. Accessibility
- Include proper ARIA labels
- Use semantic HTML elements
- Ensure keyboard navigation support

### 4. User Experience
- Show loading states during submission
- Provide success/error feedback
- Implement auto-save for long forms

## Examples

### Basic Form with Validation
```tsx
import { useFormSubmission } from '@/validations/hooks';
import { customerSchema } from '@/validations/utils';

const CustomerFormExample = () => {
  const {
    isSubmitting,
    submitError,
    submitSuccess,
    fieldErrors,
    validateFieldRealTime,
    handleSubmit,
  } = useFormSubmission(customerSchema, async (data) => {
    await api.createCustomer(data);
  });

  return (
    <Form onSubmit={handleSubmit} error={submitError} success={submitSuccess}>
      <FormField label="Name" error={fieldErrors.name}>
        <Input
          onChange={(e) => validateFieldRealTime('name', e.target.value)}
          placeholder="Customer name"
        />
      </FormField>
      
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Create Customer'}
      </Button>
    </Form>
  );
};
```

### Form with Auto-Save
```tsx
import { useAutoSave } from '@/validations/hooks';

const AutoSaveForm = () => {
  const [formData, setFormData] = useState(initialData);
  
  const { lastSaved, isSaving } = useAutoSave('customer-form', formData);
  
  return (
    <Form>
      {/* Form fields */}
      {lastSaved && (
        <p className="text-sm text-gray-500">
          Last saved: {lastSaved.toLocaleTimeString()}
        </p>
      )}
    </Form>
  );
};
```

## Testing

### Form Testing
- Test validation rules
- Test form submission
- Test error handling
- Test accessibility

### Example Test
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import CustomerForm from './CustomerForm';

describe('CustomerForm', () => {
  it('validates required fields', async () => {
    const mockSubmit = jest.fn();
    render(<CustomerForm onSubmit={mockSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: /create customer/i });
    fireEvent.click(submitButton);
    
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });
});
```

## Troubleshooting

### Common Issues
1. **Validation not working**: Check schema integration and resolver setup
2. **Form not submitting**: Verify validation passes and onSubmit handler
3. **Error messages not showing**: Check error state and FormField usage
4. **Auto-save not working**: Verify localStorage availability and key uniqueness

### Debug Tips
- Use React DevTools to inspect form state
- Check validation schema for incorrect rules
- Verify form data structure matches schema
- Test with different user inputs