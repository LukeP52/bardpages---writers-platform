'use client'

import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline'
import { Category } from '@/types'
import { storage } from '@/lib/storage'
import toast from 'react-hot-toast'

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

  const colorOptions = [
    '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#F59E0B',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6B7280'
  ]

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = () => {
    const allCategories = storage.getCategories()
    setCategories(allCategories)
  }

  const handleAssign = () => {
    if (selectedCategoryIds.length > 0) {
      onAssign(selectedCategoryIds)
      onClose()
    }
  }

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error('Category name is required')
      return
    }

    const newCategory: Category = {
      id: uuidv4(),
      name: newCategoryName.trim(),
      description: newCategoryDescription.trim() || undefined,
      color: newCategoryColor,
      createdAt: new Date()
    }

    storage.saveCategory(newCategory)
    setSelectedCategoryIds([...selectedCategoryIds, newCategory.id])
    setNewCategoryName('')
    setNewCategoryDescription('')
    setShowNewCategoryForm(false)
    loadCategories()
    toast.success(`Category "${newCategory.name}" created!`)
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
              <div className="space-y-2 mb-4">
                {categories.map(category => (
                  <label
                    key={category.id}
                    className={`flex items-center p-2 rounded border cursor-pointer transition-all ${
                      selectedCategoryIds.includes(category.id)
                        ? 'border-gray-400 bg-gray-50'
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
                      className="w-4 h-4 text-gray-600 border-gray-300 focus:ring-gray-500"
                    />
                    <div className="ml-2 flex-1">
                      <div className="text-sm font-medium text-gray-900">{category.name}</div>
                    </div>
                  </label>
                ))}
              </div>

              <button
                onClick={() => setShowNewCategoryForm(true)}
                className="w-full flex items-center justify-center gap-2 p-2 border border-dashed border-gray-300 rounded text-sm text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Add Category
              </button>
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
            <button
              onClick={handleAssign}
              disabled={selectedCategoryIds.length === 0}
              className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-3 py-2 rounded text-sm font-medium transition-colors"
            >
              Assign
            </button>
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