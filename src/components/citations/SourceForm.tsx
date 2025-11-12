'use client'

import { useState } from 'react'
import { Source } from '@/types/citations'
import { useCitationStore } from '@/stores/citationStore'
import LoadingSpinner from '@/components/LoadingSpinner'

interface SourceFormProps {
  excerptId: string
  source?: Source | null
  onSave?: (source: Source) => void
  onCancel?: () => void
}

export default function SourceForm({ excerptId, source, onSave, onCancel }: SourceFormProps) {
  const { addSource, updateSource } = useCitationStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    type: source?.type || 'book' as Source['type'],
    title: source?.title || '',
    author: source?.author || '',
    publication: source?.publication || '',
    year: source?.year || new Date().getFullYear(),
    volume: source?.volume || '',
    issue: source?.issue || '',
    pages: source?.pages || '',
    url: source?.url || '',
    doi: source?.doi || '',
    publisher: source?.publisher || '',
    location: source?.location || '',
    isbn: source?.isbn || '',
    accessDate: source?.accessDate || ''
  })

  const handleChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.author.trim()) {
      alert('Title and Author are required fields.')
      return
    }

    setIsSubmitting(true)
    
    try {
      let savedSource: Source
      
      if (source) {
        // Update existing source
        updateSource(excerptId, source.id, formData)
        savedSource = { ...source, ...formData }
      } else {
        // Create new source
        savedSource = addSource(excerptId, formData)
      }
      
      onSave?.(savedSource)
    } catch (error) {
      console.error('Error saving source:', error)
      alert('Failed to save source. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="card max-w-2xl w-full max-h-[90vh] flex flex-col">
      <div className="border-b border-slate-200/60 p-4 flex-shrink-0">
        <h3 className="text-lg font-semibold text-slate-900">
          {source ? 'Edit Source' : 'Add New Source'}
        </h3>
        <p className="text-sm text-slate-600 mt-1">
          Fields marked with <span className="text-red-500">*</span> are required
        </p>
      </div>
      
      <form id="source-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="form-group">
            <label className="form-label">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value as Source['type'])}
              className="input"
              required
            >
              <option value="book">Book</option>
              <option value="journal">Journal Article</option>
              <option value="website">Website</option>
              <option value="newspaper">Newspaper</option>
              <option value="magazine">Magazine</option>
              <option value="thesis">Thesis</option>
              <option value="conference">Conference Paper</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Year <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.year}
              onChange={(e) => handleChange('year', parseInt(e.target.value))}
              className="input"
              min="1900"
              max={new Date().getFullYear() + 10}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className="input"
            placeholder="Enter the title..."
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            Author <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.author}
            onChange={(e) => handleChange('author', e.target.value)}
            className="input"
            placeholder="Last, First M. or Organization Name"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            Publication/Publisher
          </label>
          <input
            type="text"
            value={formData.publication}
            onChange={(e) => handleChange('publication', e.target.value)}
            className="input"
            placeholder="Journal name, publisher, etc."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="form-group">
            <label className="form-label">Volume</label>
            <input
              type="text"
              value={formData.volume}
              onChange={(e) => handleChange('volume', e.target.value)}
              className="input"
              placeholder="Vol. 1"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Issue</label>
            <input
              type="text"
              value={formData.issue}
              onChange={(e) => handleChange('issue', e.target.value)}
              className="input"
              placeholder="No. 2"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Pages</label>
            <input
              type="text"
              value={formData.pages}
              onChange={(e) => handleChange('pages', e.target.value)}
              className="input"
              placeholder="123-145"
            />
          </div>
        </div>

        {(formData.type === 'website' || formData.type === 'journal') && (
          <div className="form-group">
            <label className="form-label">URL</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => handleChange('url', e.target.value)}
              className="input"
              placeholder="https://example.com"
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="form-group">
            <label className="form-label">DOI</label>
            <input
              type="text"
              value={formData.doi}
              onChange={(e) => handleChange('doi', e.target.value)}
              className="input"
              placeholder="10.1000/xyz123"
            />
          </div>

          {formData.type === 'website' && (
            <div className="form-group">
              <label className="form-label">Access Date</label>
              <input
                type="date"
                value={formData.accessDate}
                onChange={(e) => handleChange('accessDate', e.target.value)}
                className="input"
              />
            </div>
          )}
        </div>

        {formData.type === 'book' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Publisher</label>
              <input
                type="text"
                value={formData.publisher}
                onChange={(e) => handleChange('publisher', e.target.value)}
                className="input"
                placeholder="Publisher name"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                className="input"
                placeholder="City, State"
              />
            </div>
          </div>
        )}

        </div>
      </form>
      
      <div className="border-t border-slate-200/60 p-4 flex-shrink-0">
        <div className="flex gap-3">
          <button
            type="submit"
            form="source-form"
            disabled={isSubmitting || !formData.title.trim() || !formData.author.trim()}
            className="btn btn-primary"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" color="white" className="mr-2" />
                Saving...
              </>
            ) : (
              source ? 'Update Source' : 'Add Source'
            )}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-ghost"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}