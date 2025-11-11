'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  DocumentTextIcon, 
  BookOpenIcon, 
  FilmIcon, 
  HomeIcon,
  PlusIcon,
  UserCircleIcon,
  TagIcon
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'

const navigationItems = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Category Manager', href: '/categories', icon: TagIcon },
  { name: 'Excerpts', href: '/excerpts', icon: DocumentTextIcon },
  { name: 'Storyboards', href: '/storyboards', icon: FilmIcon },
  { name: 'Books', href: '/books', icon: BookOpenIcon },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200">
      {/* Header */}
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <BookOpenIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-gray-900">Bard Pages</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          const Icon = item.icon
          
          return (
            <motion.div
              key={item.name}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href={item.href}
                className={`
                  flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
                <span>{item.name}</span>
              </Link>
            </motion.div>
          )
        })}

        {/* Quick Actions */}
        <div className="pt-6 mt-6 border-t border-gray-200">
          <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Quick Actions
          </p>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/excerpts/new"
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              <PlusIcon className="w-5 h-5 text-gray-400" />
              <span>New Excerpt</span>
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
          <UserCircleIcon className="w-8 h-8 text-gray-400" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">Writer</p>
            <p className="text-xs text-gray-500 truncate">writer@bardpages.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}