import { Cite } from 'citation-js'
import { Source, FormattedCitation, CitationStyle, TextAnnotation } from '@/types/citations'

export class CitationFormatter {
  private static formatSourceForCiteJS(source: Source) {
    // Convert our Source format to citation-js format
    const cslData: any = {
      id: source.id,
      type: this.getCSLType(source.type),
      title: source.title,
      author: this.parseAuthor(source.author),
      issued: { 'date-parts': [[source.year]] }
    }

    // Add optional fields based on source type
    if (source.publication) {
      if (source.type === 'journal') {
        cslData['container-title'] = source.publication
      } else if (source.type === 'book') {
        cslData.publisher = source.publication
      }
    }

    if (source.volume) cslData.volume = source.volume
    if (source.issue) cslData.issue = source.issue
    if (source.pages) cslData.page = source.pages
    if (source.url) cslData.URL = source.url
    if (source.doi) cslData.DOI = source.doi
    if (source.publisher) cslData.publisher = source.publisher
    if (source.location) cslData['publisher-place'] = source.location
    if (source.isbn) cslData.ISBN = source.isbn

    if (source.accessDate) {
      cslData.accessed = { 'date-parts': [[new Date(source.accessDate).getFullYear()]] }
    }

    return cslData
  }

  private static getCSLType(sourceType: Source['type']): string {
    const typeMap: Record<Source['type'], string> = {
      'book': 'book',
      'journal': 'article-journal',
      'website': 'webpage',
      'newspaper': 'article-newspaper',
      'magazine': 'article-magazine',
      'thesis': 'thesis',
      'conference': 'paper-conference',
      'other': 'document'
    }
    return typeMap[sourceType] || 'document'
  }

  private static parseAuthor(author: string) {
    // Simple author parsing - could be enhanced
    const parts = author.split(',').map(part => part.trim())
    if (parts.length >= 2) {
      return [{ family: parts[0], given: parts[1] }]
    }
    return [{ literal: author }]
  }

  static formatBibliography(sources: Source[], style: CitationStyle): FormattedCitation[] {
    try {
      const cslData = sources.map(source => this.formatSourceForCiteJS(source))
      const cite = new Cite(cslData)
      
      // Get formatted bibliography
      const bibliography = cite.format('bibliography', {
        format: 'html',
        template: style.format,
        lang: 'en-US'
      })

      // Parse the bibliography HTML to extract individual citations
      const parser = new DOMParser()
      const doc = parser.parseFromString(`<div>${bibliography}</div>`, 'text/html')
      const citationElements = doc.querySelectorAll('.csl-entry, .hanging-indent > div, .bibliography > div')
      
      return sources.map((source, index) => ({
        id: `formatted-${source.id}`,
        sourceId: source.id,
        inline: this.formatInlineCitation(source, style),
        full: citationElements[index]?.textContent || `${source.author} (${source.year}). ${source.title}.`,
        style
      }))
    } catch (error) {
      console.warn('Citation formatting failed, using fallback:', error)
      
      // Fallback formatting
      return sources.map(source => ({
        id: `formatted-${source.id}`,
        sourceId: source.id,
        inline: this.formatInlineCitation(source, style),
        full: this.formatFallbackCitation(source, style.format),
        style
      }))
    }
  }

  static formatInlineCitation(source: Source, style: CitationStyle): string {
    switch (style.inlineStyle) {
      case 'superscript':
        // This will be handled by the UI component
        return `[${source.id}]`
      
      case 'footnotes':
      case 'endnotes':
        // Numbered citations
        return `[${source.id}]`
      
      case 'inline':
      default:
        // Author-year format
        const author = source.author.split(',')[0] || source.author
        return `(${author}, ${source.year})`
    }
  }

  static formatFallbackCitation(source: Source, format: CitationStyle['format']): string {
    const author = source.author
    const year = source.year
    const title = source.title

    switch (format) {
      case 'apa':
        return `${author} (${year}). ${title}. ${source.publication ? `${source.publication}.` : ''}`
      
      case 'mla':
        return `${author}. "${title}." ${source.publication ? `${source.publication}, ` : ''}${year}.`
      
      case 'chicago':
        return `${author}. "${title}." ${source.publication ? `${source.publication} ` : ''}${year}.`
      
      default:
        return `${author} (${year}). ${title}.${source.publication ? ` ${source.publication}.` : ''}`
    }
  }

  static insertCitationMarkers(
    content: string,
    annotations: TextAnnotation[],
    style: CitationStyle
  ): string {
    let result = content
    
    // Sort annotations by position (descending) to avoid index shifting
    const sortedAnnotations = [...annotations].sort((a, b) => b.startIndex - a.startIndex)
    
    for (const annotation of sortedAnnotations) {
      const marker = this.getCitationMarker(annotation, style)
      
      // Insert citation marker after the selected text
      const beforeText = result.substring(0, annotation.endIndex)
      const afterText = result.substring(annotation.endIndex)
      result = beforeText + marker + afterText
    }
    
    return result
  }

  static getCitationMarker(annotation: TextAnnotation, style: CitationStyle): string {
    switch (style.inlineStyle) {
      case 'superscript':
        return `<sup><a href="#cite-${annotation.noteId}" class="citation-link">[${annotation.noteId}]</a></sup>`
      
      case 'footnotes':
      case 'endnotes':
        return `<sup>${annotation.noteId}</sup>`
      
      case 'inline':
      default:
        // Would need source data to format properly
        return ` (Citation ${annotation.noteId})`
    }
  }

  static removeCitationMarkers(content: string): string {
    // Remove citation markers to get clean text
    return content
      .replace(/<sup><a[^>]*>\[[0-9]+\]<\/a><\/sup>/g, '')
      .replace(/<sup>[0-9]+<\/sup>/g, '')
      .replace(/\s+\(Citation\s+\d+\)/g, '')
  }

  static getAvailableStyles(): CitationStyle[] {
    return [
      {
        id: 'apa',
        name: 'APA Style',
        format: 'apa',
        inlineStyle: 'inline'
      },
      {
        id: 'mla',
        name: 'MLA Style',
        format: 'mla',
        inlineStyle: 'inline'
      },
      {
        id: 'chicago',
        name: 'Chicago Style',
        format: 'chicago',
        inlineStyle: 'footnotes'
      },
      {
        id: 'harvard',
        name: 'Harvard Style',
        format: 'harvard',
        inlineStyle: 'inline'
      },
      {
        id: 'ieee',
        name: 'IEEE Style',
        format: 'ieee',
        inlineStyle: 'superscript'
      }
    ]
  }
}