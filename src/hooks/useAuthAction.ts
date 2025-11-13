'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useStorage } from '@/contexts/StorageContext'

export function useAuthAction() {
  const { user } = useAuth()
  const { checkForGuestData, migrateGuestData } = useStorage()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [hasTriggeredMigration, setHasTriggeredMigration] = useState(false)

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

  // Trigger migration when user signs in
  useEffect(() => {
    const handleGuestDataMigration = async () => {
      console.log('🟠 AUTH TRIGGER: handleGuestDataMigration called', { user: !!user, hasTriggeredMigration })
      
      if (user && !hasTriggeredMigration) {
        const hasData = checkForGuestData()
        console.log('🟠 AUTH TRIGGER: Checking for guest data - found:', hasData)
        
        if (hasData) {
          try {
            console.log('🟠 AUTH TRIGGER: Starting migration process...')
            setHasTriggeredMigration(true) // Set flag immediately to prevent multiple calls
            
            // Add a small delay to ensure storage context is ready
            await new Promise(resolve => setTimeout(resolve, 100))
            await migrateGuestData()
            console.log('🟠 AUTH TRIGGER: Migration completed!')
          } catch (error) {
            console.error('🟠 AUTH TRIGGER: Migration failed:', error)
            setHasTriggeredMigration(false) // Reset on error so user can retry
          }
        }
      }
    }

    if (user && !hasTriggeredMigration) {
      // Add delay to ensure storage context is fully initialized
      const timer = setTimeout(() => {
        handleGuestDataMigration()
      }, 200)
      
      return () => clearTimeout(timer)
    }
  }, [user, hasTriggeredMigration, checkForGuestData, migrateGuestData])

  // Reset migration flag when user changes
  useEffect(() => {
    if (!user) {
      setHasTriggeredMigration(false)
    }
  }, [user])

  return {
    checkAuthAndProceed,
    showAuthModal,
    closeAuthModal,
    isAuthenticated: !!user
  }
}