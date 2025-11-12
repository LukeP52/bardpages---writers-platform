'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export function useAuthAction() {
  const { user } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  const checkAuthAndProceed = (requireAuth: boolean = true) => {
    console.log('Debug: checkAuthAndProceed called, user:', user ? 'authenticated' : 'not authenticated')
    
    if (requireAuth && !user) {
      console.log('Debug: User not authenticated, showing modal')
      setShowAuthModal(true)
      return false // User needs to authenticate
    }
    
    console.log('Debug: User authenticated, can proceed')
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