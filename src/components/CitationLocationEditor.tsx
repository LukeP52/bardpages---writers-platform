'use client'

import { useState, useEffect } from 'react'
import { Citation, Reference } from '@/types'

interface CitationLocationEditorProps {
  citation: Citation
  reference?: Reference
  content: string
  selectedText: string
  selectedRange: { index: number; length: number } | null
  onConfirm: (citationId: string, newText: string, newRange: { index: number; length: number }) => void
  onCancel: () => void
}

export default function CitationLocationEditor({
  citation,
  reference,
  content,
  selectedText,
  selectedRange,
  onConfirm,
  onCancel
}: CitationLocationEditorProps) {
  const [hasValidSelection, setHasValidSelection] = useState(false)

  useEffect(() => {
    setHasValidSelection(!!selectedRange && !!selectedText.trim())
  }, [selectedRange, selectedText])

  const handleConfirm = () => {
    if (selectedRange && selectedText.trim()) {
      onConfirm(citation.id, selectedText, selectedRange)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card max-w-lg w-full border border-slate-200/60">
        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200/60 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">
              Edit Citation Location
            </h3>
            <button
              type="button"
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-all duration-200"
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Current Citation Info */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Current Citation</h4>
            <div className="text-sm text-slate-600">
              <div className="mb-1">
                <strong>Text:</strong> "{citation.text}"
              </div>
              {reference && (
                <div className="text-xs text-slate-500">
                  <strong>Reference:</strong> {reference.author} ({reference.year}) - {reference.title}
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">Instructions</h4>
            <p className="text-sm text-blue-700">
              Highlight the text in your document where you want this citation to appear, then click "Update Location".
            </p>
          </div>

          {/* Selected Text Preview */}
          {hasValidSelection ? (
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-green-800 mb-2">New Location Selected</h4>
              <div className="text-sm text-green-700">
                <strong>New text:</strong> "{selectedText}"
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-amber-800 mb-2">No Text Selected</h4>
              <p className="text-sm text-amber-700">
                Please highlight text in the editor to set the new citation location.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!hasValidSelection}
              className={`btn flex-1 ${
                hasValidSelection
                  ? 'btn-primary'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Update Location
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-ghost"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}