import type { Metadata } from 'next'
import ResponsiveLayout from '@/components/ResponsiveLayout'
import { AuthProvider } from '@/contexts/AuthContext'
import { StorageProvider } from '@/contexts/StorageContext'
import './globals.css'
import 'quill/dist/quill.snow.css'

export const metadata: Metadata = {
  title: 'Bard Pages - Writers Platform',
  description: 'A comprehensive platform for writers to manage excerpts, create storyboards, and publish books',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-gray-50 font-inter">
        <AuthProvider>
          <StorageProvider>
            <ResponsiveLayout>
              {children}
            </ResponsiveLayout>
          </StorageProvider>
        </AuthProvider>
      </body>
    </html>
  )
}