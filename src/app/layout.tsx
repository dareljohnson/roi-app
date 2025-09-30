import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthHeader from '@/components/AuthHeader'
import Providers from '@/components/Providers'

// Re-enabled next/font now that we are ensuring no custom Babel config; if conflict reappears, clear .next cache.
const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Real Estate Investment ROI Calculator',
  description: 'Calculate ROI, cash flow, and profitability for real estate investment properties',
  keywords: ['real estate', 'investment', 'ROI', 'cash flow', 'property analysis', 'NPV'],
  authors: [{ name: 'Investment Property Calculator Team' }],
  openGraph: {
    title: 'Real Estate Investment ROI Calculator',
    description: 'Professional real estate investment analysis tool',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
  <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <header className="bg-white shadow-sm border-b">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Investment Property Calculator
                    </h1>
                    <p className="text-sm text-gray-600">
                      Professional Real Estate ROI Analysis
                    </p>
                  </div>
                  <AuthHeader />
                </div>
              </div>
            </header>
            
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            
            <footer className="bg-white border-t mt-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center text-sm text-gray-600">
                  <p>© 2025 Real Estate Investment ROI Calculator. All rights reserved. </p>
                  <p className="mt-2">
                    Calculate ROI • Cash Flow Analysis • Investment Recommendations
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  )
}