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
      if (user && !hasTriggeredMigration && checkForGuestData()) {
        try {
          console.log('🔄 useAuthAction: Found guest data, migrating to user account...')
          setHasTriggeredMigration(true) // Set flag immediately to prevent multiple calls
          await migrateGuestData()
          console.log('✅ useAuthAction: Guest data migration completed successfully!')
        } catch (error) {
          console.error('❌ useAuthAction: Failed to migrate guest data:', error)
          setHasTriggeredMigration(false) // Reset on error so user can retry
        }
      }
    }

    if (user && !hasTriggeredMigration) {
      handleGuestDataMigration()
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