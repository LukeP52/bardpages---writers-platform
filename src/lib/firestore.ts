'use client'

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  Timestamp,
  QuerySnapshot,
  DocumentSnapshot
} from 'firebase/firestore'
import { User } from 'firebase/auth'
import { db, isConfigured } from '@/lib/firebase'
import { SIZE_LIMITS, formatFileSize } from '@/lib/constants'
import { Excerpt, Storyboard, Category } from '@/types'

// Utility function to convert Firestore timestamps to JavaScript dates
const convertTimestamps = (data: any) => {
  if (!data) return data
  
  const converted = { ...data }
  
  // Convert Firestore Timestamps to Date objects
  if (converted.createdAt?.toDate) {
    converted.createdAt = converted.createdAt.toDate()
  }
  if (converted.updatedAt?.toDate) {
    converted.updatedAt = converted.updatedAt.toDate()
  }
  
  return converted
}

// Utility function to convert Date objects to Firestore timestamps for storage
const prepareForStorage = (data: any) => {
  if (!data) return data
  
  const prepared = { ...data }
  
  // Convert Date objects to Firestore Timestamps
  if (prepared.createdAt instanceof Date) {
    prepared.createdAt = Timestamp.fromDate(prepared.createdAt)
  }
  if (prepared.updatedAt instanceof Date) {
    prepared.updatedAt = Timestamp.fromDate(prepared.updatedAt)
  }
  
  return prepared
}

export class FirestoreService {
  private userId: string
  
  constructor(user: User) {
    this.userId = user.uid
  }

  // Check if Firestore is available
  private checkAvailability() {
    if (!isConfigured) {
      throw new Error('Firebase is not configured')
    }
  }

  // EXCERPT OPERATIONS
  async saveExcerpt(excerpt: Excerpt): Promise<void> {
    this.checkAvailability()
    
    // Check content size before saving (Firestore has 1MB limit per document)
    const contentSize = new Blob([excerpt.content]).size
    
    if (contentSize > SIZE_LIMITS.MAX_EXCERPT_CONTENT_SIZE) {
      throw new Error(`Excerpt content is too large for cloud storage (${formatFileSize(contentSize)}). Maximum allowed: ${formatFileSize(SIZE_LIMITS.MAX_EXCERPT_CONTENT_SIZE)}.`)
    }
    
    const excerptRef = doc(db, 'users', this.userId, 'excerpts', excerpt.id)
    const excerptData = prepareForStorage(excerpt)
    
    await setDoc(excerptRef, excerptData)
  }

  async getExcerpt(id: string): Promise<Excerpt | null> {
    this.checkAvailability()
    
    const excerptRef = doc(db, 'users', this.userId, 'excerpts', id)
    const excerptDoc = await getDoc(excerptRef)
    
    if (!excerptDoc.exists()) {
      return null
    }
    
    return convertTimestamps(excerptDoc.data()) as Excerpt
  }

  async getExcerpts(): Promise<Excerpt[]> {
    this.checkAvailability()
    
    const excerptsRef = collection(db, 'users', this.userId, 'excerpts')
    const q = query(excerptsRef, orderBy('updatedAt', 'desc'))
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => 
      convertTimestamps(doc.data()) as Excerpt
    )
  }

  async deleteExcerpt(id: string): Promise<void> {
    this.checkAvailability()
    
    const excerptRef = doc(db, 'users', this.userId, 'excerpts', id)
    await deleteDoc(excerptRef)
  }

  async filterExcerpts(filters: {
    tags?: string[]
    status?: string[]
    authors?: string[]
    dateFrom?: Date
    dateTo?: Date
    search?: string
  }): Promise<Excerpt[]> {
    this.checkAvailability()
    
    // Start with all excerpts and filter client-side for complex queries
    // Firestore has limitations on complex queries, so we'll fetch and filter
    const excerpts = await this.getExcerpts()
    
    return excerpts.filter(excerpt => {
      // Tag filter
      if (filters.tags && filters.tags.length > 0) {
        if (!filters.tags.some(tag => excerpt.tags.includes(tag))) {
          return false
        }
      }
      
      // Status filter
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(excerpt.status)) {
          return false
        }
      }
      
      // Author filter
      if (filters.authors && filters.authors.length > 0) {
        if (!excerpt.author || !filters.authors.includes(excerpt.author)) {
          return false
        }
      }
      
      // Date range filter
      if (filters.dateFrom && excerpt.createdAt < filters.dateFrom) {
        return false
      }
      if (filters.dateTo && excerpt.createdAt > filters.dateTo) {
        return false
      }
      
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const searchableText = [
          excerpt.title,
          excerpt.content,
          excerpt.author,
          ...excerpt.tags
        ].join(' ').toLowerCase()
        
        if (!searchableText.includes(searchTerm)) {
          return false
        }
      }
      
      return true
    })
  }

  // TAG OPERATIONS
  async getAllTags(): Promise<string[]> {
    this.checkAvailability()
    
    const excerpts = await this.getExcerpts()
    const tagSet = new Set<string>()
    
    excerpts.forEach(excerpt => {
      excerpt.tags.forEach(tag => tagSet.add(tag))
    })
    
    return Array.from(tagSet).sort()
  }

  async getUsedTags(): Promise<string[]> {
    return this.getAllTags() // Same as getAllTags for now
  }

  async getUsedAuthors(): Promise<string[]> {
    this.checkAvailability()
    
    const excerpts = await this.getExcerpts()
    const authorSet = new Set<string>()
    
    excerpts.forEach(excerpt => {
      if (excerpt.author) {
        authorSet.add(excerpt.author)
      }
    })
    
    return Array.from(authorSet).sort()
  }

  // CATEGORY OPERATIONS
  async saveCategory(category: Category): Promise<void> {
    this.checkAvailability()
    
    const categoryRef = doc(db, 'users', this.userId, 'categories', category.id)
    await setDoc(categoryRef, category)
  }

  async getCategories(): Promise<Category[]> {
    this.checkAvailability()
    
    const categoriesRef = collection(db, 'users', this.userId, 'categories')
    const querySnapshot = await getDocs(categoriesRef)
    
    return querySnapshot.docs.map(doc => doc.data() as Category)
  }

  async getCategory(id: string): Promise<Category | null> {
    this.checkAvailability()
    
    const categoryRef = doc(db, 'users', this.userId, 'categories', id)
    const categoryDoc = await getDoc(categoryRef)
    
    if (!categoryDoc.exists()) {
      return null
    }
    
    return categoryDoc.data() as Category
  }

  async deleteCategory(id: string): Promise<void> {
    this.checkAvailability()
    
    const categoryRef = doc(db, 'users', this.userId, 'categories', id)
    await deleteDoc(categoryRef)
  }

  // TAG-CATEGORY MAPPING OPERATIONS
  async addPremadeTagWithCategories(tagName: string, categoryIds: string[]): Promise<void> {
    this.checkAvailability()
    
    const tagRef = doc(db, 'users', this.userId, 'tagCategories', tagName)
    await setDoc(tagRef, {
      tagName,
      categoryIds,
      createdAt: Timestamp.now()
    })
  }

  async getTagCategories(tagName: string): Promise<Category[]> {
    this.checkAvailability()
    
    const tagRef = doc(db, 'users', this.userId, 'tagCategories', tagName)
    const tagDoc = await getDoc(tagRef)
    
    if (!tagDoc.exists()) {
      return []
    }
    
    const { categoryIds } = tagDoc.data()
    const categories: Category[] = []
    
    for (const categoryId of categoryIds) {
      const category = await this.getCategory(categoryId)
      if (category) {
        categories.push(category)
      }
    }
    
    return categories
  }

  // STORYBOARD OPERATIONS
  async saveStoryboard(storyboard: Storyboard): Promise<void> {
    this.checkAvailability()
    
    const storyboardRef = doc(db, 'users', this.userId, 'storyboards', storyboard.id)
    const storyboardData = prepareForStorage(storyboard)
    
    await setDoc(storyboardRef, storyboardData)
  }

  async getStoryboards(): Promise<Storyboard[]> {
    this.checkAvailability()
    
    const storyboardsRef = collection(db, 'users', this.userId, 'storyboards')
    const q = query(storyboardsRef, orderBy('updatedAt', 'desc'))
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => 
      convertTimestamps(doc.data()) as Storyboard
    )
  }

  async deleteStoryboard(id: string): Promise<void> {
    this.checkAvailability()
    
    const storyboardRef = doc(db, 'users', this.userId, 'storyboards', id)
    await deleteDoc(storyboardRef)
  }

  // REAL-TIME LISTENERS (optional - for live updates)
  onExcerptsChange(callback: (excerpts: Excerpt[]) => void): () => void {
    this.checkAvailability()
    
    const excerptsRef = collection(db, 'users', this.userId, 'excerpts')
    const q = query(excerptsRef, orderBy('updatedAt', 'desc'))
    
    return onSnapshot(q, (querySnapshot) => {
      const excerpts = querySnapshot.docs.map(doc => 
        convertTimestamps(doc.data()) as Excerpt
      )
      callback(excerpts)
    })
  }

  // MIGRATION HELPER - Move data from localStorage to Firestore
  async migrateFromLocalStorage(localStorageData: {
    excerpts?: Excerpt[]
    categories?: Category[]
    storyboards?: Storyboard[]
    tagCategories?: any[]
  }): Promise<void> {
    this.checkAvailability()
    
    const batch = writeBatch(db)
    
    // Migrate excerpts
    if (localStorageData.excerpts) {
      for (const excerpt of localStorageData.excerpts) {
        const excerptRef = doc(db, 'users', this.userId, 'excerpts', excerpt.id)
        batch.set(excerptRef, prepareForStorage(excerpt))
      }
    }
    
    // Migrate categories
    if (localStorageData.categories) {
      for (const category of localStorageData.categories) {
        const categoryRef = doc(db, 'users', this.userId, 'categories', category.id)
        batch.set(categoryRef, category)
      }
    }
    
    // Migrate storyboards
    if (localStorageData.storyboards) {
      for (const storyboard of localStorageData.storyboards) {
        const storyboardRef = doc(db, 'users', this.userId, 'storyboards', storyboard.id)
        batch.set(storyboardRef, prepareForStorage(storyboard))
      }
    }
    
    // Migrate tag-category mappings
    if (localStorageData.tagCategories) {
      for (const tagCategory of localStorageData.tagCategories) {
        const tagRef = doc(db, 'users', this.userId, 'tagCategories', tagCategory.tagName)
        batch.set(tagRef, tagCategory)
      }
    }
    
    await batch.commit()
  }
}

// Factory function to create Firestore service instance
export const createFirestoreService = (user: User | null): FirestoreService | null => {
  if (!user) return null
  return new FirestoreService(user)
}