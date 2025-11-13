'use client'

import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline'
import { Category } from '@/types'
import { useStorage } from '@/contexts/StorageContext'

interface CategoryAssignmentModalProps {
  tagName: string
  currentCategoryIds?: string[]
  onAssign: (categoryIds: string[]) => void
  onClose: () => void
}

export default function CategoryAssignmentModal({
  tagName,
  currentCategoryIds = [],
  onAssign,
  onClose
}: CategoryAssignmentModalProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(currentCategoryIds)
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDescription, setNewCategoryDescription] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6')
  
  const storage = useStorage()

  const colorOptions = [
    '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#F59E0B',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6B7280'
  ]

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const allCategories = await storage.getCategories()
      setCategories(allCategories)
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  const handleAssign = () => {
    onAssign(selectedCategoryIds)
    onClose()
  }
  
  const handleKeepUncategorized = () => {
    onAssign([])
    onClose()
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      console.error('Category name is required')
      return
    }

    try {
      const newCategory: Category = {
        id: uuidv4(),
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined,
        color: newCategoryColor,
        createdAt: new Date()
      }

      await storage.saveCategory(newCategory)
      setSelectedCategoryIds([...selectedCategoryIds, newCategory.id])
      setNewCategoryName('')
      setNewCategoryDescription('')
      setShowNewCategoryForm(false)
      await loadCategories()
      console.log(`Category "${newCategory.name}" created!`)
    } catch (error) {
      console.error('Failed to create category:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg border border-gray-300 w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">
            Assign Category
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          {!showNewCategoryForm ? (
            <>
              <div className="mb-3">
                <p className="text-sm text-gray-600">
                  Assign "{tagName}" to one or more categories:
                </p>
              </div>
              
              {categories.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {categories.map(category => (
                    <label
                      key={category.id}
                      className={`flex items-center p-2 rounded border cursor-pointer transition-all ${
                        selectedCategoryIds.includes(category.id)
                          ? 'border-blue-400 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategoryIds.includes(category.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategoryIds([...selectedCategoryIds, category.id])
                          } else {
                            setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== category.id))
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <div className="ml-2 flex items-center gap-2 flex-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <div className="text-sm font-medium text-gray-900">{category.name}</div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 mb-4">
                  <p className="text-sm text-gray-500 mb-2">No categories exist yet.</p>
                  <p className="text-xs text-gray-400">Create your first category to organize tags.</p>
                </div>
              )}

              <div className="space-y-2">
                <button
                  onClick={handleKeepUncategorized}
                  className="w-full flex items-center justify-center gap-2 p-2 border border-yellow-300 bg-yellow-50 hover:bg-yellow-100 rounded text-sm text-yellow-800 hover:text-yellow-900 transition-colors"
                >
                  Keep Uncategorized
                </button>
                
                <button
                  onClick={() => setShowNewCategoryForm(true)}
                  className="w-full flex items-center justify-center gap-2 p-2 border border-dashed border-gray-300 rounded text-sm text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  Create New Category
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-gray-400"
                  placeholder="Enter name..."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleCreateCategory}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowNewCategoryForm(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {!showNewCategoryForm && (
          <div className="flex gap-2 p-4 pt-0">
            {selectedCategoryIds.length > 0 && (
              <button
                onClick={handleAssign}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
              >
                Assign to {selectedCategoryIds.length} categor{selectedCategoryIds.length === 1 ? 'y' : 'ies'}
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}