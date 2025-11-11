'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Storyboard } from '@/types'
import { storage } from '@/lib/storage'

type BookStatus = 'draft' | 'review' | 'complete'

interface Book {
  id: string
  title: string
  author: string
  storyboardId?: string
  status: BookStatus
  chapters: number
  wordCount: number
  createdAt: Date
  updatedAt: Date
}

export default function BooksPage() {
  const [storyboards, setStoryboards] = useState<Storyboard[]>([])
  const [books] = useState<Book[]>([
    {
      id: '1',
      title: 'The Digital Wanderer',
      author: 'Anonymous',
      status: 'draft',
      chapters: 12,
      wordCount: 45000,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-11-01')
    },
    {
      id: '2', 
      title: 'Fragments of Tomorrow',
      author: 'Anonymous',
      status: 'review',
      chapters: 8,
      wordCount: 28500,
      createdAt: new Date('2024-02-20'),
      updatedAt: new Date('2024-10-15')
    }
  ])

  useEffect(() => {
    const loadedStoryboards = storage.getStoryboards()
    setStoryboards(loadedStoryboards)
  }, [])

  const getStatusColor = (status: BookStatus) => {
    switch(status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'review': return 'bg-yellow-100 text-yellow-800' 
      case 'complete': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
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
            IN PROGRESS
          </div>
          <div className="text-4xl font-bold text-black">
            {books.filter(b => b.status !== 'complete').length.toString().padStart(2, '0')}
          </div>
        </div>
        
        <div className="border-2 border-black p-6">
          <div className="text-black font-bold text-sm mb-2 tracking-wide">
            COMPLETED
          </div>
          <div className="text-4xl font-bold text-black">
            {books.filter(b => b.status === 'complete').length.toString().padStart(2, '0')}
          </div>
        </div>
        
        <div className="border-2 border-black p-6">
          <div className="text-black font-bold text-sm mb-2 tracking-wide">
            TOTAL WORDS
          </div>
          <div className="text-4xl font-bold text-black">
            {Math.floor(books.reduce((sum, b) => sum + b.wordCount, 0) / 1000)}K
          </div>
        </div>
      </div>

      {/* Books List */}
      {books.length === 0 ? (
        <div className="text-center py-16">
          <div className="border-2 border-black bg-white p-12">
            <div className="text-8xl font-bold text-black mb-6">
              00
            </div>
            <h3 className="text-2xl font-bold text-black mb-4 tracking-tight">
              NO BOOKS YET
            </h3>
            <p className="text-black mb-8 max-w-md mx-auto">
              Start your first book project by creating a new book or importing from an existing storyboard.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/books/new"
                className="btn btn-primary"
              >
                CREATE FIRST BOOK
              </Link>
              {storyboards.length > 0 && (
                <Link
                  href="/books/import"
                  className="btn btn-outline"
                >
                  IMPORT STORYBOARD
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {books.map((book, index) => (
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
                      <span className={`px-3 py-1 text-xs font-bold tracking-wide border border-black ${
                        book.status === 'draft' ? 'bg-white text-black' :
                        book.status === 'review' ? 'bg-yellow-100 text-black' :
                        'bg-green-100 text-black'
                      }`}>
                        {book.status.toUpperCase()}
                      </span>
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
                      {book.chapters}
                    </div>
                  </div>
                  
                  <div className="border border-black p-4">
                    <div className="text-black font-bold text-sm mb-1 tracking-wide">
                      WORD COUNT
                    </div>
                    <div className="text-2xl font-bold text-black">
                      {book.wordCount.toLocaleString()}
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
                      <button className="btn btn-outline btn-sm">
                        EXPORT PDF
                      </button>
                      <button className="btn btn-outline btn-sm">
                        EXPORT EPUB
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}