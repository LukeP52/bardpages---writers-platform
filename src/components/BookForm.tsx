'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Book, Storyboard } from '@/types'
import { storage } from '@/lib/storage'
import toast from 'react-hot-toast'

interface BookFormProps {
  book?: Book
  mode: 'create' | 'edit'
}

export default function BookForm({ book, mode }: BookFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState(book?.title || '')
  const [subtitle, setSubtitle] = useState(book?.subtitle || '')
  const [author, setAuthor] = useState(book?.author || '')
  const [storyboardId, setStoryboardId] = useState(book?.storyboardId || '')
  const [genre, setGenre] = useState(book?.metadata.genre || '')
  const [description, setDescription] = useState(book?.metadata.description || '')
  const [language, setLanguage] = useState(book?.metadata.language || 'en')
  const [isbn, setIsbn] = useState(book?.metadata.isbn || '')
  
  // Formatting options
  const [fontFamily, setFontFamily] = useState(book?.formatting.fontFamily || 'Inter')
  const [fontSize, setFontSize] = useState(book?.formatting.fontSize || 12)
  const [lineHeight, setLineHeight] = useState(book?.formatting.lineHeight || 1.6)
  const [chapterBreakStyle, setChapterBreakStyle] = useState(book?.formatting.chapterBreakStyle || 'page-break')
  
  const [availableStoryboards, setAvailableStoryboards] = useState<Storyboard[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setAvailableStoryboards(storage.getStoryboards())
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !author.trim() || !storyboardId) {
      toast.error('Please provide title, author, and select a storyboard.')
      return
    }

    setIsSubmitting(true)

    try {
      const now = new Date()
      const bookData: Book = {
        id: book?.id || uuidv4(),
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        author: author.trim(),
        storyboardId,
        metadata: {
          genre: genre.trim() || undefined,
          description: description.trim() || undefined,
          isbn: isbn.trim() || undefined,
          language,
        },
        formatting: {
          fontFamily,
          fontSize,
          lineHeight,
          marginTop: 1,
          marginBottom: 1,
          marginLeft: 1,
          marginRight: 1,
          chapterBreakStyle
        },
        createdAt: book?.createdAt || now,
        updatedAt: now,
      }

      storage.saveBook(bookData)
      
      toast.success(`Book ${mode === 'create' ? 'created' : 'updated'} successfully!`)
      router.push('/books')
    } catch (error) {
      console.error('Error saving book:', error)
      toast.error('There was an error saving your book. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="border-2 border-black bg-white p-6">
        <h2 className="text-xl font-bold text-black mb-6 uppercase tracking-wide">
          Basic Information
        </h2>
        
        <div className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input text-xl"
              placeholder="Enter book title..."
              required
            />
          </div>

          <div>
            <label htmlFor="subtitle" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
              Subtitle
            </label>
            <input
              type="text"
              id="subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="input"
              placeholder="Enter subtitle (optional)..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="author" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                Author *
              </label>
              <input
                type="text"
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="input"
                placeholder="Enter author name..."
                required
              />
            </div>

            <div>
              <label htmlFor="storyboard" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                Storyboard *
              </label>
              <select
                id="storyboard"
                value={storyboardId}
                onChange={(e) => setStoryboardId(e.target.value)}
                className="input"
                required
              >
                <option value="">Select a storyboard...</option>
                {availableStoryboards.map(storyboard => (
                  <option key={storyboard.id} value={storyboard.id}>
                    {storyboard.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="border-2 border-black bg-white p-6">
        <h2 className="text-xl font-bold text-black mb-6 uppercase tracking-wide">
          Metadata
        </h2>
        
        <div className="space-y-6">
          <div>
            <label htmlFor="description" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input min-h-[100px]"
              placeholder="Enter book description..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="genre" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                Genre
              </label>
              <input
                type="text"
                id="genre"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="input"
                placeholder="e.g. Fiction, Mystery..."
              />
            </div>

            <div>
              <label htmlFor="language" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                Language
              </label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="input"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
              </select>
            </div>

            <div>
              <label htmlFor="isbn" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                ISBN
              </label>
              <input
                type="text"
                id="isbn"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                className="input"
                placeholder="978-0-000000-00-0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Formatting */}
      <div className="border-2 border-black bg-white p-6">
        <h2 className="text-xl font-bold text-black mb-6 uppercase tracking-wide">
          Formatting Options
        </h2>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="fontFamily" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                Font Family
              </label>
              <select
                id="fontFamily"
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="input"
              >
                <option value="Inter">Inter</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Georgia">Georgia</option>
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
              </select>
            </div>

            <div>
              <label htmlFor="fontSize" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                Font Size (pt)
              </label>
              <input
                type="number"
                id="fontSize"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="input"
                min="8"
                max="24"
              />
            </div>

            <div>
              <label htmlFor="lineHeight" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                Line Height
              </label>
              <input
                type="number"
                id="lineHeight"
                value={lineHeight}
                onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                className="input"
                min="1.0"
                max="3.0"
                step="0.1"
              />
            </div>
          </div>

          <div>
            <label htmlFor="chapterBreak" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
              Chapter Break Style
            </label>
            <select
              id="chapterBreak"
              value={chapterBreakStyle}
              onChange={(e) => setChapterBreakStyle(e.target.value as 'page-break' | 'section-break' | 'spacing')}
              className="input"
            >
              <option value="page-break">Page Break</option>
              <option value="section-break">Section Break</option>
              <option value="spacing">Extra Spacing</option>
            </select>
          </div>
        </div>
      </div>

      <div className="divider my-8"></div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={handleCancel}
          className="btn btn-ghost"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !title.trim() || !author.trim() || !storyboardId}
          className="btn btn-primary"
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner size="sm" color="white" className="mr-2" />
              Saving...
            </>
          ) : mode === 'create' ? 'Create Book' : 'Update Book'}
        </button>
      </div>
    </form>
  )
}