/**
 * Supabase Storage Client
 *
 * Provides document storage functionality using Supabase Storage.
 * This client is used by both the API (server-side) and web app (client-side).
 */

import { createClient } from '@supabase/supabase-js';

// Storage bucket name for property documents
export const DOCUMENTS_BUCKET = 'property-documents';

// Initialize Supabase client lazily
let supabaseClient: ReturnType<typeof createClient> | null = null;

/**
 * Get or create the Supabase client
 * Uses environment variables for configuration
 */
export function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase environment variables. Set SUPABASE_URL and SUPABASE_ANON_KEY.'
    );
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false, // We use Clerk for auth
    },
  });

  return supabaseClient;
}

/**
 * Generate a storage path for a document
 * Format: {userId}/{propertyId}/{documentId}_{sanitizedFilename}
 */
export function generateStoragePath(
  userId: string,
  propertyId: string,
  documentId: string,
  filename: string
): string {
  // Sanitize filename - remove special characters except dots and hyphens
  const sanitized = filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase();

  return `${userId}/${propertyId}/${documentId}_${sanitized}`;
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadDocument(
  file: File | Buffer,
  storagePath: string,
  contentType?: string
): Promise<{ path: string; error: Error | null }> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(storagePath, file, {
        contentType: contentType || 'application/octet-stream',
        upsert: false, // Don't overwrite existing files
      });

    if (error) {
      return { path: '', error: new Error(error.message) };
    }

    return { path: data.path, error: null };
  } catch (err) {
    return {
      path: '',
      error: err instanceof Error ? err : new Error('Failed to upload document')
    };
  }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteDocument(
  storagePath: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .remove([storagePath]);

    if (error) {
      return { success: false, error: new Error(error.message) };
    }

    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error('Failed to delete document')
    };
  }
}

/**
 * Get a signed URL for downloading/viewing a document
 * @param storagePath - The path to the file in storage
 * @param expiresIn - URL expiry time in seconds (default: 1 hour)
 */
export async function getSignedUrl(
  storagePath: string,
  expiresIn: number = 3600
): Promise<{ url: string; error: Error | null }> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .createSignedUrl(storagePath, expiresIn);

    if (error) {
      return { url: '', error: new Error(error.message) };
    }

    return { url: data.signedUrl, error: null };
  } catch (err) {
    return {
      url: '',
      error: err instanceof Error ? err : new Error('Failed to generate signed URL')
    };
  }
}

/**
 * Get a public URL for a document (if bucket is public)
 * Note: This should only be used for non-sensitive documents
 */
export function getPublicUrl(storagePath: string): string {
  const supabase = getSupabaseClient();

  const { data } = supabase.storage
    .from(DOCUMENTS_BUCKET)
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

/**
 * List all documents for a user/property
 */
export async function listDocuments(
  userId: string,
  propertyId?: string
): Promise<{ files: string[]; error: Error | null }> {
  try {
    const supabase = getSupabaseClient();

    const path = propertyId ? `${userId}/${propertyId}` : userId;

    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .list(path);

    if (error) {
      return { files: [], error: new Error(error.message) };
    }

    return {
      files: data.map(file => `${path}/${file.name}`),
      error: null
    };
  } catch (err) {
    return {
      files: [],
      error: err instanceof Error ? err : new Error('Failed to list documents')
    };
  }
}

/**
 * Download a document as a Blob
 */
export async function downloadDocument(
  storagePath: string
): Promise<{ blob: Blob | null; error: Error | null }> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .download(storagePath);

    if (error) {
      return { blob: null, error: new Error(error.message) };
    }

    return { blob: data, error: null };
  } catch (err) {
    return {
      blob: null,
      error: err instanceof Error ? err : new Error('Failed to download document')
    };
  }
}
