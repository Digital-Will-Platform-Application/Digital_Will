/**
 * File validation utilities for uploads
 */

// Maximum file sizes (in bytes)
export const MAX_FILE_SIZES = {
  DOCUMENT: 10 * 1024 * 1024, // 10 MB for documents
  VIDEO: 100 * 1024 * 1024, // 100 MB for videos
  AUDIO: 50 * 1024 * 1024, // 50 MB for audio
} as const;

// Allowed MIME types
export const ALLOWED_MIME_TYPES = {
  DOCUMENTS: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ],
  VIDEO: [
    'video/webm',
    'video/mp4',
    'video/quicktime', // .mov
    'video/x-msvideo', // .avi
  ],
  AUDIO: [
    'audio/webm',
    'audio/mpeg',
    'audio/mp4',
    'audio/wav',
    'audio/ogg',
  ],
} as const;

// Allowed file extensions
export const ALLOWED_EXTENSIONS = {
  DOCUMENTS: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.jpg', '.jpeg', '.png', '.gif', '.webp'],
  VIDEO: ['.webm', '.mp4', '.mov', '.avi'],
  AUDIO: ['.webm', '.mp3', '.m4a', '.wav', '.ogg'],
} as const;

// File signature (magic bytes) validation
const FILE_SIGNATURES: Record<string, number[][]> = {
  // PDF
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
  // JPEG
  'image/jpeg': [
    [0xFF, 0xD8, 0xFF, 0xE0], // JPEG with JFIF
    [0xFF, 0xD8, 0xFF, 0xE1], // JPEG with EXIF
    [0xFF, 0xD8, 0xFF, 0xDB], // JPEG raw
  ],
  // PNG
  'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]], // PNG
  // GIF
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
  // WebP
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF (first 4 bytes, need to check further)
  // MP4
  'video/mp4': [[0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70]], // MP4
  // WebM
  'video/webm': [[0x1A, 0x45, 0xDF, 0xA3]], // WebM
  'audio/webm': [[0x1A, 0x45, 0xDF, 0xA3]], // WebM audio
  // MP3
  'audio/mpeg': [
    [0xFF, 0xFB], // MP3 with ID3v2
    [0x49, 0x44, 0x33], // ID3 tag
  ],
};

/**
 * Validates file type by checking MIME type and extension
 */
export function validateFileType(
  file: File,
  allowedTypes: readonly string[],
  allowedExtensions: readonly string[]
): { isValid: boolean; error?: string } {
  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type "${file.type}" is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  // Check file extension
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!allowedExtensions.includes(fileExtension)) {
    return {
      isValid: false,
      error: `File extension "${fileExtension}" is not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`,
    };
  }

  return { isValid: true };
}

/**
 * Validates file size
 */
export function validateFileSize(file: File, maxSize: number): { isValid: boolean; error?: string } {
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      isValid: false,
      error: `File size (${fileSizeMB} MB) exceeds maximum allowed size (${maxSizeMB} MB)`,
    };
  }

  if (file.size === 0) {
    return {
      isValid: false,
      error: 'File is empty',
    };
  }

  return { isValid: true };
}

/**
 * Validates file content by checking magic bytes (file signature)
 */
export async function validateFileContent(
  file: File,
  expectedMimeType: string
): Promise<{ isValid: boolean; error?: string }> {
  // Get file signature from the file
  const arrayBuffer = await file.slice(0, 12).arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // Get expected signatures for this MIME type
  const expectedSignatures = FILE_SIGNATURES[expectedMimeType];
  if (!expectedSignatures) {
    // If we don't have a signature check for this type, skip content validation
    // (some file types are harder to validate by signature)
    return { isValid: true };
  }

  // Check if any of the expected signatures match
  const matches = expectedSignatures.some((signature) => {
    return signature.every((byte, index) => bytes[index] === byte);
  });

  if (!matches) {
    return {
      isValid: false,
      error: `File content does not match expected file type "${expectedMimeType}". File may be corrupted or mislabeled.`,
    };
  }

  return { isValid: true };
}

/**
 * Comprehensive file validation for documents
 */
export async function validateDocumentFile(file: File): Promise<{ isValid: boolean; error?: string }> {
  // Validate file type
  const typeValidation = validateFileType(file, ALLOWED_MIME_TYPES.DOCUMENTS, ALLOWED_EXTENSIONS.DOCUMENTS);
  if (!typeValidation.isValid) {
    return typeValidation;
  }

  // Validate file size
  const sizeValidation = validateFileSize(file, MAX_FILE_SIZES.DOCUMENT);
  if (!sizeValidation.isValid) {
    return sizeValidation;
  }

  // Validate file content (magic bytes) for images and PDFs
  if (file.type.startsWith('image/') || file.type === 'application/pdf') {
    const contentValidation = await validateFileContent(file, file.type);
    if (!contentValidation.isValid) {
      return contentValidation;
    }
  }

  return { isValid: true };
}

/**
 * Comprehensive file validation for video files
 */
export async function validateVideoFile(file: File): Promise<{ isValid: boolean; error?: string }> {
  // Validate file type
  const typeValidation = validateFileType(file, ALLOWED_MIME_TYPES.VIDEO, ALLOWED_EXTENSIONS.VIDEO);
  if (!typeValidation.isValid) {
    return typeValidation;
  }

  // Validate file size
  const sizeValidation = validateFileSize(file, MAX_FILE_SIZES.VIDEO);
  if (!sizeValidation.isValid) {
    return sizeValidation;
  }

  // Validate file content (magic bytes)
  const contentValidation = await validateFileContent(file, file.type);
  if (!contentValidation.isValid) {
    return contentValidation;
  }

  return { isValid: true };
}

/**
 * Comprehensive file validation for audio files
 */
export async function validateAudioFile(file: File): Promise<{ isValid: boolean; error?: string }> {
  // Validate file type
  const typeValidation = validateFileType(file, ALLOWED_MIME_TYPES.AUDIO, ALLOWED_EXTENSIONS.AUDIO);
  if (!typeValidation.isValid) {
    return typeValidation;
  }

  // Validate file size
  const sizeValidation = validateFileSize(file, MAX_FILE_SIZES.AUDIO);
  if (!sizeValidation.isValid) {
    return sizeValidation;
  }

  // Validate file content (magic bytes) if available
  if (FILE_SIGNATURES[file.type]) {
    const contentValidation = await validateFileContent(file, file.type);
    if (!contentValidation.isValid) {
      return contentValidation;
    }
  }

  return { isValid: true };
}

/**
 * Validates a Blob (used for video recordings) as if it were a video file
 */
export async function validateVideoBlob(blob: Blob, fileName: string): Promise<{ isValid: boolean; error?: string }> {
  // Create a File-like object from Blob for validation
  const file = new File([blob], fileName, { type: 'video/webm' });
  return validateVideoFile(file);
}
