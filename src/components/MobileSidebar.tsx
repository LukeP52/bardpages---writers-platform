'use client'

import { Fragment, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Dialog, Transition } from '@headlessui/react'
import { 
  DocumentTextIcon, 
  BookOpenIcon, 
  FilmIcon, 
  HomeIcon,
  PlusIcon,
  UserCircleIcon,
  TagIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthAction } from '@/hooks/useAuthAction'
import AuthModal from '@/components/auth/AuthModal'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

const navigationItems = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Category Manager', href: '/categories', icon: TagIcon },
  { name: 'Excerpts', href: '/excerpts', icon: DocumentTextIcon },
  { name: 'Storyboards', href: '/storyboards', icon: FilmIcon },
  { name: 'Books', href: '/books', icon: BookOpenIcon },
]

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { checkAuthAndProceed, showAuthModal, closeAuthModal } = useAuthAction()
  const [showAuthModalLocal, setShowAuthModalLocal] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Signed out successfully')
      onClose()
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/80" />
        </Transition.Child>

        <div className="fixed inset-0 flex">
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2">
                <div className="flex h-16 shrink-0 items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <BookOpenIcon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-semibold text-gray-900">Bard Pages</span>
                  </div>
                  <button
                    type="button"
                    className="-m-2.5 p-2.5 text-gray-700"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <nav className="flex flex-1 flex-col">
                  <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul role="list" className="-mx-2 space-y-1">
                        {navigationItems.map((item) => {
                          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                          const Icon = item.icon
                          
                          return (
                            <li key={item.name}>
                              <Link
                                href={item.href}
                                onClick={onClose}
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
                            </li>
                          )
                        })}
                      </ul>
                    </li>

                    <li className="mt-6 border-t border-gray-200 pt-6">
                      <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        Quick Actions
                      </p>
                      <Link
                        href="/excerpts/new"
                        onClick={onClose}
                        className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                      >
                        <PlusIcon className="w-5 h-5 text-gray-400" />
                        <span>New Excerpt</span>
                      </Link>
                    </li>

                    <li className="mt-auto">
                      {user ? (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-gray-50">
                            <UserCircleIcon className="w-8 h-8 text-blue-600" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {user.displayName || 'User'}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            </div>
                          </div>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                          >
                            <ArrowRightOnRectangleIcon className="w-5 h-5 text-gray-400" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setShowAuthModalLocal(true)
                            onClose()
                          }}
                          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          <UserCircleIcon className="w-5 h-5 text-blue-600" />
                          <span>Sign In</span>
                        </button>
                      )}
                    </li>
                  </ul>
                </nav>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
      
      <AuthModal 
        isOpen={showAuthModal || showAuthModalLocal}
        onClose={() => {
          closeAuthModal()
          setShowAuthModalLocal(false)
        }}
      />
    </Transition.Root>
  )
}