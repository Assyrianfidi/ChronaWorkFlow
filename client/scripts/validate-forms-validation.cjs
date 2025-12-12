const fs = require('fs');
const path = require('path');

function validateFormsValidation() {
  console.log('📝 Phase 6: Forms, Validation & Interactions Validation\n');
  
  let issues = [];
  let fixes = [];
  let score = 0;
  const maxScore = 10;
  
  // 1. Check form components and structure
  console.log('🏗️  Form Components Analysis:');
  
  const formFiles = [
    'src/components/ui/Form.tsx',
    'src/components/ui/form.tsx',
    'src/components/Form.tsx',
    'src/components/forms/ContactForm.tsx',
    'src/components/forms/UserForm.tsx',
    'src/components/forms/CustomerForm.tsx',
    'src/components/forms/InvoiceForm.tsx'
  ];
  
  let formComponentsFound = 0;
  let formikUsage = 0;
  let reactHookFormUsage = 0;
  
  formFiles.forEach(file => {
    if (fs.existsSync(file)) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        formComponentsFound++;
        
        // Check for form libraries
        if (content.includes('formik') || content.includes('Formik')) {
          formikUsage++;
          console.log(`  ✅ Formik found in ${path.basename(file)}`);
        }
        
        if (content.includes('react-hook-form') || content.includes('useForm')) {
          reactHookFormUsage++;
          console.log(`  ✅ React Hook Form found in ${path.basename(file)}`);
        }
        
        // Check for form structure
        if (content.includes('<form') || content.includes('onSubmit')) {
          console.log(`  📝 Form structure in ${path.basename(file)}`);
        }
        
      } catch (error) {
        console.log(`  ❌ Cannot read ${path.basename(file)}`);
      }
    }
  });
  
  console.log(`  📊 Form components found: ${formComponentsFound}`);
  console.log(`  📋 Formik usage: ${formikUsage}`);
  console.log(`  🎣 React Hook Form usage: ${reactHookFormUsage}`);
  
  if (formComponentsFound >= 3 && (formikUsage >= 1 || reactHookFormUsage >= 1)) {
    score++;
    console.log('  ✅ Form components are properly structured');
  } else {
    console.log('  ❌ Form components need improvement');
    issues.push('Form components not properly structured');
  }
  
  // 2. Analyze validation schemas and rules
  console.log('\n✅ Validation Schemas Analysis:');
  
  const validationFiles = [
    'src/validations/index.ts',
    'src/validations/auth.ts',
    'src/validations/customer.ts',
    'src/validations/invoice.ts',
    'src/schemas/index.ts',
    'src/schemas/auth.ts'
  ];
  
  let validationSchemas = 0;
  let zodSchemas = 0;
  let yupSchemas = 0;
  let customValidation = 0;
  
  validationFiles.forEach(file => {
    if (fs.existsSync(file)) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        validationSchemas++;
        
        // Check for validation libraries
        if (content.includes('zod')) {
          zodSchemas++;
          console.log(`  ✅ Zod schema in ${path.basename(file)}`);
        }
        
        if (content.includes('yup')) {
          yupSchemas++;
          console.log(`  ✅ Yup schema in ${path.basename(file)}`);
        }
        
        // Check for custom validation
        if (content.includes('validate') || content.includes('validation')) {
          customValidation++;
          console.log(`  🔧 Custom validation in ${path.basename(file)}`);
        }
        
      } catch (error) {
        console.log(`  ❌ Cannot read ${path.basename(file)}`);
      }
    }
  });
  
  console.log(`  📊 Validation schemas: ${validationSchemas}`);
  console.log(`  🏷️  Zod schemas: ${zodSchemas}`);
  console.log(`  ✅ Yup schemas: ${yupSchemas}`);
  console.log(`  🔧 Custom validation: ${customValidation}`);
  
  if (validationSchemas >= 3 && (zodSchemas >= 1 || yupSchemas >= 1)) {
    score++;
    console.log('  ✅ Validation schemas are well implemented');
  } else {
    console.log('  ❌ Validation schemas need improvement');
    issues.push('Validation schemas not well implemented');
  }
  
  // 3. Check form submission handling
  console.log('\n📤 Form Submission Analysis:');
  
  const sourceFiles = getSourceFiles('src');
  let formSubmissions = 0;
  let asyncSubmissions = 0;
  let submissionHandling = 0;
  let successHandling = 0;
  
  sourceFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for form submission patterns
      if (content.includes('onSubmit') || content.includes('handleSubmit') || content.includes('submit')) {
        formSubmissions++;
      }
      
      // Check for async submission
      if (content.includes('async') && (content.includes('submit') || content.includes('Submit'))) {
        asyncSubmissions++;
      }
      
      // Check for submission handling
      if (content.includes('try') && content.includes('submit')) {
        submissionHandling++;
      }
      
      // Check for success handling
      if (content.includes('success') && (content.includes('submit') || content.includes('form'))) {
        successHandling++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  📤 Form submissions: ${formSubmissions} files`);
  console.log(`  ⚡ Async submissions: ${asyncSubmissions} files`);
  console.log(`  🛡️  Submission handling: ${submissionHandling} files`);
  console.log(`  ✅ Success handling: ${successHandling} files`);
  
  if (formSubmissions >= 5 && asyncSubmissions >= 3) {
    score++;
    console.log('  ✅ Form submission is well implemented');
  } else {
    console.log('  ❌ Form submission needs improvement');
    issues.push('Form submission not well implemented');
  }
  
  // 4. Check error message display
  console.log('\n🚨 Error Message Display Analysis:');
  
  let errorMessages = 0;
  let fieldErrors = 0;
  let errorComponents = 0;
  let toastNotifications = 0;
  
  sourceFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for error message patterns
      if (content.includes('error') && content.includes('message')) {
        errorMessages++;
      }
      
      // Check for field-level errors
      if (content.includes('fieldError') || content.includes('error') && content.includes('field')) {
        fieldErrors++;
      }
      
      // Check for error components
      if (content.includes('ErrorMessage') || content.includes('ErrorText') || content.includes('FormError')) {
        errorComponents++;
      }
      
      // Check for toast notifications
      if (content.includes('toast') || content.includes('Toast') || content.includes('notification')) {
        toastNotifications++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  🚨 Error messages: ${errorMessages} files`);
  console.log(`  📝 Field errors: ${fieldErrors} files`);
  console.log(`  🧩 Error components: ${errorComponents} files`);
  console.log(`  🔔 Toast notifications: ${toastNotifications} files`);
  
  if (errorMessages >= 5 && errorComponents >= 2) {
    score++;
    console.log('  ✅ Error message display is well implemented');
  } else {
    console.log('  ❌ Error message display needs improvement');
    issues.push('Error message display not well implemented');
  }
  
  // 5. Check form accessibility
  console.log('\n♿ Form Accessibility Analysis:');
  
  let accessibleForms = 0;
  let ariaLabels = 0;
  let formLabels = 0;
  let fieldsets = 0;
  
  sourceFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for accessible form patterns
      if (content.includes('<label') || content.includes('htmlFor')) {
        formLabels++;
      }
      
      // Check for ARIA labels
      if (content.includes('aria-label') || content.includes('aria-labelledby')) {
        ariaLabels++;
      }
      
      // Check for fieldsets
      if (content.includes('<fieldset') || content.includes('role="group"')) {
        fieldsets++;
      }
      
      // Check for form accessibility
      if (formLabels >= 1 || ariaLabels >= 1) {
        accessibleForms++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  ♿ Accessible forms: ${accessibleForms} files`);
  console.log(`  🏷️  ARIA labels: ${ariaLabels} files`);
  console.log(`  📝 Form labels: ${formLabels} files`);
  console.log(`  📦 Fieldsets: ${fieldsets} files`);
  
  if (formLabels >= 5 && ariaLabels >= 3) {
    score++;
    console.log('  ✅ Form accessibility is well implemented');
  } else {
    console.log('  ❌ Form accessibility needs improvement');
    issues.push('Form accessibility not well implemented');
  }
  
  // 6. Check interactive elements
  console.log('\n🎮 Interactive Elements Analysis:');
  
  let interactiveElements = 0;
  let buttonStates = 0;
  let loadingStates = 0;
  let disabledStates = 0;
  
  sourceFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for interactive elements
      if (content.includes('onClick') || content.includes('onChange') || content.includes('onSubmit')) {
        interactiveElements++;
      }
      
      // Check for button states
      if (content.includes('disabled') || content.includes('loading') || content.includes('isLoading')) {
        buttonStates++;
      }
      
      // Check for loading states in forms
      if (content.includes('loading') && (content.includes('form') || content.includes('submit'))) {
        loadingStates++;
      }
      
      // Check for disabled states
      if (content.includes('disabled') && (content.includes('button') || content.includes('input'))) {
        disabledStates++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  🎮 Interactive elements: ${interactiveElements} files`);
  console.log(`  🔘 Button states: ${buttonStates} files`);
  console.log(`  ⏳ Loading states: ${loadingStates} files`);
  console.log(`  🚫 Disabled states: ${disabledStates} files`);
  
  if (interactiveElements >= 10 && buttonStates >= 5) {
    score++;
    console.log('  ✅ Interactive elements are well implemented');
  } else {
    console.log('  ❌ Interactive elements need improvement');
    issues.push('Interactive elements not well implemented');
  }
  
  // 7. Check form validation feedback
  console.log('\n💬 Form Validation Feedback Analysis:');
  
  let realTimeValidation = 0;
  let onBlurValidation = 0;
  let onSubmitValidation = 0;
  let validationMessages = 0;
  
  sourceFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for real-time validation
      if (content.includes('onChange') && content.includes('validate')) {
        realTimeValidation++;
      }
      
      // Check for blur validation
      if (content.includes('onBlur') && content.includes('validate')) {
        onBlurValidation++;
      }
      
      // Check for submit validation
      if (content.includes('onSubmit') && content.includes('validate')) {
        onSubmitValidation++;
      }
      
      // Check for validation messages
      if (content.includes('validation') && content.includes('message')) {
        validationMessages++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  ⚡ Real-time validation: ${realTimeValidation} files`);
  console.log(`  👁️  Blur validation: ${onBlurValidation} files`);
  console.log(`  📤 Submit validation: ${onSubmitValidation} files`);
  console.log(`  💬 Validation messages: ${validationMessages} files`);
  
  if (realTimeValidation >= 2 && onSubmitValidation >= 3) {
    score++;
    console.log('  ✅ Form validation feedback is well implemented');
  } else {
    console.log('  ❌ Form validation feedback needs improvement');
    issues.push('Form validation feedback not well implemented');
  }
  
  // 8. Check form data handling
  console.log('\n🔄 Form Data Handling Analysis:');
  
  let formDataHandling = 0;
  let dataTransformation = 0;
  let formReset = 0;
  let dataPersistence = 0;
  
  sourceFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for form data handling
      if (content.includes('FormData') || content.includes('formData') || content.includes('data:')) {
        formDataHandling++;
      }
      
      // Check for data transformation
      if (content.includes('transform') && content.includes('data')) {
        dataTransformation++;
      }
      
      // Check for form reset
      if (content.includes('reset') && content.includes('form')) {
        formReset++;
      }
      
      // Check for data persistence
      if (content.includes('localStorage') && content.includes('form')) {
        dataPersistence++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  🔄 Form data handling: ${formDataHandling} files`);
  console.log(`  🔄 Data transformation: ${dataTransformation} files`);
  console.log(`  🔄 Form reset: ${formReset} files`);
  console.log(`  💾 Data persistence: ${dataPersistence} files`);
  
  if (formDataHandling >= 5 && formReset >= 2) {
    score++;
    console.log('  ✅ Form data handling is well implemented');
  } else {
    console.log('  ❌ Form data handling needs improvement');
    issues.push('Form data handling not well implemented');
  }
  
  // 9. Check form testing
  console.log('\n🧪 Form Testing Analysis:');
  
  const testFiles = sourceFiles.filter(file => 
    file.includes('.test.') || file.includes('.spec.')
  );
  
  let formTests = 0;
  let validationTests = 0;
  let submissionTests = 0;
  
  testFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for form tests
      if (content.includes('form') || content.includes('Form')) {
        formTests++;
      }
      
      // Check for validation tests
      if (content.includes('validation') && (content.includes('test') || content.includes('spec'))) {
        validationTests++;
      }
      
      // Check for submission tests
      if (content.includes('submit') && (content.includes('test') || content.includes('spec'))) {
        submissionTests++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  🧪 Form tests: ${formTests} files`);
  console.log(`  ✅ Validation tests: ${validationTests} files`);
  console.log(`  📤 Submission tests: ${submissionTests} files`);
  
  if (formTests >= 3 && validationTests >= 2) {
    score++;
    console.log('  ✅ Form testing is well implemented');
  } else {
    console.log('  ❌ Form testing needs improvement');
    issues.push('Form testing not well implemented');
  }
  
  // 10. Check user experience features
  console.log('\n🎯 User Experience Features Analysis:');
  
  let autoSave = 0;
  let progressIndicators = 0;
  let confirmationDialogs = 0;
  let keyboardNavigation = 0;
  
  sourceFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for auto-save
      if (content.includes('autoSave') || content.includes('autosave')) {
        autoSave++;
      }
      
      // Check for progress indicators
      if (content.includes('progress') && content.includes('form')) {
        progressIndicators++;
      }
      
      // Check for confirmation dialogs
      if (content.includes('confirm') && (content.includes('submit') || content.includes('delete'))) {
        confirmationDialogs++;
      }
      
      // Check for keyboard navigation
      if (content.includes('onKeyDown') || content.includes('tabIndex') || content.includes('keyboard')) {
        keyboardNavigation++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  💾 Auto-save: ${autoSave} files`);
  console.log(`  📊 Progress indicators: ${progressIndicators} files`);
  console.log(`  ❓ Confirmation dialogs: ${confirmationDialogs} files`);
  console.log(`  ⌨️  Keyboard navigation: ${keyboardNavigation} files`);
  
  if (progressIndicators >= 2 && confirmationDialogs >= 1) {
    score++;
    console.log('  ✅ User experience features are well implemented');
  } else {
    console.log('  ❌ User experience features need improvement');
    issues.push('User experience features not well implemented');
  }
  
  // Calculate final score
  const percentage = Math.round((score / maxScore) * 100);
  
  console.log('\n📊 Phase 6 Results:');
  console.log(`  🎯 Forms, Validation & Interactions Score: ${score}/${maxScore} (${percentage}%)`);
  console.log(`  🔧 Fixes Available: ${fixes.length}`);
  console.log(`  ⚠️  Issues Found: ${issues.length}`);
  
  if (fixes.length > 0) {
    console.log('\n✅ Automatic Fixes Available:');
    fixes.forEach(fix => console.log(`  - ${fix}`));
  }
  
  if (issues.length > 0) {
    console.log('\n❌ Manual Issues Requiring Attention:');
    issues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  // Phase completion determination
  const isPhaseComplete = percentage >= 85 && issues.length <= 5;
  
  console.log(`\n🎯 Phase 6 Status: ${isPhaseComplete ? '✅ COMPLETE' : '⚠️  NEEDS ATTENTION'}`);
  
  if (isPhaseComplete) {
    console.log('🚀 Ready to proceed to Phase 7');
  } else {
    console.log('📝 Address remaining issues before proceeding to Phase 7');
  }
  
  return {
    success: isPhaseComplete,
    score,
    maxScore,
    percentage,
    fixes,
    issues,
    recommendations: issues.length > 0 ? ['Address manual form and validation issues'] : []
  };
}

// Helper function to get all source files
function getSourceFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          traverse(fullPath);
        } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  traverse(dir);
  return files;
}

if (require.main === module) {
  validateFormsValidation();
}

module.exports = { validateFormsValidation };
