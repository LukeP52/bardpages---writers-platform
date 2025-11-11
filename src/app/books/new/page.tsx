'use client'

import BookForm from '@/components/BookForm'

export default function NewBookPage() {
  return (
    <div className="section bg-white">
      <div className="container max-w-4xl">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-black uppercase tracking-wide">
            Create New Book
          </h1>
          <p className="text-secondary mt-2">
            Organize your excerpts into a publishable book
          </p>
        </div>

        <BookForm mode="create" />
      </div>
    </div>
  )
}