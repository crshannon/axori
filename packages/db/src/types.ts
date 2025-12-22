import { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { users } from './schema'

/**
 * User profile type inferred from Drizzle schema (for read operations)
 */
export type UserProfile = InferSelectModel<typeof users>

/**
 * User profile insert type inferred from Drizzle schema (for insert operations)
 */
export type UserProfileInsert = InferInsertModel<typeof users>

