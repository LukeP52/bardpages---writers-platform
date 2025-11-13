import { Excerpt, Tag, Storyboard, Book, Category, TagCategoryMapping } from '@/types'

// Helper function to get user-specific or guest storage keys
export function getStorageKey(key: string, userId?: string): string {
  if (userId) {
    return `bardpages_user_${userId}_${key}`
  }
  return `bardpages_guest_${key}`
}

class InMemoryStorage {
  private excerpts: Map<string, Excerpt> = new Map()
  private tags: Map<string, Tag> = new Map()
  private storyboards: Map<string, Storyboard> = new Map()
  private books: Map<string, Book> = new Map()
  private premadeTags: Set<string> = new Set()
  private categories: Map<string, Category> = new Map()
  private tagCategoryMappings: Map<string, string[]> = new Map() // tagName -> categoryIds
  private isInitialized = false
  private userId?: string

  constructor(userId?: string) {
    this.userId = userId
  }

  private initializeFromLocalStorage() {
    if (this.isInitialized || typeof window === 'undefined') return
    
    try {
      // Load excerpts
      const excerpts = localStorage.getItem(getStorageKey('excerpts', this.userId))
      if (excerpts) {
        const parsedExcerpts = JSON.parse(excerpts)
        parsedExcerpts.forEach((excerpt: any) => {
          this.excerpts.set(excerpt.id, {
            ...excerpt,
            createdAt: new Date(excerpt.createdAt),
            updatedAt: new Date(excerpt.updatedAt)
          })
        })
      }

      // Load storyboards
      const storyboards = localStorage.getItem(getStorageKey('storyboards', this.userId))
      if (storyboards) {
        const parsedStoryboards = JSON.parse(storyboards)
        parsedStoryboards.forEach((storyboard: any) => {
          this.storyboards.set(storyboard.id, {
            ...storyboard,
            createdAt: new Date(storyboard.createdAt),
            updatedAt: new Date(storyboard.updatedAt)
          })
        })
      }

      // Load books
      const books = localStorage.getItem(getStorageKey('books', this.userId))
      if (books) {
        const parsedBooks = JSON.parse(books)
        parsedBooks.forEach((book: any) => {
          this.books.set(book.id, {
            ...book,
            createdAt: new Date(book.createdAt),
            updatedAt: new Date(book.updatedAt)
          })
        })
      }

      // Load premade tags
      const premadeTags = localStorage.getItem(getStorageKey('premade_tags', this.userId))
      if (premadeTags) {
        const parsedTags = JSON.parse(premadeTags)
        this.premadeTags = new Set(parsedTags)
      }

      // Load categories
      const categories = localStorage.getItem(getStorageKey('categories', this.userId))
      if (categories) {
        const parsedCategories = JSON.parse(categories)
        parsedCategories.forEach((category: any) => {
          this.categories.set(category.id, {
            ...category,
            createdAt: new Date(category.createdAt)
          })
        })
      }

      // Load tag-category mappings
      const tagMappings = localStorage.getItem(getStorageKey('tag_mappings', this.userId))
      if (tagMappings) {
        const parsedMappings = JSON.parse(tagMappings)
        // Handle both old single-category format and new multi-category format
        parsedMappings.forEach(([tagName, categories]: [string, string | string[]]) => {
          if (typeof categories === 'string') {
            // Legacy single category - convert to array
            this.tagCategoryMappings.set(tagName, [categories])
          } else {
            // New multi-category format
            this.tagCategoryMappings.set(tagName, categories)
          }
        })
      }

      // No default categories - users start with clean slate

      this.isInitialized = true
    } catch (error) {
      console.error('Error loading from localStorage:', error)
    }
  }

  private saveToLocalStorage() {
    if (typeof window === 'undefined') return

    try {
      const excerptKey = getStorageKey('excerpts', this.userId)
      const excerptData = Array.from(this.excerpts.values())
      
      console.log(`💾 Saving ${excerptData.length} excerpts to localStorage with key: ${excerptKey}`)
      localStorage.setItem(excerptKey, JSON.stringify(excerptData))
      
      // Verify it was saved
      const verification = localStorage.getItem(excerptKey)
      if (verification) {
        console.log(`✅ localStorage verification successful - ${JSON.parse(verification).length} excerpts saved`)
      } else {
        console.error(`❌ localStorage verification failed - NO DATA FOUND`)
      }
      
      // Save other data
      localStorage.setItem(getStorageKey('storyboards', this.userId), JSON.stringify(Array.from(this.storyboards.values())))
      localStorage.setItem(getStorageKey('books', this.userId), JSON.stringify(Array.from(this.books.values())))
      localStorage.setItem(getStorageKey('premade_tags', this.userId), JSON.stringify(Array.from(this.premadeTags)))
      localStorage.setItem(getStorageKey('categories', this.userId), JSON.stringify(Array.from(this.categories.values())))
      localStorage.setItem(getStorageKey('tag_mappings', this.userId), JSON.stringify(Array.from(this.tagCategoryMappings.entries())))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }

  // Excerpts
  getExcerpts(): Excerpt[] {
    this.initializeFromLocalStorage()
    return Array.from(this.excerpts.values()).sort((a, b) => 
      b.updatedAt.getTime() - a.updatedAt.getTime()
    )
  }

  getExcerpt(id: string): Excerpt | null {
    this.initializeFromLocalStorage()
    const existing = this.excerpts.get(id)
    if (existing) {
      return existing
    }

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(getStorageKey('excerpts', this.userId))
        if (stored) {
          const parsedExcerpts = JSON.parse(stored)
          parsedExcerpts.forEach((excerpt: any) => {
            this.excerpts.set(excerpt.id, {
              ...excerpt,
              createdAt: new Date(excerpt.createdAt),
              updatedAt: new Date(excerpt.updatedAt),
            })
          })
          const found = this.excerpts.get(id)
          return found || null
        }
      } catch (error) {
        console.error('Error loading excerpt from localStorage:', error)
      }
    }

    return null
  }

  saveExcerpt(excerpt: Excerpt): void {
    this.initializeFromLocalStorage()
    
    console.log('Storage saveExcerpt called for:', excerpt.id, excerpt.title)
    console.log('Current excerpts count before save:', this.excerpts.size)
    
    // Add any new tags from this excerpt to the premade tags (unified tag system)
    excerpt.tags.forEach(tag => {
      if (tag.trim()) {
        this.premadeTags.add(tag.trim())
      }
    })
    
    this.excerpts.set(excerpt.id, excerpt)
    console.log('Current excerpts count after save:', this.excerpts.size)
    
    this.saveToLocalStorage()
    
    // Verify it's in localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('bardpages_excerpts')
      if (stored) {
        const parsed = JSON.parse(stored)
        console.log('localStorage verification - total excerpts:', parsed.length)
        const found = parsed.find((e: any) => e.id === excerpt.id)
        console.log('localStorage verification - excerpt found:', found ? 'YES' : 'NO')
      } else {
        console.error('localStorage verification - NO DATA FOUND')
      }
    }
  }

  deleteExcerpt(id: string): void {
    this.initializeFromLocalStorage()
    this.excerpts.delete(id)
    this.saveToLocalStorage()
  }

  getExcerptsByTag(tagName: string): Excerpt[] {
    return this.getExcerpts().filter(excerpt => 
      excerpt.tags.includes(tagName)
    )
  }

  // Tags
  getTags(): Tag[] {
    return Array.from(this.tags.values()).sort((a, b) => a.name.localeCompare(b.name))
  }

  getTag(id: string): Tag | undefined {
    return this.tags.get(id)
  }

  saveTag(tag: Tag): void {
    this.tags.set(tag.id, tag)
  }

  deleteTag(id: string): boolean {
    return this.tags.delete(id)
  }

  getUsedTags(): string[] {
    const usedTags = new Set<string>()
    this.getExcerpts().forEach(excerpt => {
      excerpt.tags.forEach(tag => usedTags.add(tag))
    })
    return Array.from(usedTags).sort()
  }


  getUsedAuthors(): string[] {
    const usedAuthors = new Set<string>()
    this.getExcerpts().forEach(excerpt => {
      if (excerpt.author) usedAuthors.add(excerpt.author)
    })
    return Array.from(usedAuthors).sort()
  }

  searchExcerpts(query: string): Excerpt[] {
    const searchTerm = query.toLowerCase()
    return this.getExcerpts().filter(excerpt => 
      excerpt.title.toLowerCase().includes(searchTerm) ||
      excerpt.content.toLowerCase().includes(searchTerm) ||
      excerpt.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
      excerpt.author?.toLowerCase().includes(searchTerm)
    )
  }

  filterExcerpts(filters: {
    tags?: string[]
    status?: string[]
    authors?: string[]
    dateFrom?: Date
    dateTo?: Date
    search?: string
  }): Excerpt[] {
    let results = this.getExcerpts()

    if (filters.search) {
      results = this.searchExcerpts(filters.search)
    }

    if (filters.tags && filters.tags.length > 0) {
      results = results.filter(excerpt => 
        filters.tags!.some(tag => excerpt.tags.includes(tag))
      )
    }

    if (filters.status && filters.status.length > 0) {
      results = results.filter(excerpt => 
        filters.status!.includes(excerpt.status)
      )
    }

    if (filters.authors && filters.authors.length > 0) {
      results = results.filter(excerpt => 
        excerpt.author && filters.authors!.includes(excerpt.author)
      )
    }

    if (filters.dateFrom) {
      results = results.filter(excerpt => 
        excerpt.createdAt >= filters.dateFrom!
      )
    }

    if (filters.dateTo) {
      results = results.filter(excerpt => 
        excerpt.createdAt <= filters.dateTo!
      )
    }

    return results
  }

  // Storyboards
  getStoryboards(): Storyboard[] {
    this.initializeFromLocalStorage()
    return Array.from(this.storyboards.values()).sort((a, b) => 
      b.updatedAt.getTime() - a.updatedAt.getTime()
    )
  }

  getStoryboard(id: string): Storyboard | undefined {
    this.initializeFromLocalStorage()
    return this.storyboards.get(id)
  }

  saveStoryboard(storyboard: Storyboard): void {
    this.initializeFromLocalStorage()
    this.storyboards.set(storyboard.id, storyboard)
    this.saveToLocalStorage()
  }

  deleteStoryboard(id: string): void {
    this.initializeFromLocalStorage()
    this.storyboards.delete(id)
    this.saveToLocalStorage()
  }

  // Books
  getBooks(): Book[] {
    this.initializeFromLocalStorage()
    return Array.from(this.books.values()).sort((a, b) => 
      b.updatedAt.getTime() - a.updatedAt.getTime()
    )
  }

  getBook(id: string): Book | undefined {
    this.initializeFromLocalStorage()
    return this.books.get(id)
  }

  saveBook(book: Book): void {
    this.initializeFromLocalStorage()
    this.books.set(book.id, book)
    this.saveToLocalStorage()
  }

  deleteBook(id: string): boolean {
    this.initializeFromLocalStorage()
    const result = this.books.delete(id)
    this.saveToLocalStorage()
    return result
  }


  // Premade Tags
  getPremadeTags(): string[] {
    this.initializeFromLocalStorage()
    return Array.from(this.premadeTags).sort()
  }

  addPremadeTag(tag: string): void {
    this.initializeFromLocalStorage()
    if (tag.trim()) {
      this.premadeTags.add(tag.trim())
      this.saveToLocalStorage()
    }
  }

  deletePremadeTag(tag: string): boolean {
    this.initializeFromLocalStorage()
    const result = this.premadeTags.delete(tag)
    this.saveToLocalStorage()
    return result
  }
  
  // Complete tag deletion - removes from premade tags and category mappings
  deleteTagCompletely(tag: string): boolean {
    this.initializeFromLocalStorage()
    
    // Remove from premade tags
    const deletedFromPremade = this.premadeTags.delete(tag)
    
    // Remove from tag-category mappings
    const deletedFromMappings = this.tagCategoryMappings.delete(tag)
    
    this.saveToLocalStorage()
    return deletedFromPremade || deletedFromMappings
  }

  getAllTags(): string[] {
    // In the unified system, all tags are stored in premadeTags
    return this.getPremadeTags()
  }

  clearPremadeTags(): void {
    this.initializeFromLocalStorage()
    this.premadeTags.clear()
    this.saveToLocalStorage()
  }

  // Helper function to get writer-focused category suggestions
  getWriterCategorySuggestions(): Array<{ name: string; description: string; color: string }> {
    return [
      { name: 'Characters', description: 'Character development, personalities, backstories', color: '#3B82F6' },
      { name: 'Plot & Structure', description: 'Story arcs, plot points, narrative structure', color: '#10B981' },
      { name: 'World Building', description: 'Settings, environments, fictional worlds', color: '#EF4444' },
      { name: 'Themes & Motifs', description: 'Central themes, recurring motifs, symbolism', color: '#8B5CF6' },
      { name: 'Dialogue & Voice', description: 'Character voices, dialogue snippets, tone', color: '#F59E0B' },
      { name: 'Research Notes', description: 'Background research, fact-checking, references', color: '#EC4899' },
      { name: 'Inspiration', description: 'Ideas, observations, creative sparks', color: '#06B6D4' },
      { name: 'Genre Elements', description: 'Genre-specific tropes, conventions, elements', color: '#84CC16' },
      { name: 'Emotions & Mood', description: 'Emotional beats, atmosphere, mood setting', color: '#F97316' },
      { name: 'Draft Notes', description: 'Work in progress, revisions, editing notes', color: '#6B7280' }
    ]
  }

  getCategories(): Category[] {
    this.initializeFromLocalStorage()
    return Array.from(this.categories.values()).sort((a, b) => a.name.localeCompare(b.name))
  }

  getCategory(id: string): Category | null {
    this.initializeFromLocalStorage()
    const category = this.categories.get(id)
    return category || null
  }

  saveCategory(category: Category): void {
    this.initializeFromLocalStorage()
    this.categories.set(category.id, category)
    this.saveToLocalStorage()
  }

  deleteCategory(id: string): void {
    this.initializeFromLocalStorage()
    // Remove this category from all tag mappings
    this.tagCategoryMappings.forEach((categoryIds, tagName) => {
      const filteredIds = categoryIds.filter(catId => catId !== id)
      if (filteredIds.length > 0) {
        this.tagCategoryMappings.set(tagName, filteredIds)
      } else {
        // If no categories left, move to "Other" category
        const otherCategory = Array.from(this.categories.values()).find(cat => cat.name === 'Other')
        if (otherCategory) {
          this.tagCategoryMappings.set(tagName, [otherCategory.id])
        }
      }
    })
    
    this.categories.delete(id)
    this.saveToLocalStorage()
  }

  // Tag-Category mappings
  assignTagToCategories(tagName: string, categoryIds: string[]): void {
    this.initializeFromLocalStorage()
    this.tagCategoryMappings.set(tagName, categoryIds)
    this.saveToLocalStorage()
  }

  assignTagToCategory(tagName: string, categoryId: string): void {
    this.initializeFromLocalStorage()
    const existingCategories = this.tagCategoryMappings.get(tagName) || []
    if (!existingCategories.includes(categoryId)) {
      this.tagCategoryMappings.set(tagName, [...existingCategories, categoryId])
      this.saveToLocalStorage()
    }
  }

  getTagCategories(tagName: string): Category[] {
    this.initializeFromLocalStorage()
    const categoryIds = this.tagCategoryMappings.get(tagName) || []
    return categoryIds.map(id => this.categories.get(id)).filter(cat => cat !== undefined) as Category[]
  }

  getTagCategory(tagName: string): Category | undefined {
    this.initializeFromLocalStorage()
    const categories = this.getTagCategories(tagName)
    return categories[0] // Return first category for backward compatibility
  }

  getTagsByCategory(): Map<string, string[]> {
    this.initializeFromLocalStorage()
    const result = new Map<string, string[]>()
    
    // Initialize all categories with empty arrays
    this.categories.forEach(category => {
      result.set(category.id, [])
    })
    
    // Group tags by category (tags can appear in multiple categories)
    this.tagCategoryMappings.forEach((categoryIds, tagName) => {
      categoryIds.forEach(categoryId => {
        const categoryTags = result.get(categoryId) || []
        if (!categoryTags.includes(tagName)) {
          categoryTags.push(tagName)
          result.set(categoryId, categoryTags)
        }
      })
    })
    
    // Add uncategorized tags to "Other" category
    const otherCategory = Array.from(this.categories.values()).find(cat => cat.name === 'Other')
    if (otherCategory) {
      const categorizedTags = new Set(this.tagCategoryMappings.keys())
      const allTags = this.getAllTags()
      const uncategorizedTags = allTags.filter(tag => !categorizedTags.has(tag))
      
      const otherTags = result.get(otherCategory.id) || []
      result.set(otherCategory.id, [...otherTags, ...uncategorizedTags])
    }
    
    return result
  }

  // Enhanced tag creation with category assignment
  addPremadeTagWithCategory(tag: string, categoryId?: string): void {
    this.initializeFromLocalStorage()
    if (tag.trim()) {
      const trimmedTag = tag.trim()
      this.premadeTags.add(trimmedTag)
      
      if (categoryId) {
        this.assignTagToCategory(trimmedTag, categoryId)
      }
      
      this.saveToLocalStorage()
    }
  }

  addPremadeTagWithCategories(tag: string, categoryIds: string[]): void {
    this.initializeFromLocalStorage()
    if (tag.trim()) {
      const trimmedTag = tag.trim()
      this.premadeTags.add(trimmedTag)
      
      if (categoryIds.length > 0) {
        this.assignTagToCategories(trimmedTag, categoryIds)
      }
      
      this.saveToLocalStorage()
    }
  }
}

// Create storage instances
export function createStorage(userId?: string) {
  return new InMemoryStorage(userId)
}

// Default guest storage for backwards compatibility
export const storage = new InMemoryStorage()