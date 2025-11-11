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
}

export interface Tag {
  id: string
  name: string
  color: string
  createdAt: Date
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
  fontFamily: string
  fontSize: number
  lineHeight: number
  marginTop: number
  marginBottom: number
  marginLeft: number
  marginRight: number
  chapterBreakStyle: 'page-break' | 'section-break' | 'spacing'
}