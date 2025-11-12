'use client'

import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { PlusIcon, XMarkIcon, BookOpenIcon, GlobeAltIcon, NewspaperIcon } from '@heroicons/react/24/outline'
import { Reference, Citation } from '@/types'

interface CitationWorkflowProps {
  references: Reference[]
  citations: Citation[]
  selectedText: string
  selectedRange: { index: number; length: number } | null
  content: string
  quillRef: React.MutableRefObject<any | null>
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
  quillRef,
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

    // Move to citation step if text is selected
    if (selectedText && selectedRange) {
      setStep('citation')
    } else {
      onClose()
    }
  }

  const addCitation = (referenceId: string) => {
    if (!selectedRange || !quillRef.current) {
      console.error('No text selected or editor not available')
      return
    }

    const noteId = `cite-${Date.now()}`
    
    // Calculate citation number (should be sequential)
    const citationNumber = citations.length + 1
    
    // Use Quill's API to insert citation at the exact position
    const quill = quillRef.current
    const insertPosition = selectedRange.index + selectedRange.length
    
    console.log('Adding citation:', {
      citationNumber,
      insertPosition,
      selectedRange,
      selectedText,
      editorAvailable: !!quill
    })
    
    try {
      // Insert the citation marker using Quill 2.0+ API
      const citationText = `[${citationNumber}]`
      
      // Insert text with formatting in one operation (more reliable approach)
      quill.insertText(insertPosition, citationText, {
        'script': 'super',
        'color': '#2563eb',
        'bold': true
      })
      
      // Create citation object with updated positions
      const newCitation: Citation = {
        id: uuidv4(),
        referenceId,
        startPos: selectedRange.index,
        endPos: selectedRange.index + selectedRange.length + citationText.length,
        text: selectedText,
        noteId
      }

      // Update citations list - Quill's onChange will handle content updates automatically
      onCitationsChange([...citations, newCitation])
      
      console.log('Citation added successfully at position:', insertPosition)
      onClose()
    } catch (error) {
      console.error('Error adding citation:', error)
      console.error('Failed to add citation. Please try again.')
    }
  }

  const deleteCitation = (citationId: string) => {
    if (!quillRef.current) {
      console.error('Editor not available')
      return
    }

    const citation = citations.find(c => c.id === citationId)
    if (!citation) {
      console.error('Citation not found')
      return
    }

    const quill = quillRef.current
    const citationIndex = citations.findIndex(c => c.id === citationId) + 1
    const citationText = `[${citationIndex}]`
    
    // Search for the citation in the document
    const delta = quill.getContents()
    let position = 0
    let found = false
    
    delta.ops.forEach((op: any) => {
      if (op.insert && typeof op.insert === 'string') {
        const textIndex = op.insert.indexOf(citationText)
        if (textIndex !== -1) {
          // Check if this text has superscript formatting
          if (op.attributes && op.attributes.script === 'super') {
            quill.deleteText(position + textIndex, citationText.length)
            found = true
            return
          }
        }
        position += op.insert.length
      }
    })

    if (!found) {
      console.warn('Citation not found in editor, removing from list anyway')
    }

    // Remove citation from list
    const updatedCitations = citations.filter(c => c.id !== citationId)
    onCitationsChange(updatedCitations)
    
    console.log('Citation deleted successfully!')
  }

  const moveCitation = (citationId: string, newPosition: number) => {
    if (!quillRef.current) {
      console.error('Editor not available')
      return
    }

    const citation = citations.find(c => c.id === citationId)
    if (!citation) {
      console.error('Citation not found')
      return
    }

    const quill = quillRef.current
    const citationIndex = citations.findIndex(c => c.id === citationId) + 1
    const citationText = `[${citationIndex}]`

    // First delete the citation
    deleteCitation(citationId)
    
    // Small delay to ensure deletion is processed, then re-add at new position
    setTimeout(() => {
      if (quillRef.current) {
        try {
          // Re-insert the citation at the new position using Quill 2.0+ API
          quill.insertText(newPosition, citationText, {
            'script': 'super',
            'color': '#2563eb',
            'bold': true
          })

          // Update citation position in the list
          const updatedCitations = citations.map(c => 
            c.id === citationId 
              ? { ...c, startPos: newPosition, endPos: newPosition + citationText.length }
              : c
          )
          
          onCitationsChange(updatedCitations)
          console.log('Citation moved successfully!')
        } catch (error) {
          console.error('Error moving citation:', error)
          console.error('Failed to move citation. Please try again.')
        }
      }
    }, 100)
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
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200/60">
          <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200/60 p-6 rounded-t-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Citations & References
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-all duration-200"
              >
                ×
              </button>
            </div>
            {selectedText && (
              <div className="mt-4 p-3 bg-blue-50/80 border border-blue-200/60 rounded-xl backdrop-blur-sm">
                <p className="text-sm text-blue-800 font-medium">
                  <strong>Selected text:</strong> "{selectedText}"
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Choose which reference to cite this text with, or manage existing citations below:
                </p>
              </div>
            )}
            {!selectedText && citations.length > 0 && (
              <div className="mt-4 p-3 bg-amber-50/80 border border-amber-200/60 rounded-xl backdrop-blur-sm">
                <p className="text-sm text-amber-800 font-medium">
                  Manage existing citations
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Select text first to add new citations, or edit existing ones below.
                </p>
              </div>
            )}
          </div>
          
          <div className="p-6">
            {selectedText && references.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <BookOpenIcon className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-600 mb-4">No references available. Please add a reference first.</p>
                <button
                  type="button"
                  onClick={() => setStep('reference')}
                  className="btn btn-primary"
                >
                  Add Reference
                </button>
              </div>
            ) : selectedText ? (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Choose a Reference to Cite</h4>
                {references.map((reference) => (
                  <div key={reference.id} className="card p-4 hover:bg-white/90 cursor-pointer transition-all duration-200 hover:transform hover:scale-[1.02]"
                       onClick={() => addCitation(reference.id)}>
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
                ))}
                
                {/* Existing Citations Section */}
                {citations.length > 0 && (
                  <>
                    <div className="divider"></div>
                    <div className="pt-4">
                      <h4 className="text-sm font-semibold text-slate-700 mb-3">Existing Citations in Document</h4>
                      <div className="space-y-2">
                        {citations.map((citation, index) => {
                          const reference = references.find(r => r.id === citation.referenceId)
                          return (
                            <div key={citation.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <div className="flex-1">
                                <span className="inline-flex items-center text-xs font-mono px-2 py-1 bg-blue-100 text-blue-800 rounded mr-2">
                                  [{index + 1}]
                                </span>
                                <span className="text-sm text-slate-600">
                                  "{citation.text}"
                                </span>
                                {reference && (
                                  <div className="text-xs text-slate-500 mt-1">
                                    {reference.author} ({reference.year})
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (quillRef.current && selectedRange) {
                                      // Move citation to current selection position
                                      moveCitation(citation.id, selectedRange.index + selectedRange.length)
                                    }
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded hover:bg-blue-50"
                                  title="Move citation to selected position"
                                  disabled={!selectedRange}
                                >
                                  Move Here
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteCitation(citation.id)}
                                  className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded hover:bg-red-50"
                                  title="Delete citation"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}

                <div className="divider"></div>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => setStep('reference')}
                    className="btn btn-secondary w-full"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add New Reference
                  </button>
                </div>
              </div>
            ) : (
              // No text selected - show citation management only
              <div className="space-y-3">
                {citations.length > 0 ? (
                  <>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">Existing Citations in Document</h4>
                    <div className="space-y-2">
                      {citations.map((citation, index) => {
                        const reference = references.find(r => r.id === citation.referenceId)
                        return (
                          <div key={citation.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex-1">
                              <span className="inline-flex items-center text-xs font-mono px-2 py-1 bg-blue-100 text-blue-800 rounded mr-2">
                                [{index + 1}]
                              </span>
                              <span className="text-sm text-slate-600">
                                "{citation.text}"
                              </span>
                              {reference && (
                                <div className="text-xs text-slate-500 mt-1">
                                  {reference.author} ({reference.year})
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => deleteCitation(citation.id)}
                                className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded hover:bg-red-50"
                                title="Delete citation"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <BookOpenIcon className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-600 mb-4">No citations yet. Select text in the editor, then click "Add Reference" to add citations.</p>
                  </div>
                )}
                
                <div className="divider"></div>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => setStep('reference')}
                    className="btn btn-secondary w-full"
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
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200/60">
        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200/60 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">
              {editingReference ? 'Edit Reference' : 'Add New Reference'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-all duration-200"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-slate-600 mt-2">
            Fields marked with <span className="text-red-500 font-semibold">*</span> are required
          </p>
          {selectedText && (
            <div className="mt-3 p-3 bg-amber-50/80 border border-amber-200/60 rounded-xl backdrop-blur-sm">
              <p className="text-xs text-amber-800 font-medium">
                After adding this reference, you'll be able to cite: "{selectedText}"
              </p>
            </div>
          )}
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
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

              <div>
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

            <div>
              <label className="form-label">
                Title <span className="text-red-500 font-semibold">*</span>
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
              <label className="form-label">
                Author <span className="text-red-500 font-semibold">*</span>
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

              <div>
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
              <div>
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