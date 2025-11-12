// Size limits for BardPages platform
export const SIZE_LIMITS = {
  // Content limits (keeping under Firestore's 1MB document limit)
  MAX_EXCERPT_CONTENT_SIZE: 800 * 1024, // 800KB
  
  // Image upload limits
  MAX_IMAGE_FILE_SIZE: 5 * 1024 * 1024, // 5MB for individual image files
  MAX_TOTAL_CONTENT_WITH_IMAGES: 800 * 1024, // 800KB for total content including embedded images
  
  // Document file limits
  MAX_DOCUMENT_FILE_SIZE: 2 * 1024 * 1024, // 2MB for document files (.txt, .docx, etc.)
  
  // Base64 encoding size multiplier (base64 increases size by ~33%)
  BASE64_SIZE_MULTIPLIER: 1.4,
  
  // Warning thresholds for UI
  CONTENT_SIZE_WARNING_THRESHOLD: 0.8, // Show yellow warning at 80% of limit
  CONTENT_SIZE_DANGER_THRESHOLD: 0.9,  // Show red warning at 90% of limit
} as const

// File format restrictions
export const SUPPORTED_FORMATS = {
  DOCUMENTS: ['.txt', '.md', '.docx', '.doc', '.rtf', '.html'],
  IMAGES: ['image/*'], // All image types
} as const

// User-friendly size formatting
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i]
}

// Check if content size is within limits
export const isContentSizeValid = (content: string): { valid: boolean; size: number; message?: string } => {
  const size = new Blob([content]).size
  const maxSize = SIZE_LIMITS.MAX_EXCERPT_CONTENT_SIZE
  
  if (size > maxSize) {
    return {
      valid: false,
      size,
      message: `Content is too large (${formatFileSize(size)}). Maximum allowed: ${formatFileSize(maxSize)}`
    }
  }
  
  return { valid: true, size }
}

// Get content size status for UI styling
export const getContentSizeStatus = (content: string): 'safe' | 'warning' | 'danger' | 'exceeded' => {
  const size = new Blob([content]).size
  const maxSize = SIZE_LIMITS.MAX_EXCERPT_CONTENT_SIZE
  const ratio = size / maxSize
  
  if (ratio > 1) return 'exceeded'
  if (ratio > SIZE_LIMITS.CONTENT_SIZE_DANGER_THRESHOLD) return 'danger'
  if (ratio > SIZE_LIMITS.CONTENT_SIZE_WARNING_THRESHOLD) return 'warning'
  return 'safe'
}