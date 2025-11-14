'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Book, Storyboard, Excerpt } from '@/types'
import { useStorage } from '@/contexts/StorageContext'
import EmptyState from '@/components/EmptyState'
import { exportBook, downloadFile } from '@/lib/exportUtils'
import { BookOpenIcon } from '@heroicons/react/24/outline'

export default function BooksPage() {
  const storage = useStorage()
  const [storyboards, setStoryboards] = useState<Storyboard[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [excerpts, setExcerpts] = useState<Excerpt[]>([])

  // Utility function to safely format dates (handles both Date objects and Firestore Timestamps)
  const formatDate = (date: any) => {
    try {
      // If it's already a Date object
      if (date instanceof Date) {
        return date.toLocaleDateString()
      }
      // If it's a Firestore Timestamp or other object with seconds
      if (date && typeof date === 'object' && date.seconds) {
        return new Date(date.seconds * 1000).toLocaleDateString()
      }
      // Try to convert to Date as fallback
      return new Date(date).toLocaleDateString()
    } catch (error) {
      console.warn('Failed to format date:', date, error)
      return 'Invalid Date'
    }
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedStoryboards, loadedBooks, loadedExcerpts] = await Promise.all([
          storage.getStoryboards(),
          storage.getBooks(),
          storage.getExcerpts()
        ])
        setStoryboards(loadedStoryboards)
        setBooks(loadedBooks)
        setExcerpts(loadedExcerpts)
        console.log('Loaded books:', loadedBooks)
      } catch (error) {
        console.error('Failed to load books data:', error)
      }
    }
    
    loadData()
  }, [storage])

  const getBookStats = (book: Book) => {
    const storyboard = storyboards.find(s => s.id === book.storyboardId)
    if (!storyboard) return { chapters: 0, wordCount: 0 }
    
    const chapters = storyboard.sections.length
    const totalWordCount = storyboard.sections.reduce((total, section) => {
      const excerpt = excerpts.find(e => e.id === section.excerptId)
      return total + (excerpt?.wordCount || 0)
    }, 0)
    
    return { chapters, wordCount: totalWordCount }
  }

  const handleExport = async (book: Book, format: 'pdf' | 'epub') => {
    try {
      const content = await exportBook(book, {
        format,
        includeMetadata: true,
        includeCover: false,
        imagePageBreaks: false // Allow images inline with text
      }, storage)
      
      const filename = `${book.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${format}`
      downloadFile(content, filename, 'text/html')
      
      console.log(`Book exported as ${format.toUpperCase()}!`)
    } catch (err) {
      console.error('Failed to export book')
    }
  }

  const handleDeleteBook = async (book: Book) => {
    if (window.confirm(`Are you sure you want to delete "${book.title}"? This action cannot be undone.`)) {
      try {
        await storage.deleteBook(book.id)
        const updatedBooks = await storage.getBooks()
        setBooks(updatedBooks)
        console.log('Book deleted successfully!')
      } catch (error) {
        console.error('Failed to delete book:', error)
      }
    }
  }


  return (
    <div className="container py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-black tracking-tight mb-1">
            BOOKS
          </h1>
          <p className="text-black font-mono text-xs">
            YOUR PUBLISHED WORKS
          </p>
        </div>
        
        <div className="flex gap-4">
          <Link
            href="/books/new"
            className="btn btn-primary"
          >
            + NEW BOOK
          </Link>
        </div>
      </div>

      {/* Stats Dashboard */}
      {books.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-4">
            <div className="text-gray-600 font-medium text-xs mb-1 uppercase tracking-wide">
              Total Books
            </div>
            <div className="text-2xl font-bold text-black">
              {books.length.toString().padStart(2, '0')}
            </div>
          </div>
          
          <div className="card p-4">
            <div className="text-gray-600 font-medium text-xs mb-1 uppercase tracking-wide">
              Total Chapters
            </div>
            <div className="text-2xl font-bold text-black">
              {books.reduce((total, book) => total + getBookStats(book).chapters, 0).toString().padStart(2, '0')}
            </div>
          </div>
          
          <div className="card p-4">
            <div className="text-gray-600 font-medium text-xs mb-1 uppercase tracking-wide">
              Total Words
            </div>
            <div className="text-2xl font-bold text-black">
              {Math.floor(books.reduce((sum, book) => sum + getBookStats(book).wordCount, 0) / 1000)}K
            </div>
          </div>
          
          <div className="card p-4">
            <div className="text-gray-600 font-medium text-xs mb-1 uppercase tracking-wide">
              Avg. Word Count
            </div>
            <div className="text-2xl font-bold text-black">
              {books.length > 0 ? Math.floor(books.reduce((sum, book) => sum + getBookStats(book).wordCount, 0) / books.length / 1000) : 0}K
            </div>
          </div>
        </div>
      )}

      {/* Books List */}
      {books.length === 0 ? (
        <div className="text-center py-16">
          <div className="card bg-white p-12">
            <div className="text-8xl font-bold text-black mb-6">
              00
            </div>
            <h3 className="text-2xl font-bold text-black mb-4 tracking-tight">
              NO BOOKS YET
            </h3>
            <p className="text-black mb-8 max-w-md mx-auto">
              Create your first book by organizing excerpts into a storyboard, then transform it into a published work.
            </p>
            <Link
              href="/books/new"
              className="btn btn-primary"
            >
              CREATE FIRST BOOK
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {books.map((book, index) => {
            const { chapters, wordCount } = getBookStats(book)
            return (
              <div key={book.id} className="card bg-white hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-gray-600 font-bold font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <Link 
                          href={`/books/${book.id}/preview`}
                          className="text-lg font-bold text-black hover:text-blue-600 transition-colors truncate"
                        >
                          {book.title}
                        </Link>
                        {book.subtitle && (
                          <span className="text-gray-500 text-sm truncate">
                            — {book.subtitle}
                          </span>
                        )}
                      </div>
                      
                      <div className="text-gray-600 text-sm mb-3">
                        by {book.author}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{chapters} chapters</span>
                          <span>{wordCount.toLocaleString()} words</span>
                          <span>{formatDate(book.updatedAt)}</span>
                        </div>
                        
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleExport(book, 'pdf')}
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition-colors"
                          >
                            PDF
                          </button>
                          <button 
                            onClick={() => handleExport(book, 'epub')}
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition-colors"
                          >
                            EPUB
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4 shrink-0">
                      <Link
                        href={`/books/${book.id}/edit`}
                        className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/books/${book.id}/preview`}
                        className="btn btn-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-sm"
                      >
                        Preview
                      </Link>
                      <button
                        onClick={() => handleDeleteBook(book)}
                        className="btn btn-sm border border-red-300 text-red-600 hover:bg-red-500 hover:text-white px-3 py-1 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}