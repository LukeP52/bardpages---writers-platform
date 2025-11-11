'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { storage } from '@/lib/storage'
import toast from 'react-hot-toast'

export default function TagManagerPage() {
  const [allTags, setAllTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    // Debug what's happening with tags
    const excerpts = storage.getExcerpts()
    const usedTags = storage.getUsedTags() 
    const premadeTags = storage.getPremadeTags()
    const allTags = storage.getAllTags()
    
    console.log('=== TAG DEBUG ===')
    console.log('Total excerpts:', excerpts.length)
    console.log('Excerpts with tags:', excerpts.filter(e => e.tags && e.tags.length > 0))
    console.log('All excerpt tags found:', excerpts.flatMap(e => e.tags || []))
    console.log('UsedTags method result:', usedTags)
    console.log('PremadeTags method result:', premadeTags)
    console.log('GetAllTags method result:', allTags)
    console.log('=== END DEBUG ===')
    
    setAllTags(allTags)
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
    // Check if this tag is used in any excerpts
    const excerpts = storage.getExcerpts()
    const isUsedInExcerpts = excerpts.some(excerpt => excerpt.tags.includes(tag))
    
    if (isUsedInExcerpts) {
      const confirmed = window.confirm(`"${tag}" is used in excerpts. Are you sure you want to remove it? It will remain in existing excerpts but won't appear as a quick-select option.`)
      if (!confirmed) return
    }
    
    storage.deletePremadeTag(tag)
    loadData()
    toast.success('Tag removed successfully!')
  }

  const migrateExistingTags = () => {
    // Get all tags from excerpts and add them to premade tags
    const excerpts = storage.getExcerpts()
    const allExcerptTags = new Set<string>()
    
    excerpts.forEach(excerpt => {
      excerpt.tags.forEach(tag => {
        if (tag.trim()) {
          allExcerptTags.add(tag.trim())
        }
      })
    })
    
    // Add all found tags to premade tags
    allExcerptTags.forEach(tag => {
      storage.addPremadeTag(tag)
    })
    
    loadData()
    toast.success(`Migrated ${allExcerptTags.size} tags from excerpts!`)
  }

  return (
    <div className="container py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-6xl font-bold text-black tracking-tight mb-2">
          TAGS
        </h1>
        <p className="text-black font-mono text-sm">
          MANAGE ALL YOUR TAGS IN ONE PLACE
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
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

        {/* All Tags List */}
        <div className="border-2 border-black bg-white">
          <div className="p-6 border-b-2 border-black">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-black tracking-wide">
                  ALL TAGS ({allTags.length})
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  Tags from excerpts and manually added tags. All tags appear as quick-select options when creating excerpts.
                </p>
              </div>
              <button
                onClick={migrateExistingTags}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                SYNC EXCERPT TAGS
              </button>
            </div>
          </div>
          <div className="p-6">
            {allTags.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl font-bold text-gray-300 mb-6">00</div>
                <h3 className="text-xl font-bold text-black mb-4">NO TAGS YET</h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
                  Add your first tag above, or create excerpts with tags to see them here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {allTags.map((tag) => {
                  const excerpts = storage.getExcerpts()
                  const usageCount = excerpts.filter(excerpt => excerpt.tags.includes(tag)).length
                  
                  return (
                    <div
                      key={tag}
                      className="flex items-center justify-between p-4 border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <span className="tag text-sm">
                          {tag}
                        </span>
                        {usageCount > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            Used in {usageCount} excerpt{usageCount !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => deleteTag(tag)}
                        className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition-colors"
                        title="Delete tag"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="border-2 border-black bg-white p-6">
          <h3 className="text-lg font-bold text-black mb-4 tracking-wide">
            HOW TAGS WORK
          </h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>• <strong>All tags</strong> appear as quick-select buttons when creating or editing excerpts</p>
            <p>• <strong>Add tags manually</strong> using the form above, or they'll be created automatically when you add them to excerpts</p>
            <p>• <strong>Usage count</strong> shows how many excerpts use each tag</p>
            <p>• <strong>Deleting a tag</strong> removes it from the quick-select list but keeps it in existing excerpts</p>
          </div>
        </div>
      </div>
    </div>
  )
}