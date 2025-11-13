'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Storyboard, Excerpt, StoryboardSection, Category } from '@/types'
import { useStorage } from '@/contexts/StorageContext'
import { v4 as uuidv4 } from 'uuid'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  rectIntersection,
  pointerWithin,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion, AnimatePresence } from 'framer-motion'

// Sortable Excerpt Card Component
function SortableExcerptCard({ 
  section, 
  excerpt, 
  index, 
  displayMode, 
  onRemove, 
  isBeingDraggedOver = false
}: {
  section: StoryboardSection
  excerpt: Excerpt
  index: number
  displayMode: 'title' | 'date'
  onRemove: (id: string) => void
  isBeingDraggedOver?: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const displayText = displayMode === 'title' 
    ? excerpt.title 
    : (() => {
        const date = excerpt.createdAt
        const isoDate = new Date(date).toISOString().split('T')[0]
        return new Date(isoDate + 'T12:00:00').toLocaleDateString()
      })()

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border border-gray-200 rounded-xl p-4 cursor-move transition-all hover:shadow-lg group h-24 flex items-center justify-between ${
        isDragging ? 'opacity-50' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      {/* Minimal Content - Title and Date Only */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1.5 rounded-lg shrink-0">
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate" title={displayText}>
            {displayText.length > 30 ? `${displayText.substring(0, 30)}...` : displayText}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {(() => {
              const date = excerpt.createdAt
              const isoDate = new Date(date).toISOString().split('T')[0]
              return new Date(isoDate + 'T12:00:00').toLocaleDateString()
            })()}
          </p>
        </div>
      </div>
      
      {/* Remove Button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemove(section.id)
        }}
        className="text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 shrink-0 p-1"
        title="Remove from storyboard"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// Close dropdown when clicking outside
function useClickOutside(ref: React.RefObject<HTMLDivElement | null>, handler: () => void) {
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [ref, handler])
}

export default function StoryboardEditPage() {
  const params = useParams()
  const router = useRouter()
  const storage = useStorage()
  const storyboardId = params.id as string
  
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null)
  const [excerpts, setExcerpts] = useState<Excerpt[]>([])
  const [availableExcerpts, setAvailableExcerpts] = useState<Excerpt[]>([])
  const [filteredAvailableExcerpts, setFilteredAvailableExcerpts] = useState<Excerpt[]>([])
  const [selectedExcerpts, setSelectedExcerpts] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [availableAuthors, setAvailableAuthors] = useState<string[]>([])
  const [displayMode, setDisplayMode] = useState<'title' | 'date'>('title')
  const [showExcerptsDropdown, setShowExcerptsDropdown] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [tagCategories, setTagCategories] = useState<Record<string, string[]>>({})
  const [categories, setCategories] = useState<Category[]>([])
  const [openCategoryDropdowns, setOpenCategoryDropdowns] = useState<Set<string>>(new Set())
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [storyboardSortBy, setStoryboardSortBy] = useState<'order' | 'name' | 'displayDate' | 'lastEdited'>('order')
  const [storyboardSortReversed, setStoryboardSortReversed] = useState(false)
  const categoryDropdownRef = React.useRef<HTMLDivElement>(null)

  // Close category dropdowns when clicking outside
  useClickOutside(categoryDropdownRef, () => {
    setOpenCategoryDropdowns(new Set())
  })


  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedStoryboards, loadedExcerpts, allTags, usedAuthors, loadedCategories] = await Promise.all([
          storage.getStoryboards(),
          storage.getExcerpts(),
          storage.getAllTags(),
          storage.getUsedAuthors(),
          storage.getCategories()
        ])
        
        const loadedStoryboard = loadedStoryboards.find(sb => sb.id === storyboardId)
        if (!loadedStoryboard) {
          router.push('/storyboards')
          return
        }

        setExcerpts(loadedExcerpts)
        
        // Clean up storyboard sections that reference non-existent excerpts
        const excerptIds = new Set(loadedExcerpts.map(excerpt => excerpt.id))
        const validSections = loadedStoryboard.sections.filter(section => excerptIds.has(section.excerptId))
        
        // If we removed orphaned sections, save the cleaned storyboard
        if (validSections.length !== loadedStoryboard.sections.length) {
          const cleanedStoryboard = {
            ...loadedStoryboard,
            sections: validSections.map((section, index) => ({ ...section, order: index }))
          }
          await storage.saveStoryboard(cleanedStoryboard)
          setStoryboard(cleanedStoryboard)
          console.log(`Cleaned up ${loadedStoryboard.sections.length - validSections.length} orphaned sections from storyboard`)
        } else {
          setStoryboard(loadedStoryboard)
        }
        
        // Filter out excerpts that are already in the storyboard
        const usedExcerptIds = new Set(validSections.map(section => section.excerptId))
        const available = loadedExcerpts.filter(excerpt => !usedExcerptIds.has(excerpt.id))
        setAvailableExcerpts(available)
        setFilteredAvailableExcerpts(available)
        
        // Set filter options
        setAvailableTags(allTags)
        setAvailableAuthors(usedAuthors)
        setCategories(loadedCategories)
        
        // Build tag categories from real category data
        const tagCategoryMap: Record<string, string[]> = {}
        
        // Get tag-category mappings for all tags
        const tagCategoryPromises = allTags.map(async (tag) => {
          const tagCategories = await storage.getTagCategories(tag)
          return { tag, categories: tagCategories }
        })
        
        const tagCategoryResults = await Promise.all(tagCategoryPromises)
        
        // Organize tags by category name
        tagCategoryResults.forEach(({ tag, categories }) => {
          if (categories.length > 0) {
            categories.forEach(category => {
              if (!tagCategoryMap[category.name]) {
                tagCategoryMap[category.name] = []
              }
              tagCategoryMap[category.name].push(tag)
            })
          } else {
            // Uncategorized tags
            if (!tagCategoryMap['Uncategorized']) {
              tagCategoryMap['Uncategorized'] = []
            }
            tagCategoryMap['Uncategorized'].push(tag)
          }
        })
        
        setTagCategories(tagCategoryMap)
      } catch (error) {
        console.error('Failed to load storyboard data:', error)
      }
    }
    
    loadData()
  }, [storyboardId, router, storage])

  const getExcerptById = (excerptId: string) => {
    return excerpts.find(excerpt => excerpt.id === excerptId)
  }

  const saveStoryboard = async (updatedStoryboard: Storyboard) => {
    try {
      const storyboardToSave = {
        ...updatedStoryboard,
        updatedAt: new Date()
      }
      await storage.saveStoryboard(storyboardToSave)
      setStoryboard(storyboardToSave)
      
      // Update available excerpts
      const usedExcerptIds = new Set(storyboardToSave.sections.map(section => section.excerptId))
      const available = excerpts.filter(excerpt => !usedExcerptIds.has(excerpt.id))
      setAvailableExcerpts(available)
      applyFilters(available)
    } catch (error) {
      console.error('Failed to save storyboard:', error)
    }
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

  // Removed updateSectionNotes as we don't need notes anymore

  // Simplified drag and drop handlers using @dnd-kit's sortable behavior
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id && storyboard) {
      const oldIndex = storyboard.sections.findIndex(section => section.id === active.id)
      const newIndex = storyboard.sections.findIndex(section => section.id === over?.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newSections = arrayMove(storyboard.sections, oldIndex, newIndex)
        // Update order numbers
        newSections.forEach((section, index) => {
          section.order = index
        })
        
        saveStoryboard({
          ...storyboard,
          sections: newSections
        })
      }
    }

    setActiveId(null)
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
    
    // Create all sections first, then update storyboard once
    const newSections = [...storyboard.sections]
    selectedExcerptList.forEach((excerpt) => {
      const newSection: StoryboardSection = {
        id: uuidv4(),
        excerptId: excerpt.id,
        order: newSections.length,
        notes: ''
      }
      newSections.push(newSection)
    })

    // Update storyboard with all new sections at once
    saveStoryboard({
      ...storyboard,
      sections: newSections
    })

    setSelectedExcerpts(new Set())
    setShowExcerptsDropdown(false) // Close dropdown after adding
  }

  const addAllFilteredExcerpts = () => {
    if (!storyboard || filteredAvailableExcerpts.length === 0) return

    // Create all sections first, then update storyboard once
    const newSections = [...storyboard.sections]
    filteredAvailableExcerpts.forEach((excerpt) => {
      const newSection: StoryboardSection = {
        id: uuidv4(),
        excerptId: excerpt.id,
        order: newSections.length,
        notes: ''
      }
      newSections.push(newSection)
    })

    // Update storyboard with all new sections at once
    saveStoryboard({
      ...storyboard,
      sections: newSections
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

  const addExcerptFromDropdown = (excerpt: Excerpt) => {
    addExcerptToStoryboard(excerpt)
    setShowExcerptsDropdown(false)
  }

  const toggleCategoryDropdown = (category: string) => {
    setOpenCategoryDropdowns(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }

  const toggleTagInCategory = (tag: string, category: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag)
      } else {
        return [...prev, tag]
      }
    })
  }

  const getSelectedTagsInCategory = (categoryTags: string[]) => {
    return categoryTags.filter(tag => selectedTags.includes(tag))
  }

  const getStoryboardStats = () => {
    if (!storyboard) return { sections: 0, words: 0 }
    
    const words = storyboard.sections.reduce((total, section) => {
      const excerpt = getExcerptById(section.excerptId)
      return total + (excerpt?.wordCount || 0)
    }, 0)
    
    return { sections: storyboard.sections.length, words }
  }

  const getSortedStoryboardSections = () => {
    if (!storyboard) return []
    
    const validSections = storyboard.sections
      .map(section => ({ section, excerpt: getExcerptById(section.excerptId) }))
      .filter(({ excerpt }) => excerpt !== null)
    
    let sortedSections = [...validSections]
    
    if (storyboardSortBy === 'order') {
      sortedSections.sort((a, b) => a.section.order - b.section.order)
    } else {
      sortedSections.sort((a, b) => {
        switch (storyboardSortBy) {
          case 'name':
            return a.excerpt!.title.localeCompare(b.excerpt!.title)
          case 'displayDate':
            // Sort by the excerpt's creation date (which is the display date)
            return b.excerpt!.createdAt.getTime() - a.excerpt!.createdAt.getTime() // Newest first by default
          case 'lastEdited':
            return b.excerpt!.updatedAt.getTime() - a.excerpt!.updatedAt.getTime() // Newest first by default
          default:
            return a.section.order - b.section.order
        }
      })
    }
    
    // Apply reverse if needed
    if (storyboardSortReversed) {
      sortedSections.reverse()
    }
    
    return sortedSections
  }

  const applySortToStoryboard = async () => {
    if (!storyboard) return
    
    // Apply the current sort and update section orders
    const sortedSections = getSortedStoryboardSections()
    const reorderedSections = sortedSections.map(({ section }, index) => ({
      ...section,
      order: index
    }))
    
    await saveStoryboard({
      id: storyboard.id,
      title: storyboard.title,
      description: storyboard.description,
      createdAt: storyboard.createdAt,
      updatedAt: new Date(),
      sections: reorderedSections
    })
  }

  const handleStoryboardSort = async (sortType: 'order' | 'name' | 'displayDate' | 'lastEdited') => {
    if (!storyboard) return
    
    setStoryboardSortBy(sortType)
    
    if (sortType === 'order') {
      // Reset reverse when going back to manual order
      setStoryboardSortReversed(false)
      // Reset to original order
      const originalSections = [...storyboard.sections].sort((a, b) => a.order - b.order)
      const updatedStoryboard = {
        id: storyboard.id,
        title: storyboard.title,
        description: storyboard.description,
        createdAt: storyboard.createdAt,
        updatedAt: new Date(),
        sections: originalSections
      }
      setStoryboard(updatedStoryboard)
      return
    }
    
    await applySortToStoryboard()
  }

  const getBaseSortedSections = () => {
    if (!storyboard) return []
    
    const validSections = storyboard.sections
      .map(section => ({ section, excerpt: getExcerptById(section.excerptId) }))
      .filter(({ excerpt }) => excerpt !== null)
    
    let sortedSections = [...validSections]
    
    if (storyboardSortBy === 'order') {
      sortedSections.sort((a, b) => a.section.order - b.section.order)
    } else {
      sortedSections.sort((a, b) => {
        switch (storyboardSortBy) {
          case 'name':
            return a.excerpt!.title.localeCompare(b.excerpt!.title)
          case 'displayDate':
            return b.excerpt!.createdAt.getTime() - a.excerpt!.createdAt.getTime()
          case 'lastEdited':
            return b.excerpt!.updatedAt.getTime() - a.excerpt!.updatedAt.getTime()
          default:
            return a.section.order - b.section.order
        }
      })
    }
    
    return sortedSections
  }

  const handleReverseToggle = async () => {
    if (!storyboard) return
    
    const newReversedState = !storyboardSortReversed
    setStoryboardSortReversed(newReversedState)
    
    // Only apply sort if not in manual order mode
    if (storyboardSortBy !== 'order') {
      // Get base sorted sections (without previous reverse)
      const baseSortedSections = getBaseSortedSections()
      // Apply new reverse state
      const finalSections = newReversedState ? [...baseSortedSections].reverse() : baseSortedSections
      
      const reorderedSections = finalSections.map(({ section }, index) => ({
        ...section,
        order: index
      }))
      
      await saveStoryboard({
        id: storyboard.id,
        title: storyboard.title,
        description: storyboard.description,
        createdAt: storyboard.createdAt,
        updatedAt: new Date(),
        sections: reorderedSections
      })
    }
  }

  if (!storyboard) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const stats = getStoryboardStats()
  const activeExcerpt = activeId ? getExcerptById(storyboard.sections.find(s => s.id === activeId)?.excerptId || '') : null

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header Bar */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push('/storyboards')}
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Storyboards
            </button>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{storyboard.title}</h1>
              {storyboard.description && (
                <p className="text-sm text-gray-600 mt-1">{storyboard.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>{stats.sections} sections</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{stats.words} words</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Updated {(() => {
                const date = storyboard.updatedAt
                const isoDate = new Date(date).toISOString().split('T')[0]
                return new Date(isoDate + 'T12:00:00').toLocaleDateString()
              })()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Simple Controls Bar */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left Side - Add Excerpts and Sort */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowExcerptsDropdown(!showExcerptsDropdown)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Excerpts ({availableExcerpts.length})
            </button>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Sort:</label>
              <select
                value={storyboardSortBy}
                onChange={(e) => handleStoryboardSort(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="order">Manual Order</option>
                <option value="name">Name A-Z</option>
                <option value="displayDate">Display Date</option>
                <option value="lastEdited">Last Edited</option>
              </select>
              
              {storyboardSortBy !== 'order' && (
                <button
                  onClick={handleReverseToggle}
                  className={`p-2 border border-gray-300 rounded-lg transition-colors ${
                    storyboardSortReversed 
                      ? 'bg-blue-100 border-blue-500 text-blue-700' 
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                  title="Reverse order"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {/* Right Side - Display Mode */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Display:</label>
            <select
              value={displayMode}
              onChange={(e) => setDisplayMode(e.target.value as 'title' | 'date')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="title">Title</option>
              <option value="date">Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="flex-1 overflow-hidden relative">
        {/* Excerpts Dropdown Overlay */}
        <AnimatePresence>
          {showExcerptsDropdown && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/20 backdrop-blur-sm z-40"
                onClick={() => setShowExcerptsDropdown(false)}
              />
              
              {/* Dropdown */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute top-4 left-6 right-6 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[80vh]"
              >
                {/* Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Add Excerpts to Storyboard</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">{filteredAvailableExcerpts.length} available</span>
                      <button
                        onClick={() => setShowExcerptsDropdown(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Filters and Controls */}
                <div className="p-4 border-b border-gray-200 space-y-4">
                  {/* Search and Date Filters */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="relative flex-1 min-w-64">
                      <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search excerpts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">From:</label>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">To:</label>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {(searchQuery || selectedTags.length > 0 || selectedAuthors.length > 0 || dateFrom || dateTo) && (
                      <button
                        onClick={clearAllFilters}
                        className="px-4 py-2 text-sm bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>

                  {/* Tag Categories */}
                  {Object.keys(tagCategories).length > 0 && (
                    <div className="flex items-start gap-3 flex-wrap">
                      <span className="text-sm font-medium text-gray-700 mt-2">Categories:</span>
                      <div ref={categoryDropdownRef} className="flex flex-wrap gap-2">
                        {Object.entries(tagCategories).map(([category, tags]) => {
                          const selectedInCategory = getSelectedTagsInCategory(tags)
                          return (
                            <div key={category} className="relative">
                              <button
                                onClick={() => toggleCategoryDropdown(category)}
                                className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${
                                  selectedInCategory.length > 0
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                                }`}
                              >
                                <span className="font-medium">{category}</span>
                                {selectedInCategory.length > 0 && (
                                  <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                                    {selectedInCategory.length}
                                  </span>
                                )}
                                <svg className={`w-4 h-4 transition-transform ${
                                  openCategoryDropdowns.has(category) ? 'rotate-180' : ''
                                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              
                              <AnimatePresence>
                                {openCategoryDropdowns.has(category) && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-64 max-h-80 overflow-y-auto"
                                  >
                                    <div className="p-3">
                                      <div className="flex items-center justify-between mb-3 pb-2 border-b">
                                        <h4 className="font-medium text-gray-900">{category}</h4>
                                        <span className="text-xs text-gray-500">{selectedInCategory.length}/{tags.length} selected</span>
                                      </div>
                                      <div className="space-y-2">
                                        {tags.map(tag => (
                                          <label key={tag} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                                            <input
                                              type="checkbox"
                                              checked={selectedTags.includes(tag)}
                                              onChange={() => toggleTagInCategory(tag, category)}
                                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                            />
                                            <span className="text-sm text-gray-700 flex-1">{tag}</span>
                                            <span className="text-xs text-gray-400">
                                              {excerpts.filter(e => e.tags.includes(tag)).length}
                                            </span>
                                          </label>
                                        ))}
                                      </div>
                                      
                                      {selectedInCategory.length > 0 && (
                                        <div className="mt-3 pt-3 border-t">
                                          <button
                                            onClick={() => {
                                              setSelectedTags(prev => prev.filter(tag => !tags.includes(tag)))
                                            }}
                                            className="w-full text-xs text-red-600 hover:text-red-700 transition-colors"
                                          >
                                            Clear {category} ({selectedInCategory.length})
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Authors Filter */}
                  {availableAuthors.length > 0 && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700">Authors:</span>
                      <div className="flex flex-wrap gap-2">
                        {availableAuthors.map(author => (
                          <button
                            key={author}
                            onClick={() => toggleAuthor(author)}
                            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
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

                  {/* Selection Actions */}
                  {filteredAvailableExcerpts.length > 0 && (
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={selectAllVisible}
                        className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 rounded transition-colors"
                      >
                        Select All Visible
                      </button>
                      {selectedExcerpts.size > 0 && (
                        <>
                          <button
                            onClick={addSelectedExcerpts}
                            className="text-xs bg-green-50 hover:bg-green-100 text-green-600 px-3 py-2 rounded transition-colors"
                          >
                            Add Selected ({selectedExcerpts.size})
                          </button>
                          <button
                            onClick={clearSelection}
                            className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-600 px-3 py-2 rounded transition-colors"
                          >
                            Clear Selection
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="overflow-y-auto max-h-80 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredAvailableExcerpts.length === 0 ? (
                      <div className="col-span-full text-center py-8">
                        <div className="text-gray-400 text-2xl mb-2">📝</div>
                        <p className="text-gray-500 text-sm">
                          {availableExcerpts.length === 0 
                            ? "All excerpts are in this storyboard."
                            : "No excerpts match your filters."
                          }
                        </p>
                      </div>
                    ) : (
                      filteredAvailableExcerpts.map((excerpt) => (
                        <motion.div
                          key={excerpt.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`border rounded-lg p-3 transition-all cursor-pointer ${
                            selectedExcerpts.has(excerpt.id)
                              ? 'border-blue-500 bg-blue-50 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                          }`}
                          onClick={() => toggleExcerptSelection(excerpt.id)}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={selectedExcerpts.has(excerpt.id)}
                              onChange={() => toggleExcerptSelection(excerpt.id)}
                              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 text-sm mb-1 truncate">{excerpt.title}</h4>
                              {excerpt.author && (
                                <p className="text-xs text-gray-600 mb-1">by {excerpt.author}</p>
                              )}
                              <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                                <span>{excerpt.wordCount} words</span>
                                <span>{(() => {
                                  const date = excerpt.createdAt
                                  const isoDate = new Date(date).toISOString().split('T')[0]
                                  return new Date(isoDate + 'T12:00:00').toLocaleDateString()
                                })()}</span>
                              </div>
                              {excerpt.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {excerpt.tags.slice(0, 2).map(tag => (
                                    <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                      {tag}
                                    </span>
                                  ))}
                                  {excerpt.tags.length > 2 && (
                                    <span className="text-xs text-gray-500">+{excerpt.tags.length - 2}</span>
                                  )}
                                </div>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  addExcerptFromDropdown(excerpt)
                                }}
                                className="mt-2 w-full text-xs bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded transition-colors"
                              >
                                Add to Storyboard
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Storyboard Manager */}
        <div className="h-full p-6 overflow-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {storyboard.sections.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full flex items-center justify-center"
              >
                <div className="text-center">
                  <div className="text-6xl text-gray-300 mb-4">📚</div>
                  <h3 className="text-xl font-medium text-gray-600 mb-2">Start Building Your Story</h3>
                  <p className="text-gray-500 max-w-md mb-4">
                    Click "Add Excerpts" above to select excerpts for your storyboard. You can reorder them by dragging within this area.
                  </p>
                  <button
                    onClick={() => setShowExcerptsDropdown(true)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Add Your First Excerpt
                  </button>
                </div>
              </motion.div>
            ) : (
              <SortableContext 
                items={storyboard.sections.map(section => section.id)}
                strategy={rectSortingStrategy}
              >
                <motion.div 
                  layout
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 auto-rows-max"
                >
                  <AnimatePresence>
                    {getSortedStoryboardSections().map(({ section, excerpt }, index) => (
                      <SortableExcerptCard
                        key={section.id}
                        section={section}
                        excerpt={excerpt!}
                        index={index}
                        displayMode={displayMode}
                        onRemove={removeSection}
                        isBeingDraggedOver={false}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              </SortableContext>
            )}
            
            <DragOverlay>
              {activeId && activeExcerpt ? (
                <div className="bg-white border-2 border-blue-500 rounded-xl p-4 shadow-2xl h-24 flex items-center justify-between transform rotate-3 scale-105">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="bg-blue-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg shrink-0">
                      {String(storyboard.sections.findIndex(s => s.id === activeId) + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
                        {(displayMode === 'title' ? activeExcerpt.title : (() => {
                          const date = activeExcerpt.createdAt
                          const isoDate = new Date(date).toISOString().split('T')[0]
                          return new Date(isoDate + 'T12:00:00').toLocaleDateString()
                        })()).substring(0, 30)}...
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {(() => {
                          const date = activeExcerpt.createdAt
                          const isoDate = new Date(date).toISOString().split('T')[0]
                          return new Date(isoDate + 'T12:00:00').toLocaleDateString()
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    </div>
  )
}