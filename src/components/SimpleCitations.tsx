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
    
    if (!formData.title.trim() || !formData.author.trim()) {
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

    onSourcesChange([...sources, newSource])
    
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
            onClick={() => setShowForm(true)}
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
              onClick={() => setShowForm(true)}
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
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="border-b border-slate-200/60 p-4">
              <h3 className="text-lg font-semibold text-slate-900">Add New Source</h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Source['type'] }))}
                    className="input"
                  >
                    <option value="book">Book</option>
                    <option value="journal">Journal Article</option>
                    <option value="website">Website</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Year</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    className="input"
                    min="1900"
                    max={new Date().getFullYear() + 10}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="input"
                  placeholder="Enter the title..."
                  required
                />
              </div>

              <div>
                <label className="form-label">Author *</label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                  className="input"
                  placeholder="Author name"
                  required
                />
              </div>

              <div>
                <label className="form-label">Publication</label>
                <input
                  type="text"
                  value={formData.publication}
                  onChange={(e) => setFormData(prev => ({ ...prev, publication: e.target.value }))}
                  className="input"
                  placeholder="Journal, publisher, etc."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Pages</label>
                  <input
                    type="text"
                    value={formData.pages}
                    onChange={(e) => setFormData(prev => ({ ...prev, pages: e.target.value }))}
                    className="input"
                    placeholder="123-145"
                  />
                </div>

                <div>
                  <label className="form-label">URL</label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    className="input"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200/60">
                <button type="submit" className="btn btn-primary">
                  Add Source
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)}
                  className="btn btn-ghost"
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