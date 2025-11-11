export interface Excerpt {
  id: string
  title: string
  content: string
  author?: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
  wordCount: number
  status: 'draft' | 'review' | 'final'
  imageUrl?: string
  references: Reference[]
  citations: Citation[]
}

export interface Reference {
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
  accessDate?: Date
  publisher?: string
  location?: string
  isbn?: string
  createdAt: Date
}

export interface Citation {
  id: string
  referenceId: string
  startPos: number
  endPos: number
  text: string
  noteId: string // Unique identifier for the citation number
}

export interface Tag {
  id: string
  name: string
  color: string
  createdAt: Date
}

export interface Category {
  id: string
  name: string
  description?: string
  color: string
  createdAt: Date
}

export interface TagCategoryMapping {
  tagName: string
  categoryId: string
}

export interface StoryboardSection {
  id: string
  excerptId: string
  order: number
  notes?: string
}

export interface Storyboard {
  id: string
  title: string
  description?: string
  sections: StoryboardSection[]
  createdAt: Date
  updatedAt: Date
}

export interface Book {
  id: string
  title: string
  subtitle?: string
  author: string
  storyboardId: string
  coverImage?: string
  metadata: BookMetadata
  formatting: BookFormatting
  createdAt: Date
  updatedAt: Date
}

export interface BookMetadata {
  genre?: string
  description?: string
  publishedDate?: Date
  isbn?: string
  language: string
}

export interface BookFormatting {
  // Typography & Layout
  fontFamily: string
  fontSize: number
  lineHeight: number
  chapterBreakStyle: 'page-break' | 'section-break' | 'spacing'
  
  // Page Layout
  marginTop: number
  marginBottom: number
  marginLeft: number
  marginRight: number
  
  // Chapter Formatting
  useChapters: boolean
  chapterTitleFont: string
  chapterTitleSize: number
  chapterNumberStyle: 'numeric' | 'roman' | 'words' | 'none'
  
  // Paragraph Formatting
  paragraphSpacing: number
  firstLineIndent: number
  textAlignment: 'left' | 'center' | 'right' | 'justify'
  
  // Advanced Options
  dropCapEnabled: boolean
  headerFooterEnabled: boolean
  pageNumbers: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right' | 'none'
  
  // Reference Formatting
  referenceStyle: 'apa' | 'mla' | 'chicago' | 'harvard' | 'ieee' | 'vancouver'
  citationStyle: 'footnotes' | 'endnotes' | 'inline'
  includeReferences: boolean
}