import { Excerpt, Tag, Storyboard, Book, Reference, Citation, Category, TagCategoryMapping } from '@/types'

class InMemoryStorage {
  private excerpts: Map<string, Excerpt> = new Map()
  private tags: Map<string, Tag> = new Map()
  private storyboards: Map<string, Storyboard> = new Map()
  private books: Map<string, Book> = new Map()
  private premadeTags: Set<string> = new Set()
  private categories: Map<string, Category> = new Map()
  private tagCategoryMappings: Map<string, string[]> = new Map() // tagName -> categoryIds
  private isInitialized = false

  private initializeFromLocalStorage() {
    if (this.isInitialized || typeof window === 'undefined') return
    
    try {
      // Load excerpts
      const excerpts = localStorage.getItem('bardpages_excerpts')
      if (excerpts) {
        const parsedExcerpts = JSON.parse(excerpts)
        parsedExcerpts.forEach((excerpt: any) => {
          this.excerpts.set(excerpt.id, {
            ...excerpt,
            references: excerpt.references || [],
            citations: excerpt.citations || [],
            createdAt: new Date(excerpt.createdAt),
            updatedAt: new Date(excerpt.updatedAt)
          })
        })
      }

      // Load storyboards
      const storyboards = localStorage.getItem('bardpages_storyboards')
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
      const books = localStorage.getItem('bardpages_books')
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
      const premadeTags = localStorage.getItem('bardpages_premade_tags')
      if (premadeTags) {
        const parsedTags = JSON.parse(premadeTags)
        this.premadeTags = new Set(parsedTags)
      }

      // Load categories
      const categories = localStorage.getItem('bardpages_categories')
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
      const tagMappings = localStorage.getItem('bardpages_tag_mappings')
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

      // Initialize default categories if none exist
      if (this.categories.size === 0) {
        this.initializeDefaultCategories()
      }

      this.isInitialized = true
    } catch (error) {
      console.error('Error loading from localStorage:', error)
    }
  }

  private saveToLocalStorage() {
    if (typeof window === 'undefined') return

    try {
      // Save excerpts
      localStorage.setItem('bardpages_excerpts', JSON.stringify(Array.from(this.excerpts.values())))
      
      // Save storyboards
      localStorage.setItem('bardpages_storyboards', JSON.stringify(Array.from(this.storyboards.values())))
      
      // Save books
      localStorage.setItem('bardpages_books', JSON.stringify(Array.from(this.books.values())))
      
      // Save premade tags
      localStorage.setItem('bardpages_premade_tags', JSON.stringify(Array.from(this.premadeTags)))
      
      // Save categories
      localStorage.setItem('bardpages_categories', JSON.stringify(Array.from(this.categories.values())))
      
      // Save tag-category mappings
      localStorage.setItem('bardpages_tag_mappings', JSON.stringify(Array.from(this.tagCategoryMappings.entries())))
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
        const stored = localStorage.getItem('bardpages_excerpts')
        if (stored) {
          const parsedExcerpts = JSON.parse(stored)
          parsedExcerpts.forEach((excerpt: any) => {
            this.excerpts.set(excerpt.id, {
              ...excerpt,
              references: excerpt.references || [],
              citations: excerpt.citations || [],
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

  getAllTags(): string[] {
    // In the unified system, all tags are stored in premadeTags
    return this.getPremadeTags()
  }

  clearPremadeTags(): void {
    this.initializeFromLocalStorage()
    this.premadeTags.clear()
    this.saveToLocalStorage()
  }

  // Categories
  private initializeDefaultCategories(): void {
    const defaultCategories = [
      { name: 'Dates & Eras', color: '#3B82F6', description: 'Historical periods, centuries, years' },
      { name: 'Geography & Regions', color: '#10B981', description: 'Places, countries, cities, regions' },
      { name: 'Wars & Military', color: '#EF4444', description: 'Battles, conflicts, military history' },
      { name: 'Politics & Government', color: '#8B5CF6', description: 'Political systems, leaders, governance' },
      { name: 'Religion & Philosophy', color: '#F59E0B', description: 'Religious themes, philosophical concepts' },
      { name: 'Culture & Society', color: '#EC4899', description: 'Social customs, traditions, cultural aspects' },
      { name: 'Economics & Trade', color: '#06B6D4', description: 'Commerce, economics, trade relations' },
      { name: 'Science & Technology', color: '#84CC16', description: 'Scientific discoveries, technological advances' },
      { name: 'People & Biography', color: '#F97316', description: 'Historical figures, biographical information' },
      { name: 'Other', color: '#6B7280', description: 'Uncategorized tags' }
    ]

    defaultCategories.forEach((cat, index) => {
      const category: Category = {
        id: `default-${index + 1}`,
        name: cat.name,
        description: cat.description,
        color: cat.color,
        createdAt: new Date()
      }
      this.categories.set(category.id, category)
    })
    
    this.saveToLocalStorage()
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

export const storage = new InMemoryStorage()