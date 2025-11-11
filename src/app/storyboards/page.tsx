'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Storyboard, Excerpt } from '@/types'
import { storage } from '@/lib/storage'
import { v4 as uuidv4 } from 'uuid'

export default function StoryboardsPage() {
  const [storyboards, setStoryboards] = useState<Storyboard[]>([])
  const [excerpts, setExcerpts] = useState<Excerpt[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newStoryboardTitle, setNewStoryboardTitle] = useState('')
  const [newStoryboardDescription, setNewStoryboardDescription] = useState('')

  useEffect(() => {
    const loadedStoryboards = storage.getStoryboards()
    const loadedExcerpts = storage.getExcerpts()
    setStoryboards(loadedStoryboards)
    setExcerpts(loadedExcerpts)
  }, [])

  const createStoryboard = () => {
    if (!newStoryboardTitle.trim()) return

    const newStoryboard: Storyboard = {
      id: uuidv4(),
      title: newStoryboardTitle.trim(),
      description: newStoryboardDescription.trim() || undefined,
      sections: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    storage.saveStoryboard(newStoryboard)
    setStoryboards(storage.getStoryboards())
    setNewStoryboardTitle('')
    setNewStoryboardDescription('')
    setShowCreateForm(false)
  }

  const deleteStoryboard = (id: string) => {
    if (window.confirm('Are you sure you want to delete this storyboard?')) {
      storage.deleteStoryboard(id)
      setStoryboards(storage.getStoryboards())
    }
  }

  const getExcerptById = (excerptId: string) => {
    return excerpts.find(excerpt => excerpt.id === excerptId)
  }

  const getStoryboardWordCount = (storyboard: Storyboard) => {
    return storyboard.sections.reduce((total, section) => {
      const excerpt = getExcerptById(section.excerptId)
      return total + (excerpt?.wordCount || 0)
    }, 0)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Storyboards</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + New Storyboard
        </button>
      </div>

      {/* Create Storyboard Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create New Storyboard</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={newStoryboardTitle}
                  onChange={(e) => setNewStoryboardTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter storyboard title"
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  value={newStoryboardDescription}
                  onChange={(e) => setNewStoryboardDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe your storyboard"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={createStoryboard}
                disabled={!newStoryboardTitle.trim()}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Storyboard
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false)
                  setNewStoryboardTitle('')
                  setNewStoryboardDescription('')
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Storyboards Grid */}
      {storyboards.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No storyboards yet</h3>
          <p className="text-gray-500 mb-6">
            Create your first storyboard to start organizing your excerpts into structured stories.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your First Storyboard
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {storyboards.map((storyboard) => (
            <div key={storyboard.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200">
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-semibold text-gray-900 line-clamp-2 flex-1">
                    {storyboard.title}
                  </h3>
                  <div className="flex gap-1 ml-3">
                    <Link
                      href={`/storyboards/${storyboard.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Edit
                    </Link>
                    <span className="text-gray-400">|</span>
                    <button
                      onClick={() => deleteStoryboard(storyboard.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                {storyboard.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {storyboard.description}
                  </p>
                )}
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{storyboard.sections.length} sections</span>
                    <span>{getStoryboardWordCount(storyboard)} words</span>
                  </div>
                  
                  {storyboard.sections.length > 0 && (
                    <div className="text-xs text-gray-400">
                      Recent: {storyboard.sections.slice(0, 2).map(section => {
                        const excerpt = getExcerptById(section.excerptId)
                        return excerpt?.title || 'Untitled'
                      }).join(', ')}{storyboard.sections.length > 2 && ` +${storyboard.sections.length - 2} more`}
                    </div>
                  )}
                </div>
                
                <div className="text-sm text-gray-500">
                  Updated {storyboard.updatedAt.toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}