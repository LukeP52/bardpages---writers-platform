'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { storage } from '@/lib/storage'
import toast from 'react-hot-toast'

export default function TagManagerPage() {
  const [premadeTags, setPremadeTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setPremadeTags(storage.getPremadeTags())
  }


  const addTag = () => {
    if (newTag.trim()) {
      storage.addPremadeTag(newTag.trim())
      setNewTag('')
      loadData()
      toast.success('Tag added successfully!')
    }
  }

  const deleteTag = (tag: string) => {
    storage.deletePremadeTag(tag)
    loadData()
    toast.success('Tag removed successfully!')
  }

  return (
    <div className="container py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-6xl font-bold text-black tracking-tight mb-2">
          TAG MANAGER
        </h1>
        <p className="text-black font-mono text-sm">
          MANAGE PREMADE TAGS FOR QUICK TAGGING
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Premade Tags Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-black mb-4 tracking-tight">
              PREMADE TAGS
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Create predefined tags that will be available as quick options when creating excerpts. These tags will appear as clickable options in the excerpt form and filter system.
            </p>
          </div>

          {/* Add Tag Form */}
          <div className="border-2 border-black bg-white p-6">
            <h3 className="text-lg font-bold text-black mb-4 tracking-wide">
              ADD NEW TAG
            </h3>
            <div className="flex gap-0">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
                className="input border-r-0 flex-1"
                placeholder="Enter tag name..."
              />
              <button
                onClick={addTag}
                className="btn btn-primary px-6"
                disabled={!newTag.trim()}
              >
                <PlusIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tags List */}
          <div className="border-2 border-black bg-white">
            <div className="p-6 border-b-2 border-black">
              <h3 className="text-lg font-bold text-black tracking-wide">
                EXISTING TAGS ({premadeTags.length})
              </h3>
            </div>
            <div className="p-6">
              {premadeTags.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl font-bold text-gray-300 mb-4">00</div>
                  <p className="text-gray-500 text-sm">
                    No tags created yet. Add your first tag above.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {premadeTags.map((tag) => (
                    <div
                      key={tag}
                      className="flex items-center justify-between p-3 border border-gray-200 bg-gray-50"
                    >
                      <span className="tag text-xs">
                        {tag}
                      </span>
                      <button
                        onClick={() => deleteTag(tag)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Delete tag"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="mt-12 border-2 border-black bg-white p-6">
        <h3 className="text-lg font-bold text-black mb-4 tracking-wide">
          HOW TO USE PREMADE TAGS
        </h3>
        <div className="text-sm text-gray-700">
          <ul className="space-y-2">
            <li>• <strong>Quick Selection:</strong> Premade tags appear as clickable buttons in the excerpt form</li>
            <li>• <strong>Consistent Tagging:</strong> Use for common tags like "character-study", "dialogue", "action", "world-building"</li>
            <li>• <strong>Filtering:</strong> All tags (premade and custom) appear in the excerpts filter system</li>
            <li>• <strong>Organization:</strong> Create tags for themes, genres, or writing techniques you use frequently</li>
          </ul>
        </div>
      </div>
    </div>
  )
}