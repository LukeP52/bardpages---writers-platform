'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, XMarkIcon, PencilIcon } from '@heroicons/react/24/outline'
import { v4 as uuidv4 } from 'uuid'
import { Category } from '@/types'
import { useStorage } from '@/contexts/StorageContext'
import CategoryAssignmentModal from '@/components/CategoryAssignmentModal'

export default function TagManagerPage() {
  const [allTags, setAllTags] = useState<string[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [newTag, setNewTag] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [showCategoryAssignmentModal, setShowCategoryAssignmentModal] = useState(false)
  const [selectedTagForAssignment, setSelectedTagForAssignment] = useState<string>('')
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false)
  const [currentCategoryIds, setCurrentCategoryIds] = useState<string[]>([])
  const [groupedTags, setGroupedTags] = useState<{ [key: string]: string[] }>({})
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)
  const storage = useStorage()
  const categorySuggestions = storage.getWriterCategorySuggestions()

  useEffect(() => {
    loadData()
  }, [storage])

  const loadData = async () => {
    try {
      const [allTags, allCategories] = await Promise.all([
        storage.getUsedTags(),
        storage.getCategories()
      ])
      setAllTags(allTags)
      setCategories(allCategories)
      
      // Load grouped tags after we have both tags and categories
      await loadGroupedTags(allTags, allCategories)
    } catch (error) {
      console.error('Failed to load tags and categories:', error)
    }
  }

  const loadGroupedTags = async (tags?: string[], cats?: Category[]) => {
    const tagsToUse = tags || allTags
    const categoriesToUse = cats || categories
    
    if (tagsToUse.length === 0) {
      setGroupedTags({})
      return
    }
    
    try {
      setIsLoadingGroups(true)
      const result: { [key: string]: string[] } = {}
      
      // Initialize all categories with empty arrays
      categoriesToUse.forEach(category => {
        result[category.name] = []
      })
      
      // Add "Uncategorized" category if it doesn't exist
      if (!result['Uncategorized']) {
        result['Uncategorized'] = []
      }
      
      // For each tag, get its assigned categories and group accordingly
      const categorizedTags = new Set<string>()
      
      for (const tag of tagsToUse) {
        try {
          const tagCategories = await storage.getTagCategories(tag)
          
          if (tagCategories.length > 0) {
            // Tag has assigned categories
            tagCategories.forEach(category => {
              if (result[category.name]) {
                result[category.name].push(tag)
                categorizedTags.add(tag)
              }
            })
          }
        } catch (error) {
          console.error(`Failed to get categories for tag "${tag}":`, error)
        }
      }
      
      // Add uncategorized tags to "Uncategorized" group
      const uncategorizedTags = tagsToUse.filter(tag => !categorizedTags.has(tag))
      result['Uncategorized'] = uncategorizedTags
      
      setGroupedTags(result)
    } catch (error) {
      console.error('Failed to load grouped tags:', error)
    } finally {
      setIsLoadingGroups(false)
    }
  }


  const addTag = async () => {
    if (newTag.trim()) {
      setSelectedTagForAssignment(newTag.trim())
      setCurrentCategoryIds([])
      setShowCategoryAssignmentModal(true)
    }
  }

  const handleCategoryAssignment = async (categoryIds: string[]) => {
    if (selectedTagForAssignment) {
      try {
        await storage.addPremadeTagWithCategories(selectedTagForAssignment, categoryIds)
        setNewTag('')
        setSelectedTagForAssignment('')
        await loadData()
        
        // Get category names
        const categoryNames = await Promise.all(
          categoryIds.map(id => storage.getCategory(id))
        )
        const validCategoryNames = categoryNames.filter(Boolean).map(cat => cat!.name)
        
      } catch (error) {
        console.error('Failed to assign tag to categories:', error)
      }
    }
  }

  const handleTagReassignment = async (tagName: string) => {
    try {
      setSelectedTagForAssignment(tagName)
      const categories = await storage.getTagCategories(tagName)
      setCurrentCategoryIds(categories.map(cat => cat.id))
      setShowCategoryAssignmentModal(true)
    } catch (error) {
      console.error('Failed to get tag categories:', error)
      setCurrentCategoryIds([])
      setShowCategoryAssignmentModal(true)
    }
  }

  const addSuggestedCategory = async (suggestion: { name: string; description: string; color: string }) => {
    try {
      const newCategory: Category = {
        id: uuidv4(),
        name: suggestion.name,
        description: suggestion.description,
        color: suggestion.color,
        createdAt: new Date()
      }
      await storage.saveCategory(newCategory)
      await loadData()
    } catch (error) {
      console.error('Failed to create suggested category:', error)
    }
  }

  const addCategory = async () => {
    if (newCategoryName.trim()) {
      try {
        const newCategory: Category = {
          id: uuidv4(),
          name: newCategoryName.trim(),
          description: `Custom category: ${newCategoryName.trim()}`,
          color: '#6B7280',
          createdAt: new Date()
        }
        await storage.saveCategory(newCategory)
        setNewCategoryName('')
        await loadData()
      } catch (error) {
        console.error('Failed to create category:', error)
      }
    }
  }

  const deleteTag = async (tag: string) => {
    try {
      // Check if this tag is used in any excerpts
      const excerpts = await storage.getExcerpts()
      const isUsedInExcerpts = excerpts.some(excerpt => excerpt.tags.includes(tag))
      
      if (isUsedInExcerpts) {
        console.log(`"${tag}" is currently used in excerpts and cannot be deleted. Remove it from excerpts first.`)
        return
      }
      
      // Since we're auto-populating, tags are removed automatically when not used
      await loadData()
    } catch (error) {
      console.error('Failed to delete tag:', error)
    }
  }

  const deleteCategory = async (categoryId: string) => {
    try {
      const category = await storage.getCategory(categoryId)
      if (!category) return
      
      // Check if category has any tags assigned to it by looking at groupedTags
      const categoryTags = groupedTags[category.name] || []
      
      if (categoryTags.length > 0) {
        console.log(`Category "${category.name}" has ${categoryTags.length} tags assigned and cannot be deleted. Reassign the tags first.`)
        return
      }
      
      await storage.deleteCategory(categoryId)
      await loadData()
      console.log(`Category "${category.name}" has been deleted.`)
    } catch (error) {
      console.error('Failed to delete category:', error)
    }
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
        {/* Category Suggestions - Always visible, show remaining suggestions */}
        {(() => {
          // Filter out suggestions that already exist as categories
          const existingCategoryNames = categories.map(cat => cat.name.toLowerCase())
          const availableSuggestions = categorySuggestions.filter(
            suggestion => !existingCategoryNames.includes(suggestion.name.toLowerCase())
          )
          
          return availableSuggestions.length > 0 ? (
            <div className="card bg-white p-6 mb-8">
              <h3 className="text-lg font-bold text-black mb-4 tracking-wide">
                SUGGESTED CATEGORIES FOR WRITERS
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {categories.length === 0 
                  ? 'Get started quickly with these writer-focused categories, or create your own below.'
                  : 'Add more categories to better organize your tags.'
                }
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.name}
                    className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors cursor-pointer"
                    onClick={() => addSuggestedCategory(suggestion)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: suggestion.color }}
                      ></div>
                      <div>
                        <div className="font-bold text-sm text-black">
                          {suggestion.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {suggestion.description}
                        </div>
                      </div>
                    </div>
                    <PlusIcon className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
              {categories.length > 0 && (
                <p className="text-xs text-gray-500 mt-4">
                  {categories.length} of {categorySuggestions.length} suggested categories created
                </p>
              )}
            </div>
          ) : null
        })()}

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

        {/* Categories List */}
        {categories.length > 0 && (
          <div className="card bg-white">
            <div className="p-6 border-b-2 border-black">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-black tracking-wide">
                    CATEGORIES ({categories.length})
                  </h3>
                  <p className="text-sm text-gray-600 mt-2">
                    Organize your tags into categories. Delete empty categories or reassign tags first.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => {
                  const categoryTags = groupedTags[category.name] || []
                  return (
                    <div
                      key={category.id}
                      className="border border-gray-200 rounded p-4 bg-gray-50 hover:bg-gray-100 transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          ></div>
                          <span className="font-bold text-sm text-black">
                            {category.name}
                          </span>
                        </div>
                        <button
                          onClick={() => deleteCategory(category.id)}
                          className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete category"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        {category.description}
                      </p>
                      <div className="text-xs text-gray-500">
                        {categoryTags.length} tags
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

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
            ) : isLoadingGroups ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
                <p className="text-gray-600 text-sm">Loading categories...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedTags).map(([category, tags]) => (
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
                          {tags.map((tag) => (
                              <div
                                key={tag}
                                className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded px-3 py-2 group transition-colors"
                              >
                                <span className="text-xs font-mono text-gray-800">
                                  {tag}
                                </span>
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
                            ))}
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
          currentCategoryIds={currentCategoryIds}
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