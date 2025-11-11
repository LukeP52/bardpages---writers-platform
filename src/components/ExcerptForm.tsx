'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import QuillEditor from '@/components/QuillEditor'
import LoadingSpinner from '@/components/LoadingSpinner'
import ReferenceManager, { AddReferenceButton } from '@/components/ReferenceManager'
import CitationWorkflow from '@/components/CitationWorkflow'
import CategoryAssignmentModal from '@/components/CategoryAssignmentModal'
import { Excerpt, Reference, Citation } from '@/types'
import { storage } from '@/lib/storage'
import { FileParser } from '@/lib/fileParser'
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
  const [selectedRange, setSelectedRange] = useState<{ index: number; length: number } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCategoryAssignmentModal, setShowCategoryAssignmentModal] = useState(false)
  const [selectedTagForAssignment, setSelectedTagForAssignment] = useState('')
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const quillRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
          references,
          citations,
          date
        })
      }
    }, 1000) // Debounce for 1 second

    return () => clearTimeout(timeoutId)
  }, [title, content, author, status, tags, references, citations, date, saveDraft])

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
      // Check if this tag already exists in storage
      const allTags = storage.getAllTags()
      if (allTags.includes(trimmedTag)) {
        // Tag exists, just add it
        setTags(prev => [...prev, trimmedTag])
        setNewTag('')
      } else {
        // New tag, show category assignment modal
        setSelectedTagForAssignment(trimmedTag)
        setShowCategoryAssignmentModal(true)
      }
    }
  }

  const handleCategoryAssignment = (categoryIds: string[]) => {
    if (selectedTagForAssignment) {
      storage.addPremadeTagWithCategories(selectedTagForAssignment, categoryIds)
      setTags(prev => [...prev, selectedTagForAssignment])
      setNewTag('')
      setSelectedTagForAssignment('')
      const categoryNames = categoryIds.map(id => storage.getCategory(id)?.name).filter(Boolean)
      toast.success(`Tag "${selectedTagForAssignment}" added to ${categoryNames.length > 1 ? categoryNames.join(', ') : categoryNames[0] || 'category'}!`)
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove))
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingFile(true)
    setUploadProgress('Validating file...')

    try {
      // Validate file
      const validation = FileParser.validateFile(file)
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid file')
        return
      }

      setUploadProgress('Reading file content...')

      // Parse file content
      const parsed = await FileParser.parseFile(file)
      
      setUploadProgress('Populating form...')

      // Populate form fields
      if (!title.trim()) {
        setTitle(parsed.title)
      }
      
      setContent(parsed.content)
      
      // Update word count will be handled by the content change
      
      setUploadProgress('File uploaded successfully!')
      toast.success(`File "${file.name}" uploaded and processed successfully!`)
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
    } catch (error) {
      console.error('File upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to process file')
    } finally {
      setIsUploadingFile(false)
      setTimeout(() => setUploadProgress(''), 3000)
    }
  }

  const triggerFileUpload = () => {
    fileInputRef.current?.click()
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
        wordCount: getWordCount(content)
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

  const handleSelectionChange = (range: { index: number; length: number } | null, source: string) => {
    if (range && range.length > 0 && quillRef.current) {
      const text = quillRef.current.getText(range.index, range.length)
      setSelectedText(text.trim())
      setSelectedRange(range)
    } else {
      setSelectedText('')
      setSelectedRange(null)
    }
  }

  const handleAddReference = () => {
    // Get current selection from Quill
    if (quillRef.current) {
      const selection = quillRef.current.getSelection()
      if (selection && selection.length > 0) {
        const text = quillRef.current.getText(selection.index, selection.length)
        setSelectedText(text.trim())
        setSelectedRange(selection)
      }
    }
    setShowCitationWorkflow(true)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.')
      return
    }
    
    // Create data URL for preview and attachment
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      if (dataUrl) {
        // Create an image tag to append to content
        const imageTag = `<img src="${dataUrl}" alt="Attached image" style="max-width: 100%; height: auto;">`
        
        // Append the image to the end of the content with some spacing
        const newContent = content.trim() + (content.trim() ? '<br><br>' : '') + imageTag
        
        setContent(newContent)
        toast.success('Image file attached to content!')
        
        // Clear the file input
        e.target.value = ''
      }
    }
    reader.readAsDataURL(file)
  }

  const handleAttachImage = () => {
    if (!imageUrl.trim()) return
    
    // Create an image tag to append to content
    const imageTag = `<img src="${imageUrl.trim()}" alt="Attached image" style="max-width: 100%; height: auto;">`
    
    // Append the image to the end of the content with some spacing
    const newContent = content.trim() + (content.trim() ? '<br><br>' : '') + imageTag
    
    setContent(newContent)
    setImageUrl('') // Clear the input after adding
    toast.success('Image URL attached to content!')
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="section">
      <div className="container max-w-5xl">
        <div className="mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-2">
            {mode === 'create' ? 'Create Excerpt' : 'Edit Excerpt'}
          </h1>
          <p className="text-slate-600 text-lg">
            {mode === 'create' ? 'Start crafting your story fragment' : 'Refine your narrative piece'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Title and File Upload Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-4">
              <div className="form-group mb-0">
                <label htmlFor="title" className="form-label text-sm">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input"
                  placeholder="Enter excerpt title..."
                  required
                />
              </div>
            </div>

            <div className="card p-4">
              <div className="form-group mb-0">
                <label className="form-label text-sm">
                  Import From File
                </label>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    accept={FileParser.getSupportedFormats().join(',')}
                    className="hidden"
                    disabled={isUploadingFile}
                  />
                  <button
                    type="button"
                    onClick={triggerFileUpload}
                    disabled={isUploadingFile}
                    className="btn btn-outline btn-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    {isUploadingFile ? 'Processing...' : 'Choose File'}
                  </button>
                  
                  {uploadProgress && (
                    <span className="text-xs text-slate-600 font-medium truncate">
                      {uploadProgress}
                    </span>
                  )}
                </div>
                
                {isUploadingFile && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div className="bg-blue-600 h-1 rounded-full animate-pulse" style={{ width: '70%' }}></div>
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-slate-500 mt-1">
                  Supports: {FileParser.getSupportedFormats().slice(0, 3).join(', ')}...
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Excerpt Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="form-group">
                <label htmlFor="author" className="form-label">
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

              <div className="form-group">
                <label htmlFor="status" className="form-label">
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

              <div className="form-group">
                <label htmlFor="date" className="form-label">
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="form-group">
              <div className="flex items-center justify-between mb-4">
                <label className="form-label mb-0">
                  Content *
                </label>
                <AddReferenceButton onClick={handleAddReference} />
              </div>
              <div className="rounded-xl overflow-hidden border border-slate-200 mt-2">
                <QuillEditor
                  value={content}
                  onChange={setContent}
                  onSelectionChange={handleSelectionChange}
                  quillRef={quillRef}
                  placeholder="Start writing your excerpt..."
                  className="min-h-[400px]"
                />
              </div>
              <div className="mt-3 text-sm text-slate-500 font-medium">
                Word count: {getWordCount(content)}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="form-group">
              <label className="form-label">
                Attach Images
              </label>
              <p className="text-sm text-slate-600 mb-4">
                Add images to your excerpt. They will appear at the end of your content.
              </p>
              
              <div className="space-y-4">
                {/* File Upload Option */}
                <div>
                  <input
                    type="file"
                    id="image-file-input"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('image-file-input')?.click()}
                    className="btn btn-primary flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload Image File
                  </button>
                </div>

                {/* URL Input Option */}
                <div className="border-t pt-4">
                  <p className="text-xs text-slate-500 mb-2">Or paste an image URL:</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <input
                        type="url"
                        id="image-url-input"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="input"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAttachImage}
                      disabled={!imageUrl.trim()}
                      className="btn btn-secondary"
                    >
                      Add URL
                    </button>
                  </div>
                </div>
              </div>

              {imageUrl && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-slate-700 mb-3">Preview:</p>
                  <img 
                    src={imageUrl} 
                    alt="Preview" 
                    className="max-w-xs max-h-48 rounded-xl border border-slate-200 shadow-sm"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="form-group">
              <label className="form-label">
                Tags
              </label>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="tag inline-flex items-center"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-slate-400 hover:text-red-500 w-4 h-4 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-3">
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
                  className="input flex-1"
                  placeholder="Add a tag..."
                />
                <button
                  type="button"
                  onClick={() => addTag(newTag)}
                  className="btn btn-secondary"
                >
                  Add Tag
                </button>
              </div>

              {availableTags.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-slate-600 mb-3">Suggested tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {availableTags
                      .filter(tag => !tags.includes(tag))
                      .map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => addTag(tag)}
                          className="tag border-dashed border-slate-300 text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                        >
                          + {tag}
                        </button>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* References List */}
          {references.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">
                References ({references.length})
              </h3>
              <ReferenceManager
                references={references}
                citations={citations}
                onReferencesChange={setReferences}
                onCitationsChange={setCitations}
              />
            </div>
          )}

          <div className="divider"></div>

          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">
              Your work is automatically saved as you type
            </p>
            <div className="flex space-x-4">
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
                className="btn btn-primary btn-lg"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" color="white" className="mr-2" />
                    Saving...
                  </>
                ) : mode === 'create' ? 'Create Excerpt' : 'Update Excerpt'}
              </button>
            </div>
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

        {/* Category Assignment Modal */}
        {showCategoryAssignmentModal && (
          <CategoryAssignmentModal
            tagName={selectedTagForAssignment}
            currentCategoryIds={storage.getTagCategories(selectedTagForAssignment).map(cat => cat.id)}
            onAssign={handleCategoryAssignment}
            onClose={() => {
              setShowCategoryAssignmentModal(false)
              setSelectedTagForAssignment('')
              setNewTag('')
            }}
          />
        )}
      </div>
    </div>
  )
}