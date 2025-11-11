import { Excerpt, Tag, Storyboard, Book } from '@/types'

class InMemoryStorage {
  private excerpts: Map<string, Excerpt> = new Map()
  private tags: Map<string, Tag> = new Map()
  private storyboards: Map<string, Storyboard> = new Map()
  private books: Map<string, Book> = new Map()

  // Excerpts
  getExcerpts(): Excerpt[] {
    return Array.from(this.excerpts.values()).sort((a, b) => 
      b.updatedAt.getTime() - a.updatedAt.getTime()
    )
  }

  getExcerpt(id: string): Excerpt | undefined {
    return this.excerpts.get(id)
  }

  saveExcerpt(excerpt: Excerpt): void {
    this.excerpts.set(excerpt.id, excerpt)
  }

  deleteExcerpt(id: string): boolean {
    return this.excerpts.delete(id)
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

  getUsedCategories(): string[] {
    const usedCategories = new Set<string>()
    this.getExcerpts().forEach(excerpt => {
      if (excerpt.category) usedCategories.add(excerpt.category)
    })
    return Array.from(usedCategories).sort()
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
      excerpt.author?.toLowerCase().includes(searchTerm) ||
      excerpt.category?.toLowerCase().includes(searchTerm)
    )
  }

  filterExcerpts(filters: {
    tags?: string[]
    status?: string[]
    categories?: string[]
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

    if (filters.categories && filters.categories.length > 0) {
      results = results.filter(excerpt => 
        excerpt.category && filters.categories!.includes(excerpt.category)
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
    return Array.from(this.storyboards.values()).sort((a, b) => 
      b.updatedAt.getTime() - a.updatedAt.getTime()
    )
  }

  getStoryboard(id: string): Storyboard | undefined {
    return this.storyboards.get(id)
  }

  saveStoryboard(storyboard: Storyboard): void {
    this.storyboards.set(storyboard.id, storyboard)
  }

  deleteStoryboard(id: string): boolean {
    return this.storyboards.delete(id)
  }

  // Books
  getBooks(): Book[] {
    return Array.from(this.books.values()).sort((a, b) => 
      b.updatedAt.getTime() - a.updatedAt.getTime()
    )
  }

  getBook(id: string): Book | undefined {
    return this.books.get(id)
  }

  saveBook(book: Book): void {
    this.books.set(book.id, book)
  }

  deleteBook(id: string): boolean {
    return this.books.delete(id)
  }
}

export const storage = new InMemoryStorage()