'use client'

import { useState } from 'react'
import { useCitationStore } from '@/stores/citationStore'
import { useTextAnnotation } from './TextAnnotator'
import SourceForm from './SourceForm'
import { Source } from '@/types/citations'
import { 
  PlusIcon, 
  BookOpenIcon, 
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface CitationManagerProps {
  excerptId: string
}

export default function CitationManager({ excerptId }: CitationManagerProps) {
  const { 
    getSourcesForExcerpt, 
    getAnnotationsForExcerpt, 
    deleteSource,
    deleteAnnotation,
    setUIState,
    uiState 
  } = useCitationStore()
  
  const {
    isAnnotating,
    currentSelection,
    startAnnotating,
    stopAnnotating,
    addAnnotation,
    annotations,
    sources
  } = useTextAnnotation(excerptId)
  
  const [showSourceForm, setShowSourceForm] = useState(false)
  const [editingSource, setEditingSource] = useState<Source | null>(null)
  const [selectedSourceForAnnotation, setSelectedSourceForAnnotation] = useState<string | null>(null)

  const handleAddSource = () => {
    setEditingSource(null)
    setShowSourceForm(true)
  }

  const handleEditSource = (source: Source) => {
    setEditingSource(source)
    setShowSourceForm(true)
  }

  const handleDeleteSource = (sourceId: string) => {
    const source = sources.find(s => s.id === sourceId)
    if (source && confirm(`Delete "${source.title}"? This will also remove any citations using this source.`)) {
      deleteSource(excerptId, sourceId)
    }
  }

  const handleSourceSaved = (source: Source) => {
    setShowSourceForm(false)
    setEditingSource(null)
    
    // If we were in the annotation flow, continue with the new source
    if (selectedSourceForAnnotation === 'new' && currentSelection?.isValid) {
      addAnnotation(source.id)
      setSelectedSourceForAnnotation(null)
    }
  }

  const handleStartAnnotation = (sourceId?: string) => {
    if (sourceId) {
      setSelectedSourceForAnnotation(sourceId)
    } else {
      setSelectedSourceForAnnotation('new')
    }
    startAnnotating()
  }

  const handleConfirmAnnotation = () => {
    if (selectedSourceForAnnotation && selectedSourceForAnnotation !== 'new' && currentSelection?.isValid) {
      addAnnotation(selectedSourceForAnnotation)
      setSelectedSourceForAnnotation(null)
    } else if (selectedSourceForAnnotation === 'new') {
      // Show source form to create new source first
      handleAddSource()
    }
  }

  const handleCancelAnnotation = () => {
    stopAnnotating()
    setSelectedSourceForAnnotation(null)
  }

  const handleDeleteAnnotation = (annotationId: string) => {
    const annotation = annotations.find(a => a.id === annotationId)
    if (annotation && confirm(`Remove citation for "${annotation.selectedText}"?`)) {
      deleteAnnotation(excerptId, annotationId)
    }
  }

  if (showSourceForm) {
    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <SourceForm
          excerptId={excerptId}
          source={editingSource}
          onSave={handleSourceSaved}
          onCancel={() => {
            setShowSourceForm(false)
            setEditingSource(null)
            if (selectedSourceForAnnotation === 'new') {
              handleCancelAnnotation()
            }
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Annotation Mode UI */}
      {isAnnotating && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-blue-900">
                Citation Mode Active
              </h3>
              <button
                onClick={handleCancelAnnotation}
                className="text-blue-600 hover:text-blue-800"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            {currentSelection?.isValid ? (
              <div className="space-y-3">
                <div className="p-3 bg-white rounded border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Selected text:</strong> "{currentSelection.text}"
                  </p>
                </div>
                
                {selectedSourceForAnnotation && selectedSourceForAnnotation !== 'new' ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleConfirmAnnotation}
                      className="btn btn-primary btn-sm"
                    >
                      <CheckIcon className="w-4 h-4 mr-1" />
                      Add Citation
                    </button>
                    <button
                      onClick={handleCancelAnnotation}
                      className="btn btn-ghost btn-sm"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-blue-700">Choose a source for this citation:</p>
                    <div className="flex flex-wrap gap-2">
                      {sources.map(source => (
                        <button
                          key={source.id}
                          onClick={() => handleStartAnnotation(source.id)}
                          className="btn btn-outline btn-sm"
                        >
                          {source.author} ({source.year})
                        </button>
                      ))}
                      <button
                        onClick={() => handleStartAnnotation()}
                        className="btn btn-secondary btn-sm"
                      >
                        <PlusIcon className="w-4 h-4 mr-1" />
                        New Source
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center text-amber-700">
                <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                <p className="text-sm">
                  Please highlight text in the editor to create a citation.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sources Section */}
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
              onClick={handleAddSource}
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
                onClick={handleAddSource}
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
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStartAnnotation(source.id)}
                        className="btn btn-outline btn-sm"
                        disabled={isAnnotating}
                      >
                        Cite
                      </button>
                      <button
                        onClick={() => handleEditSource(source)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSource(source.id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Citations Section */}
      {annotations.length > 0 && (
        <div className="card">
          <div className="border-b border-slate-200/60 p-6">
            <h3 className="text-lg font-semibold text-slate-900">
              Citations ({annotations.length})
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Citations in this document
            </p>
          </div>

          <div className="p-6">
            <div className="space-y-3">
              {annotations.map(annotation => {
                const source = sources.find(s => s.id === annotation.sourceId)
                return (
                  <div key={annotation.id} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                    <div className="flex-1">
                      <span className="text-xs font-mono px-2 py-1 bg-blue-100 text-blue-800 rounded mr-3">
                        [{annotation.noteId}]
                      </span>
                      <span className="text-sm text-slate-600">
                        "{annotation.selectedText}"
                      </span>
                      {source && (
                        <div className="text-xs text-slate-500 mt-1 ml-8">
                          {source.author} ({source.year}) - {source.title}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteAnnotation(annotation.id)}
                      className="text-red-400 hover:text-red-600 ml-3"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}