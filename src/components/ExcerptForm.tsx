'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import QuillEditor from '@/components/QuillEditor'
import LoadingSpinner from '@/components/LoadingSpinner'
import ReferenceManager, { AddReferenceButton } from '@/components/ReferenceManager'
import CitationWorkflow from '@/components/CitationWorkflow'
import { Excerpt, Reference, Citation } from '@/types'
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
    if (excerpt?.createdAt) {
      return new Date(excerpt.createdAt).toISOString().split('T')[0]
    }
    return new Date().toISOString().split('T')[0]
  })
  const [tags, setTags] = useState<string[]>(excerpt?.tags || [])
  const [newTag, setNewTag] = useState('')
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [availableAuthors, setAvailableAuthors] = useState<string[]>([])
  const [imageUrl, setImageUrl] = useState(excerpt?.imageUrl || '')
  const [references, setReferences] = useState<Reference[]>(excerpt?.references || [])
  const [citations, setCitations] = useState<Citation[]>(excerpt?.citations || [])
  const [showCitationWorkflow, setShowCitationWorkflow] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-save functionality
  const getDraftKey = useCallback(() => {
    return `draft_excerpt_${excerpt?.id || 'new'}_${Date.now().toString().slice(-6)}`
  }, [excerpt?.id])

  const saveDraft = useCallback((draftData: any) => {
    if (typeof window === 'undefined') return
    
    try {
      const draftKey = `draft_excerpt_${excerpt?.id || 'new'}`
      localStorage.setItem(draftKey, JSON.stringify({
        ...draftData,
        savedAt: new Date().toISOString()
      }))
    } catch (error) {
      console.warn('Could not save draft:', error)
    }
  }, [excerpt?.id])

  const loadDraft = useCallback(() => {
    if (typeof window === 'undefined') return null
    
    try {
      const draftKey = `draft_excerpt_${excerpt?.id || 'new'}`
      const draftData = localStorage.getItem(draftKey)
      return draftData ? JSON.parse(draftData) : null
    } catch (error) {
      console.warn('Could not load draft:', error)
      return null
    }
  }, [excerpt?.id])

  const clearDraft = useCallback(() => {
    if (typeof window === 'undefined') return
    
    try {
      const draftKey = `draft_excerpt_${excerpt?.id || 'new'}`
      localStorage.removeItem(draftKey)
    } catch (error) {
      console.warn('Could not clear draft:', error)
    }
  }, [excerpt?.id])

  // Load draft data on component mount
  useEffect(() => {
    const draft = loadDraft()
    if (draft && !excerpt) {
      // Only load draft for new excerpts, not when editing existing ones
      setTitle(draft.title || '')
      setContent(draft.content || '')
      setAuthor(draft.author || '')
      setStatus(draft.status || 'draft')
      setTags(draft.tags || [])
      setImageUrl(draft.imageUrl || '')
      setReferences(draft.references || [])
      setCitations(draft.citations || [])
      setDate(draft.date || new Date().toISOString().split('T')[0])
      
      if (draft.savedAt) {
        const savedTime = new Date(draft.savedAt).toLocaleTimeString()
        toast.success(`Draft restored from ${savedTime}`)
      }
    }
  }, [excerpt, loadDraft])

  // Auto-save draft data when fields change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (title || content || author || references.length > 0 || citations.length > 0) {
        saveDraft({
          title,
          content,
          author,
          status,
          tags,
          imageUrl,
          references,
          citations,
          date
        })
      }
    }, 1000) // Debounce for 1 second

    return () => clearTimeout(timeoutId)
  }, [title, content, author, status, tags, imageUrl, references, citations, date, saveDraft])

  useEffect(() => {
    setAvailableTags(storage.getAllTags())
    setAvailableAuthors(storage.getUsedAuthors())
  }, [])

  useEffect(() => {
    if (excerpt) {
      setTitle(excerpt.title ?? '')
      setContent(excerpt.content ?? '')
      setAuthor(excerpt.author ?? '')
      setStatus(excerpt.status ?? 'draft')
      setTags(excerpt.tags ?? [])
      setImageUrl(excerpt.imageUrl ?? '')
      setDate(
        excerpt.createdAt
          ? new Date(excerpt.createdAt).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      )
    }
  }, [excerpt])

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
      const selectedDate = new Date(date)
      const excerptData: Excerpt = {
        id: excerpt?.id || uuidv4(),
        title: title.trim(),
        content: content.trim(),
        author: author.trim() || undefined,
        status,
        tags,
        references,
        citations,
        createdAt: excerpt?.createdAt || selectedDate,
        updatedAt: now,
        wordCount: getWordCount(content),
        imageUrl: imageUrl.trim() || undefined
      }

      console.log('Saving excerpt:', excerptData.id, excerptData.title)
      storage.saveExcerpt(excerptData)
      
      // Verify it was saved
      const saved = storage.getExcerpt(excerptData.id)
      console.log('Verification - saved excerpt retrieved:', saved ? 'SUCCESS' : 'FAILED')
      
      if (!saved) {
        throw new Error('Failed to save excerpt to storage')
      }
      
      // Clear draft since we successfully saved
      clearDraft()
      
      toast.success(`Excerpt ${mode === 'create' ? 'created' : 'updated'} successfully!`)
      router.push('/excerpts')
    } catch (error) {
      console.error('Error saving excerpt:', error)
      toast.error('There was an error saving your excerpt. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTextSelection = () => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const selectedText = selection.toString().trim()
      
      if (selectedText) {
        setSelectedText(selectedText)
        // For now, we'll use simple text positions
        // In a real implementation, you'd want to map this to the content string positions
        setSelectedRange({ 
          start: range.startOffset, 
          end: range.endOffset 
        })
      } else {
        setSelectedText('')
        setSelectedRange(null)
      }
    }
  }

  const handleAddReference = () => {
    handleTextSelection()
    setShowCitationWorkflow(true)
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="section bg-white">
      <div className="container max-w-4xl">
        <div className="mb-12 flex items-center justify-between">
          <h1 className="text-4xl font-bold text-black uppercase tracking-wide">
            {mode === 'create' ? 'Create Excerpt' : 'Edit Excerpt'}
          </h1>
          <AddReferenceButton onClick={handleAddReference} />
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
              <label htmlFor="date" className="block text-sm font-bold text-black mb-4 uppercase tracking-wide">
                Date
              </label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input w-full"
              />
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
            <label htmlFor="imageUrl" className="block text-sm font-bold text-black mb-4 uppercase tracking-wide">
              Image URL (Optional)
            </label>
            <input
              type="url"
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="input w-full"
              placeholder="https://example.com/image.jpg"
            />
            {imageUrl && (
              <div className="mt-4">
                <p className="text-sm font-bold text-black mb-2 uppercase tracking-wide">Preview:</p>
                <img 
                  src={imageUrl} 
                  alt="Preview" 
                  className="max-w-xs max-h-48 border-2 border-black"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
              </div>
            )}
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
                id="new-tag"
                name="new-tag"
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

          {/* References List */}
          {references.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-black mb-6 uppercase tracking-wide">
                References ({references.length})
              </h2>
              <ReferenceManager
                references={references}
                citations={citations}
                onReferencesChange={setReferences}
                onCitationsChange={setCitations}
              />
            </div>
          )}

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

        {/* Citation Workflow Modal */}
        {showCitationWorkflow && (
          <CitationWorkflow
            references={references}
            citations={citations}
            selectedText={selectedText}
            selectedRange={selectedRange}
            content={content}
            onReferencesChange={setReferences}
            onCitationsChange={setCitations}
            onContentChange={setContent}
            onClose={() => setShowCitationWorkflow(false)}
          />
        )}
      </div>
    </div>
  )
}