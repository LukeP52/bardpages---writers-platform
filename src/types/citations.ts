// Simple citation types
export interface Source {
  id: string
  title: string
  author: string
  year: number
  type: 'book' | 'journal' | 'website' | 'other'
  url?: string
  publication?: string
  pages?: string
}