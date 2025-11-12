'use client'

import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { PlusIcon, XMarkIcon, BookOpenIcon, GlobeAltIcon, NewspaperIcon, PencilIcon } from '@heroicons/react/24/outline'
import { Reference, Citation } from '@/types'

interface ReferenceManagerProps {
  references: Reference[]
  citations: Citation[]
  onReferencesChange: (references: Reference[]) => void
  onCitationsChange: (citations: Citation[]) => void
  onClose?: () => void
}

export default function ReferenceManager({
  references,
  citations,
  onReferencesChange,
  onCitationsChange,
  onClose
}: ReferenceManagerProps) {
  const [showAddReference, setShowAddReference] = useState(false)
  const [editingReference, setEditingReference] = useState<Reference | null>(null)

  const [newReference, setNewReference] = useState<Partial<Reference>>({
    type: 'book',
    title: '',
    author: '',
    year: new Date().getFullYear()
  })


  const startEditingReference = (reference: Reference) => {
    setEditingReference(reference)
    setNewReference({
      type: reference.type,
      title: reference.title,
      author: reference.author,
      publication: reference.publication,
      year: reference.year,
      volume: reference.volume,
      issue: reference.issue,
      pages: reference.pages,
      url: reference.url,
      doi: reference.doi,
      accessDate: reference.accessDate,
      publisher: reference.publisher,
      location: reference.location,
      isbn: reference.isbn
    })
    setShowAddReference(true)
  }

  const saveReference = () => {
    if (!newReference.title || !newReference.author) {
      console.error('Please provide at least title and author')
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
      console.log('Reference updated successfully!')
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
      console.log('Reference added successfully!')
    }

    // Reset form
    setNewReference({
      type: 'book',
      title: '',
      author: '',
      year: new Date().getFullYear()
    })
    setEditingReference(null)
    setShowAddReference(false)
  }

  const cancelEditing = () => {
    setNewReference({
      type: 'book',
      title: '',
      author: '',
      year: new Date().getFullYear()
    })
    setEditingReference(null)
    setShowAddReference(false)
    if (onClose) onClose()
  }

  const deleteReference = (id: string) => {
    // Find all citations that reference this reference
    const citationsToDelete = citations.filter(citation => citation.referenceId === id)
    
    if (citationsToDelete.length > 0) {
      // Remove all citations that reference this reference
      const remainingCitations = citations.filter(citation => citation.referenceId !== id)
      onCitationsChange(remainingCitations)
    }

    // Remove the reference
    onReferencesChange(references.filter(ref => ref.id !== id))
    
    const citationCount = citationsToDelete.length
    if (citationCount > 0) {
      console.log(`Reference deleted and ${citationCount} citation${citationCount > 1 ? 's' : ''} removed`)
    } else {
      console.log('Reference deleted')
    }
  }

  const formatReference = (ref: Reference) => {
    // Basic APA formatting - you can expand this for other styles
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

  return (
    <div className="space-y-6">
      {/* References List */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">
            References ({references.length})
          </h3>
          <button
            type="button"
            onClick={() => {
              setEditingReference(null)
              setNewReference({
                type: 'book',
                title: '',
                author: '',
                year: new Date().getFullYear()
              })
              setShowAddReference(!showAddReference)
            }}
            className="btn btn-primary btn-sm"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Reference
          </button>
        </div>

        {references.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <BookOpenIcon className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-600">No references yet. Add your first reference to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {references.map((reference) => (
              <div key={reference.id} className="card p-4 hover:bg-white/90 transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeIcon(reference.type)}
                      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        {reference.type}
                      </span>
                    </div>
                    <p className="text-sm text-slate-900 leading-relaxed">
                      {formatReference(reference)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      type="button"
                      onClick={() => startEditingReference(reference)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1.5 rounded-lg transition-all duration-200"
                      title="Edit reference"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteReference(reference.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-all duration-200"
                      title="Delete reference"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Reference Modal */}
      {showAddReference && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200/60">
              <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200/60 p-6 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {editingReference ? 'Edit Reference' : 'Add New Reference'}
                  </h3>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-all duration-200"
                  >
                    ×
                  </button>
                </div>
                <p className="text-sm text-slate-600 mt-3">
                  Fields marked with <span className="text-red-500 font-semibold">*</span> are required
                </p>
              </div>
              
              <div className="p-6">
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">
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

              <div className="form-group">
                <label className="form-label">
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

            <div className="form-group">
              <label className="form-label">
                Title <span className="text-red-500 font-semibold">*</span>
              </label>
              <input
                type="text"
                value={newReference.title || ''}
                onChange={(e) => {
                  setNewReference({ ...newReference, title: e.target.value })
                }}
                className={`input ${!newReference.title ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                placeholder="Enter title (required)..."
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Author <span className="text-red-500 font-semibold">*</span>
              </label>
              <input
                type="text"
                value={newReference.author || ''}
                onChange={(e) => {
                  setNewReference({ ...newReference, author: e.target.value })
                }}
                className={`input ${!newReference.author ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                placeholder="Last, F. M. (required)..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">
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

              <div className="form-group">
                <label className="form-label">
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
              <div className="form-group">
                <label className="form-label">
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
                {editingReference ? 'Update Reference' : 'Add Reference'}
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                className="btn btn-ghost"
              >
                Cancel
              </button>
            </div>
          </div>
              </div>
            </div>
          </div>
      )}

      {/* Citations Summary */}
      {citations.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Citations in Text ({citations.length})
          </h3>
          <div className="space-y-2">
            {citations.map((citation, index) => {
              const reference = references.find(ref => ref.id === citation.referenceId)
              return (
                <div key={citation.id} className="text-sm bg-slate-50/80 backdrop-blur-sm p-3 rounded-xl border border-slate-200/60">
                  <span className="font-semibold text-blue-600">[{index + 1}]</span> "{citation.text}" 
                  {reference && (
                    <span className="text-slate-600 ml-2">
                      → {reference.author} ({reference.year})
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// Simple button component for adding references (to be placed in top right)
interface AddReferenceButtonProps {
  onClick: () => void
}

export function AddReferenceButton({ onClick }: AddReferenceButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn btn-primary"
    >
      <PlusIcon className="w-4 h-4 mr-2" />
      Add Reference
    </button>
  )
}