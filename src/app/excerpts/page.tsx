'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Excerpt } from '@/types'
import { storage } from '@/lib/storage'

export default function ExcerptsPage() {
  const [excerpts, setExcerpts] = useState<Excerpt[]>([])
  const [filteredExcerpts, setFilteredExcerpts] = useState<Excerpt[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const loadedExcerpts = storage.getExcerpts()
    const usedTags = storage.getUsedTags()
    
    setExcerpts(loadedExcerpts)
    setFilteredExcerpts(loadedExcerpts)
    setAvailableTags(usedTags)
  }, [])

  useEffect(() => {
    let filtered = excerpts

    if (selectedTags.length > 0) {
      filtered = filtered.filter(excerpt =>
        selectedTags.some(tag => excerpt.tags.includes(tag))
      )
    }

    if (searchQuery) {
      filtered = filtered.filter(excerpt =>
        excerpt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        excerpt.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredExcerpts(filtered)
  }, [excerpts, selectedTags, searchQuery])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
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
              <span>{excerpt.wordCount} WORDS</span>
              <span>{excerpt.updatedAt.toLocaleDateString().toUpperCase()}</span>
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
        <div>
          <input
            type="text"
            placeholder="SEARCH EXCERPTS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input w-full"
          />
        </div>

        {availableTags.length > 0 && (
          <div>
            <p className="text-black font-bold text-sm mb-3 tracking-wide">
              FILTER BY TAGS:
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