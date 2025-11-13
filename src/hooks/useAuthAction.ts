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

  // Auto-migrate guest data when user signs in
  const handleGuestDataMigration = useCallback(async () => {
    if (user && !hasTriggeredMigration && checkForGuestData()) {
      try {
        console.log('Found guest data, migrating to user account...')
        await migrateGuestData()
        setHasTriggeredMigration(true)
        console.log('Guest data migration completed successfully!')
      } catch (error) {
        console.error('Failed to migrate guest data:', error)
      }
    }
  }, [user, hasTriggeredMigration, checkForGuestData, migrateGuestData])

  // Trigger migration when user signs in
  useEffect(() => {
    if (user && !hasTriggeredMigration) {
      handleGuestDataMigration()
    }
  }, [user, handleGuestDataMigration, hasTriggeredMigration])

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
    isAuthenticated: !!user,
    handleGuestDataMigration
  }
}