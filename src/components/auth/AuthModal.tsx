'use client'

import { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import LoginForm from './LoginForm'
import SignupForm from './SignupForm'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  if (!isOpen) return null

  const handleToggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login')
  }

  const handleSuccess = () => {
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-lg border border-gray-300 w-full max-w-md mx-auto my-4 max-h-[calc(100vh-2rem)] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 -m-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4">
          {mode === 'login' ? (
            <LoginForm 
              onToggleMode={handleToggleMode}
              onSuccess={handleSuccess}
            />
          ) : (
            <SignupForm 
              onToggleMode={handleToggleMode}
              onSuccess={handleSuccess}
            />
          )}
        </div>
      </div>
    </div>
  )
}