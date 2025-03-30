/**
 * Application Configuration
 * Centralizes all environment variables and secrets management
 */

// Function to get required environment variables or throw error if missing
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is missing. Please add it to your secrets.`);
  }
  return value;
}

// Function to get optional environment variables with a default fallback
function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

// Database configuration
export const DATABASE_CONFIG = {
  url: getRequiredEnv('DATABASE_URL'),
};

// Server configuration
export const SERVER_CONFIG = {
  port: parseInt(getOptionalEnv('PORT', '5000')),
  environment: getOptionalEnv('NODE_ENV', 'development'),
};

// PDF Processing configuration
export const PDF_CONFIG = {
  // Currently using local processing, but prepared for potential future API integration
  maxSizeBytes: parseInt(getOptionalEnv('MAX_PDF_SIZE_BYTES', (10 * 1024 * 1024).toString())), // 10MB default
};

// Export a function to validate all required configuration at startup
export function validateConfig(): void {
  // Currently this just accesses DATABASE_CONFIG.url which will throw if missing
  // Additional validation can be added here as needed
  const dbUrl = DATABASE_CONFIG.url;
  
  console.log('Configuration validated successfully');
}