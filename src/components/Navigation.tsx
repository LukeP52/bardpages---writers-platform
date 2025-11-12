'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import AuthModal from '@/components/auth/AuthModal'
import { UserCircleIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

const navigationItems = [
  { name: 'Excerpts', href: '/excerpts' },
  { name: 'Storyboards', href: '/storyboards' },
  { name: 'Books', href: '/books' },
]

export default function Navigation() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      console.log('Signed out successfully')
      setShowUserMenu(false)
    } catch (error) {
      console.error('Failed to sign out')
    }
  }

  return (
    <nav className="nav">
      <div className="container">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-12">
            <Link href="/" className="text-2xl font-bold text-slate-900 tracking-tight">
              BardPages
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
            {user ? (
              <>
                <Link href="/excerpts/new" className="btn btn-primary">
                  New Excerpt
                </Link>
                
                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <UserCircleIcon className="w-6 h-6" />
                    <span className="text-sm font-medium hidden md:block">
                      {user.displayName || user.email?.split('@')[0]}
                    </span>
                    <ChevronDownIcon className="w-4 h-4" />
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                      <div className="py-1">
                        <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                          <div className="font-medium">{user.displayName || 'User'}</div>
                          <div className="text-gray-500">{user.email}</div>
                        </div>
                        <Link
                          href="/categories"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Manage Tags
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="btn btn-primary"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
      
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </nav>
  )
}