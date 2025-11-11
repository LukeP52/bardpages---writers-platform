'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigationItems = [
  { name: 'Excerpts', href: '/excerpts' },
  { name: 'Storyboards', href: '/storyboards' },
  { name: 'Books', href: '/books' },
]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-white border-b-2 border-black">
      <div className="container">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-12">
            <Link href="/" className="text-2xl font-bold text-black tracking-tight">
              BARD PAGES
            </Link>
            <div className="hidden md:flex items-center space-x-0">
              {navigationItems.map((item) => {
                const isActive = pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`nav-link ${isActive ? 'active' : ''}`}
                  >
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/excerpts/new" className="btn btn-primary">
              New Excerpt
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}