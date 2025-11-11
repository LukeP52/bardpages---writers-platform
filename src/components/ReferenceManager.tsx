'use client'

import { useState, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { PlusIcon, XMarkIcon, BookOpenIcon, GlobeAltIcon, NewspaperIcon } from '@heroicons/react/24/outline'
import { Reference, Citation } from '@/types'
import toast from 'react-hot-toast'

interface ReferenceManagerProps {
  references: Reference[]
  citations: Citation[]
  content: string
  onReferencesChange: (references: Reference[]) => void
  onCitationsChange: (citations: Citation[]) => void
  onContentChange: (content: string) => void
}

export default function ReferenceManager({
  references,
  citations,
  content,
  onReferencesChange,
  onCitationsChange,
  onContentChange
}: ReferenceManagerProps) {
  const [showAddReference, setShowAddReference] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)

  const [newReference, setNewReference] = useState<Partial<Reference>>({
    type: 'book',
    title: '',
    author: '',
    year: new Date().getFullYear()
  })

  const handleTextSelection = () => {
    if (!contentRef.current) return

    const textarea = contentRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    if (start !== end) {
      const selected = content.substring(start, end)
      setSelectedText(selected)
      setSelectedRange({ start, end })
    } else {
      setSelectedText('')
      setSelectedRange(null)
    }
  }

  const addCitation = (referenceId: string) => {
    if (!selectedRange) {
      toast.error('Please select text to cite first')
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
    
    setSelectedText('')
    setSelectedRange(null)
    toast.success('Citation added successfully!')
  }

  const addReference = () => {
    console.log('addReference called')
    console.log('newReference state:', newReference)
    console.log('Validation check - title:', newReference.title, 'author:', newReference.author)
    
    if (!newReference.title || !newReference.author) {
      console.log('Validation failed - missing title or author')
      toast.error('Please provide at least title and author')
      return
    }

    console.log('Validation passed, creating reference...')

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

    console.log('Created reference:', reference)
    console.log('Current references array:', references)
    console.log('Calling onReferencesChange with:', [...references, reference])

    onReferencesChange([...references, reference])
    setNewReference({
      type: 'book',
      title: '',
      author: '',
      year: new Date().getFullYear()
    })
    setShowAddReference(false)
    toast.success('Reference added successfully!')
    
    console.log('addReference completed')
  }

  const deleteReference = (id: string) => {
    // Check if reference is used in citations
    const usedInCitations = citations.some(citation => citation.referenceId === id)
    
    if (usedInCitations) {
      toast.error('Cannot delete reference that is cited in the text')
      return
    }

    onReferencesChange(references.filter(ref => ref.id !== id))
    toast.success('Reference deleted')
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
      {/* Text Editor with Selection */}
      <div>
        <label className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
          Content with Citations
        </label>
        <textarea
          ref={contentRef}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          onSelect={handleTextSelection}
          onMouseUp={handleTextSelection}
          onKeyUp={handleTextSelection}
          className="input min-h-[200px] font-mono text-sm"
          placeholder="Write your content here. Select text and add references to create citations..."
        />
        
        {selectedText && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              <strong>Selected text:</strong> "{selectedText}"
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Choose a reference below to cite this text, or add a new reference.
            </p>
          </div>
        )}
      </div>

      {/* References List */}
      <div className="border-2 border-black bg-white">
        <div className="p-4 border-b-2 border-black flex items-center justify-between">
          <h3 className="text-lg font-bold text-black tracking-wide">
            REFERENCES ({references.length})
          </h3>
          <button
            type="button"
            onClick={() => setShowAddReference(!showAddReference)}
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
                      {selectedText && (
                        <button
                          type="button"
                          onClick={() => addCitation(reference.id)}
                          className="btn btn-primary btn-sm"
                        >
                          CITE
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteReference(reference.id)}
                        className="text-red-600 hover:text-red-800 p-1"
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

      {/* Add Reference Form */}
      {showAddReference && (() => {
        console.log('Add Reference Form is rendering')
        console.log('Current newReference state:', newReference)
        return (
          <div className="border-2 border-black bg-white p-6">
            <h3 className="text-lg font-bold text-black mb-4 tracking-wide">
              ADD NEW REFERENCE
            </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                  Type *
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
                  Year *
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
                Title *
              </label>
              <input
                type="text"
                value={newReference.title || ''}
                onChange={(e) => {
                  console.log('Title changing to:', e.target.value)
                  setNewReference({ ...newReference, title: e.target.value })
                }}
                className="input"
                placeholder="Enter title..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                Author *
              </label>
              <input
                type="text"
                value={newReference.author || ''}
                onChange={(e) => {
                  console.log('Author changing to:', e.target.value)
                  setNewReference({ ...newReference, author: e.target.value })
                }}
                className="input"
                placeholder="Last, F. M."
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
                onClick={() => {
                  console.log('Add Reference button clicked!')
                  console.log('Button disabled state:', !newReference.title || !newReference.author)
                  console.log('newReference at button click:', newReference)
                  addReference()
                }}
                className="btn btn-primary"
                disabled={!newReference.title || !newReference.author}
              >
                Add Reference
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log('Cancel button clicked!')
                  setShowAddReference(false)
                }}
                className="btn btn-ghost"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
        )
      })()}

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