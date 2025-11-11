'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, XMarkIcon, PencilIcon } from '@heroicons/react/24/outline'
import { v4 as uuidv4 } from 'uuid'
import { Category } from '@/types'
import { storage } from '@/lib/storage'
import CategoryAssignmentModal from '@/components/CategoryAssignmentModal'
import toast from 'react-hot-toast'

export default function TagManagerPage() {
  const [allTags, setAllTags] = useState<string[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [newTag, setNewTag] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [showCategoryAssignmentModal, setShowCategoryAssignmentModal] = useState(false)
  const [selectedTagForAssignment, setSelectedTagForAssignment] = useState<string>('')
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const allTags = storage.getAllTags()
    setAllTags(allTags)
    const allCategories = storage.getCategories()
    setCategories(allCategories)
  }


  const addTag = () => {
    if (newTag.trim()) {
      setSelectedTagForAssignment(newTag.trim())
      setShowCategoryAssignmentModal(true)
    }
  }

  const handleCategoryAssignment = (categoryIds: string[]) => {
    if (selectedTagForAssignment) {
      storage.addPremadeTagWithCategories(selectedTagForAssignment, categoryIds)
      setNewTag('')
      setSelectedTagForAssignment('')
      loadData()
      const categoryNames = categoryIds.map(id => storage.getCategory(id)?.name).filter(Boolean)
      toast.success(`Tag "${selectedTagForAssignment}" assigned to ${categoryNames.length > 1 ? categoryNames.join(', ') : categoryNames[0] || 'category'}!`)
    }
  }

  const handleTagReassignment = (tagName: string) => {
    setSelectedTagForAssignment(tagName)
    setShowCategoryAssignmentModal(true)
  }

  const addCategory = () => {
    if (newCategoryName.trim()) {
      const newCategory: Category = {
        id: uuidv4(),
        name: newCategoryName.trim(),
        description: `Custom category: ${newCategoryName.trim()}`,
        color: '#6B7280',
        createdAt: new Date()
      }
      storage.saveCategory(newCategory)
      setNewCategoryName('')
      loadData()
      toast.success(`Category "${newCategory.name}" created successfully!`)
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

  const categorizeTag = (tag: string): string => {
    const tagLower = tag.toLowerCase()
    
    // Date/Time patterns
    if (/\b(century|year|decade|era|period|ancient|medieval|renaissance|modern|bc|ad|ce|bce|\d{4}s?|\d{1,2}th)\b/i.test(tagLower)) {
      return 'Dates & Eras'
    }
    
    // Geography/Regions
    if (/\b(america|europe|asia|africa|ocean|sea|mountain|river|city|country|continent|north|south|east|west|empire|kingdom|nation|state|province|region|territory)\b/i.test(tagLower)) {
      return 'Geography & Regions'
    }
    
    // Wars/Military/Battles
    if (/\b(war|battle|fight|combat|military|army|navy|soldier|general|victory|defeat|siege|campaign|revolution|rebellion|conflict|invasion|conquest)\b/i.test(tagLower)) {
      return 'Wars & Military'
    }
    
    // Politics/Government
    if (/\b(politic|government|king|queen|emperor|president|minister|parliament|congress|election|democracy|republic|monarchy|dictatorship|leader|ruler|power|authority)\b/i.test(tagLower)) {
      return 'Politics & Government'
    }
    
    // Religion/Philosophy
    if (/\b(religion|christian|muslim|jewish|buddhist|hindu|god|church|temple|mosque|faith|belief|philosophy|moral|ethic|spiritual)\b/i.test(tagLower)) {
      return 'Religion & Philosophy'
    }
    
    // Culture/Society
    if (/\b(culture|society|social|custom|tradition|art|music|literature|education|family|marriage|festival|ceremony|ritual)\b/i.test(tagLower)) {
      return 'Culture & Society'
    }
    
    // Economics/Trade
    if (/\b(trade|economic|money|gold|silver|merchant|market|commerce|business|wealth|poor|rich|tax|resource|agriculture|industry)\b/i.test(tagLower)) {
      return 'Economics & Trade'
    }
    
    // Science/Technology
    if (/\b(science|technology|invention|discovery|medicine|astronomy|navigation|engineering|mathematics|innovation)\b/i.test(tagLower)) {
      return 'Science & Technology'
    }
    
    // People/Biography
    if (/\b(biography|person|people|character|hero|villain|famous|notable|explorer|inventor|artist|writer|poet)\b/i.test(tagLower)) {
      return 'People & Biography'
    }
    
    // Default category
    return 'Other'
  }

  const groupTagsByCategory = () => {
    const tagsByCategory = storage.getTagsByCategory()
    const result: { [key: string]: string[] } = {}
    
    categories.forEach(category => {
      const tags = tagsByCategory.get(category.id) || []
      if (tags.length > 0) {
        result[category.name] = tags.sort()
      }
    })
    
    return result
  }

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  return (
    <div className="container py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black tracking-tight mb-1">
            TAGS
          </h1>
          <p className="text-black font-mono text-xs">
            MANAGE ALL YOUR TAGS IN ONE PLACE
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Add Category and Tag Forms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Add Category Form */}
          <div className="card bg-white p-4">
            <h3 className="text-sm font-bold text-black mb-3 tracking-wide">
              ADD NEW CATEGORY
            </h3>
            <div className="flex gap-0 mb-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCategory()
                  }
                }}
                className="input border-r-0 flex-1 text-sm"
                placeholder="Category name..."
              />
              <button
                onClick={addCategory}
                className="btn btn-primary px-4"
                disabled={!newCategoryName.trim()}
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Add Tag Form */}
          <div className="card bg-white p-4">
            <h3 className="text-sm font-bold text-black mb-3 tracking-wide">
              ADD NEW TAG
            </h3>
            <div className="flex gap-0 mb-2">
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
                className="input border-r-0 flex-1 text-sm"
                placeholder="Tag name..."
              />
              <button
                onClick={addTag}
                className="btn btn-primary px-4"
                disabled={!newTag.trim()}
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* All Tags List */}
        <div className="card bg-white">
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
                className="text-xs text-gray-400 hover:text-gray-600 underline opacity-70 hover:opacity-100 transition-opacity"
                title="Sync any missing tags from excerpts"
              >
                sync
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
              <div className="space-y-4">
                {Object.entries(groupTagsByCategory()).map(([category, tags]) => (
                  <div key={category} className="border border-gray-200 rounded">
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-black text-sm tracking-wide">
                          {category.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded">
                          {tags.length}
                        </span>
                      </div>
                      <span className="text-gray-500 text-sm">
                        {expandedCategories.has(category) ? '−' : '+'}
                      </span>
                    </button>
                    
                    {expandedCategories.has(category) && (
                      <div className="p-4 bg-white">
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag) => {
                            const excerpts = storage.getExcerpts()
                            const usageCount = excerpts.filter(excerpt => excerpt.tags.includes(tag)).length
                            
                            return (
                              <div
                                key={tag}
                                className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded px-3 py-2 group transition-colors"
                              >
                                <span className="text-xs font-mono text-gray-800">
                                  {tag}
                                </span>
                                {usageCount > 0 && (
                                  <span className="text-xs text-gray-500 bg-gray-200 px-1 rounded">
                                    {usageCount}
                                  </span>
                                )}
                                <button
                                  onClick={() => handleTagReassignment(tag)}
                                  className="text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                                  title="Reassign category"
                                >
                                  <PencilIcon className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => deleteTag(tag)}
                                  className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                                  title="Delete tag"
                                >
                                  <XMarkIcon className="w-3 h-3" />
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="card bg-white p-6">
          <h3 className="text-lg font-bold text-black mb-4 tracking-wide">
            HOW CATEGORIZED TAGS WORK
          </h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>• <strong>Create categories:</strong> Add custom categories to organize your tags beyond the default ones</p>
            <p>• <strong>Category assignment:</strong> When adding tags, you'll be prompted to assign them to a category</p>
            <p>• <strong>Reassign tags:</strong> Click the pencil icon next to any tag to move it to a different category</p>
            <p>• <strong>Expand categories:</strong> Click on a category to see its tags. Numbers show how many tags are in each category</p>
            <p>• <strong>Usage tracking:</strong> See how many excerpts use each tag with the usage counter</p>
            <p>• <strong>Smart deletion:</strong> Delete tags with the × icon (removes from quick-select but keeps in existing excerpts)</p>
          </div>
        </div>
      </div>

      {/* Category Assignment Modal */}
      {showCategoryAssignmentModal && (
        <CategoryAssignmentModal
          tagName={selectedTagForAssignment}
          currentCategoryIds={storage.getTagCategories(selectedTagForAssignment).map(cat => cat.id)}
          onAssign={handleCategoryAssignment}
          onClose={() => {
            setShowCategoryAssignmentModal(false)
            setSelectedTagForAssignment('')
          }}
        />
      )}
    </div>
  )
}