'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Excerpt } from '@/types'
import { storage } from '@/lib/storage'
import { v4 as uuidv4 } from 'uuid'

export default function ExcerptsPage() {
  const [excerpts, setExcerpts] = useState<Excerpt[]>([])
  const [filteredExcerpts, setFilteredExcerpts] = useState<Excerpt[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [availableAuthors, setAvailableAuthors] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    const loadedExcerpts = storage.getExcerpts()
    const usedTags = storage.getUsedTags()
    const usedAuthors = storage.getUsedAuthors()
    
    setExcerpts(loadedExcerpts)
    setFilteredExcerpts(loadedExcerpts)
    setAvailableTags(usedTags)
    setAvailableAuthors(usedAuthors)
  }, [])

  useEffect(() => {
    const filters = {
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
      authors: selectedAuthors.length > 0 ? selectedAuthors : undefined,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      search: searchQuery || undefined
    }

    const filtered = storage.filterExcerpts(filters)
    setFilteredExcerpts(filtered)
  }, [selectedTags, selectedStatuses, selectedAuthors, searchQuery, dateFrom, dateTo])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    )
  }


  const toggleAuthor = (author: string) => {
    setSelectedAuthors(prev =>
      prev.includes(author)
        ? prev.filter(a => a !== author)
        : [...prev, author]
    )
  }

  const clearAllFilters = () => {
    setSelectedTags([])
    setSelectedStatuses([])
    setSelectedAuthors([])
    setSearchQuery('')
    setDateFrom('')
    setDateTo('')
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
      const cacheKey = `editing_excerpt_${excerpt.id}`
      const cacheData = {
        ...excerpt,
        createdAt: excerpt.createdAt.toISOString(),
        updatedAt: excerpt.updatedAt.toISOString(),
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

  const debugStorage = () => {
    console.log('=== STORAGE DEBUG ===')
    const loadedExcerpts = storage.getExcerpts()
    console.log('Excerpts from storage:', loadedExcerpts.length)
    loadedExcerpts.forEach((excerpt, i) => {
      console.log(`${i + 1}. ${excerpt.title} (ID: ${excerpt.id})`)
    })

    // Check localStorage directly
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('bardpages_excerpts')
      if (stored) {
        const parsed = JSON.parse(stored)
        console.log('localStorage direct check:', parsed.length, 'excerpts')
      } else {
        console.log('localStorage direct check: NO DATA')
      }
    }
    console.log('=== END DEBUG ===')
  }

  const createTestExcerpt = () => {
    const testExcerpt: Excerpt = {
      id: uuidv4(),
      title: 'Debug Test Excerpt',
      content: 'This is a test excerpt created for debugging storage issues.',
      author: 'Debug System',
      status: 'draft',
      tags: ['debug', 'test'],
      createdAt: new Date(),
      updatedAt: new Date(),
      wordCount: 12
    }
    
    console.log('Creating test excerpt with ID:', testExcerpt.id)
    storage.saveExcerpt(testExcerpt)
    
    // Test immediate retrieval
    const retrieved = storage.getExcerpt(testExcerpt.id)
    console.log('Immediate retrieval test:', retrieved ? 'SUCCESS' : 'FAILED')
    
    // Force refresh the state
    const updated = storage.getExcerpts()
    setExcerpts(updated)
    setFilteredExcerpts(updated)
    
    // Test edit URL
    console.log('Edit URL would be:', `/excerpts/${testExcerpt.id}/edit`)
  }

  const testDirectStorage = () => {
    console.log('=== DIRECT LOCALSTORAGE TEST ===')
    
    // Direct test
    const testData = { test: 'data', time: new Date().toISOString() }
    
    try {
      localStorage.setItem('test_storage', JSON.stringify(testData))
      const retrieved = localStorage.getItem('test_storage')
      console.log('Direct localStorage test:', retrieved ? 'SUCCESS' : 'FAILED')
      
      // Check current excerpts in localStorage
      const excerpts = localStorage.getItem('bardpages_excerpts')
      console.log('Current excerpts in localStorage:', excerpts ? JSON.parse(excerpts).length : 'NONE')
      
      localStorage.removeItem('test_storage')
    } catch (error) {
      console.error('localStorage error:', error)
    }
    
    console.log('=== END DIRECT TEST ===')
  }

  const renderExcerpts = () => (
    <div className="space-y-6">
      {filteredExcerpts.map((excerpt, index) => (
        <div key={excerpt.id} className="border-2 border-black bg-white">
          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-black font-bold font-mono text-lg">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <a 
                    href={`/excerpts/${excerpt.id}/edit`}
                    onClick={() => {
                      console.log('Title clicked for excerpt:', excerpt.id)
                      cacheExcerptForEditing(excerpt)
                    }}
                    className="text-2xl font-bold text-black tracking-tight hover:underline cursor-pointer"
                  >
                    {excerpt.title}
                  </a>
                </div>
                <div className="text-black mb-4 leading-relaxed">
                  {getExcerptPreview(excerpt.content, 200)}
                </div>
              </div>
              
              <div className="flex gap-2 ml-6">
                <a
                  href={`/excerpts/${excerpt.id}/edit`}
                  onClick={() => {
                    console.log('EDIT button clicked for excerpt:', excerpt.id)
                    cacheExcerptForEditing(excerpt)
                  }}
                  className="btn btn-primary"
                >
                  EDIT
                </a>
              </div>
            </div>
            
            {excerpt.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {excerpt.tags.map(tag => (
                  <span
                    key={tag}
                    className="tag"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            <div className="flex items-center justify-between text-sm font-mono text-black">
              <div className="flex items-center space-x-4">
                <span>{excerpt.wordCount} WORDS</span>
                {excerpt.author && (
                  <span>BY {excerpt.author.toUpperCase()}</span>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <span className={`px-2 py-1 text-xs font-bold ${
                  excerpt.status === 'final' ? 'bg-green-500 text-white' :
                  excerpt.status === 'review' ? 'bg-yellow-500 text-white' :
                  'bg-gray-500 text-white'
                }`}>
                  {excerpt.status.toUpperCase()}
                </span>
                <span>{excerpt.updatedAt.toLocaleDateString().toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )



  return (
    <div className="container py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-6xl font-bold text-black tracking-tight mb-2">
            EXCERPTS
          </h1>
          <p className="text-black font-mono text-sm">
            YOUR STORY FRAGMENTS
          </p>
        </div>
        
        <Link
          href="/excerpts/new"
          className="btn btn-primary"
        >
          + NEW EXCERPT
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-6">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="SEARCH EXCERPTS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input flex-1"
          />
          <button
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="btn btn-outline"
          >
            FILTERS {filtersExpanded ? '−' : '+'}
          </button>
          {(selectedTags.length > 0 || selectedStatuses.length > 0 || selectedAuthors.length > 0 || searchQuery || dateFrom || dateTo) && (
            <button
              onClick={clearAllFilters}
              className="btn btn-ghost"
            >
              CLEAR ALL
            </button>
          )}
        </div>

        {filtersExpanded && (
          <div className="border-2 border-black bg-white p-6 space-y-6">
            {/* Status Filter */}
            <div>
              <p className="text-black font-bold text-sm mb-3 tracking-wide">
                STATUS:
              </p>
              <div className="flex flex-wrap gap-2">
                {['draft', 'review', 'final'].map(status => (
                  <button
                    key={status}
                    onClick={() => toggleStatus(status)}
                    className={`px-4 py-2 border-2 border-black text-sm font-bold tracking-wide transition-colors ${
                      selectedStatuses.includes(status) 
                        ? 'bg-black text-white' 
                        : 'bg-white text-black hover:bg-black hover:text-white'
                    }`}
                  >
                    {status.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Authors Filter */}
            {availableAuthors.length > 0 && (
              <div>
                <p className="text-black font-bold text-sm mb-3 tracking-wide">
                  AUTHORS:
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableAuthors.map(author => (
                    <button
                      key={author}
                      onClick={() => toggleAuthor(author)}
                      className={`px-4 py-2 border-2 border-black text-sm font-bold tracking-wide transition-colors ${
                        selectedAuthors.includes(author) 
                          ? 'bg-black text-white' 
                          : 'bg-white text-black hover:bg-black hover:text-white'
                      }`}
                    >
                      {author.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Date Filter */}
            <div>
              <p className="text-black font-bold text-sm mb-3 tracking-wide">
                DATE RANGE:
              </p>
              <div className="flex gap-4">
                <div>
                  <label className="block text-xs font-mono text-gray-600 mb-1">FROM:</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="input w-40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-gray-600 mb-1">TO:</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
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
                      onClick={() => toggleTag(tag)}
                      className={`tag ${
                        selectedTags.includes(tag) ? 'tag-active' : ''
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
        {(selectedTags.length > 0 || selectedStatuses.length > 0 || selectedAuthors.length > 0 || dateFrom || dateTo) && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-bold text-black tracking-wide">ACTIVE FILTERS:</span>
            {selectedStatuses.map(status => (
              <span key={status} className="px-2 py-1 bg-gray-200 text-black text-xs font-mono">
                Status: {status}
              </span>
            ))}
            {selectedAuthors.map(author => (
              <span key={author} className="px-2 py-1 bg-gray-200 text-black text-xs font-mono">
                Author: {author}
              </span>
            ))}
            {dateFrom && (
              <span className="px-2 py-1 bg-gray-200 text-black text-xs font-mono">
                From: {dateFrom}
              </span>
            )}
            {dateTo && (
              <span className="px-2 py-1 bg-gray-200 text-black text-xs font-mono">
                To: {dateTo}
              </span>
            )}
            {selectedTags.map(tag => (
              <span key={tag} className="px-2 py-1 bg-gray-200 text-black text-xs font-mono">
                Tag: {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {filteredExcerpts.length === 0 ? (
        <div className="text-center py-16">
          <div className="border-2 border-black bg-white p-12">
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
    </div>
  )
}