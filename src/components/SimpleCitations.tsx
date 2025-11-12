'use client'

import { useState } from 'react'
import { Source } from '@/types/citations'
import { PlusIcon, TrashIcon, BookOpenIcon } from '@heroicons/react/24/outline'

interface SimpleCitationsProps {
  excerptId: string
  sources: Source[]
  onSourcesChange: (sources: Source[]) => void
}

export default function SimpleCitations({ excerptId, sources, onSourcesChange }: SimpleCitationsProps) {
  console.log('🔥 SimpleCitations: Component rendered with sources:', sources)
  console.log('🔥 SimpleCitations: sources.length:', sources.length)
  console.log('🔥 SimpleCitations: sources type:', typeof sources)
  console.log('🔥 SimpleCitations: sources is array:', Array.isArray(sources))
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    year: new Date().getFullYear(),
    type: 'book' as Source['type'],
    url: '',
    publication: '',
    pages: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('🔥 SimpleCitations: Form submitted!', { formData })
    
    if (!formData.title.trim() || !formData.author.trim()) {
      console.log('❌ SimpleCitations: Validation failed')
      alert('Title and Author are required')
      return
    }

    const newSource: Source = {
      id: `source-${Date.now()}`,
      title: formData.title.trim(),
      author: formData.author.trim(),
      year: formData.year,
      type: formData.type,
      url: formData.url.trim() || undefined,
      publication: formData.publication.trim() || undefined,
      pages: formData.pages.trim() || undefined
    }

    console.log('🔥 SimpleCitations: New source created:', newSource)
    console.log('🔥 SimpleCitations: Current sources before:', sources)
    
    const updatedSources = [...sources, newSource]
    console.log('🔥 SimpleCitations: Updated sources:', updatedSources)
    
    onSourcesChange(updatedSources)
    
    console.log('🔥 SimpleCitations: Called onSourcesChange with:', updatedSources)
    
    // Reset form
    setFormData({
      title: '',
      author: '',
      year: new Date().getFullYear(),
      type: 'book',
      url: '',
      publication: '',
      pages: ''
    })
    setShowForm(false)
    
    console.log('🔥 SimpleCitations: Form closed')
  }

  const handleDelete = (sourceId: string) => {
    if (confirm('Delete this source?')) {
      onSourcesChange(sources.filter(s => s.id !== sourceId))
    }
  }

  return (
    <div className="card">
      <div className="border-b border-slate-200/60 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Sources</h3>
            <p className="text-sm text-slate-600 mt-1">
              Manage your research sources and references
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowForm(true)
            }}
            className="btn btn-primary"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Source
          </button>
        </div>
      </div>

      <div className="p-6">
        {sources.length === 0 ? (
          <div className="text-center py-8">
            <BookOpenIcon className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-600 mb-4">No sources added yet</p>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowForm(true)
              }}
              className="btn btn-secondary"
            >
              Add your first source
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sources.map(source => (
              <div key={source.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide px-2 py-1 bg-slate-100 rounded">
                        {source.type}
                      </span>
                      <span className="text-xs text-slate-500">
                        {source.year}
                      </span>
                    </div>
                    <h4 className="font-medium text-slate-900 mb-1">
                      {source.title}
                    </h4>
                    <p className="text-sm text-slate-600">
                      {source.author}
                    </p>
                    {source.publication && (
                      <p className="text-xs text-slate-500 mt-1">
                        {source.publication}
                      </p>
                    )}
                    {source.pages && (
                      <p className="text-xs text-slate-500">
                        Pages: {source.pages}
                      </p>
                    )}
                    {source.url && (
                      <a 
                        href={source.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline block mt-1"
                      >
                        {source.url}
                      </a>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleDelete(source.id)}
                    className="text-red-400 hover:text-red-600 ml-3"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Simple Modal */}
      {showForm && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowForm(false)
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
               onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-gray-200 p-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Add New Source</h3>
                <button 
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Source['type'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="book">Book</option>
                    <option value="journal">Journal Article</option>
                    <option value="website">Website</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1900"
                    max={new Date().getFullYear() + 10}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter the title..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Author *</label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Author name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Publication</label>
                <input
                  type="text"
                  value={formData.publication}
                  onChange={(e) => setFormData(prev => ({ ...prev, publication: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Journal, publisher, etc."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pages</label>
                  <input
                    type="text"
                    value={formData.pages}
                    onChange={(e) => setFormData(prev => ({ ...prev, pages: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="123-145"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Add Source
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}