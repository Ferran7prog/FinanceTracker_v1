/**
 * Frontend Application Configuration
 * Centralizes all environment variables and client-side settings
 */

// PDF Configuration
export const PDF_CONFIG = {
  // CDN URL for the PDF.js worker
  workerUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.js',
  
  // Maximum allowed file size in bytes (10MB)
  maxSizeBytes: 10 * 1024 * 1024,
};

// API Configuration
export const API_CONFIG = {
  // Base URL for API requests (uses current origin as default)
  baseUrl: '',
  
  // Default timeout for API requests in milliseconds
  timeout: 30000,
};