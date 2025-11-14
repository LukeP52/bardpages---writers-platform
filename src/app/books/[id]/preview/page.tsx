'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import LoadingState from '@/components/LoadingState'
import ErrorState from '@/components/ErrorState'
import { Book } from '@/types'
import { useStorage } from '@/contexts/StorageContext'
import { generateBookContent, exportBook, downloadFile, downloadPDF } from '@/lib/exportUtils'

export default function BookPreviewPage() {
  const storage = useStorage()
  const params = useParams()
  const bookId = params.id as string
  const [book, setBook] = useState<Book | null>(null)
  const [bookContent, setBookContent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const loadBook = async () => {
      // Don't try to load if storage is still initializing
      if (storage.isLoading) {
        return
      }
      
      try {
        console.log('Loading book with ID:', bookId)
        console.log('Storage context:', storage)
        
        // First, let's see what books are available
        const allBooks = await storage.getBooks()
        console.log('All available books:', allBooks)
        console.log('Book IDs:', allBooks.map(b => b.id))
        
        const loadedBook = await storage.getBook(bookId)
        console.log('Loaded book:', loadedBook)
        
        if (!loadedBook) {
          setError(`Book not found. Looking for ID: ${bookId}`)
        } else {
          setBook(loadedBook)
          const content = await generateBookContent(loadedBook, storage)
          setBookContent(content)
        }
      } catch (err) {
        console.error('Error loading book:', err)
        setError('Failed to load book')
      } finally {
        setLoading(false)
      }
    }

    loadBook()
  }, [bookId, storage, storage.isLoading])

  const handleExport = async (format: 'html' | 'pdf' | 'epub' | 'docx') => {
    if (!book) return
    
    setExporting(true)
    try {
      const content = await exportBook(book, {
        format,
        includeMetadata: true,
        includeCover: false,
        imagePageBreaks: book.formatting.imagePageBreaks
      }, storage)
      
      const filename = `${book.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${format}`
      
      if (format === 'pdf') {
        await downloadPDF(content, filename)
        console.log('Opening clean PDF format. Use Ctrl+P (Cmd+P) and select "Save as PDF".')
      } else {
        downloadFile(content, filename, format === 'html' ? 'text/html' : 'application/octet-stream')
        console.log(`Book exported as ${format.toUpperCase()}!`)
      }
    } catch (err) {
      console.error('Failed to export book')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return <LoadingState message="Loading book preview..." />
  }

  if (error || !book || !bookContent) {
    return (
      <ErrorState
        title="Book not found"
        message={error || "The book you're looking for doesn't exist."}
      />
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <div className="container max-w-4xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/books"
                className="btn btn-ghost"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Books
              </Link>
              <h1 className="text-xl font-bold text-black">
                Preview: {book.title}
              </h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleExport('html')}
                disabled={exporting}
                className="btn btn-secondary btn-sm"
              >
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                HTML
              </button>
              <button
                onClick={() => handleExport('pdf')}
                disabled={exporting}
                className="btn btn-secondary btn-sm"
              >
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                PDF
              </button>
              <button
                onClick={() => handleExport('epub')}
                disabled={exporting}
                className="btn btn-secondary btn-sm"
              >
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                EPUB
              </button>
              <button
                onClick={() => handleExport('docx')}
                disabled={exporting}
                className="btn btn-secondary btn-sm"
              >
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                DOCX
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Book Content */}
      <div className="container max-w-4xl py-12">
        <div 
          className="bg-white border-2 border-gray-200 p-12 shadow-lg"
          style={{
            fontFamily: book.formatting.fontFamily,
            fontSize: `${book.formatting.fontSize}pt`,
            lineHeight: book.formatting.lineHeight,
          }}
        >
          {/* Title Page */}
          <div className="text-center mb-16 border-b border-gray-200 pb-16">
            <h1 className="text-5xl font-bold text-black mb-4">
              {book.title}
            </h1>
            {book.subtitle && (
              <h2 className="text-2xl text-gray-600 mb-8">
                {book.subtitle}
              </h2>
            )}
            <p className="text-xl text-black font-medium mb-6">
              by {book.author}
            </p>
            {book.metadata.genre && (
              <p className="text-sm text-gray-500 uppercase tracking-wide">
                {book.metadata.genre}
              </p>
            )}
            {book.metadata.description && (
              <div className="mt-8 text-gray-700 max-w-2xl mx-auto">
                {book.metadata.description}
              </div>
            )}
          </div>

          {/* Chapters */}
          <div className="space-y-12">
            {bookContent.chapters.map((chapter: any, index: number) => (
              <div key={index} className="chapter">
                <h2 
                  className={`text-3xl font-bold text-black mb-8 ${
                    book.formatting.chapterBreakStyle === 'page-break' ? 'break-before-page' : ''
                  } ${
                    book.formatting.chapterBreakStyle === 'spacing' ? 'mt-16' : ''
                  }`}
                >
                  {chapter.title}
                </h2>
                <div 
                  className={`prose prose-lg max-w-none ${
                    book.formatting.textAlignment === 'justify' 
                      ? 'text-left' 
                      : `text-${book.formatting.textAlignment}`
                  }`}
                  style={{
                    textAlign: book.formatting.textAlignment === 'justify' ? 'left' : book.formatting.textAlignment,
                    wordSpacing: 'normal',
                    letterSpacing: 'normal'
                  }}
                  dangerouslySetInnerHTML={{ __html: chapter.content }}
                />
              </div>
            ))}
          </div>

          {/* Book Info */}
          <div className="mt-16 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>Generated from {bookContent.chapters.length} chapters</p>
            <p>Total word count: {bookContent.chapters.reduce((total: number, chapter: any) => 
              total + chapter.excerpts.reduce((sum: number, excerpt: any) => sum + excerpt.wordCount, 0), 0
            ).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}