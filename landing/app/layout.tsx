import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from './components/Navigation'
import Hero from './components/Hero'
import Features from './components/Features'
import Pricing from './components/Pricing'
import Testimonials from './components/Testimonials'
import CTA from './components/CTA'
import Footer from './components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'AccuBooks - Enterprise Accounting Made Simple',
  description: 'Professional accounting software for businesses. Manage invoices, payroll, inventory, and financial reporting with ease. Start your free trial today.',
  keywords: 'accounting software, bookkeeping, invoicing, payroll, financial reporting, business management',
  authors: [{ name: 'AccuBooks Team' }],
  openGraph: {
    title: 'AccuBooks - Enterprise Accounting Made Simple',
    description: 'Professional accounting software for businesses. Manage invoices, payroll, inventory, and financial reporting with ease.',
    url: 'https://accubooks.com',
    siteName: 'AccuBooks',
    images: [
      {
        url: 'https://accubooks.com/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AccuBooks Accounting Software',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AccuBooks - Enterprise Accounting Made Simple',
    description: 'Professional accounting software for businesses. Manage invoices, payroll, inventory, and financial reporting with ease.',
    images: ['https://accubooks.com/images/twitter-card.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function HomePage() {
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href="https://accubooks.com" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', 'YOUR_FACEBOOK_PIXEL_ID');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=YOUR_FACEBOOK_PIXEL_ID&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
      </head>
      <body className={`${inter.className} bg-white text-gray-900`}>
        <Navigation />
        <Hero />
        <Features />
        <Pricing />
        <Testimonials />
        <CTA />
        <Footer />
      </body>
    </html>
  )
}
