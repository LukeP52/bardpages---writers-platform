import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { 
  Source, 
  TextAnnotation, 
  CitationDocument, 
  CitationStyle, 
  TextSelection, 
  CitationUIState 
} from '@/types/citations'

interface CitationStore {
  // State
  documents: Record<string, CitationDocument>
  currentExcerptId: string | null
  uiState: CitationUIState
  
  // Actions
  setCurrentExcerpt: (excerptId: string) => void
  addSource: (excerptId: string, source: Omit<Source, 'id' | 'createdAt'>) => Source
  updateSource: (excerptId: string, sourceId: string, updates: Partial<Source>) => void
  deleteSource: (excerptId: string, sourceId: string) => void
  addAnnotation: (excerptId: string, annotation: Omit<TextAnnotation, 'id' | 'noteId' | 'createdAt' | 'updatedAt' | 'excerptId'>) => TextAnnotation
  updateAnnotation: (excerptId: string, annotationId: string, updates: Partial<TextAnnotation>) => void
  deleteAnnotation: (excerptId: string, annotationId: string) => void
  setUIState: (updates: Partial<CitationUIState>) => void
  setTextSelection: (selection: TextSelection | null) => void
  startAnnotating: () => void
  stopAnnotating: () => void
  getSourcesForExcerpt: (excerptId: string) => Source[]
  getAnnotationsForExcerpt: (excerptId: string) => TextAnnotation[]
  getNextNoteId: (excerptId: string) => number
  clearExcerpt: (excerptId: string) => void
}

const defaultCitationStyle: CitationStyle = {
  id: 'apa',
  name: 'APA Style',
  format: 'apa',
  inlineStyle: 'inline'
}

const defaultUIState: CitationUIState = {
  isAddingSource: false,
  isAnnotating: false,
  selectedSource: null,
  currentSelection: null,
  showBibliography: false,
  editingAnnotation: null
}

const initializeDocument = (excerptId: string): CitationDocument => {
  const now = new Date().toISOString()
  return {
    excerptId,
    sources: [],
    annotations: [],
    style: defaultCitationStyle,
    bibliography: [],
    createdAt: now,
    updatedAt: now
  }
}

export const useCitationStore = create<CitationStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        documents: {},
        currentExcerptId: null,
        uiState: defaultUIState,
        
        // Actions
        setCurrentExcerpt: (excerptId: string) => {
          const { documents } = get()
          if (!documents[excerptId]) {
            set({
              currentExcerptId: excerptId,
              documents: {
                ...documents,
                [excerptId]: initializeDocument(excerptId)
              }
            })
          } else {
            set({ currentExcerptId: excerptId })
          }
        },
        
        addSource: (excerptId: string, sourceData) => {
          const newSource: Source = {
            ...sourceData,
            id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString()
          }
          
          const { documents } = get()
          const document = documents[excerptId] || initializeDocument(excerptId)
          
          set({
            documents: {
              ...documents,
              [excerptId]: {
                ...document,
                sources: [...document.sources, newSource],
                updatedAt: new Date().toISOString()
              }
            }
          })
          
          return newSource
        },
        
        updateSource: (excerptId: string, sourceId: string, updates) => {
          const { documents } = get()
          const document = documents[excerptId]
          if (!document) return
          
          const updatedSources = document.sources.map(source =>
            source.id === sourceId ? { ...source, ...updates } : source
          )
          
          set({
            documents: {
              ...documents,
              [excerptId]: {
                ...document,
                sources: updatedSources,
                updatedAt: new Date().toISOString()
              }
            }
          })
        },
        
        deleteSource: (excerptId: string, sourceId: string) => {
          const { documents } = get()
          const document = documents[excerptId]
          if (!document) return
          
          set({
            documents: {
              ...documents,
              [excerptId]: {
                ...document,
                sources: document.sources.filter(s => s.id !== sourceId),
                annotations: document.annotations.filter(a => a.sourceId !== sourceId),
                updatedAt: new Date().toISOString()
              }
            }
          })
        },
        
        addAnnotation: (excerptId: string, annotationData) => {
          const { documents } = get()
          const document = documents[excerptId] || initializeDocument(excerptId)
          
          const noteId = document.annotations.length > 0 
            ? Math.max(...document.annotations.map(a => a.noteId)) + 1 
            : 1
          
          const now = new Date().toISOString()
          const newAnnotation: TextAnnotation = {
            ...annotationData,
            id: `annotation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            excerptId,
            noteId,
            createdAt: now,
            updatedAt: now
          }
          
          set({
            documents: {
              ...documents,
              [excerptId]: {
                ...document,
                annotations: [...document.annotations, newAnnotation],
                updatedAt: new Date().toISOString()
              }
            }
          })
          
          return newAnnotation
        },
        
        updateAnnotation: (excerptId: string, annotationId: string, updates) => {
          const { documents } = get()
          const document = documents[excerptId]
          if (!document) return
          
          const updatedAnnotations = document.annotations.map(annotation =>
            annotation.id === annotationId 
              ? { ...annotation, ...updates, updatedAt: new Date().toISOString() }
              : annotation
          )
          
          set({
            documents: {
              ...documents,
              [excerptId]: {
                ...document,
                annotations: updatedAnnotations,
                updatedAt: new Date().toISOString()
              }
            }
          })
        },
        
        deleteAnnotation: (excerptId: string, annotationId: string) => {
          const { documents } = get()
          const document = documents[excerptId]
          if (!document) return
          
          const annotation = document.annotations.find(a => a.id === annotationId)
          if (!annotation) return
          
          // Remove annotation and renumber remaining ones
          const filteredAnnotations = document.annotations.filter(a => a.id !== annotationId)
          const renumberedAnnotations = filteredAnnotations
            .filter(a => a.noteId > annotation.noteId)
            .map(a => ({ ...a, noteId: a.noteId - 1, updatedAt: new Date().toISOString() }))
          
          const finalAnnotations = [
            ...filteredAnnotations.filter(a => a.noteId < annotation.noteId),
            ...renumberedAnnotations
          ]
          
          set({
            documents: {
              ...documents,
              [excerptId]: {
                ...document,
                annotations: finalAnnotations,
                updatedAt: new Date().toISOString()
              }
            }
          })
        },
        
        setUIState: (updates) => {
          const { uiState } = get()
          set({
            uiState: { ...uiState, ...updates }
          })
        },
        
        setTextSelection: (selection) => {
          const { uiState } = get()
          set({
            uiState: { ...uiState, currentSelection: selection }
          })
        },
        
        startAnnotating: () => {
          const { uiState } = get()
          set({
            uiState: { ...uiState, isAnnotating: true }
          })
        },
        
        stopAnnotating: () => {
          const { uiState } = get()
          set({
            uiState: { 
              ...uiState, 
              isAnnotating: false,
              currentSelection: null,
              editingAnnotation: null
            }
          })
        },
        
        getSourcesForExcerpt: (excerptId: string) => {
          const { documents } = get()
          return documents[excerptId]?.sources || []
        },
        
        getAnnotationsForExcerpt: (excerptId: string) => {
          const { documents } = get()
          return documents[excerptId]?.annotations || []
        },
        
        getNextNoteId: (excerptId: string) => {
          const annotations = get().getAnnotationsForExcerpt(excerptId)
          return annotations.length > 0 ? Math.max(...annotations.map(a => a.noteId)) + 1 : 1
        },
        
        clearExcerpt: (excerptId: string) => {
          const { documents } = get()
          const newDocuments = { ...documents }
          delete newDocuments[excerptId]
          set({ documents: newDocuments })
        }
      }),
      {
        name: 'bardpages-citations',
        partialize: (state) => ({ 
          documents: state.documents 
        })
      }
    ),
    { name: 'citation-store' }
  )
)