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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Excerpts</h1>
        <Link
          href="/excerpts/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Excerpt
        </Link>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search excerpts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {availableTags.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Filter by tags:</p>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {filteredExcerpts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {excerpts.length === 0 ? 'No excerpts yet' : 'No excerpts found'}
          </h3>
          <p className="text-gray-500 mb-6">
            {excerpts.length === 0 
              ? 'Start writing your first excerpt to begin your story collection.'
              : 'Try adjusting your search or filter criteria.'
            }
          </p>
          {excerpts.length === 0 && (
            <Link
              href="/excerpts/new"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Excerpt
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExcerpts.map(excerpt => (
            <Link key={excerpt.id} href={`/excerpts/${excerpt.id}`}>
              <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                  {excerpt.title}
                </h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                  {getExcerptPreview(excerpt.content)}
                </p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {excerpt.tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {excerpt.tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{excerpt.tags.length - 3} more
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>{excerpt.wordCount} words</span>
                  <span>{excerpt.updatedAt.toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}