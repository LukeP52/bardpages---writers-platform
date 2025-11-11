'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Excerpt } from '@/types'
import { storage } from '@/lib/storage'

export default function ExcerptsPage() {
  const [excerpts, setExcerpts] = useState<Excerpt[]>([])
  const [filteredExcerpts, setFilteredExcerpts] = useState<Excerpt[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [availableAuthors, setAvailableAuthors] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filtersExpanded, setFiltersExpanded] = useState(false)

  useEffect(() => {
    const loadedExcerpts = storage.getExcerpts()
    const usedTags = storage.getUsedTags()
    const usedCategories = storage.getUsedCategories()
    const usedAuthors = storage.getUsedAuthors()
    
    setExcerpts(loadedExcerpts)
    setFilteredExcerpts(loadedExcerpts)
    setAvailableTags(usedTags)
    setAvailableCategories(usedCategories)
    setAvailableAuthors(usedAuthors)
  }, [])

  useEffect(() => {
    const filters = {
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
      authors: selectedAuthors.length > 0 ? selectedAuthors : undefined,
      search: searchQuery || undefined
    }

    const filtered = storage.filterExcerpts(filters)
    setFilteredExcerpts(filtered)
  }, [selectedTags, selectedStatuses, selectedCategories, selectedAuthors, searchQuery])

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

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
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
    setSelectedCategories([])
    setSelectedAuthors([])
    setSearchQuery('')
  }

  const getExcerptPreview = (content: string, maxLength = 150) => {
    const textContent = content.replace(/<[^>]*>/g, '').trim()
    return textContent.length > maxLength
      ? textContent.substring(0, maxLength) + '...'
      : textContent
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
                  <h2 className="text-2xl font-bold text-black tracking-tight">
                    {excerpt.title}
                  </h2>
                </div>
                <div className="text-black mb-4 leading-relaxed">
                  {getExcerptPreview(excerpt.content, 200)}
                </div>
              </div>
              
              <div className="flex gap-2 ml-6">
                <Link
                  href={`/excerpts/${excerpt.id}`}
                  className="btn btn-outline"
                >
                  VIEW
                </Link>
                <Link
                  href={`/excerpts/${excerpt.id}/edit`}
                  className="btn btn-primary"
                >
                  EDIT
                </Link>
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
                {excerpt.category && (
                  <span className="px-2 py-1 bg-black text-white text-xs">
                    {excerpt.category.toUpperCase()}
                  </span>
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
          {(selectedTags.length > 0 || selectedStatuses.length > 0 || selectedCategories.length > 0 || selectedAuthors.length > 0 || searchQuery) && (
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

            {/* Categories Filter */}
            {availableCategories.length > 0 && (
              <div>
                <p className="text-black font-bold text-sm mb-3 tracking-wide">
                  CATEGORIES:
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableCategories.map(category => (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={`px-4 py-2 border-2 border-black text-sm font-bold tracking-wide transition-colors ${
                        selectedCategories.includes(category) 
                          ? 'bg-black text-white' 
                          : 'bg-white text-black hover:bg-black hover:text-white'
                      }`}
                    >
                      {category.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

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
        {(selectedTags.length > 0 || selectedStatuses.length > 0 || selectedCategories.length > 0 || selectedAuthors.length > 0) && (
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
            {selectedCategories.map(category => (
              <span key={category} className="px-2 py-1 bg-gray-200 text-black text-xs font-mono">
                Category: {category}
              </span>
            ))}
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