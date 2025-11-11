'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Storyboard, Excerpt, StoryboardSection } from '@/types'
import { storage } from '@/lib/storage'
import { v4 as uuidv4 } from 'uuid'

export default function StoryboardEditPage() {
  const params = useParams()
  const router = useRouter()
  const storyboardId = params.id as string
  
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null)
  const [excerpts, setExcerpts] = useState<Excerpt[]>([])
  const [availableExcerpts, setAvailableExcerpts] = useState<Excerpt[]>([])
  const [filteredAvailableExcerpts, setFilteredAvailableExcerpts] = useState<Excerpt[]>([])
  const [draggedExcerpt, setDraggedExcerpt] = useState<Excerpt | null>(null)
  const [draggedSection, setDraggedSection] = useState<StoryboardSection | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [selectedExcerpts, setSelectedExcerpts] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [availableAuthors, setAvailableAuthors] = useState<string[]>([])
  const [filtersExpanded, setFiltersExpanded] = useState(false)

  useEffect(() => {
    const loadedStoryboard = storage.getStoryboard(storyboardId)
    const loadedExcerpts = storage.getExcerpts()
    
    if (!loadedStoryboard) {
      router.push('/storyboards')
      return
    }

    setStoryboard(loadedStoryboard)
    setExcerpts(loadedExcerpts)
    
    // Filter out excerpts that are already in the storyboard
    const usedExcerptIds = new Set(loadedStoryboard.sections.map(section => section.excerptId))
    const available = loadedExcerpts.filter(excerpt => !usedExcerptIds.has(excerpt.id))
    setAvailableExcerpts(available)
    setFilteredAvailableExcerpts(available)
    
    // Set filter options
    setAvailableTags(storage.getAllTags())
    setAvailableAuthors(storage.getUsedAuthors())
  }, [storyboardId, router])

  const getExcerptById = (excerptId: string) => {
    return excerpts.find(excerpt => excerpt.id === excerptId)
  }

  const saveStoryboard = (updatedStoryboard: Storyboard) => {
    const storyboardToSave = {
      ...updatedStoryboard,
      updatedAt: new Date()
    }
    storage.saveStoryboard(storyboardToSave)
    setStoryboard(storyboardToSave)
    
    // Update available excerpts
    const usedExcerptIds = new Set(storyboardToSave.sections.map(section => section.excerptId))
    const available = excerpts.filter(excerpt => !usedExcerptIds.has(excerpt.id))
    setAvailableExcerpts(available)
    applyFilters(available)
  }

  const addExcerptToStoryboard = (excerpt: Excerpt, position?: number) => {
    if (!storyboard) return

    const newSection: StoryboardSection = {
      id: uuidv4(),
      excerptId: excerpt.id,
      order: position ?? storyboard.sections.length,
      notes: ''
    }

    const newSections = [...storyboard.sections]
    
    if (position !== undefined) {
      // Insert at specific position
      newSections.splice(position, 0, newSection)
      // Reorder the sections
      newSections.forEach((section, index) => {
        section.order = index
      })
    } else {
      newSections.push(newSection)
    }

    saveStoryboard({
      ...storyboard,
      sections: newSections
    })
  }

  const removeSection = (sectionId: string) => {
    if (!storyboard) return

    const newSections = storyboard.sections
      .filter(section => section.id !== sectionId)
      .map((section, index) => ({ ...section, order: index }))

    saveStoryboard({
      ...storyboard,
      sections: newSections
    })
  }

  const reorderSections = (fromIndex: number, toIndex: number) => {
    if (!storyboard || fromIndex === toIndex) return

    const newSections = [...storyboard.sections]
    const [movedSection] = newSections.splice(fromIndex, 1)
    newSections.splice(toIndex, 0, movedSection)

    // Update order numbers
    newSections.forEach((section, index) => {
      section.order = index
    })

    saveStoryboard({
      ...storyboard,
      sections: newSections
    })
  }

  const updateSectionNotes = (sectionId: string, notes: string) => {
    if (!storyboard) return

    const newSections = storyboard.sections.map(section =>
      section.id === sectionId ? { ...section, notes } : section
    )

    saveStoryboard({
      ...storyboard,
      sections: newSections
    })
  }

  // Drag and Drop Handlers
  const handleExcerptDragStart = (excerpt: Excerpt) => {
    setDraggedExcerpt(excerpt)
  }

  const handleSectionDragStart = (section: StoryboardSection) => {
    setDraggedSection(section)
  }

  const handleDragOver = (e: React.DragEvent, index?: number) => {
    e.preventDefault()
    if (index !== undefined) {
      setDragOverIndex(index)
    }
  }

  const handleDrop = (e: React.DragEvent, position?: number) => {
    e.preventDefault()
    
    if (draggedExcerpt) {
      addExcerptToStoryboard(draggedExcerpt, position)
    } else if (draggedSection) {
      const fromIndex = storyboard?.sections.findIndex(s => s.id === draggedSection.id) ?? -1
      const toIndex = position ?? storyboard?.sections.length ?? 0
      if (fromIndex !== -1) {
        reorderSections(fromIndex, toIndex)
      }
    }
    
    setDraggedExcerpt(null)
    setDraggedSection(null)
    setDragOverIndex(null)
  }

  const applyFilters = (excerptsList = availableExcerpts) => {
    let filtered = [...excerptsList]

    // Text search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(excerpt =>
        excerpt.title.toLowerCase().includes(query) ||
        excerpt.content.toLowerCase().includes(query) ||
        (excerpt.author && excerpt.author.toLowerCase().includes(query))
      )
    }

    // Tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(excerpt =>
        selectedTags.some(tag => excerpt.tags.includes(tag))
      )
    }

    // Author filter
    if (selectedAuthors.length > 0) {
      filtered = filtered.filter(excerpt =>
        excerpt.author && selectedAuthors.includes(excerpt.author)
      )
    }

    // Date filter
    if (dateFrom || dateTo) {
      filtered = filtered.filter(excerpt => {
        const excerptDate = new Date(excerpt.createdAt)
        const fromDate = dateFrom ? new Date(dateFrom) : null
        const toDate = dateTo ? new Date(dateTo) : null

        if (fromDate && excerptDate < fromDate) return false
        if (toDate && excerptDate > toDate) return false
        return true
      })
    }

    setFilteredAvailableExcerpts(filtered)
  }

  // Apply filters whenever filter criteria changes
  useEffect(() => {
    applyFilters()
  }, [searchQuery, selectedTags, selectedAuthors, dateFrom, dateTo, availableExcerpts])

  const toggleExcerptSelection = (excerptId: string) => {
    const newSelection = new Set(selectedExcerpts)
    if (newSelection.has(excerptId)) {
      newSelection.delete(excerptId)
    } else {
      newSelection.add(excerptId)
    }
    setSelectedExcerpts(newSelection)
  }

  const selectAllVisible = () => {
    const visibleIds = new Set(filteredAvailableExcerpts.map(e => e.id))
    setSelectedExcerpts(visibleIds)
  }

  const clearSelection = () => {
    setSelectedExcerpts(new Set())
  }

  const addSelectedExcerpts = () => {
    if (!storyboard || selectedExcerpts.size === 0) return

    const selectedExcerptList = filteredAvailableExcerpts.filter(e => selectedExcerpts.has(e.id))
    
    selectedExcerptList.forEach((excerpt, index) => {
      setTimeout(() => {
        addExcerptToStoryboard(excerpt)
      }, index * 100) // Stagger the additions slightly
    })

    setSelectedExcerpts(new Set())
  }

  const addAllVisible = () => {
    if (!storyboard || filteredAvailableExcerpts.length === 0) return

    filteredAvailableExcerpts.forEach((excerpt, index) => {
      setTimeout(() => {
        addExcerptToStoryboard(excerpt)
      }, index * 100) // Stagger the additions slightly
    })
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const toggleAuthor = (author: string) => {
    setSelectedAuthors(prev =>
      prev.includes(author) ? prev.filter(a => a !== author) : [...prev, author]
    )
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setSelectedTags([])
    setSelectedAuthors([])
    setDateFrom('')
    setDateTo('')
    setSelectedExcerpts(new Set())
  }

  const getStoryboardStats = () => {
    if (!storyboard) return { sections: 0, words: 0 }
    
    const words = storyboard.sections.reduce((total, section) => {
      const excerpt = getExcerptById(section.excerptId)
      return total + (excerpt?.wordCount || 0)
    }, 0)
    
    return { sections: storyboard.sections.length, words }
  }

  if (!storyboard) {
    return <div>Loading...</div>
  }

  const stats = getStoryboardStats()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.push('/storyboards')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Storyboards
          </button>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{storyboard.title}</h1>
        {storyboard.description && (
          <p className="text-gray-600">{storyboard.description}</p>
        )}
        
        <div className="flex gap-6 mt-4 text-sm text-gray-500">
          <span>{stats.sections} sections</span>
          <span>{stats.words} total words</span>
          <span>Updated {storyboard.updatedAt.toLocaleDateString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Available Excerpts */}
        <div className="lg:col-span-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Available Excerpts</h2>
            <button
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded transition-colors"
            >
              Filters {filtersExpanded ? '−' : '+'}
            </button>
          </div>

          {/* Filters */}
          {filtersExpanded && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 space-y-4">
              {/* Search */}
              <div>
                <input
                  type="text"
                  placeholder="Search excerpts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Tags */}
              {availableTags.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-2">Tags:</p>
                  <div className="flex flex-wrap gap-1">
                    {availableTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-2 py-1 text-xs rounded-full transition-colors ${
                          selectedTags.includes(tag)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Authors */}
              {availableAuthors.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-2">Authors:</p>
                  <div className="flex flex-wrap gap-1">
                    {availableAuthors.map(author => (
                      <button
                        key={author}
                        onClick={() => toggleAuthor(author)}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          selectedAuthors.includes(author)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {author}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Clear Filters */}
              {(searchQuery || selectedTags.length > 0 || selectedAuthors.length > 0 || dateFrom || dateTo) && (
                <button
                  onClick={clearAllFilters}
                  className="w-full text-sm bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}

          {/* Bulk Actions */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={selectAllVisible}
              disabled={filteredAvailableExcerpts.length === 0}
              className="flex-1 text-sm bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Select All ({filteredAvailableExcerpts.length})
            </button>
            {selectedExcerpts.size > 0 && (
              <>
                <button
                  onClick={addSelectedExcerpts}
                  className="flex-1 text-sm bg-green-50 hover:bg-green-100 text-green-600 px-3 py-2 rounded transition-colors"
                >
                  Add Selected ({selectedExcerpts.size})
                </button>
                <button
                  onClick={clearSelection}
                  className="text-sm bg-gray-50 hover:bg-gray-100 text-gray-600 px-3 py-2 rounded transition-colors"
                >
                  Clear
                </button>
              </>
            )}
            {filteredAvailableExcerpts.length > 0 && (
              <button
                onClick={addAllVisible}
                className="text-sm bg-purple-50 hover:bg-purple-100 text-purple-600 px-3 py-2 rounded transition-colors"
              >
                Add All
              </button>
            )}
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {availableExcerpts.length === 0 ? (
              <p className="text-gray-500 text-sm">
                All excerpts are already in this storyboard.
              </p>
            ) : filteredAvailableExcerpts.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No excerpts match your filter criteria.
              </p>
            ) : (
              filteredAvailableExcerpts.map((excerpt) => (
                <div
                  key={excerpt.id}
                  className={`bg-white border rounded-lg p-4 transition-all ${
                    selectedExcerpts.has(excerpt.id)
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedExcerpts.has(excerpt.id)}
                      onChange={() => toggleExcerptSelection(excerpt.id)}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div
                      draggable
                      onDragStart={() => handleExcerptDragStart(excerpt)}
                      className="flex-1 cursor-move"
                    >
                      <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{excerpt.title}</h3>
                      {excerpt.author && (
                        <p className="text-xs text-gray-600 mb-1">by {excerpt.author}</p>
                      )}
                      <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
                        <span>{excerpt.wordCount} words</span>
                        <span>{new Date(excerpt.createdAt).toLocaleDateString()}</span>
                      </div>
                      {excerpt.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {excerpt.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {tag}
                            </span>
                          ))}
                          {excerpt.tags.length > 3 && (
                            <span className="text-xs text-gray-500">+{excerpt.tags.length - 3} more</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Storyboard Sections */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Story Structure</h2>
            <span className="text-sm text-gray-500">Drag excerpts here to add them</span>
          </div>

          <div
            className="min-h-96 space-y-4"
            onDragOver={(e) => handleDragOver(e)}
            onDrop={(e) => handleDrop(e)}
          >
            {storyboard.sections.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="text-gray-400 mb-2">📚</div>
                <p className="text-gray-500">
                  Drag excerpts from the left panel to build your story structure
                </p>
              </div>
            ) : (
              storyboard.sections.map((section, index) => {
                const excerpt = getExcerptById(section.excerptId)
                if (!excerpt) return null

                return (
                  <div key={section.id}>
                    {/* Drop zone */}
                    <div
                      className={`h-2 transition-colors ${
                        dragOverIndex === index ? 'bg-blue-200' : 'bg-transparent'
                      }`}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                    />
                    
                    {/* Section */}
                    <div
                      draggable
                      onDragStart={() => handleSectionDragStart(section)}
                      className="bg-white border border-gray-200 rounded-lg p-6 cursor-move hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                            <h3 className="font-semibold text-gray-900">{excerpt.title}</h3>
                          </div>
                          <p className="text-gray-600 text-sm line-clamp-2">
                            {excerpt.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                          </p>
                        </div>
                        <button
                          onClick={() => removeSection(section.id)}
                          className="text-red-600 hover:text-red-800 ml-4"
                          title="Remove from storyboard"
                        >
                          ✕
                        </button>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                        <span>{excerpt.wordCount} words</span>
                        <div className="flex gap-2">
                          {excerpt.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {/* Section Notes */}
                      <div>
                        <textarea
                          value={section.notes || ''}
                          onChange={(e) => updateSectionNotes(section.id, e.target.value)}
                          placeholder="Add notes for this section..."
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            
            {/* Final drop zone */}
            <div
              className={`h-8 transition-colors ${
                dragOverIndex === storyboard.sections.length ? 'bg-blue-200' : 'bg-transparent'
              }`}
              onDragOver={(e) => handleDragOver(e, storyboard.sections.length)}
              onDrop={(e) => handleDrop(e, storyboard.sections.length)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}