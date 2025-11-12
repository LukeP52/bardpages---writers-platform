'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { User } from 'firebase/auth'
import { useAuth } from '@/contexts/AuthContext'
import { FirestoreService, createFirestoreService } from '@/lib/firestore'
import { storage as localStorage } from '@/lib/storage'
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
    if (user) {
      const service = createFirestoreService(user)
      setFirestoreService(service)
      setIsUsingCloud(true)
    } else {
      setFirestoreService(null)
      setIsUsingCloud(false)
    }
  }, [user])

  // Auto-migrate data from localStorage to Firestore when user signs in
  const migrateToCloud = useCallback(async () => {
    if (!firestoreService || migrationCompleted) return
    
    try {
      setIsLoading(true)
      
      // Get data from localStorage
      const localExcerpts = localStorage.getExcerpts()
      const localCategories = localStorage.getCategories()
      const localStoryboards = localStorage.getStoryboards()
      
      // Check if there's any local data to migrate
      if (localExcerpts.length === 0 && localCategories.length === 0 && localStoryboards.length === 0) {
        setMigrationCompleted(true)
        return
      }
      
      // Migrate to Firestore
      await firestoreService.migrateFromLocalStorage({
        excerpts: localExcerpts,
        categories: localCategories,
        storyboards: localStoryboards
      })
      
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
      if (isUsingCloud && firestoreService) {
        return await cloudMethod(...args)
      } else {
        // For localStorage, wrap synchronous methods in Promise.resolve
        const result = localMethod(...args)
        return result instanceof Promise ? result : Promise.resolve(result)
      }
    }
  }

  const contextValue: StorageContextType = {
    // Excerpt operations
    saveExcerpt: createStorageMethod(
      (excerpt: Excerpt) => localStorage.saveExcerpt(excerpt),
      (excerpt: Excerpt) => firestoreService!.saveExcerpt(excerpt)
    ),
    
    getExcerpt: createStorageMethod(
      (id: string) => localStorage.getExcerpt(id),
      (id: string) => firestoreService!.getExcerpt(id)
    ),
    
    getExcerpts: createStorageMethod(
      () => localStorage.getExcerpts(),
      () => firestoreService!.getExcerpts()
    ),
    
    deleteExcerpt: createStorageMethod(
      (id: string) => localStorage.deleteExcerpt(id),
      (id: string) => firestoreService!.deleteExcerpt(id)
    ),
    
    filterExcerpts: createStorageMethod(
      (filters: any) => localStorage.filterExcerpts(filters),
      (filters: any) => firestoreService!.filterExcerpts(filters)
    ),
    
    // Tag operations
    getAllTags: createStorageMethod(
      () => localStorage.getAllTags(),
      () => firestoreService!.getAllTags()
    ),
    
    getUsedTags: createStorageMethod(
      () => localStorage.getUsedTags(),
      () => firestoreService!.getUsedTags()
    ),
    
    getUsedAuthors: createStorageMethod(
      () => localStorage.getUsedAuthors(),
      () => firestoreService!.getUsedAuthors()
    ),
    
    // Category operations
    saveCategory: createStorageMethod(
      (category: Category) => localStorage.saveCategory(category),
      (category: Category) => firestoreService!.saveCategory(category)
    ),
    
    getCategories: createStorageMethod(
      () => localStorage.getCategories(),
      () => firestoreService!.getCategories()
    ),
    
    getCategory: createStorageMethod(
      (id: string) => localStorage.getCategory(id),
      (id: string) => firestoreService!.getCategory(id)
    ),
    
    deleteCategory: createStorageMethod(
      (id: string) => localStorage.deleteCategory(id),
      (id: string) => firestoreService!.deleteCategory(id)
    ),
    
    addPremadeTagWithCategories: createStorageMethod(
      (tagName: string, categoryIds: string[]) => localStorage.addPremadeTagWithCategories(tagName, categoryIds),
      (tagName: string, categoryIds: string[]) => firestoreService!.addPremadeTagWithCategories(tagName, categoryIds)
    ),
    
    getTagCategories: createStorageMethod(
      (tagName: string) => localStorage.getTagCategories(tagName),
      (tagName: string) => firestoreService!.getTagCategories(tagName)
    ),
    
    // Storyboard operations
    saveStoryboard: createStorageMethod(
      (storyboard: Storyboard) => localStorage.saveStoryboard(storyboard),
      (storyboard: Storyboard) => firestoreService!.saveStoryboard(storyboard)
    ),
    
    getStoryboards: createStorageMethod(
      () => localStorage.getStoryboards(),
      () => firestoreService!.getStoryboards()
    ),
    
    deleteStoryboard: createStorageMethod(
      (id: string) => localStorage.deleteStoryboard(id),
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