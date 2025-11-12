'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export function useAuthAction() {
  const { user } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  const executeWithAuth = (action: () => void, requireAuth: boolean = true) => {
    if (requireAuth && !user) {
      setShowAuthModal(true)
      return false // Action was not executed
    }
    
    action()
    return true // Action was executed
  }

  const closeAuthModal = () => {
    setShowAuthModal(false)
  }

  return {
    executeWithAuth,
    showAuthModal,
    closeAuthModal,
    isAuthenticated: !!user
  }
}