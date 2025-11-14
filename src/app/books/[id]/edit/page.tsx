'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import BookForm from '@/components/BookForm'
import LoadingState from '@/components/LoadingState'
import ErrorState from '@/components/ErrorState'
import { Book } from '@/types'
import { useStorage } from '@/contexts/StorageContext'

export default function EditBookPage() {
  const storage = useStorage()
  const params = useParams()
  const bookId = params.id as string
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadBook = async () => {
      // Don't try to load if storage is still initializing
      if (storage.isLoading) {
        return
      }
      
      try {
        const loadedBook = await storage.getBook(bookId)
        if (!loadedBook) {
          setError('Book not found')
        } else {
          setBook(loadedBook)
        }
      } catch (err) {
        setError('Failed to load book')
      } finally {
        setLoading(false)
      }
    }

    loadBook()
  }, [bookId, storage, storage.isLoading])

  if (loading) {
    return <LoadingState message="Loading book..." />
  }

  if (error || !book) {
    return (
      <ErrorState
        title="Book not found"
        message={error || "The book you're looking for doesn't exist."}
      />
    )
  }

  return (
    <div className="section bg-white">
      <div className="container max-w-4xl">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-black uppercase tracking-wide">
            Edit Book
          </h1>
          <p className="text-secondary mt-2">
            Update your book details and organization
          </p>
        </div>

        <BookForm mode="edit" book={book} />
      </div>
    </div>
  )
}