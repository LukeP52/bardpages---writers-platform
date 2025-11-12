'use client'

import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { PlusIcon, XMarkIcon, BookOpenIcon, GlobeAltIcon, NewspaperIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline'
import { Reference, Citation } from '@/types'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface SortableCitationItemProps {
  citation: Citation
  index: number
  reference?: Reference
  onDelete: (id: string) => void
  onMove: (id: string, position: number) => void
  selectedRange?: { index: number; length: number } | null
}

function SortableCitationItem({ citation, index, reference, onDelete, onMove, selectedRange }: SortableCitationItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: citation.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
    >
      <div className="flex-1 flex items-center gap-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab hover:cursor-grabbing p-1 text-slate-400 hover:text-slate-600"
        >
          <ArrowsUpDownIcon className="w-4 h-4" />
        </div>
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
      </div>
      <div className="flex gap-2">
        {selectedRange && (
          <button
            type="button"
            onClick={() => onMove(citation.id, selectedRange.index + selectedRange.length)}
            className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded hover:bg-blue-50"
            title="Move citation to selected position"
          >
            Move Here
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(citation.id)}
          className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded hover:bg-red-50"
          title="Delete citation"
        >
          ×
        </button>
      </div>
    </div>
  )
}

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
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = citations.findIndex(citation => citation.id === active.id)
      const newIndex = citations.findIndex(citation => citation.id === over?.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedCitations = arrayMove(citations, oldIndex, newIndex)
        
        // Update citation numbers in content
        let newContent = content
        reorderedCitations.forEach((citation, index) => {
          const oldNumber = citations.findIndex(c => c.id === citation.id) + 1
          const newNumber = index + 1
          if (oldNumber !== newNumber) {
            const oldMarker = `<sup>[${oldNumber}]</sup>`
            const newMarker = `<sup>[${newNumber}]</sup>`
            newContent = newContent.replace(oldMarker, newMarker)
          }
        })
        
        onContentChange(newContent)
        onCitationsChange(reorderedCitations)
        console.log('Citations reordered successfully!')
      }
    }
  }
  
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
    if (!selectedRange) {
      console.error('No text selected')
      return
    }

    const noteId = `cite-${Date.now()}`
    const newCitation: Citation = {
      id: uuidv4(),
      referenceId,
      startPos: selectedRange.index,
      endPos: selectedRange.index + selectedRange.length,
      text: selectedText,
      noteId
    }

    // Insert citation marker in content (HTML) - using the proven working approach
    const citationNumber = citations.length + 1
    const citationMarker = `<sup>[${citationNumber}]</sup>`
    
    // Find position in HTML content to insert citation
    // For now, we'll append the citation marker after the selected text
    // This is a simplified approach - in production you'd want more sophisticated HTML manipulation
    let newContent = content
    const textToFind = selectedText
    const firstOccurrence = newContent.indexOf(textToFind)
    if (firstOccurrence !== -1) {
      const beforeText = newContent.substring(0, firstOccurrence + textToFind.length)
      const afterText = newContent.substring(firstOccurrence + textToFind.length)
      newContent = beforeText + citationMarker + afterText
    }

    onContentChange(newContent)
    onCitationsChange([...citations, newCitation])
    
    console.log('Citation added successfully!')
    onClose()
  }

  const deleteCitation = (citationId: string) => {
    const citation = citations.find(c => c.id === citationId)
    if (!citation) {
      console.error('Citation not found')
      return
    }

    const citationIndex = citations.findIndex(c => c.id === citationId) + 1
    const citationMarker = `<sup>[${citationIndex}]</sup>`
    
    // Remove citation marker from content
    let newContent = content.replace(citationMarker, '')
    
    // Remove citation from list
    const updatedCitations = citations.filter(c => c.id !== citationId)
    
    // Renumber all remaining citations in content
    updatedCitations.forEach((cit, index) => {
      const oldMarker = `<sup>[${citations.findIndex(c => c.id === cit.id) + 1}]</sup>`
      const newMarker = `<sup>[${index + 1}]</sup>`
      newContent = newContent.replace(oldMarker, newMarker)
    })
    
    onContentChange(newContent)
    onCitationsChange(updatedCitations)
    
    console.log('Citation deleted and renumbered successfully!')
  }

  const moveCitation = (citationId: string, newPosition: number) => {
    const citation = citations.find(c => c.id === citationId)
    if (!citation) {
      console.error('Citation not found')
      return
    }

    const citationIndex = citations.findIndex(c => c.id === citationId) + 1
    const citationMarker = `<sup>[${citationIndex}]</sup>`

    // Remove the old citation marker and insert at new position
    let newContent = content.replace(citationMarker, '')
    
    // For simplicity, append at end - in a real app you'd want more sophisticated positioning
    newContent += citationMarker
    
    onContentChange(newContent)
    
    // Update citation position in the list
    const updatedCitations = citations.map(c => 
      c.id === citationId 
        ? { ...c, startPos: newPosition, endPos: newPosition + citationMarker.length }
        : c
    )
    
    onCitationsChange(updatedCitations)
    console.log('Citation moved successfully!')
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
                
                {/* Existing Citations Section with Drag & Drop */}
                {citations.length > 0 && (
                  <>
                    <div className="divider"></div>
                    <div className="pt-4">
                      <h4 className="text-sm font-semibold text-slate-700 mb-3">
                        Existing Citations in Document 
                        <span className="text-xs text-slate-500 font-normal ml-2">(drag to reorder)</span>
                      </h4>
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={citations.map(c => c.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-2">
                            {citations.map((citation, index) => {
                              const reference = references.find(r => r.id === citation.referenceId)
                              return (
                                <SortableCitationItem
                                  key={citation.id}
                                  citation={citation}
                                  index={index}
                                  reference={reference}
                                  selectedRange={selectedRange}
                                  onDelete={deleteCitation}
                                  onMove={moveCitation}
                                />
                              )
                            })}
                          </div>
                        </SortableContext>
                      </DndContext>
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
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">
                      Existing Citations in Document 
                      <span className="text-xs text-slate-500 font-normal ml-2">(drag to reorder)</span>
                    </h4>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={citations.map(c => c.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {citations.map((citation, index) => {
                            const reference = references.find(r => r.id === citation.referenceId)
                            return (
                              <SortableCitationItem
                                key={citation.id}
                                citation={citation}
                                index={index}
                                reference={reference}
                                selectedRange={null}
                                onDelete={deleteCitation}
                                onMove={moveCitation}
                              />
                            )
                          })}
                        </div>
                      </SortableContext>
                    </DndContext>
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