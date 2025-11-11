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
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-6xl font-bold text-black tracking-tight mb-2">
            STORYBOARDS
          </h1>
          <p className="text-black font-mono text-sm">
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
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white border-4 border-black p-8 w-full max-w-lg">
            <h2 className="text-3xl font-bold text-black mb-6 tracking-tight">
              CREATE STORYBOARD
            </h2>
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-black font-bold text-sm mb-2 tracking-wide">
                  TITLE
                </label>
                <input
                  type="text"
                  id="title"
                  value={newStoryboardTitle}
                  onChange={(e) => setNewStoryboardTitle(e.target.value)}
                  className="input w-full"
                  placeholder="ENTER STORYBOARD TITLE"
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-black font-bold text-sm mb-2 tracking-wide">
                  DESCRIPTION (OPTIONAL)
                </label>
                <textarea
                  id="description"
                  value={newStoryboardDescription}
                  onChange={(e) => setNewStoryboardDescription(e.target.value)}
                  className="input w-full resize-none"
                  rows={3}
                  placeholder="DESCRIBE YOUR STORYBOARD"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button
                onClick={createStoryboard}
                disabled={!newStoryboardTitle.trim()}
                className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                CREATE
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false)
                  setNewStoryboardTitle('')
                  setNewStoryboardDescription('')
                }}
                className="btn btn-outline flex-1"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {storyboards.length === 0 ? (
        <div className="text-center py-16">
          <div className="border-2 border-black bg-white p-12">
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
        <div className="space-y-6">
          {storyboards.map((storyboard, index) => (
            <div key={storyboard.id} className="border-2 border-black bg-white">
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-black font-bold font-mono text-lg">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <h2 className="text-2xl font-bold text-black tracking-tight">
                        {storyboard.title}
                      </h2>
                    </div>
                    {storyboard.description && (
                      <p className="text-black mb-4 leading-relaxed ml-12">
                        {storyboard.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-6">
                    <Link
                      href={`/storyboards/${storyboard.id}`}
                      className="btn btn-outline"
                    >
                      EDIT
                    </Link>
                    <button
                      onClick={() => deleteStoryboard(storyboard.id)}
                      className="btn btn-outline hover:bg-red-50 hover:border-red-600 hover:text-red-600"
                    >
                      DELETE
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="border border-black p-4">
                    <div className="text-black font-bold text-sm mb-1 tracking-wide">
                      SECTIONS
                    </div>
                    <div className="text-2xl font-bold text-black">
                      {storyboard.sections.length}
                    </div>
                  </div>
                  
                  <div className="border border-black p-4">
                    <div className="text-black font-bold text-sm mb-1 tracking-wide">
                      TOTAL WORDS
                    </div>
                    <div className="text-2xl font-bold text-black">
                      {getStoryboardWordCount(storyboard)}
                    </div>
                  </div>
                  
                  <div className="border border-black p-4">
                    <div className="text-black font-bold text-sm mb-1 tracking-wide">
                      LAST UPDATED
                    </div>
                    <div className="text-sm font-mono text-black">
                      {storyboard.updatedAt.toLocaleDateString().toUpperCase()}
                    </div>
                  </div>
                </div>
                
                {storyboard.sections.length > 0 && (
                  <div className="border-t-2 border-black pt-4">
                    <div className="text-black font-bold text-sm mb-2 tracking-wide">
                      RECENT EXCERPTS:
                    </div>
                    <div className="text-black font-mono text-sm">
                      {storyboard.sections.slice(0, 3).map((section, idx) => {
                        const excerpt = getExcerptById(section.excerptId)
                        return (
                          <span key={section.excerptId}>
                            {excerpt?.title || 'UNTITLED'}
                            {idx < Math.min(2, storyboard.sections.length - 1) && ', '}
                          </span>
                        )
                      })}
                      {storyboard.sections.length > 3 && (
                        <span> + {storyboard.sections.length - 3} MORE</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}