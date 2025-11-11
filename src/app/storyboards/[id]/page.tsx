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
  const [draggedExcerpt, setDraggedExcerpt] = useState<Excerpt | null>(null)
  const [draggedSection, setDraggedSection] = useState<StoryboardSection | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

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
    setAvailableExcerpts(loadedExcerpts.filter(excerpt => !usedExcerptIds.has(excerpt.id)))
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
    setAvailableExcerpts(excerpts.filter(excerpt => !usedExcerptIds.has(excerpt.id)))
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Excerpts</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {availableExcerpts.length === 0 ? (
              <p className="text-gray-500 text-sm">
                All excerpts are already in this storyboard.
              </p>
            ) : (
              availableExcerpts.map((excerpt) => (
                <div
                  key={excerpt.id}
                  draggable
                  onDragStart={() => handleExcerptDragStart(excerpt)}
                  className="bg-white border border-gray-200 rounded-lg p-4 cursor-move hover:shadow-md transition-shadow"
                >
                  <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{excerpt.title}</h3>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>{excerpt.wordCount} words</span>
                    <span>{excerpt.tags.length} tags</span>
                  </div>
                  {excerpt.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
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