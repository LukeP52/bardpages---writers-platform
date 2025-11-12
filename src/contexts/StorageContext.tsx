'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { User } from 'firebase/auth'
import { useAuth } from '@/contexts/AuthContext'
import { FirestoreService, createFirestoreService } from '@/lib/firestore'
import { storage as localStorageService } from '@/lib/storage'
import { Excerpt, Storyboard, Category } from '@/types'
import toast from 'react-hot-toast'

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
  
  // Storyboard operations
  saveStoryboard: (storyboard: Storyboard) => Promise<void>
  getStoryboards: () => Promise<Storyboard[]>
  deleteStoryboard: (id: string) => Promise<void>
  
  // Migration
  migrateToCloud: () => Promise<void>
  
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

  // Initialize Firestore service when user signs in
  useEffect(() => {
    console.log('StorageContext: User changed:', user ? `${user.email} (authenticated)` : 'null (not authenticated)')
    
    if (user) {
      console.log('StorageContext: Creating Firestore service for user:', user.uid)
      const service = createFirestoreService(user)
      console.log('StorageContext: Firestore service created:', service ? 'SUCCESS' : 'FAILED')
      setFirestoreService(service)
      setIsUsingCloud(true)
      console.log('StorageContext: Switched to cloud storage mode')
    } else {
      console.log('StorageContext: No user, using localStorage')
      setFirestoreService(null)
      setIsUsingCloud(false)
    }
  }, [user])

  // Auto-migrate data from localStorage to Firestore when user signs in
  const migrateToCloud = useCallback(async () => {
    console.log('MigrateToCloud: Called with firestoreService =', firestoreService ? 'EXISTS' : 'NULL', ', migrationCompleted =', migrationCompleted)
    
    if (!firestoreService || migrationCompleted) {
      console.log('MigrateToCloud: Skipping - no service or already completed')
      return
    }
    
    try {
      console.log('MigrateToCloud: Starting migration process')
      setIsLoading(true)
      
      // Get data from localStorage
      const localExcerpts = localStorageService.getExcerpts()
      const localCategories = localStorageService.getCategories()
      const localStoryboards = localStorageService.getStoryboards()
      
      console.log('MigrateToCloud: Found local data:', localExcerpts.length, 'excerpts,', localCategories.length, 'categories')
      
      // Check if there's any local data to migrate
      if (localExcerpts.length === 0 && localCategories.length === 0 && localStoryboards.length === 0) {
        console.log('MigrateToCloud: No data to migrate')
        setMigrationCompleted(true)
        return
      }
      
      console.log('MigrateToCloud: Migrating to Firestore...')
      // Migrate to Firestore
      await firestoreService.migrateFromLocalStorage({
        excerpts: localExcerpts,
        categories: localCategories,
        storyboards: localStoryboards
      })
      
      console.log('MigrateToCloud: Migration successful!')
      toast.success(`Migrated ${localExcerpts.length} excerpts and ${localCategories.length} categories to cloud storage!`)
      setMigrationCompleted(true)
      
    } catch (error) {
      console.error('Migration failed:', error)
      toast.error('Failed to migrate data to cloud storage')
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

  // Create wrapper functions that route to appropriate storage
  const createStorageMethod = <T extends any[], R>(
    localMethod: (...args: T) => R,
    cloudMethod: (...args: T) => Promise<R>
  ) => {
    return async (...args: T): Promise<R> => {
      console.log('StorageMethod: isUsingCloud =', isUsingCloud, ', firestoreService =', firestoreService ? 'EXISTS' : 'NULL')
      
      if (isUsingCloud && firestoreService) {
        console.log('StorageMethod: Using Firestore for operation')
        return await cloudMethod(...args)
      } else {
        console.log('StorageMethod: Using localStorage for operation')
        // For localStorage, wrap synchronous methods in Promise.resolve
        const result = localMethod(...args)
        return result instanceof Promise ? result : Promise.resolve(result)
      }
    }
  }

  const contextValue: StorageContextType = {
    // Excerpt operations
    saveExcerpt: createStorageMethod(
      (excerpt: Excerpt) => localStorageService.saveExcerpt(excerpt),
      (excerpt: Excerpt) => firestoreService!.saveExcerpt(excerpt)
    ),
    
    getExcerpt: createStorageMethod(
      (id: string) => localStorageService.getExcerpt(id),
      (id: string) => firestoreService!.getExcerpt(id)
    ),
    
    getExcerpts: createStorageMethod(
      () => localStorageService.getExcerpts(),
      () => firestoreService!.getExcerpts()
    ),
    
    deleteExcerpt: createStorageMethod(
      (id: string) => localStorageService.deleteExcerpt(id),
      (id: string) => firestoreService!.deleteExcerpt(id)
    ),
    
    filterExcerpts: createStorageMethod(
      (filters: any) => localStorageService.filterExcerpts(filters),
      (filters: any) => firestoreService!.filterExcerpts(filters)
    ),
    
    // Tag operations
    getAllTags: createStorageMethod(
      () => localStorageService.getAllTags(),
      () => firestoreService!.getAllTags()
    ),
    
    getUsedTags: createStorageMethod(
      () => localStorageService.getUsedTags(),
      () => firestoreService!.getUsedTags()
    ),
    
    getUsedAuthors: createStorageMethod(
      () => localStorageService.getUsedAuthors(),
      () => firestoreService!.getUsedAuthors()
    ),
    
    // Category operations
    saveCategory: createStorageMethod(
      (category: Category) => localStorageService.saveCategory(category),
      (category: Category) => firestoreService!.saveCategory(category)
    ),
    
    getCategories: createStorageMethod(
      () => localStorageService.getCategories(),
      () => firestoreService!.getCategories()
    ),
    
    getCategory: createStorageMethod(
      (id: string) => localStorageService.getCategory(id),
      (id: string) => firestoreService!.getCategory(id)
    ),
    
    deleteCategory: createStorageMethod(
      (id: string) => localStorageService.deleteCategory(id),
      (id: string) => firestoreService!.deleteCategory(id)
    ),
    
    addPremadeTagWithCategories: createStorageMethod(
      (tagName: string, categoryIds: string[]) => localStorageService.addPremadeTagWithCategories(tagName, categoryIds),
      (tagName: string, categoryIds: string[]) => firestoreService!.addPremadeTagWithCategories(tagName, categoryIds)
    ),
    
    getTagCategories: createStorageMethod(
      (tagName: string) => localStorageService.getTagCategories(tagName),
      (tagName: string) => firestoreService!.getTagCategories(tagName)
    ),
    
    // Storyboard operations
    saveStoryboard: createStorageMethod(
      (storyboard: Storyboard) => localStorageService.saveStoryboard(storyboard),
      (storyboard: Storyboard) => firestoreService!.saveStoryboard(storyboard)
    ),
    
    getStoryboards: createStorageMethod(
      () => localStorageService.getStoryboards(),
      () => firestoreService!.getStoryboards()
    ),
    
    deleteStoryboard: createStorageMethod(
      (id: string) => localStorageService.deleteStoryboard(id),
      (id: string) => firestoreService!.deleteStoryboard(id)
    ),
    
    // Migration
    migrateToCloud,
    
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