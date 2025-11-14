'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Excerpt } from '@/types'
import { useStorage } from '@/contexts/StorageContext'
import { useAuthAction } from '@/hooks/useAuthAction'
import AuthModal from '@/components/auth/AuthModal'
import { v4 as uuidv4 } from 'uuid'

export default function ExcerptsPage() {
  const [excerpts, setExcerpts] = useState<Excerpt[]>([])
  const [filteredExcerpts, setFilteredExcerpts] = useState<Excerpt[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedExcerptIds, setSelectedExcerptIds] = useState<string[]>([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [dateDisplayMode, setDateDisplayMode] = useState<'created' | 'updated'>('updated')
  const [sortBy, setSortBy] = useState<'name' | 'dateCreated' | 'dateUpdated' | 'tags'>('dateUpdated')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [filterTags, setFilterTags] = useState<string[]>([])
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const { checkAuthAndProceed, showAuthModal, closeAuthModal } = useAuthAction()
  const storage = useStorage()
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        console.log('=== LOADING EXCERPTS PAGE ===')
        console.log('Storage mode:', storage.isUsingCloud ? 'Cloud (Firestore)' : 'Local Storage')
        
        const [loadedExcerpts, usedTags] = await Promise.all([
          storage.getExcerpts(),
          storage.getUsedTags()
        ])
        
        console.log(`Loaded ${loadedExcerpts.length} excerpts from storage`)
        console.log('Used tags found:', usedTags)
        
        setExcerpts(loadedExcerpts)
        setFilteredExcerpts(loadedExcerpts)
        setAvailableTags(usedTags)
      } catch (error) {
        console.error('Failed to load excerpts data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [storage])

  useEffect(() => {
    const applyFiltersAndSort = () => {
      if (isLoading) return

      let filtered = [...excerpts]
      
      // Apply search filter
      if (searchQuery) {
        const searchTerm = searchQuery.toLowerCase()
        filtered = filtered.filter(excerpt =>
          excerpt.title.toLowerCase().includes(searchTerm)
        )
      }
      
      // Apply tag filter
      if (filterTags.length > 0) {
        filtered = filtered.filter(excerpt =>
          filterTags.some(tag => excerpt.tags.includes(tag))
        )
      }
      
      // Apply date range filter
      if (filterDateFrom) {
        const fromDate = new Date(filterDateFrom)
        filtered = filtered.filter(excerpt => {
          const rawDate = sortBy === 'dateCreated' ? excerpt.createdAt : excerpt.updatedAt
          // Safely convert date for comparison
          const compareDate = rawDate && typeof rawDate === 'object' && 'seconds' in rawDate
            ? new Date((rawDate as any).seconds * 1000)
            : new Date(rawDate)
          return compareDate >= fromDate
        })
      }
      
      if (filterDateTo) {
        const toDate = new Date(filterDateTo)
        toDate.setHours(23, 59, 59, 999) // Include full day
        filtered = filtered.filter(excerpt => {
          const rawDate = sortBy === 'dateCreated' ? excerpt.createdAt : excerpt.updatedAt
          // Safely convert date for comparison
          const compareDate = rawDate && typeof rawDate === 'object' && 'seconds' in rawDate
            ? new Date((rawDate as any).seconds * 1000)
            : new Date(rawDate)
          return compareDate <= toDate
        })
      }
      
      // Apply sorting
      filtered.sort((a, b) => {
        let comparison = 0
        
        switch (sortBy) {
          case 'name':
            comparison = a.title.localeCompare(b.title)
            break
          case 'dateCreated':
            // Safely convert dates to JavaScript Date objects before calling getTime()
            const aCreatedAt = a.createdAt && typeof a.createdAt === 'object' && 'seconds' in a.createdAt
              ? new Date((a.createdAt as any).seconds * 1000)
              : new Date(a.createdAt)
            const bCreatedAt = b.createdAt && typeof b.createdAt === 'object' && 'seconds' in b.createdAt
              ? new Date((b.createdAt as any).seconds * 1000)
              : new Date(b.createdAt)
            comparison = aCreatedAt.getTime() - bCreatedAt.getTime()
            break
          case 'dateUpdated':
            // Safely convert dates to JavaScript Date objects before calling getTime()
            const aUpdatedAt = a.updatedAt && typeof a.updatedAt === 'object' && 'seconds' in a.updatedAt
              ? new Date((a.updatedAt as any).seconds * 1000)
              : new Date(a.updatedAt)
            const bUpdatedAt = b.updatedAt && typeof b.updatedAt === 'object' && 'seconds' in b.updatedAt
              ? new Date((b.updatedAt as any).seconds * 1000)
              : new Date(b.updatedAt)
            comparison = aUpdatedAt.getTime() - bUpdatedAt.getTime()
            break
          case 'tags':
            comparison = (a.tags[0] || '').localeCompare(b.tags[0] || '')
            break
        }
        
        return sortDirection === 'desc' ? -comparison : comparison
      })
      
      setFilteredExcerpts(filtered)
    }
    
    applyFiltersAndSort()
  }, [excerpts, searchQuery, filterTags, filterDateFrom, filterDateTo, sortBy, sortDirection, isLoading])

  const toggleFilterTag = (tag: string) => {
    setFilterTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setFilterTags([])
    setFilterDateFrom('')
    setFilterDateTo('')
  }

  const handleDeleteExcerpt = async (excerpt: Excerpt) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${excerpt.title}"? This action cannot be undone.`)
    
    if (confirmed) {
      try {
        console.log(`Deleting excerpt: ${excerpt.id} - "${excerpt.title}"`)
        console.log('Storage mode:', storage.isUsingCloud ? 'Cloud (Firestore)' : 'Local Storage')
        
        await storage.deleteExcerpt(excerpt.id)
        console.log('Delete operation completed')
        
        // Verify deletion
        const verifyDeleted = await storage.getExcerpt(excerpt.id)
        console.log('Verification check - excerpt still exists:', verifyDeleted ? 'YES (ERROR!)' : 'NO (GOOD)')
        
        // Refresh the excerpts list
        const updatedExcerpts = await storage.getExcerpts()
        console.log(`Refreshed excerpts list: ${updatedExcerpts.length} total`)
        setExcerpts(updatedExcerpts)
        setFilteredExcerpts(updatedExcerpts)
        
      } catch (error) {
        console.error('Failed to delete excerpt:', error)
      }
    }
  }

  const toggleExcerptSelection = (excerptId: string) => {
    setSelectedExcerptIds(prev => {
      const newSelection = prev.includes(excerptId)
        ? prev.filter(id => id !== excerptId)
        : [...prev, excerptId]
      
      // If no items are selected, exit selection mode
      if (newSelection.length === 0) {
        setIsSelectionMode(false)
      }
      
      return newSelection
    })
  }

  const selectAllExcerpts = () => {
    setSelectedExcerptIds(filteredExcerpts.map(e => e.id))
  }

  const deselectAllExcerpts = () => {
    setSelectedExcerptIds([])
  }

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode)
    if (!isSelectionMode) {
      setSelectedExcerptIds([])
    }
  }

  const handleSelectDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    
    if (value === 'select') {
      // Enter selection mode without selecting anything
      setIsSelectionMode(true)
      setSelectedExcerptIds([])
    } else if (value === 'select-all') {
      // Enter selection mode and select all excerpts
      setIsSelectionMode(true)
      setSelectedExcerptIds(filteredExcerpts.map(e => e.id))
    }
    
    // Reset dropdown to default after selection
    e.target.value = ''
  }

  const handleBulkDelete = async () => {
    if (selectedExcerptIds.length === 0) {
      console.log('No excerpts selected')
      return
    }

    const selectedExcerpts = excerpts.filter(e => selectedExcerptIds.includes(e.id))
    const titles = selectedExcerpts.map(e => e.title).slice(0, 3)
    const displayText = titles.join(', ') + (selectedExcerpts.length > 3 ? ` and ${selectedExcerpts.length - 3} more` : '')
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedExcerptIds.length} excerpt(s)?\n\n${displayText}\n\nThis action cannot be undone.`
    )
    
    if (confirmed) {
      try {
        console.log(`Starting bulk delete of ${selectedExcerptIds.length} excerpts:`, selectedExcerptIds)
        console.log('Storage mode:', storage.isUsingCloud ? 'Cloud (Firestore)' : 'Local Storage')
        
        // Delete all selected excerpts
        await Promise.all(selectedExcerptIds.map(id => storage.deleteExcerpt(id)))
        console.log('Bulk delete operations completed')
        
        // Verify deletions
        const verificationResults = await Promise.all(
          selectedExcerptIds.map(async id => {
            const still_exists = await storage.getExcerpt(id)
            return { id, still_exists: !!still_exists }
          })
        )
        console.log('Verification results:', verificationResults)
        
        // Refresh the excerpts list
        const updatedExcerpts = await storage.getExcerpts()
        console.log(`Refreshed excerpts list: ${updatedExcerpts.length} total (was ${excerpts.length})`)
        setExcerpts(updatedExcerpts)
        setFilteredExcerpts(updatedExcerpts)
        setSelectedExcerptIds([])
        setIsSelectionMode(false)
        
      } catch (error) {
        console.error('Failed to delete excerpts:', error)
      }
    }
  }

  const getExcerptPreview = (content: string, maxLength = 150) => {
    const textContent = content.replace(/<[^>]*>/g, '').trim()
    return textContent.length > maxLength
      ? textContent.substring(0, maxLength) + '...'
      : textContent
  }

  const cacheExcerptForEditing = (excerpt: Excerpt) => {
    if (typeof window === 'undefined') {
      return
    }
    try {
      // Safely format dates for caching
      const formatDateForCache = (date: any) => {
        try {
          let dateObj: Date
          
          if (date && typeof date === 'object' && 'seconds' in date) {
            // Firestore Timestamp
            dateObj = new Date((date as any).seconds * 1000)
          } else {
            // Regular Date or string
            dateObj = new Date(date)
          }
          
          // Validate the date before calling toISOString()
          if (isNaN(dateObj.getTime()) || dateObj.getTime() === 0) {
            console.warn('Invalid date detected, using fallback:', date)
            return new Date().toISOString()
          }
          
          return dateObj.toISOString()
        } catch (error) {
          console.warn('Error formatting date for cache:', error, date)
          return new Date().toISOString()
        }
      }

      const cacheKey = `editing_excerpt_${excerpt.id}`
      const cacheData = {
        ...excerpt,
        createdAt: formatDateForCache(excerpt.createdAt),
        updatedAt: formatDateForCache(excerpt.updatedAt),
      }
      
      console.log('Caching excerpt with key:', cacheKey)
      console.log('Cache data:', cacheData)
      
      sessionStorage.setItem(cacheKey, JSON.stringify(cacheData))
      
      // Verify it was saved
      const saved = sessionStorage.getItem(cacheKey)
      console.log('Cache verification:', saved ? 'SUCCESS' : 'FAILED')
    } catch (error) {
      console.warn('Unable to cache excerpt for editing:', error)
    }
  }




  const renderExcerpts = () => (
    <div className="space-y-3">
      {filteredExcerpts.map((excerpt, index) => (
        <div key={excerpt.id} className={`card bg-white hover:shadow-md transition-all ${
          selectedExcerptIds.includes(excerpt.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
        }`}>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Selection checkbox or index */}
                {isSelectionMode ? (
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedExcerptIds.includes(excerpt.id)}
                      onChange={() => toggleExcerptSelection(excerpt.id)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </label>
                ) : (
                  <span className="text-gray-600 font-bold font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                )}
                
                {/* Title and Date */}
                <div className="flex-1 min-w-0">
                  <a 
                    href={`/excerpts/${excerpt.id}/edit`}
                    onClick={() => {
                      console.log('Title clicked for excerpt:', excerpt.id)
                      cacheExcerptForEditing(excerpt)
                    }}
                    className="text-lg font-bold text-black hover:text-blue-600 transition-colors truncate block"
                  >
                    {excerpt.title}
                  </a>
                  <p className="text-sm text-gray-500 mt-1">
                    {(() => {
                      try {
                        const date = dateDisplayMode === 'created' ? excerpt.createdAt : excerpt.updatedAt
                        
                        // Safely handle date formatting
                        let dateObj: Date
                        if (date && typeof date === 'object' && 'seconds' in date) {
                          // Firestore Timestamp
                          dateObj = new Date((date as any).seconds * 1000)
                        } else {
                          dateObj = new Date(date)
                        }
                        
                        // Validate the date
                        if (isNaN(dateObj.getTime())) {
                          return 'Invalid date'
                        }
                        
                        // Display date the same way as shown in the form (ISO date part)
                        const isoDate = dateObj.toISOString().split('T')[0]
                        return new Date(isoDate + 'T12:00:00').toLocaleDateString()
                      } catch (error) {
                        console.warn('Error formatting excerpt date:', error)
                        return 'Invalid date'
                      }
                    })()}
                  </p>
                </div>
              </div>
              
              {/* Action buttons */}
              {!isSelectionMode && (
                <div className="flex gap-2 ml-4 shrink-0">
                  <a
                    href={`/excerpts/${excerpt.id}/edit`}
                    onClick={() => {
                      console.log('EDIT button clicked for excerpt:', excerpt.id)
                      cacheExcerptForEditing(excerpt)
                    }}
                    className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm"
                  >
                    Edit
                  </a>
                  <button
                    onClick={() => handleDeleteExcerpt(excerpt)}
                    className="btn btn-sm border border-red-300 text-red-600 hover:bg-red-500 hover:text-white px-3 py-1 text-sm"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )



  return (
    <div className="container py-12">
      {/* Header */}
      <div className="mb-6">
        {/* Mobile header layout */}
        <div className="md:hidden">
          <div className="flex flex-col space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-black tracking-tight mb-1">
                EXCERPTS
              </h1>
              <p className="text-black font-mono text-xs">
                YOUR STORY FRAGMENTS
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Link
                href="/excerpts/new"
                className="btn btn-primary min-h-[44px] px-4 flex items-center justify-center touch-manipulation"
              >
                + NEW EXCERPT
              </Link>
              
              {filteredExcerpts.length > 0 && (
                <select
                  onChange={handleSelectDropdownChange}
                  className="input text-sm min-h-[44px] w-32 flex-shrink-0 touch-manipulation"
                  defaultValue=""
                >
                  <option value="" disabled>Select...</option>
                  <option value="select">Select</option>
                  <option value="select-all">Select All</option>
                </select>
              )}
            </div>
            
            {isSelectionMode && selectedExcerptIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="w-full btn bg-red-600 hover:bg-red-700 text-white min-h-[44px]"
              >
                Delete ({selectedExcerptIds.length}) Selected
              </button>
            )}
          </div>
        </div>
        
        {/* Desktop header layout */}
        <div className="hidden md:flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black tracking-tight mb-1">
              EXCERPTS
            </h1>
            <p className="text-black font-mono text-xs">
              YOUR STORY FRAGMENTS
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {filteredExcerpts.length > 0 && (
              <div className="flex items-center gap-2">
                <select
                  onChange={handleSelectDropdownChange}
                  className="input text-sm"
                  defaultValue=""
                >
                  <option value="" disabled>Select...</option>
                  <option value="select">Select</option>
                  <option value="select-all">Select All</option>
                </select>
                
                {isSelectionMode && selectedExcerptIds.length > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="btn btn-sm bg-red-600 hover:bg-red-700 text-white"
                  >
                    Delete ({selectedExcerptIds.length})
                  </button>
                )}
              </div>
            )}
            <Link
              href="/excerpts/new"
              className="btn btn-primary"
            >
              + NEW EXCERPT
            </Link>
          </div>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="mb-8 space-y-6">
        {/* Mobile layout */}
        <div className="md:hidden space-y-3">
          <input
            type="text"
            placeholder="SEARCH BY NAME..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input w-full min-h-[44px] text-base"
          />
          
          <div className="grid grid-cols-2 gap-2">
            <select
              value={dateDisplayMode}
              onChange={(e) => setDateDisplayMode(e.target.value as 'created' | 'updated')}
              className="input text-sm min-h-[44px]"
            >
              <option value="updated">Show: Last Updated</option>
              <option value="created">Show: Excerpt Date</option>
            </select>
            
            <select
              value={`${sortBy}-${sortDirection}`}
              onChange={(e) => {
                const [sort, direction] = e.target.value.split('-')
                setSortBy(sort as any)
                setSortDirection(direction as any)
              }}
              className="input text-sm min-h-[44px]"
            >
              <option value="dateUpdated-desc">Sort: Newest Updated</option>
              <option value="dateUpdated-asc">Sort: Oldest Updated</option>
              <option value="dateCreated-desc">Sort: Newest Excerpt Date</option>
              <option value="dateCreated-asc">Sort: Oldest Excerpt Date</option>
              <option value="name-asc">Sort: Name A-Z</option>
              <option value="name-desc">Sort: Name Z-A</option>
              <option value="tags-asc">Sort: Tags A-Z</option>
            </select>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className="flex-1 btn btn-outline min-h-[44px]"
            >
              FILTERS {filtersExpanded ? '−' : '+'}
            </button>
            
            {(searchQuery || filterTags.length > 0 || filterDateFrom || filterDateTo) && (
              <button
                onClick={clearAllFilters}
                className="btn btn-ghost min-h-[44px] px-4"
              >
                CLEAR
              </button>
            )}
          </div>
        </div>
        
        {/* Desktop layout */}
        <div className="hidden md:flex gap-4 items-center">
          <input
            type="text"
            placeholder="SEARCH BY NAME..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input flex-1"
          />
          
          <select
            value={dateDisplayMode}
            onChange={(e) => setDateDisplayMode(e.target.value as 'created' | 'updated')}
            className="input text-sm flex-1"
          >
            <option value="updated">Show: Last Updated</option>
            <option value="created">Show: Excerpt Date</option>
          </select>
          
          <select
            value={`${sortBy}-${sortDirection}`}
            onChange={(e) => {
              const [sort, direction] = e.target.value.split('-')
              setSortBy(sort as any)
              setSortDirection(direction as any)
            }}
            className="input text-sm flex-1"
          >
            <option value="dateUpdated-desc">Sort: Newest Updated</option>
            <option value="dateUpdated-asc">Sort: Oldest Updated</option>
            <option value="dateCreated-desc">Sort: Newest Excerpt Date</option>
            <option value="dateCreated-asc">Sort: Oldest Excerpt Date</option>
            <option value="name-asc">Sort: Name A-Z</option>
            <option value="name-desc">Sort: Name Z-A</option>
            <option value="tags-asc">Sort: Tags A-Z</option>
          </select>
          
          <button
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="btn btn-outline"
          >
            FILTERS {filtersExpanded ? '−' : '+'}
          </button>
          
          {(searchQuery || filterTags.length > 0 || filterDateFrom || filterDateTo) && (
            <button
              onClick={clearAllFilters}
              className="btn btn-ghost"
            >
              CLEAR
            </button>
          )}
        </div>

        {filtersExpanded && (
          <div className="card bg-white p-6 space-y-4">
            {/* Date Range Filter */}
            <div>
              <p className="text-black font-bold text-sm mb-3 tracking-wide">
                DATE RANGE:
              </p>
              <div className="flex gap-4">
                <div>
                  <label className="block text-xs font-mono text-gray-600 mb-1">FROM:</label>
                  <input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="input w-40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-gray-600 mb-1">TO:</label>
                  <input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="input w-40"
                  />
                </div>
              </div>
            </div>

            {/* Tags Filter */}
            {availableTags.length > 0 && (
              <div>
                <p className="text-black font-bold text-sm mb-3 tracking-wide">
                  TAGS:
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleFilterTag(tag)}
                      className={`tag ${
                        filterTags.includes(tag) ? 'tag-active' : ''
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Active Filters Summary */}
        {(filterTags.length > 0 || filterDateFrom || filterDateTo) && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-bold text-black tracking-wide">ACTIVE FILTERS:</span>
            {filterDateFrom && (
              <span className="px-2 py-1 bg-gray-200 text-black text-xs font-mono">
                From: {filterDateFrom}
              </span>
            )}
            {filterDateTo && (
              <span className="px-2 py-1 bg-gray-200 text-black text-xs font-mono">
                To: {filterDateTo}
              </span>
            )}
            {filterTags.map(tag => (
              <span key={tag} className="px-2 py-1 bg-gray-200 text-black text-xs font-mono">
                Tag: {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-16">
          <div className="card bg-white p-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-slate-600">Loading excerpts...</p>
          </div>
        </div>
      ) : filteredExcerpts.length === 0 ? (
        <div className="text-center py-16">
          <div className="card bg-white p-12">
            <div className="text-8xl font-bold text-black mb-6">
              {excerpts.length === 0 ? '00' : '??'}
            </div>
            <h3 className="text-2xl font-bold text-black mb-4 tracking-tight">
              {excerpts.length === 0 ? 'NO EXCERPTS YET' : 'NO EXCERPTS FOUND'}
            </h3>
            <p className="text-black mb-8 max-w-md mx-auto">
              {excerpts.length === 0 
                ? 'Start writing your first excerpt to begin your story collection.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {excerpts.length === 0 && (
              <Link
                href="/excerpts/new"
                className="btn btn-primary"
              >
                CREATE FIRST EXCERPT
              </Link>
            )}
          </div>
        </div>
      ) : (
        renderExcerpts()
      )}
      
      <AuthModal 
        isOpen={showAuthModal}
        onClose={closeAuthModal}
      />
    </div>
  )
}