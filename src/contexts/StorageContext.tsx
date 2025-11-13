'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { User } from 'firebase/auth'
import { useAuth } from '@/contexts/AuthContext'
import { FirestoreService, createFirestoreService } from '@/lib/firestore'
import { storage as localStorageService, createStorage } from '@/lib/storage'
import { SIZE_LIMITS, formatFileSize } from '@/lib/constants'
import { Excerpt, Storyboard, Category } from '@/types'

interface StorageContextType {
  // Excerpt operations
  saveExcerpt: (excerpt: Excerpt) => Promise<void>
  getExcerpt: (id: string) => Promise<Excerpt | null>
  getExcerpts: () => Promise<Excerpt[]>
  deleteExcerpt: (id: string) => Promise<void>
  filterExcerpts: (filters: any) => Promise<Excerpt[]>
  
  // Tag operations
  getAllTags: () => Promise<string[]>
  getUsedTags: () => Promise<string[]>
  getUsedAuthors: () => Promise<string[]>
  
  // Category operations
  saveCategory: (category: Category) => Promise<void>
  getCategories: () => Promise<Category[]>
  getCategory: (id: string) => Promise<Category | null>
  deleteCategory: (id: string) => Promise<void>
  addPremadeTagWithCategories: (tagName: string, categoryIds: string[]) => Promise<void>
  getTagCategories: (tagName: string) => Promise<Category[]>
  getWriterCategorySuggestions: () => Array<{ name: string; description: string; color: string }>
  
  // Storyboard operations
  saveStoryboard: (storyboard: Storyboard) => Promise<void>
  getStoryboards: () => Promise<Storyboard[]>
  deleteStoryboard: (id: string) => Promise<void>
  
  // Migration
  migrateToCloud: () => Promise<void>
  
  // Guest migration
  checkForGuestData: () => boolean
  migrateGuestData: () => Promise<void>
  
  // State
  isUsingCloud: boolean
  isLoading: boolean
}

const StorageContext = createContext<StorageContextType | undefined>(undefined)

export const StorageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [firestoreService, setFirestoreService] = useState<FirestoreService | null>(null)
  const [isUsingCloud, setIsUsingCloud] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [migrationCompleted, setMigrationCompleted] = useState(false)
  const [currentLocalStorage, setCurrentLocalStorage] = useState(localStorageService)

  // Initialize Firestore service and user-specific storage when user signs in
  useEffect(() => {
    if (user) {
      const service = createFirestoreService(user)
      setFirestoreService(service)
      setIsUsingCloud(true)
      // Create user-specific local storage
      setCurrentLocalStorage(createStorage(user.uid))
    } else {
      setFirestoreService(null)
      setIsUsingCloud(false)
      // Use guest storage for signed-out users
      setCurrentLocalStorage(createStorage())
    }
    // Reset migration when user changes
    setMigrationCompleted(false)
  }, [user])

  // Auto-migrate data from localStorage to Firestore when user signs in
  const migrateToCloud = useCallback(async () => {
    if (!firestoreService || migrationCompleted) {
      return
    }
    
    try {
      setIsLoading(true)
      
      // First check if user already has cloud data - if so, don't migrate
      const existingCloudExcerpts = await firestoreService.getExcerpts()
      if (existingCloudExcerpts.length > 0) {
        // User already has cloud data, skip migration and clear localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('bardpages_excerpts')
          localStorage.removeItem('bardpages_storyboards')
          localStorage.removeItem('bardpages_categories')
          localStorage.removeItem('bardpages_premade_tags')
          localStorage.removeItem('bardpages_tag_mappings')
        }
        setMigrationCompleted(true)
        return
      }
      
      // Get data from guest storage (user might have data from when they were signed out)
      const guestStorage = createStorage()
      const localExcerpts = guestStorage.getExcerpts()
      const localCategories = guestStorage.getCategories()
      const localStoryboards = guestStorage.getStoryboards()
      
      // Check if there's any local data to migrate
      if (localExcerpts.length === 0 && localCategories.length === 0 && localStoryboards.length === 0) {
        setMigrationCompleted(true)
        return
      }
      
      // Filter out excerpts with content too large for Firestore
      const validExcerpts = localExcerpts.filter(excerpt => {
        const contentSize = new Blob([excerpt.content]).size
        return contentSize <= SIZE_LIMITS.MAX_EXCERPT_CONTENT_SIZE
      })
      
      const skippedCount = localExcerpts.length - validExcerpts.length
      if (skippedCount > 0) {
        console.warn(`${skippedCount} excerpts were too large to migrate to cloud storage`)
      }
      
      // Migrate to Firestore
      await firestoreService.migrateFromLocalStorage({
        excerpts: validExcerpts,
        categories: localCategories,
        storyboards: localStoryboards
      })
      
      // Clear localStorage after successful migration to prevent re-migration
      if (typeof window !== 'undefined') {
        localStorage.removeItem('bardpages_excerpts')
        localStorage.removeItem('bardpages_storyboards')
        localStorage.removeItem('bardpages_categories')
        localStorage.removeItem('bardpages_premade_tags')
        localStorage.removeItem('bardpages_tag_mappings')
      }
      
      console.log(`Migrated ${validExcerpts.length} excerpts and ${localCategories.length} categories to cloud storage!`)
      setMigrationCompleted(true)
      
    } catch (error) {
      console.error('Migration failed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [firestoreService, migrationCompleted])

  // Auto-migrate when Firestore service is ready
  useEffect(() => {
    if (firestoreService && !migrationCompleted) {
      migrateToCloud()
    }
  }, [firestoreService, migrateToCloud, migrationCompleted])

  // Guest data migration functions
  const checkForGuestData = useCallback(() => {
    if (typeof window === 'undefined') return false
    
    const guestStorage = createStorage()
    const guestExcerpts = guestStorage.getExcerpts()
    const guestCategories = guestStorage.getCategories()
    const guestStoryboards = guestStorage.getStoryboards()
    
    return guestExcerpts.length > 0 || guestCategories.length > 0 || guestStoryboards.length > 0
  }, [])

  const migrateGuestData = useCallback(async () => {
    console.log('🟡 MIGRATION: migrateGuestData called')
    
    if (!user || !isUsingCloud || !firestoreService) {
      console.log('🟡 MIGRATION: Cannot migrate - user/cloud/firestore not available')
      return
    }

    // Add flag to prevent multiple concurrent migrations
    if (isLoading) {
      console.log('🟡 MIGRATION: Already in progress, skipping')
      return
    }

    const guestStorage = createStorage()
    const guestExcerpts = guestStorage.getExcerpts()
    const guestCategories = guestStorage.getCategories()
    const guestStoryboards = guestStorage.getStoryboards()

    console.log('🟡 MIGRATION: Found guest data:', {
      excerpts: guestExcerpts.length,
      excerptIds: guestExcerpts.map(e => e.id)
    })

    // If no guest data, don't migrate
    if (guestExcerpts.length === 0 && guestCategories.length === 0 && guestStoryboards.length === 0) {
      console.log('🟡 MIGRATION: No guest data to migrate')
      return
    }

    try {
      setIsLoading(true)
      console.log(`🟡 MIGRATION: Starting migration of ${guestExcerpts.length} excerpts`)
      
      // Migrate excerpts to the user's cloud storage
      for (const excerpt of guestExcerpts) {
        console.log('🟡 MIGRATION: Saving excerpt to Firestore:', excerpt.id)
        await firestoreService.saveExcerpt(excerpt)
        console.log('🟡 MIGRATION: Saved to Firestore, now clearing from guest storage')
        
        // Immediately clear each guest excerpt after successful migration
        try {
          guestStorage.deleteExcerpt(excerpt.id)
          console.log('🟡 MIGRATION: Cleared from guest storage:', excerpt.id)
        } catch (error) {
          console.warn(`🟡 MIGRATION: Could not clear guest excerpt ${excerpt.id}:`, error)
        }
      }

      // Migrate categories
      for (const category of guestCategories) {
        await firestoreService.saveCategory(category)
        console.log(`Migrated category: ${category.name}`)
      }

      // Migrate storyboards  
      for (const storyboard of guestStoryboards) {
        await firestoreService.saveStoryboard(storyboard)
        console.log(`Migrated storyboard: ${storyboard.title}`)
      }

      // Clear guest data after successful migration
      if (typeof window !== 'undefined') {
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key?.startsWith('bardpages_guest_')) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))
        console.log('Cleared guest data from localStorage')
      }

      console.log(`✅ Migration completed: ${guestExcerpts.length} excerpts, ${guestCategories.length} categories, and ${guestStoryboards.length} storyboards`)
      
    } catch (error) {
      console.error('Failed to migrate guest data:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [user, isUsingCloud, firestoreService, isLoading])

  // Create wrapper functions that route to appropriate storage
  const createStorageMethod = <T extends any[], R>(
    localMethodName: string,
    cloudMethod: (...args: T) => Promise<R>
  ) => {
    return async (...args: T): Promise<R> => {
      if (isUsingCloud && firestoreService) {
        return await cloudMethod(...args)
      } else {
        // For localStorage, wrap synchronous methods in Promise.resolve
        const localMethod = (currentLocalStorage as any)[localMethodName]
        const result = localMethod.apply(currentLocalStorage, args)
        return result instanceof Promise ? result : Promise.resolve(result)
      }
    }
  }

  const contextValue: StorageContextType = {
    // Excerpt operations
    saveExcerpt: createStorageMethod(
      'saveExcerpt',
      (excerpt: Excerpt) => firestoreService!.saveExcerpt(excerpt)
    ),
    
    getExcerpt: createStorageMethod(
      'getExcerpt',
      (id: string) => firestoreService!.getExcerpt(id)
    ),
    
    getExcerpts: createStorageMethod(
      'getExcerpts',
      () => firestoreService!.getExcerpts()
    ),
    
    deleteExcerpt: createStorageMethod(
      'deleteExcerpt',
      (id: string) => firestoreService!.deleteExcerpt(id)
    ),
    
    filterExcerpts: createStorageMethod(
      'filterExcerpts',
      (filters: any) => firestoreService!.filterExcerpts(filters)
    ),
    
    // Tag operations
    getAllTags: createStorageMethod(
      'getAllTags',
      () => firestoreService!.getAllTags()
    ),
    
    getUsedTags: createStorageMethod(
      'getUsedTags',
      () => firestoreService!.getUsedTags()
    ),
    
    getUsedAuthors: createStorageMethod(
      'getUsedAuthors',
      () => firestoreService!.getUsedAuthors()
    ),
    
    // Category operations
    saveCategory: createStorageMethod(
      'saveCategory',
      (category: Category) => firestoreService!.saveCategory(category)
    ),
    
    getCategories: createStorageMethod(
      'getCategories',
      () => firestoreService!.getCategories()
    ),
    
    getCategory: createStorageMethod(
      'getCategory',
      (id: string) => firestoreService!.getCategory(id)
    ),
    
    deleteCategory: createStorageMethod(
      'deleteCategory',
      (id: string) => firestoreService!.deleteCategory(id)
    ),
    
    addPremadeTagWithCategories: createStorageMethod(
      'addPremadeTagWithCategories',
      (tagName: string, categoryIds: string[]) => firestoreService!.addPremadeTagWithCategories(tagName, categoryIds)
    ),
    
    getTagCategories: createStorageMethod(
      'getTagCategories',
      (tagName: string) => firestoreService!.getTagCategories(tagName)
    ),
    
    getWriterCategorySuggestions: () => currentLocalStorage.getWriterCategorySuggestions(),
    
    // Storyboard operations
    saveStoryboard: createStorageMethod(
      'saveStoryboard',
      (storyboard: Storyboard) => firestoreService!.saveStoryboard(storyboard)
    ),
    
    getStoryboards: createStorageMethod(
      'getStoryboards',
      () => firestoreService!.getStoryboards()
    ),
    
    deleteStoryboard: createStorageMethod(
      'deleteStoryboard',
      (id: string) => firestoreService!.deleteStoryboard(id)
    ),
    
    // Migration
    migrateToCloud,
    
    // Guest migration
    checkForGuestData,
    migrateGuestData,
    
    // State
    isUsingCloud,
    isLoading
  }

  return (
    <StorageContext.Provider value={contextValue}>
      {children}
    </StorageContext.Provider>
  )
}

export const useStorage = () => {
  const context = useContext(StorageContext)
  if (context === undefined) {
    throw new Error('useStorage must be used within a StorageProvider')
  }
  return context
}