import type { Metadata } from 'next'
import Navigation from '@/components/Navigation'
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
      <body className="antialiased bg-gray-50">
        <Navigation />
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}