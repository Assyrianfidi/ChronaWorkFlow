'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRightIcon, PlayIcon, CheckIcon } from '@heroicons/react/24/outline'

export default function Hero() {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)

  return (
    <>
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-blue-400 to-purple-600 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>

        <div className="mx-auto max-w-4xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
              Enterprise Accounting
              <span className="block text-blue-600">Made Simple</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
              Professional accounting software for modern businesses. Manage invoices, payroll,
              inventory, and financial reporting with ease. Join thousands of businesses already
              using AccuBooks.
            </p>

            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/signup"
                className="rounded-md bg-blue-600 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
                onClick={() => {
                  if (typeof window !== 'undefined' && (window as any).gtag) {
                    (window as any).gtag('event', 'click', {
                      event_category: 'button',
                      event_label: 'Start Free Trial',
                    });
                  }
                }}
              >
                Start Free Trial
                <ArrowRightIcon className="ml-2 h-5 w-5 inline" aria-hidden="true" />
              </Link>

              <button
                onClick={() => setIsVideoModalOpen(true)}
                className="text-lg font-semibold leading-6 text-gray-900 hover:text-blue-600 transition-colors flex items-center"
              >
                <PlayIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                Watch Demo
              </button>
            </div>

            <div className="mt-12 flex items-center justify-center gap-x-8 text-sm text-gray-600">
              <div className="flex items-center">
                <CheckIcon className="h-4 w-4 text-green-500 mr-2" aria-hidden="true" />
                14-day free trial
              </div>
              <div className="flex items-center">
                <CheckIcon className="h-4 w-4 text-green-500 mr-2" aria-hidden="true" />
                No credit card required
              </div>
              <div className="flex items-center">
                <CheckIcon className="h-4 w-4 text-green-500 mr-2" aria-hidden="true" />
                Cancel anytime
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative max-w-4xl mx-4">
            <button
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="aspect-video bg-gray-900 rounded-lg">
              <iframe
                className="w-full h-full rounded-lg"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                title="AccuBooks Demo Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
