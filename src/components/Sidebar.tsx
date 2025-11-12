'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  DocumentTextIcon, 
  BookOpenIcon, 
  FilmIcon, 
  HomeIcon,
  TagIcon,
  SparklesIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import AuthModal from '@/components/auth/AuthModal'
import toast from 'react-hot-toast'

const navigationItems = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Categories', href: '/categories', icon: TagIcon },
  { name: 'Excerpts', href: '/excerpts', icon: DocumentTextIcon },
  { name: 'Storyboards', href: '/storyboards', icon: FilmIcon },
  { name: 'Books', href: '/books', icon: BookOpenIcon },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Signed out successfully')
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  return (
    <motion.div 
      className="flex flex-col w-72 bg-white/80 border-r border-slate-200/60"
      style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="flex items-center h-20 px-8 border-b border-slate-200/60">
        <motion.div 
          className="flex items-center space-x-3"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">BardPages</h1>
            <p className="text-xs text-slate-500 font-medium">Writer's Platform</p>
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-6 py-8 space-y-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          
          return (
            <motion.div
              key={item.name}
              whileHover={{ x: 4 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <Link
                href={item.href}
                className={`
                  group flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 shadow-sm border border-blue-200/50' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/80'
                  }
                `}
              >
                <Icon 
                  className={`
                    mr-3 h-5 w-5 transition-colors
                    ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}
                  `} 
                />
                <span className="tracking-wide">{item.name}</span>
                {isActive && (
                  <motion.div
                    className="ml-auto w-2 h-2 bg-blue-600 rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                  />
                )}
              </Link>
            </motion.div>
          )
        })}
      </nav>

      {/* Authentication Section */}
      <div className="p-6 border-t border-slate-200/60">
        {user ? (
          <div className="card p-4 bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200/80">
            <div className="flex items-center space-x-3 mb-3">
              <UserCircleIcon className="w-8 h-8 text-blue-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {user.displayName || 'User'}
                </p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
            <motion.button
              onClick={handleLogout}
              className="btn btn-outline w-full text-xs flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              Sign Out
            </motion.button>
          </div>
        ) : (
          <div className="card p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200/80">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <UserCircleIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Sign In</p>
                <p className="text-xs text-slate-500">Sync your work</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Sign in to save your work and access it from anywhere.
            </p>
            <motion.button
              onClick={() => setShowAuthModal(true)}
              className="btn btn-primary w-full text-xs"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Sign In
            </motion.button>
          </div>
        )}
      </div>
      
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </motion.div>
  )
}