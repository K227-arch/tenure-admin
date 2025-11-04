import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Admin Dashboard - Membership Management System',
  description: 'Comprehensive admin dashboard for managing memberships, financial reports, payouts, and member engagement',
  authors: [{ name: 'Lovable' }],
  openGraph: {
    title: 'Admin Dashboard - Membership Management System',
    description: 'Comprehensive admin dashboard for managing memberships, financial reports, payouts, and member engagement',
    type: 'website',
    images: ['https://lovable.dev/opengraph-image-p98pqg.png'],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@lovable_dev',
    images: ['https://lovable.dev/opengraph-image-p98pqg.png'],
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
          {children}
        </Providers>
      </body>
    </html>
  )
}