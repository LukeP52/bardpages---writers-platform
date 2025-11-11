'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import QuillEditor from '@/components/QuillEditor'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Excerpt } from '@/types'
import { storage } from '@/lib/storage'
import toast from 'react-hot-toast'

interface ExcerptFormProps {
  excerpt?: Excerpt
  mode: 'create' | 'edit'
}

export default function ExcerptForm({ excerpt, mode }: ExcerptFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState(excerpt?.title || '')
  const [content, setContent] = useState(excerpt?.content || '')
  const [author, setAuthor] = useState(excerpt?.author || '')
  const [status, setStatus] = useState<'draft' | 'review' | 'final'>(excerpt?.status || 'draft')
  const [date, setDate] = useState(() => {
    const dateObj = excerpt?.createdAt ? new Date(excerpt.createdAt) : new Date()
    return {
      month: dateObj.getMonth() + 1,
      day: dateObj.getDate(),
      year: dateObj.getFullYear()
    }
  })
  const [tags, setTags] = useState<string[]>(excerpt?.tags || [])
  const [newTag, setNewTag] = useState('')
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [availableAuthors, setAvailableAuthors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setAvailableTags(storage.getAllTags())
    setAvailableAuthors(storage.getUsedAuthors())
  }, [])

  const getWordCount = (html: string): number => {
    const text = html.replace(/<[^>]*>/g, '').trim()
    return text ? text.split(/\s+/).length : 0
  }

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags(prev => [...prev, trimmedTag])
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !content.trim()) {
      toast.error('Please provide both a title and content for your excerpt.')
      return
    }

    setIsSubmitting(true)

    try {
      const now = new Date()
      const selectedDate = new Date(date.year, date.month - 1, date.day)
      const excerptData: Excerpt = {
        id: excerpt?.id || uuidv4(),
        title: title.trim(),
        content: content.trim(),
        author: author.trim() || undefined,
        status,
        tags,
        createdAt: excerpt?.createdAt || selectedDate,
        updatedAt: now,
        wordCount: getWordCount(content)
      }

      storage.saveExcerpt(excerptData)
      
      toast.success(`Excerpt ${mode === 'create' ? 'created' : 'updated'} successfully!`)
      router.push('/excerpts')
    } catch (error) {
      console.error('Error saving excerpt:', error)
      toast.error('There was an error saving your excerpt. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="section bg-white">
      <div className="container max-w-4xl">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-black uppercase tracking-wide">
            {mode === 'create' ? 'Create Excerpt' : 'Edit Excerpt'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label htmlFor="title" className="block text-sm font-bold text-black mb-4 uppercase tracking-wide">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input text-xl"
              placeholder="Enter excerpt title..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="author" className="block text-sm font-bold text-black mb-4 uppercase tracking-wide">
                Author
              </label>
              <input
                type="text"
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="input"
                placeholder="Enter author name..."
                list="authors-list"
              />
              {availableAuthors.length > 0 && (
                <datalist id="authors-list">
                  {availableAuthors.map(authorName => (
                    <option key={authorName} value={authorName} />
                  ))}
                </datalist>
              )}
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-bold text-black mb-4 uppercase tracking-wide">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'draft' | 'review' | 'final')}
                className="input"
              >
                <option value="draft">Draft</option>
                <option value="review">Review</option>
                <option value="final">Final</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-4 uppercase tracking-wide">
                Date
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <input
                    type="text"
                    value={(() => {
                      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                      return months[date.month - 1] || ''
                    })()}
                    onChange={(e) => {
                      const value = e.target.value.toLowerCase()
                      const monthMap: { [key: string]: number } = {
                        'jan': 1, 'january': 1,
                        'feb': 2, 'february': 2,
                        'mar': 3, 'march': 3,
                        'apr': 4, 'april': 4,
                        'may': 5,
                        'jun': 6, 'june': 6,
                        'jul': 7, 'july': 7,
                        'aug': 8, 'august': 8,
                        'sep': 9, 'september': 9,
                        'oct': 10, 'october': 10,
                        'nov': 11, 'november': 11,
                        'dec': 12, 'december': 12
                      }
                      
                      if (value === '') {
                        setDate(prev => ({ ...prev, month: 1 }))
                      } else {
                        const monthNum = monthMap[value]
                        if (monthNum) {
                          setDate(prev => ({ ...prev, month: monthNum }))
                        }
                        // Allow partial typing by checking if any month starts with the typed value
                        const partialMatch = Object.keys(monthMap).find(key => key.startsWith(value))
                        if (partialMatch && value.length >= 2) {
                          const monthNum = monthMap[partialMatch]
                          if (monthNum) {
                            setDate(prev => ({ ...prev, month: monthNum }))
                          }
                        }
                      }
                    }}
                    className="input text-sm px-3 py-2"
                    placeholder="Month"
                    list="months-list"
                  />
                  <datalist id="months-list">
                    <option value="Jan">January</option>
                    <option value="Feb">February</option>
                    <option value="Mar">March</option>
                    <option value="Apr">April</option>
                    <option value="May">May</option>
                    <option value="Jun">June</option>
                    <option value="Jul">July</option>
                    <option value="Aug">August</option>
                    <option value="Sep">September</option>
                    <option value="Oct">October</option>
                    <option value="Nov">November</option>
                    <option value="Dec">December</option>
                  </datalist>
                </div>
                
                <div>
                  <input
                    type="text"
                    value={date.day}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === '') {
                        setDate(prev => ({ ...prev, day: 1 }))
                      } else {
                        const numValue = parseInt(value)
                        if (!isNaN(numValue) && numValue >= 1 && numValue <= 31) {
                          setDate(prev => ({ ...prev, day: numValue }))
                        }
                      }
                    }}
                    className="input text-sm px-3 py-2"
                    placeholder="Day"
                    list="days-list"
                  />
                  <datalist id="days-list">
                    {Array.from({ length: 31 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </datalist>
                </div>
                
                <div>
                  <input
                    type="text"
                    value={date.year}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === '') {
                        setDate(prev => ({ ...prev, year: new Date().getFullYear() }))
                      } else {
                        const numValue = parseInt(value)
                        if (!isNaN(numValue) && numValue >= 1900 && numValue <= 2100) {
                          setDate(prev => ({ ...prev, year: numValue }))
                        }
                      }
                    }}
                    className="input text-sm px-4 py-2"
                    placeholder="Year"
                    list="years-list"
                  />
                  <datalist id="years-list">
                    {Array.from({ length: 25 }, (_, i) => {
                      const year = new Date().getFullYear() - i
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      )
                    })}
                  </datalist>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-black mb-4 uppercase tracking-wide">
              Content *
            </label>
            <QuillEditor
              value={content}
              onChange={setContent}
              placeholder="Start writing your excerpt..."
              className="min-h-[400px] border-2 border-black"
            />
            <div className="mt-4 text-sm text-secondary font-mono">
              Word count: {getWordCount(content)}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-black mb-4 uppercase tracking-wide">
              Tags
            </label>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-4 py-2 bg-black text-white text-sm font-mono"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-white hover:bg-white hover:text-black w-5 h-5 flex items-center justify-center"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-0">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag(newTag)
                  }
                }}
                className="input border-r-0"
                placeholder="Add a tag..."
              />
              <button
                type="button"
                onClick={() => addTag(newTag)}
                className="btn btn-secondary px-8"
              >
                Add
              </button>
            </div>

            {availableTags.length > 0 && (
              <div className="mt-6">
                <p className="text-sm text-secondary mb-3 uppercase tracking-wide">Available tags:</p>
                <div className="flex flex-wrap gap-2">
                  {availableTags
                    .filter(tag => !tags.includes(tag))
                    .map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => addTag(tag)}
                        className="px-3 py-1 border border-black text-black text-xs font-mono hover:bg-black hover:text-white transition-colors"
                      >
                        + {tag}
                      </button>
                    ))
                  }
                </div>
              </div>
            )}
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
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className="btn btn-primary"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" color="white" className="mr-2" />
                  Saving...
                </>
              ) : mode === 'create' ? 'Create Excerpt' : 'Update Excerpt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}