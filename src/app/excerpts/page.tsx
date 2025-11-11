'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Excerpt } from '@/types'
import { storage } from '@/lib/storage'
import RichTextEditor from '@/components/RichTextEditor'

type ViewMode = 'grid' | 'list' | 'preview'

export default function ExcerptsPage() {
  const [excerpts, setExcerpts] = useState<Excerpt[]>([])
  const [filteredExcerpts, setFilteredExcerpts] = useState<Excerpt[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [expandedExcerpt, setExpandedExcerpt] = useState<string | null>(null)

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

  const toggleExcerptExpansion = (excerptId: string) => {
    setExpandedExcerpt(expandedExcerpt === excerptId ? null : excerptId)
  }

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredExcerpts.map(excerpt => (
        <div key={excerpt.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200">
          <div className="p-6">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xl font-semibold text-gray-900 line-clamp-2 flex-1">
                {excerpt.title}
              </h3>
              <div className="flex gap-1 ml-3">
                <Link
                  href={`/excerpts/${excerpt.id}`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View
                </Link>
                <span className="text-gray-400">|</span>
                <Link
                  href={`/excerpts/${excerpt.id}/edit`}
                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                >
                  Edit
                </Link>
              </div>
            </div>
            
            <div className="text-gray-600 text-sm mb-3 line-clamp-3">
              {getExcerptPreview(excerpt.content)}
            </div>
            
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
        </div>
      ))}
    </div>
  )

  const renderListView = () => (
    <div className="space-y-4">
      {filteredExcerpts.map(excerpt => (
        <div key={excerpt.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-xl font-semibold text-gray-900 flex-1">
              {excerpt.title}
            </h3>
            <div className="flex gap-3 ml-6">
              <button
                onClick={() => toggleExcerptExpansion(excerpt.id)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {expandedExcerpt === excerpt.id ? 'Collapse' : 'Preview'}
              </button>
              <Link
                href={`/excerpts/${excerpt.id}`}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View
              </Link>
              <Link
                href={`/excerpts/${excerpt.id}/edit`}
                className="text-green-600 hover:text-green-800 text-sm font-medium"
              >
                Edit
              </Link>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {excerpt.tags.map(tag => (
              <span
                key={tag}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
          
          <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
            <span>{excerpt.wordCount} words</span>
            <span>Updated {excerpt.updatedAt.toLocaleDateString()}</span>
          </div>
          
          {expandedExcerpt === excerpt.id ? (
            <div className="border-t pt-4">
              <RichTextEditor
                value={excerpt.content}
                onChange={() => {}}
                readonly={true}
                height={300}
              />
            </div>
          ) : (
            <p className="text-gray-600 text-sm line-clamp-2">
              {getExcerptPreview(excerpt.content)}
            </p>
          )}
        </div>
      ))}
    </div>
  )

  const renderPreviewView = () => (
    <div className="space-y-8">
      {filteredExcerpts.map(excerpt => (
        <div key={excerpt.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-2xl font-semibold text-gray-900">
                {excerpt.title}
              </h3>
              <div className="flex gap-3">
                <Link
                  href={`/excerpts/${excerpt.id}`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View Full
                </Link>
                <Link
                  href={`/excerpts/${excerpt.id}/edit`}
                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                >
                  Edit
                </Link>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {excerpt.tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
            
            <div className="flex gap-4 text-sm text-gray-500">
              <span>{excerpt.wordCount} words</span>
              <span>Updated {excerpt.updatedAt.toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="p-6">
            <RichTextEditor
              value={excerpt.content}
              onChange={() => {}}
              readonly={true}
              height={400}
            />
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Excerpts</h1>
        
        <div className="flex gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                viewMode === 'preview'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Preview
            </button>
          </div>
          
          <Link
            href="/excerpts/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            + New Excerpt
          </Link>
        </div>
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
        <>
          {viewMode === 'grid' && renderGridView()}
          {viewMode === 'list' && renderListView()}
          {viewMode === 'preview' && renderPreviewView()}
        </>
      )}
    </div>
  )
}