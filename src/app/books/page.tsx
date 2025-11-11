'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Book, Storyboard, Excerpt } from '@/types'
import { storage } from '@/lib/storage'
import EmptyState from '@/components/EmptyState'
import { exportBook, downloadFile } from '@/lib/exportUtils'
import { BookOpenIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function BooksPage() {
  const [storyboards, setStoryboards] = useState<Storyboard[]>([])
  const [books, setBooks] = useState<Book[]>([])

  useEffect(() => {
    const loadedStoryboards = storage.getStoryboards()
    const loadedBooks = storage.getBooks()
    setStoryboards(loadedStoryboards)
    setBooks(loadedBooks)
  }, [])

  const getBookStats = (book: Book) => {
    const storyboard = storyboards.find(s => s.id === book.storyboardId)
    if (!storyboard) return { chapters: 0, wordCount: 0 }
    
    const chapters = storyboard.sections.length
    const totalWordCount = storyboard.sections.reduce((total, section) => {
      const excerpt = storage.getExcerpt(section.excerptId)
      return total + (excerpt?.wordCount || 0)
    }, 0)
    
    return { chapters, wordCount: totalWordCount }
  }

  const handleExport = async (book: Book, format: 'pdf' | 'epub') => {
    try {
      const content = await exportBook(book, {
        format,
        includeMetadata: true,
        includeCover: false
      })
      
      const filename = `${book.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${format}`
      downloadFile(content, filename, 'text/html')
      
      toast.success(`Book exported as ${format.toUpperCase()}!`)
    } catch (err) {
      toast.error('Failed to export book')
    }
  }


  return (
    <div className="container py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-6xl font-bold text-black tracking-tight mb-2">
            BOOKS
          </h1>
          <p className="text-black font-mono text-sm">
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
          <Link
            href="/books/import"
            className="btn btn-outline"
          >
            IMPORT FROM STORYBOARD
          </Link>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="border-2 border-black p-6">
          <div className="text-black font-bold text-sm mb-2 tracking-wide">
            TOTAL BOOKS
          </div>
          <div className="text-4xl font-bold text-black">
            {books.length.toString().padStart(2, '0')}
          </div>
        </div>
        
        <div className="border-2 border-black p-6">
          <div className="text-black font-bold text-sm mb-2 tracking-wide">
            WITH STORYBOARDS
          </div>
          <div className="text-4xl font-bold text-black">
            {books.length.toString().padStart(2, '0')}
          </div>
        </div>
        
        <div className="border-2 border-black p-6">
          <div className="text-black font-bold text-sm mb-2 tracking-wide">
            TOTAL CHAPTERS
          </div>
          <div className="text-4xl font-bold text-black">
            {books.reduce((total, book) => total + getBookStats(book).chapters, 0).toString().padStart(2, '0')}
          </div>
        </div>
        
        <div className="border-2 border-black p-6">
          <div className="text-black font-bold text-sm mb-2 tracking-wide">
            TOTAL WORDS
          </div>
          <div className="text-4xl font-bold text-black">
            {Math.floor(books.reduce((sum, book) => sum + getBookStats(book).wordCount, 0) / 1000)}K
          </div>
        </div>
      </div>

      {/* Books List */}
      {books.length === 0 ? (
        <EmptyState
          icon={<BookOpenIcon className="w-8 h-8 text-gray-400" />}
          title="No books yet"
          description="Start your first book project by organizing excerpts into a storyboard, then create a book from it."
          actionLabel="Create New Book"
          onAction={() => window.location.href = '/books/new'}
        />
      ) : (
        <div className="space-y-6">
          {books.map((book, index) => {
            const { chapters, wordCount } = getBookStats(book)
            return (
              <div key={book.id} className="border-2 border-black bg-white">
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="text-black font-bold font-mono text-lg">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <h2 className="text-2xl font-bold text-black tracking-tight">
                          {book.title}
                        </h2>
                        {book.subtitle && (
                          <span className="text-gray-600 text-lg">
                            — {book.subtitle}
                          </span>
                        )}
                      </div>
                      <div className="text-black mb-4 font-mono text-sm ml-12">
                        BY {book.author.toUpperCase()}
                      </div>
                    </div>
                  
                    <div className="flex gap-2 ml-6">
                    <Link
                      href={`/books/${book.id}/edit`}
                      className="btn btn-outline"
                    >
                      EDIT
                    </Link>
                    <Link
                      href={`/books/${book.id}/preview`}
                      className="btn btn-primary"
                    >
                      PREVIEW
                    </Link>
                    </div>
                  </div>
                
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="border border-black p-4">
                      <div className="text-black font-bold text-sm mb-1 tracking-wide">
                        CHAPTERS
                      </div>
                      <div className="text-2xl font-bold text-black">
                        {chapters}
                      </div>
                    </div>
                    
                    <div className="border border-black p-4">
                      <div className="text-black font-bold text-sm mb-1 tracking-wide">
                        WORD COUNT
                      </div>
                      <div className="text-2xl font-bold text-black">
                        {wordCount.toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="border border-black p-4">
                      <div className="text-black font-bold text-sm mb-1 tracking-wide">
                        LAST UPDATED
                      </div>
                      <div className="text-sm font-mono text-black">
                        {book.updatedAt.toLocaleDateString().toUpperCase()}
                      </div>
                    </div>
                  </div>
                
                  <div className="border-t-2 border-black pt-4">
                  <div className="flex items-center justify-between">
                    <div className="text-black font-bold text-sm tracking-wide">
                      CREATED: {book.createdAt.toLocaleDateString().toUpperCase()}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleExport(book, 'pdf')}
                        className="btn btn-outline btn-sm"
                      >
                        EXPORT PDF
                      </button>
                      <button 
                        onClick={() => handleExport(book, 'epub')}
                        className="btn btn-outline btn-sm"
                      >
                        EXPORT EPUB
                      </button>
                    </div>
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