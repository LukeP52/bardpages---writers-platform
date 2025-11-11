'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { storage } from '@/lib/storage'
import toast from 'react-hot-toast'

export default function CategoriesPage() {
  const [premadeCategories, setPremadeCategories] = useState<string[]>([])
  const [premadeTags, setPremadeTags] = useState<string[]>([])
  const [newCategory, setNewCategory] = useState('')
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setPremadeCategories(storage.getPremadeCategories())
    setPremadeTags(storage.getPremadeTags())
  }

  const addCategory = () => {
    if (newCategory.trim()) {
      storage.addPremadeCategory(newCategory.trim())
      setNewCategory('')
      loadData()
      toast.success('Category added successfully!')
    }
  }

  const deleteCategory = (category: string) => {
    storage.deletePremadeCategory(category)
    loadData()
    toast.success('Category removed successfully!')
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
          CATEGORY MANAGER
        </h1>
        <p className="text-black font-mono text-sm">
          MANAGE CATEGORIES AND PREMADE TAGS
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Categories Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-black mb-4 tracking-tight">
              CATEGORIES
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Create predefined categories that will appear as options when creating excerpts.
            </p>
          </div>

          {/* Add Category Form */}
          <div className="border-2 border-black bg-white p-6">
            <h3 className="text-lg font-bold text-black mb-4 tracking-wide">
              ADD NEW CATEGORY
            </h3>
            <div className="flex gap-0">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCategory()
                  }
                }}
                className="input border-r-0 flex-1"
                placeholder="Enter category name..."
              />
              <button
                onClick={addCategory}
                className="btn btn-primary px-6"
                disabled={!newCategory.trim()}
              >
                <PlusIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Categories List */}
          <div className="border-2 border-black bg-white">
            <div className="p-6 border-b-2 border-black">
              <h3 className="text-lg font-bold text-black tracking-wide">
                EXISTING CATEGORIES ({premadeCategories.length})
              </h3>
            </div>
            <div className="p-6">
              {premadeCategories.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl font-bold text-gray-300 mb-4">00</div>
                  <p className="text-gray-500 text-sm">
                    No categories created yet. Add your first category above.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {premadeCategories.map((category) => (
                    <div
                      key={category}
                      className="flex items-center justify-between p-4 border border-gray-200 bg-gray-50"
                    >
                      <span className="font-mono text-sm font-medium text-black">
                        {category}
                      </span>
                      <button
                        onClick={() => deleteCategory(category)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Delete category"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Premade Tags Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-black mb-4 tracking-tight">
              PREMADE TAGS
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
          HOW TO USE
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
          <div>
            <h4 className="font-bold text-black mb-2">Categories</h4>
            <ul className="space-y-1">
              <li>• Categories appear as autocomplete options in the excerpt form</li>
              <li>• Used for organizing excerpts by type (fiction, non-fiction, poetry, etc.)</li>
              <li>• Categories also appear as filter options in the excerpts page</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-black mb-2">Premade Tags</h4>
            <ul className="space-y-1">
              <li>• Tags appear as clickable options in the excerpt form</li>
              <li>• Used for quick tagging without typing (character-study, dialogue, action, etc.)</li>
              <li>• Premade tags also appear in the filtering system</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}