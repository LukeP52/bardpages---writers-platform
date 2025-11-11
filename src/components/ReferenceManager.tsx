'use client'

import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { PlusIcon, XMarkIcon, BookOpenIcon, GlobeAltIcon, NewspaperIcon, PencilIcon } from '@heroicons/react/24/outline'
import { Reference, Citation } from '@/types'
import toast from 'react-hot-toast'

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
      toast.success(`Reference deleted and ${citationCount} citation${citationCount > 1 ? 's' : ''} removed`)
    } else {
      toast.success('Reference deleted')
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
      <div className="border-2 border-black bg-white">
        <div className="p-4 border-b-2 border-black flex items-center justify-between">
          <h3 className="text-lg font-bold text-black tracking-wide">
            REFERENCES ({references.length})
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
            <PlusIcon className="w-4 h-4 mr-1" />
            ADD REFERENCE
          </button>
        </div>

        <div className="p-4">
          {references.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BookOpenIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No references yet. Add your first reference to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {references.map((reference) => (
                <div key={reference.id} className="border border-gray-200 rounded p-4 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
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
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        type="button"
                        onClick={() => startEditingReference(reference)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Edit reference"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteReference(reference.id)}
                        className="text-red-600 hover:text-red-800 p-1"
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
      </div>

      {/* Add Reference Modal */}
      {showAddReference && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white border-2 border-black max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b-2 border-black p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-black tracking-wide">
                    {editingReference ? 'EDIT REFERENCE' : 'ADD NEW REFERENCE'}
                  </h3>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="text-black hover:bg-black hover:text-white p-2 font-bold text-xl"
                  >
                    ×
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Fields marked with <span className="text-red-500 font-bold">*</span> are required
                </p>
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
                onChange={(e) => {
                  setNewReference({ ...newReference, title: e.target.value })
                }}
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
                onChange={(e) => {
                  setNewReference({ ...newReference, author: e.target.value })
                }}
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
        <div className="border-2 border-black bg-white p-4">
          <h3 className="text-lg font-bold text-black mb-4 tracking-wide">
            CITATIONS IN TEXT ({citations.length})
          </h3>
          <div className="space-y-2">
            {citations.map((citation, index) => {
              const reference = references.find(ref => ref.id === citation.referenceId)
              return (
                <div key={citation.id} className="text-sm bg-gray-50 p-3 rounded">
                  <span className="font-bold">[{index + 1}]</span> "{citation.text}" 
                  {reference && (
                    <span className="text-gray-600 ml-2">
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
      ADD REFERENCE
    </button>
  )
}