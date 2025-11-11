'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { storage } from '@/lib/storage'
import toast from 'react-hot-toast'

export default function TagManagerPage() {
  const [allTags, setAllTags] = useState<string[]>([])
  const [usedTags, setUsedTags] = useState<string[]>([])
  const [premadeTags, setPremadeTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const used = storage.getUsedTags()
    const premade = storage.getPremadeTags()
    const all = storage.getAllTags()
    
    setUsedTags(used)
    setPremadeTags(premade)
    setAllTags(all)
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

  const promoteToManagedTag = (tag: string) => {
    storage.addPremadeTag(tag)
    loadData()
    toast.success('Tag added to managed tags!')
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

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Managed Tags Section */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-black mb-4 tracking-tight">
                MANAGED TAGS
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Create predefined tags that will be available as quick options when creating excerpts.
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

            {/* Managed Tags List */}
            <div className="border-2 border-black bg-white">
              <div className="p-6 border-b-2 border-black">
                <h3 className="text-lg font-bold text-black tracking-wide">
                  MANAGED TAGS ({premadeTags.length})
                </h3>
              </div>
              <div className="p-6">
                {premadeTags.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl font-bold text-gray-300 mb-4">00</div>
                    <p className="text-gray-500 text-sm">
                      No managed tags yet. Add your first tag above.
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

          {/* Tags From Excerpts Section */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-black mb-4 tracking-tight">
                TAGS FROM EXCERPTS
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Tags that have been used in excerpts. Click + to add them to your managed tags.
              </p>
            </div>

            {/* Used Tags List */}
            <div className="border-2 border-black bg-white">
              <div className="p-6 border-b-2 border-black">
                <h3 className="text-lg font-bold text-black tracking-wide">
                  EXCERPT TAGS ({usedTags.filter(tag => !premadeTags.includes(tag)).length})
                </h3>
              </div>
              <div className="p-6">
                {usedTags.filter(tag => !premadeTags.includes(tag)).length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl font-bold text-gray-300 mb-4">00</div>
                    <p className="text-gray-500 text-sm">
                      No excerpt tags yet. Create excerpts with tags to see them here.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {usedTags.filter(tag => !premadeTags.includes(tag)).map((tag) => (
                      <div
                        key={tag}
                        className="flex items-center justify-between p-3 border border-gray-200 bg-blue-50"
                      >
                        <span className="tag text-xs bg-blue-100 text-blue-800">
                          {tag}
                        </span>
                        <button
                          onClick={() => promoteToManagedTag(tag)}
                          className="text-green-600 hover:text-green-800 p-1"
                          title="Add to managed tags"
                        >
                          <PlusIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="mt-12 border-2 border-black bg-white p-6">
        <h3 className="text-lg font-bold text-black mb-4 tracking-wide">
          HOW TAG MANAGEMENT WORKS
        </h3>
        <div className="text-sm text-gray-700">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold mb-2">MANAGED TAGS</h4>
              <ul className="space-y-1">
                <li>• Appear as quick-select buttons in excerpt forms</li>
                <li>• Created manually or promoted from excerpt tags</li>
                <li>• Can be deleted if no longer needed</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-2">EXCERPT TAGS</h4>
              <ul className="space-y-1">
                <li>• Created when you add tags to excerpts</li>
                <li>• Shown in blue on the right side</li>
                <li>• Click + to promote to managed tags</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}