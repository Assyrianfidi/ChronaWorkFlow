import Link from 'next/link'
import { ChevronRightIcon, CodeBracketIcon, KeyIcon, DocumentTextIcon } from '@heroicons/react/24/outline'

const apiSections = [
  {
    title: 'Authentication',
    description: 'Secure your API requests with JWT tokens and manage user sessions.',
    href: '/api/authentication',
    icon: KeyIcon,
  },
  {
    title: 'Companies',
    description: 'Create and manage multiple companies with complete data isolation.',
    href: '/api/companies',
    icon: DocumentTextIcon,
  },
  {
    title: 'Financial Data',
    description: 'Access accounts, transactions, invoices, and financial reports.',
    href: '/api/financial-data',
    icon: DocumentTextIcon,
  },
  {
    title: 'Billing',
    description: 'Manage subscriptions, invoices, and payment methods.',
    href: '/api/billing',
    icon: DocumentTextIcon,
  },
  {
    title: 'Integrations',
    description: 'Connect with Stripe, Plaid, and other third-party services.',
    href: '/api/integrations',
    icon: CodeBracketIcon,
  },
]

export default function APIPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-green-400 to-blue-600 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>

        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              API
              <span className="block text-green-600">Documentation</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Build powerful integrations with the AccuBooks API. Access financial data,
              manage subscriptions, and automate your accounting workflows.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/api/authentication"
                className="rounded-md bg-green-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
              >
                Get Started
              </Link>
              <Link
                href="#base-url"
                className="text-sm font-semibold leading-6 text-gray-900 hover:text-green-600"
              >
                View Base URL <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Base URL Section */}
      <div id="base-url" className="bg-gray-50">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Base URL
            </h2>
            <div className="mt-6">
              <div className="bg-gray-900 text-white p-4 rounded-lg font-mono text-sm">
                https://api.accubooks.com/v1
              </div>
            </div>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              All API requests should be made to this base URL. Authentication is required for all endpoints.
            </p>
          </div>
        </div>
      </div>

      {/* API Sections */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              API Reference
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Explore our comprehensive API documentation organized by functionality.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid max-w-xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-2 xl:grid-cols-3">
              {apiSections.map((section) => (
                <div key={section.title} className="flex flex-col">
                  <div className="flex items-center mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600">
                      <section.icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    <h3 className="ml-3 text-lg font-semibold text-gray-900">
                      {section.title}
                    </h3>
                  </div>
                  <p className="flex-auto text-base leading-7 text-gray-600 mb-6">
                    {section.description}
                  </p>
                  <Link
                    href={section.href}
                    className="text-sm font-semibold leading-6 text-green-600 hover:text-green-500 flex items-center"
                  >
                    Learn more
                    <ChevronRightIcon className="ml-1 h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Code Example */}
      <div className="bg-gray-900">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Quick Start Example
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Here's a simple example of how to authenticate and make your first API call.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-2xl">
            <div className="bg-gray-800 rounded-lg p-6 overflow-x-auto">
              <pre className="text-sm text-gray-300">
                <code>{`// 1. Authenticate and get JWT token
const response = await fetch('https://api.accubooks.com/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'your-email@example.com',
    password: 'your-password'
  })
});

const { token } = await response.json();

// 2. Use token for authenticated requests
const companies = await fetch('https://api.accubooks.com/v1/companies', {
  headers: {
    'Authorization': \`Bearer \${token}\`,
    'Content-Type': 'application/json'
  }
});

const data = await companies.json();
console.log(data);`}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* SDKs and Libraries */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              SDKs and Libraries
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Speed up your integration with our official SDKs and community libraries.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid max-w-xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
              <div className="rounded-lg border border-gray-200 p-8">
                <h3 className="text-lg font-semibold text-gray-900">JavaScript SDK</h3>
                <p className="mt-4 text-base text-gray-600">
                  Official Node.js and browser SDK with TypeScript support.
                </p>
                <Link
                  href="https://github.com/accubooks/accubooks-js"
                  className="mt-6 text-sm font-semibold leading-6 text-green-600 hover:text-green-500"
                >
                  View on GitHub <span aria-hidden="true">→</span>
                </Link>
              </div>

              <div className="rounded-lg border border-gray-200 p-8">
                <h3 className="text-lg font-semibold text-gray-900">Python SDK</h3>
                <p className="mt-4 text-base text-gray-600">
                  Python library for easy integration with Django and Flask apps.
                </p>
                <Link
                  href="https://github.com/accubooks/accubooks-python"
                  className="mt-6 text-sm font-semibold leading-6 text-green-600 hover:text-green-500"
                >
                  View on GitHub <span aria-hidden="true">→</span>
                </Link>
              </div>

              <div className="rounded-lg border border-gray-200 p-8">
                <h3 className="text-lg font-semibold text-gray-900">PHP SDK</h3>
                <p className="mt-4 text-base text-gray-600">
                  PHP library for Laravel, WordPress, and custom applications.
                </p>
                <Link
                  href="https://github.com/accubooks/accubooks-php"
                  className="mt-6 text-sm font-semibold leading-6 text-green-600 hover:text-green-500"
                >
                  View on GitHub <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Support Section */}
      <div className="bg-gray-50">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Need Help?
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Our developer support team is here to help you with your integration.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/support"
                className="rounded-md bg-gray-900 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
              >
                Contact Support
              </Link>
              <Link
                href="https://github.com/accubooks/api-examples"
                className="text-sm font-semibold leading-6 text-gray-900 hover:text-green-600"
              >
                View Examples <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
