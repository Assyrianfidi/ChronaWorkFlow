import Link from 'next/link'
import { ChevronRightIcon, BookOpenIcon, CodeBracketIcon, UserGroupIcon, ChartBarIcon } from '@heroicons/react/24/outline'

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-blue-400 to-purple-600 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>

        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              AccuBooks
              <span className="block text-blue-600">Documentation</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Everything you need to integrate with and use AccuBooks accounting software.
              From API references to user guides, find the information you need to get started.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/api"
                className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                View API Docs
              </Link>
              <Link
                href="/guides/getting-started"
                className="text-sm font-semibold leading-6 text-gray-900 hover:text-blue-600"
              >
                Getting Started <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Sections */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to know
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Comprehensive documentation covering all aspects of AccuBooks, from basic usage to advanced integrations.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
              <div className="flex flex-col">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                    <BookOpenIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  User Guides
                </dt>
                <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Step-by-step guides for accountants and business owners to make the most of AccuBooks.
                  </p>
                  <p className="mt-6">
                    <Link href="/guides" className="text-sm font-semibold leading-6 text-blue-600 hover:text-blue-500">
                      Browse guides <span aria-hidden="true">→</span>
                    </Link>
                  </p>
                </dd>
              </div>

              <div className="flex flex-col">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                    <CodeBracketIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  API Reference
                </dt>
                <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Complete API documentation for developers integrating with AccuBooks.
                  </p>
                  <p className="mt-6">
                    <Link href="/api" className="text-sm font-semibold leading-6 text-blue-600 hover:text-blue-500">
                      View API docs <span aria-hidden="true">→</span>
                    </Link>
                  </p>
                </dd>
              </div>

              <div className="flex flex-col">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                    <UserGroupIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  Support
                </dt>
                <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Get help from our support team and community resources.
                  </p>
                  <p className="mt-6">
                    <Link href="/support" className="text-sm font-semibold leading-6 text-blue-600 hover:text-blue-500">
                      Get support <span aria-hidden="true">→</span>
                    </Link>
                  </p>
                </dd>
              </div>

              <div className="flex flex-col">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                    <ChartBarIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  Integrations
                </dt>
                <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Connect AccuBooks with your favorite business tools and services.
                  </p>
                  <p className="mt-6">
                    <Link href="/integrations" className="text-sm font-semibold leading-6 text-blue-600 hover:text-blue-500">
                      View integrations <span aria-hidden="true">→</span>
                    </Link>
                  </p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Quick Start Section */}
      <div className="bg-gray-50">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Ready to get started?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600">
              Join thousands of businesses already using AccuBooks for their accounting needs.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="https://accubooks.com/signup"
                className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Start Free Trial
              </Link>
              <Link
                href="/guides/getting-started"
                className="text-sm font-semibold leading-6 text-gray-900 hover:text-blue-600"
              >
                View Getting Started Guide <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Search Documentation
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Can't find what you're looking for? Use our search to quickly find the information you need.
            </p>
            <div className="mt-10">
              <form action="/search" method="GET" className="mx-auto max-w-md">
                <div className="relative">
                  <input
                    type="search"
                    name="q"
                    className="block w-full rounded-md border-0 py-3 pl-4 pr-12 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    placeholder="Search documentation..."
                  />
                  <button
                    type="submit"
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    <ChevronRightIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
