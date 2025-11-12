'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export function useAuthAction() {
  const { user } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  const checkAuthAndProceed = (requireAuth: boolean = true) => {
    if (requireAuth && !user) {
      setShowAuthModal(true)
      return false // User needs to authenticate
    }
    
    return true // User can proceed
  }

  const closeAuthModal = () => {
    setShowAuthModal(false)
  }

  return {
    checkAuthAndProceed,
    showAuthModal,
    closeAuthModal,
    isAuthenticated: !!user
  }
}