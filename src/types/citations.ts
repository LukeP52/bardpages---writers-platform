// Modern Citation System Types - Built from ground up for BardPages

export interface Source {
  id: string
  type: 'book' | 'journal' | 'website' | 'newspaper' | 'magazine' | 'thesis' | 'conference' | 'other'
  title: string
  author: string
  publication?: string
  year: number
  volume?: string
  issue?: string
  pages?: string
  url?: string
  doi?: string
  accessDate?: string
  publisher?: string
  location?: string
  isbn?: string
  createdAt: string
}

export interface TextAnnotation {
  id: string
  excerptId: string
  startIndex: number
  endIndex: number
  selectedText: string
  sourceId: string
  noteId: number // For citation numbering [1], [2], etc.
  createdAt: string
  updatedAt: string
}

export interface CitationStyle {
  id: string
  name: string
  format: 'apa' | 'mla' | 'chicago' | 'harvard' | 'ieee' | 'vancouver'
  inlineStyle: 'footnotes' | 'endnotes' | 'inline' | 'superscript'
}

export interface FormattedCitation {
  id: string
  sourceId: string
  inline: string // e.g., "(Smith, 2023)" or "[1]"
  full: string // Full bibliography entry
  style: CitationStyle
}

export interface CitationDocument {
  excerptId: string
  sources: Source[]
  annotations: TextAnnotation[]
  style: CitationStyle
  bibliography: FormattedCitation[]
  createdAt: string
  updatedAt: string
}

// Selection state for text annotation
export interface TextSelection {
  text: string
  startIndex: number
  endIndex: number
  isValid: boolean
}

// UI state
export interface CitationUIState {
  isAddingSource: boolean
  isAnnotating: boolean
  selectedSource: Source | null
  currentSelection: TextSelection | null
  showBibliography: boolean
  editingAnnotation: TextAnnotation | null
}