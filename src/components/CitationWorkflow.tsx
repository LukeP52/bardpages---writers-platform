'use client'

import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { PlusIcon, XMarkIcon, BookOpenIcon, GlobeAltIcon, NewspaperIcon } from '@heroicons/react/24/outline'
import { Reference, Citation } from '@/types'
import toast from 'react-hot-toast'

interface CitationWorkflowProps {
  references: Reference[]
  citations: Citation[]
  selectedText: string
  selectedRange: { start: number; end: number } | null
  content: string
  onReferencesChange: (references: Reference[]) => void
  onCitationsChange: (citations: Citation[]) => void
  onContentChange: (content: string) => void
  onClose: () => void
}

export default function CitationWorkflow({
  references,
  citations,
  selectedText,
  selectedRange,
  content,
  onReferencesChange,
  onCitationsChange,
  onContentChange,
  onClose
}: CitationWorkflowProps) {
  const [step, setStep] = useState<'reference' | 'citation'>('reference')
  const [editingReference, setEditingReference] = useState<Reference | null>(null)
  
  const [newReference, setNewReference] = useState<Partial<Reference>>({
    type: 'book',
    title: '',
    author: '',
    year: new Date().getFullYear()
  })

  const saveReference = () => {
    if (!newReference.title || !newReference.author) {
      toast.error('Please provide at least title and author')
      return
    }

    if (editingReference) {
      // Update existing reference
      const updatedReference: Reference = {
        ...editingReference,
        type: newReference.type as any,
        title: newReference.title,
        author: newReference.author,
        publication: newReference.publication,
        year: newReference.year || new Date().getFullYear(),
        volume: newReference.volume,
        issue: newReference.issue,
        pages: newReference.pages,
        url: newReference.url,
        doi: newReference.doi,
        accessDate: newReference.accessDate,
        publisher: newReference.publisher,
        location: newReference.location,
        isbn: newReference.isbn
      }

      onReferencesChange(references.map(ref => 
        ref.id === editingReference.id ? updatedReference : ref
      ))
      toast.success('Reference updated successfully!')
    } else {
      // Add new reference
      const reference: Reference = {
        id: uuidv4(),
        type: newReference.type as any,
        title: newReference.title,
        author: newReference.author,
        publication: newReference.publication,
        year: newReference.year || new Date().getFullYear(),
        volume: newReference.volume,
        issue: newReference.issue,
        pages: newReference.pages,
        url: newReference.url,
        doi: newReference.doi,
        accessDate: newReference.accessDate,
        publisher: newReference.publisher,
        location: newReference.location,
        isbn: newReference.isbn,
        createdAt: new Date()
      }

      onReferencesChange([...references, reference])
      toast.success('Reference added successfully!')
    }

    // Move to citation step if text is selected
    if (selectedText && selectedRange) {
      setStep('citation')
    } else {
      onClose()
    }
  }

  const addCitation = (referenceId: string) => {
    if (!selectedRange) {
      toast.error('No text selected')
      return
    }

    const noteId = `cite-${Date.now()}`
    const newCitation: Citation = {
      id: uuidv4(),
      referenceId,
      startPos: selectedRange.start,
      endPos: selectedRange.end,
      text: selectedText,
      noteId
    }

    // Insert citation marker in content
    const beforeText = content.substring(0, selectedRange.end)
    const afterText = content.substring(selectedRange.end)
    const citationNumber = citations.length + 1
    const newContent = `${beforeText}[${citationNumber}]${afterText}`

    onContentChange(newContent)
    onCitationsChange([...citations, newCitation])
    
    toast.success('Citation added successfully!')
    onClose()
  }

  const formatReference = (ref: Reference) => {
    switch (ref.type) {
      case 'book':
        return `${ref.author} (${ref.year}). ${ref.title}. ${ref.publisher ? `${ref.publisher}.` : ''}`
      case 'journal':
        return `${ref.author} (${ref.year}). ${ref.title}. ${ref.publication}, ${ref.volume}${ref.issue ? `(${ref.issue})` : ''}, ${ref.pages}.`
      case 'website':
        return `${ref.author} (${ref.year}). ${ref.title}. Retrieved from ${ref.url}`
      default:
        return `${ref.author} (${ref.year}). ${ref.title}.`
    }
  }

  const getTypeIcon = (type: Reference['type']) => {
    switch (type) {
      case 'book': return <BookOpenIcon className="w-4 h-4" />
      case 'website': return <GlobeAltIcon className="w-4 h-4" />
      case 'journal':
      case 'newspaper':
      case 'magazine':
        return <NewspaperIcon className="w-4 h-4" />
      default: return <BookOpenIcon className="w-4 h-4" />
    }
  }

  if (step === 'citation') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white border-2 border-black max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b-2 border-black p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-black tracking-wide">
                CITE SELECTED TEXT
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="text-black hover:bg-black hover:text-white p-2 font-bold text-xl"
              >
                ×
              </button>
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">
                <strong>Selected text:</strong> "{selectedText}"
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Choose which reference to cite this text with:
              </p>
            </div>
          </div>
          
          <div className="p-6">
            {references.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpenIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No references available. Please add a reference first.</p>
                <button
                  type="button"
                  onClick={() => setStep('reference')}
                  className="btn btn-primary mt-4"
                >
                  Add Reference
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {references.map((reference) => (
                  <div key={reference.id} className="border border-gray-200 rounded p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer"
                       onClick={() => addCitation(reference.id)}>
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeIcon(reference.type)}
                      <span className="text-xs font-bold text-gray-600 uppercase">
                        {reference.type}
                      </span>
                    </div>
                    <p className="text-sm font-mono text-black">
                      {formatReference(reference)}
                    </p>
                  </div>
                ))}
                
                <div className="border-t pt-4 mt-4">
                  <button
                    type="button"
                    onClick={() => setStep('reference')}
                    className="btn btn-outline w-full"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add New Reference
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Reference step (same as before but simplified)
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-2 border-black max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b-2 border-black p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-black tracking-wide">
              {editingReference ? 'EDIT REFERENCE' : 'ADD NEW REFERENCE'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-black hover:bg-black hover:text-white p-2 font-bold text-xl"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Fields marked with <span className="text-red-500 font-bold">*</span> are required
          </p>
          {selectedText && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-xs text-yellow-800">
                After adding this reference, you'll be able to cite: "{selectedText}"
              </p>
            </div>
          )}
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                  Type
                </label>
                <select
                  value={newReference.type}
                  onChange={(e) => setNewReference({ ...newReference, type: e.target.value as any })}
                  className="input"
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

              <div>
                <label className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                  Year
                </label>
                <input
                  type="number"
                  value={newReference.year}
                  onChange={(e) => setNewReference({ ...newReference, year: parseInt(e.target.value) })}
                  className="input"
                  min="1900"
                  max={new Date().getFullYear() + 10}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                Title <span className="text-red-500 text-lg">*</span>
              </label>
              <input
                type="text"
                value={newReference.title || ''}
                onChange={(e) => setNewReference({ ...newReference, title: e.target.value })}
                className={`input ${!newReference.title ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                placeholder="Enter title (required)..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                Author <span className="text-red-500 text-lg">*</span>
              </label>
              <input
                type="text"
                value={newReference.author || ''}
                onChange={(e) => setNewReference({ ...newReference, author: e.target.value })}
                className={`input ${!newReference.author ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                placeholder="Last, F. M. (required)..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                  Publication/Publisher
                </label>
                <input
                  type="text"
                  value={newReference.publication || ''}
                  onChange={(e) => setNewReference({ ...newReference, publication: e.target.value })}
                  className="input"
                  placeholder="Journal name, publisher, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                  Pages
                </label>
                <input
                  type="text"
                  value={newReference.pages || ''}
                  onChange={(e) => setNewReference({ ...newReference, pages: e.target.value })}
                  className="input"
                  placeholder="e.g., 123-145"
                />
              </div>
            </div>

            {(newReference.type === 'website' || newReference.type === 'journal') && (
              <div>
                <label className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                  URL
                </label>
                <input
                  type="url"
                  value={newReference.url || ''}
                  onChange={(e) => setNewReference({ ...newReference, url: e.target.value })}
                  className="input"
                  placeholder="https://..."
                />
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={saveReference}
                className="btn btn-primary"
                disabled={!newReference.title || !newReference.author}
              >
                {selectedText ? 'Save & Continue to Citation' : (editingReference ? 'Update Reference' : 'Add Reference')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}