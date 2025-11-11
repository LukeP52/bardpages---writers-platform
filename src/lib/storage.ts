import { Excerpt, Tag, Storyboard, Book } from '@/types'

class InMemoryStorage {
  private excerpts: Map<string, Excerpt> = new Map()
  private tags: Map<string, Tag> = new Map()
  private storyboards: Map<string, Storyboard> = new Map()
  private books: Map<string, Book> = new Map()
  private premadeTags: Set<string> = new Set()
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

  getExcerpt(id: string): Excerpt | undefined {
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
              createdAt: new Date(excerpt.createdAt),
              updatedAt: new Date(excerpt.updatedAt),
            })
          })
          return this.excerpts.get(id)
        }
      } catch (error) {
        console.error('Error loading excerpt from localStorage:', error)
      }
    }

    return undefined
  }

  saveExcerpt(excerpt: Excerpt): void {
    this.initializeFromLocalStorage()
    
    console.log('Storage saveExcerpt called for:', excerpt.id, excerpt.title)
    console.log('Current excerpts count before save:', this.excerpts.size)
    
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

  deleteExcerpt(id: string): boolean {
    this.initializeFromLocalStorage()
    const result = this.excerpts.delete(id)
    this.saveToLocalStorage()
    return result
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

  deleteStoryboard(id: string): boolean {
    this.initializeFromLocalStorage()
    const result = this.storyboards.delete(id)
    this.saveToLocalStorage()
    return result
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
    const usedTags = this.getUsedTags()
    const premadeTags = this.getPremadeTags()
    const allTags = new Set([...usedTags, ...premadeTags])
    return Array.from(allTags).sort()
  }

  clearPremadeTags(): void {
    this.initializeFromLocalStorage()
    this.premadeTags.clear()
    this.saveToLocalStorage()
  }
}

export const storage = new InMemoryStorage()