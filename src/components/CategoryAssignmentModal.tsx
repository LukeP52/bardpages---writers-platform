'use client'

import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline'
import { Category } from '@/types'
import { storage } from '@/lib/storage'
import toast from 'react-hot-toast'

interface CategoryAssignmentModalProps {
  tagName: string
  currentCategoryId?: string
  onAssign: (categoryId: string) => void
  onClose: () => void
}

export default function CategoryAssignmentModal({
  tagName,
  currentCategoryId,
  onAssign,
  onClose
}: CategoryAssignmentModalProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState(currentCategoryId || '')
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
    if (selectedCategoryId) {
      onAssign(selectedCategoryId)
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
    setSelectedCategoryId(newCategory.id)
    setNewCategoryName('')
    setNewCategoryDescription('')
    setShowNewCategoryForm(false)
    loadCategories()
    toast.success(`Category "${newCategory.name}" created!`)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Assign Category for "{tagName}"
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {!showNewCategoryForm ? (
            <>
              <div className="space-y-3 mb-6">
                {categories.map(category => (
                  <label
                    key={category.id}
                    className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedCategoryId === category.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={category.id}
                      checked={selectedCategoryId === category.id}
                      onChange={(e) => setSelectedCategoryId(e.target.value)}
                      className="sr-only"
                    />
                    <div
                      className="w-4 h-4 rounded-full mr-3 border-2 border-white shadow-sm"
                      style={{ backgroundColor: category.color }}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{category.name}</div>
                      {category.description && (
                        <div className="text-sm text-gray-500">{category.description}</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              <button
                onClick={() => setShowNewCategoryForm(true)}
                className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                Create New Category
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter category name..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Optional description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="flex gap-2">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewCategoryColor(color)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        newCategoryColor === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreateCategory}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Create Category
                </button>
                <button
                  onClick={() => setShowNewCategoryForm(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {!showNewCategoryForm && (
          <div className="flex gap-3 p-6 pt-0">
            <button
              onClick={handleAssign}
              disabled={!selectedCategoryId}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Assign Category
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}