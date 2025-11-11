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
    <div className="container py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-black tracking-tight mb-1">
            STORYBOARDS
          </h1>
          <p className="text-black font-mono text-xs">
            ORGANIZE YOUR EXCERPTS
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary"
        >
          + NEW STORYBOARD
        </button>
      </div>

      {/* Create Storyboard Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border border-gray-300 w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">
                Create Storyboard
              </h3>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newStoryboardTitle}
                    onChange={(e) => setNewStoryboardTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-gray-400"
                    placeholder="Enter title..."
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newStoryboardDescription}
                    onChange={(e) => setNewStoryboardDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-gray-400 resize-none"
                    rows={3}
                    placeholder="Describe your storyboard..."
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={createStoryboard}
                  disabled={!newStoryboardTitle.trim()}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false)
                    setNewStoryboardTitle('')
                    setNewStoryboardDescription('')
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {storyboards.length === 0 ? (
        <div className="text-center py-16">
          <div className="card bg-white p-12">
            <div className="text-8xl font-bold text-black mb-6">
              00
            </div>
            <h3 className="text-2xl font-bold text-black mb-4 tracking-tight">
              NO STORYBOARDS YET
            </h3>
            <p className="text-black mb-8 max-w-md mx-auto">
              Create your first storyboard to start organizing your excerpts into structured stories.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn btn-primary"
            >
              CREATE FIRST STORYBOARD
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {storyboards.map((storyboard, index) => (
            <div key={storyboard.id} className="card bg-white hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-gray-600 font-bold font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <Link 
                        href={`/storyboards/${storyboard.id}`}
                        className="text-lg font-bold text-black hover:text-blue-600 transition-colors truncate"
                      >
                        {storyboard.title}
                      </Link>
                    </div>
                    
                    {storyboard.description && (
                      <div className="text-gray-700 text-sm mb-3 leading-relaxed">
                        {storyboard.description}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{storyboard.sections.length} sections</span>
                        <span>{getStoryboardWordCount(storyboard)} words</span>
                        <span>{storyboard.updatedAt.toLocaleDateString()}</span>
                      </div>
                      
                      {storyboard.sections.length > 0 && (
                        <div className="text-xs text-gray-400 truncate max-w-xs">
                          {storyboard.sections.slice(0, 2).map((section, idx) => {
                            const excerpt = getExcerptById(section.excerptId)
                            return (
                              <span key={section.excerptId}>
                                {excerpt?.title || 'Untitled'}
                                {idx < Math.min(1, storyboard.sections.length - 1) && ', '}
                              </span>
                            )
                          })}
                          {storyboard.sections.length > 2 && (
                            <span> +{storyboard.sections.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4 shrink-0">
                    <Link
                      href={`/storyboards/${storyboard.id}`}
                      className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => deleteStoryboard(storyboard.id)}
                      className="btn btn-sm border border-red-300 text-red-600 hover:bg-red-500 hover:text-white px-3 py-1 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}