#!/bin/bash

# Install rich text editor and form dependencies
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image @hookform/resolvers react-query @tanstack/react-query-devtools

# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest @types/jest

# Install E2E testing
npx cypress install

# Install Storybook
npx storybook@latest init

echo "✅ Dependencies installed successfully!"
echo "Run 'npm run dev' to start the development server"
echo "Run 'npx cypress open' to open the Cypress test runner"
echo "Run 'npm run storybook' to start Storybook"
