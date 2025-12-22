// Re-export types from @axori/db to ensure single source of truth
// Types are inferred from Drizzle schemas using InferSelectModel/InferInsertModel

export type {
  UserProfile,
  UserProfileInsert,
} from "@axori/db";

// Note: Property types should also be exported from @axori/db when Property schema types are added
// For now, keeping Property type here until Property types are added to packages/db/src/types.ts
export type Property = {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  createdAt: Date;
  updatedAt: Date;
};


