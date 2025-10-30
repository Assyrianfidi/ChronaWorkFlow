import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from './components/Navigation'
import Footer from './components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'AccuBooks Documentation',
  description: 'Complete documentation for AccuBooks accounting software - API reference, user guides, and developer resources.',
  keywords: 'accounting software, documentation, API, user guide, bookkeeping',
  authors: [{ name: 'AccuBooks Team' }],
  openGraph: {
    title: 'AccuBooks Documentation',
    description: 'Complete documentation for AccuBooks accounting software',
    url: 'https://docs.accubooks.com',
    siteName: 'AccuBooks Docs',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AccuBooks Documentation',
    description: 'Complete documentation for AccuBooks accounting software',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href="https://docs.accubooks.com" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${inter.className} bg-white text-gray-900`}>
        <Navigation />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
