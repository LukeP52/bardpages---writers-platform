'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import RichTextEditor from '@/components/RichTextEditor'
import { Excerpt } from '@/types'
import { storage } from '@/lib/storage'

interface ExcerptFormProps {
  excerpt?: Excerpt
  mode: 'create' | 'edit'
}

export default function ExcerptForm({ excerpt, mode }: ExcerptFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState(excerpt?.title || '')
  const [content, setContent] = useState(excerpt?.content || '')
  const [tags, setTags] = useState<string[]>(excerpt?.tags || [])
  const [newTag, setNewTag] = useState('')
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setAvailableTags(storage.getUsedTags())
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
      alert('Please provide both a title and content for your excerpt.')
      return
    }

    setIsSubmitting(true)

    try {
      const now = new Date()
      const excerptData: Excerpt = {
        id: excerpt?.id || uuidv4(),
        title: title.trim(),
        content: content.trim(),
        tags,
        createdAt: excerpt?.createdAt || now,
        updatedAt: now,
        wordCount: getWordCount(content)
      }

      storage.saveExcerpt(excerptData)
      
      router.push('/excerpts')
    } catch (error) {
      console.error('Error saving excerpt:', error)
      alert('There was an error saving your excerpt. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {mode === 'create' ? 'Create New Excerpt' : 'Edit Excerpt'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            placeholder="Enter excerpt title..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content *
          </label>
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="Start writing your excerpt..."
            height={400}
          />
          <div className="mt-2 text-sm text-gray-500">
            Word count: {getWordCount(content)}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
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
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add a tag..."
            />
            <button
              type="button"
              onClick={() => addTag(newTag)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Add
            </button>
          </div>

          {availableTags.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-2">Available tags:</p>
              <div className="flex flex-wrap gap-1">
                {availableTags
                  .filter(tag => !tags.includes(tag))
                  .map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addTag(tag)}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded hover:bg-gray-200 transition-colors"
                    >
                      + {tag}
                    </button>
                  ))
                }
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !title.trim() || !content.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Excerpt' : 'Update Excerpt'}
          </button>
        </div>
      </form>
    </div>
  )
}