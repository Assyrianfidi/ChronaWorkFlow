import Link from 'next/link'
import { CheckIcon } from '@heroicons/react/24/outline'

const tiers = [
  {
    name: 'Free',
    id: 'tier-free',
    href: '/signup?plan=free',
    price: { monthly: '$0', annually: '$0' },
    description: 'Perfect for getting started with basic accounting needs.',
    features: [
      'Up to 3 users',
      'Basic invoicing',
      'Expense tracking',
      'Financial reports',
      'Email support',
    ],
    limitations: [
      'Limited to 100 transactions/month',
      'No payroll features',
      'Basic reporting only',
    ],
  },
  {
    name: 'Standard',
    id: 'tier-standard',
    href: '/signup?plan=standard',
    price: { monthly: '$29', annually: '$290' },
    description: 'Ideal for growing businesses with advanced accounting needs.',
    features: [
      'Up to 10 users',
      'Advanced invoicing & payments',
      'Bank reconciliation',
      'Advanced reporting',
      'Priority support',
      'API access',
    ],
    highlighted: false,
  },
  {
    name: 'Enterprise',
    id: 'tier-enterprise',
    href: '/signup?plan=enterprise',
    price: { monthly: '$99', annually: '$990' },
    description: 'Complete accounting solution for large organizations.',
    features: [
      'Unlimited users',
      'Advanced payroll',
      'Inventory management',
      'Multi-company support',
      'Custom integrations',
      'Dedicated support',
      'Advanced analytics',
    ],
    highlighted: true,
  },
]

export default function Pricing() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Choose the plan that works for your business. All plans include our core accounting features.
          </p>
        </div>

        {/* Pricing Toggle */}
        <div className="mt-16 flex justify-center">
          <div className="relative">
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button className="relative rounded-md bg-white px-6 py-2 text-sm font-medium text-gray-900 shadow-sm">
                Monthly
              </button>
              <button className="ml-1 rounded-md px-6 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">
                Annually
                <span className="ml-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <div className="grid max-w-xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className={`${
                  tier.highlighted
                    ? 'ring-2 ring-blue-600'
                    : 'ring-1 ring-gray-200'
                } rounded-3xl p-8`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold leading-8 text-gray-900">
                    {tier.name}
                  </h3>
                  {tier.highlighted && (
                    <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white">
                      Most popular
                    </span>
                  )}
                </div>

                <p className="mt-4 text-sm leading-6 text-gray-600">
                  {tier.description}
                </p>

                <div className="mt-6 flex items-baseline gap-x-2">
                  <span className="text-5xl font-bold tracking-tight text-gray-900">
                    {tier.price.monthly}
                  </span>
                  <span className="text-sm font-semibold leading-6 text-gray-600">
                    /month
                  </span>
                </div>

                <Link
                  href={tier.href}
                  className={`mt-6 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    tier.highlighted
                      ? 'bg-blue-600 text-white hover:bg-blue-500 focus-visible:outline-blue-600'
                      : 'bg-gray-900 text-white hover:bg-gray-700 focus-visible:outline-gray-900'
                  }`}
                >
                  {tier.name === 'Free' ? 'Get started' : 'Start free trial'}
                </Link>

                <ul className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <CheckIcon className="h-6 w-6 flex-none text-green-600" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                  {tier.limitations?.map((limitation) => (
                    <li key={limitation} className="flex gap-x-3 text-gray-500">
                      <span className="h-6 w-6 flex-none">•</span>
                      {limitation}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-gray-600">
            All plans include our standard features. Need something custom?
            <Link href="/contact" className="font-semibold text-blue-600 hover:text-blue-500">
              {' '}Contact sales
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
