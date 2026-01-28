/**
 * Supabase Integration Module
 *
 * Provides Supabase-specific functionality for the Axori platform,
 * including storage operations for property documents.
 */

export {
  getSupabaseClient,
  DOCUMENTS_BUCKET,
  generateStoragePath,
  uploadDocument,
  deleteDocument,
  getSignedUrl,
  getPublicUrl,
  listDocuments,
  downloadDocument,
} from './storage';
