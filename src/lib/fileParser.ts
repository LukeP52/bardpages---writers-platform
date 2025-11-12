import { SIZE_LIMITS, SUPPORTED_FORMATS, formatFileSize } from '@/lib/constants'

export interface ParsedFileContent {
  title: string
  content: string
  wordCount: number
}

export class FileParser {
  static async parseFile(file: File): Promise<ParsedFileContent> {
    const fileName = file.name
    const fileExtension = fileName.split('.').pop()?.toLowerCase()
    
    // Extract title from filename (remove extension)
    const title = fileName.replace(/\.[^/.]+$/, "")
    
    let content = ""
    
    try {
      switch (fileExtension) {
        case 'txt':
        case 'md':
          content = await this.parseTextFile(file)
          break
        case 'docx':
          content = await this.parseDocxFile(file)
          break
        case 'doc':
          // For older .doc files, we'll treat them as text for now
          // In production, you might want to use a library like 'doc-to-text'
          content = await this.parseTextFile(file)
          break
        case 'rtf':
          content = await this.parseRtfFile(file)
          break
        case 'html':
          content = await this.parseHtmlFile(file)
          break
        default:
          throw new Error(`Unsupported file format: .${fileExtension}`)
      }
      
      const wordCount = this.countWords(content)
      
      return {
        title,
        content: content.trim(),
        wordCount
      }
    } catch (error) {
      throw new Error(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  private static async parseTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        resolve(text || '')
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }
  
  private static async parseDocxFile(file: File): Promise<string> {
    // For client-side DOCX parsing, we can use a lightweight approach
    // This is a simplified parser - for production, consider using 'docx-preview' or similar
    try {
      const arrayBuffer = await file.arrayBuffer()
      
      // DOCX files are ZIP archives containing XML
      // We'll try to extract text from the main document XML
      const text = await this.extractTextFromDocx(arrayBuffer)
      return text
    } catch (error) {
      // Fallback: try to read as plain text
      console.warn('DOCX parsing failed, attempting as plain text:', error)
      return await this.parseTextFile(file)
    }
  }
  
  private static async extractTextFromDocx(arrayBuffer: ArrayBuffer): Promise<string> {
    // This is a basic implementation. For full DOCX support, you'd need a proper library
    // For now, we'll provide helpful guidance for the user
    return `DOCX file detected! 

To import your Word document content:
1. Open your .docx file in Microsoft Word or Google Docs
2. Select all content (Ctrl+A or Cmd+A)
3. Copy the content (Ctrl+C or Cmd+C)
4. Paste it directly into the content editor below

Alternatively, save your document as a .txt or .md file and re-upload for automatic content extraction.`
  }
  
  private static async parseRtfFile(file: File): Promise<string> {
    const text = await this.parseTextFile(file)
    // Basic RTF cleaning - remove RTF control codes
    return text
      .replace(/\\[a-zA-Z]+\d*\s?/g, '') // Remove RTF control words
      .replace(/\{|\}/g, '') // Remove braces
      .replace(/\\\\/g, '\\') // Unescape backslashes
      .trim()
  }
  
  private static async parseHtmlFile(file: File): Promise<string> {
    const htmlContent = await this.parseTextFile(file)
    // Create a temporary DOM element to extract text content
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent
    
    // Remove script and style elements
    const scripts = tempDiv.querySelectorAll('script, style')
    scripts.forEach(el => el.remove())
    
    return tempDiv.textContent || tempDiv.innerText || ''
  }
  
  private static countWords(text: string): number {
    if (!text.trim()) return 0
    
    // Remove HTML tags and extra whitespace, then count words
    const cleanText = text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
    
    return cleanText ? cleanText.split(/\s+/).length : 0
  }
  
  static getSupportedFormats(): string[] {
    return [...SUPPORTED_FORMATS.DOCUMENTS]
  }
  
  static getMaxFileSize(): number {
    return SIZE_LIMITS.MAX_DOCUMENT_FILE_SIZE
  }
  
  static validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.getMaxFileSize()) {
      return {
        valid: false,
        error: `File size too large. Maximum size is ${formatFileSize(this.getMaxFileSize())}`
      }
    }
    
    // Check file extension
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    const supportedFormats = this.getSupportedFormats().map(f => f.replace('.', ''))
    
    if (!fileExtension || !supportedFormats.includes(fileExtension)) {
      return {
        valid: false,
        error: `Unsupported file format. Supported formats: ${this.getSupportedFormats().join(', ')}`
      }
    }
    
    return { valid: true }
  }
}