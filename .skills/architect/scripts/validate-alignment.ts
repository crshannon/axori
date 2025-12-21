#!/usr/bin/env tsx
/**
 * Validation script to check alignment between Drizzle schemas, Zod schemas, and TypeScript types.
 *
 * Usage:
 *   pnpm tsx .skills/architect/scripts/validate-alignment.ts
 *
 * This script checks:
 * - Drizzle schema fields match Zod schema fields
 * - Type exports are using inference
 * - No duplicate type definitions
 * - Field naming consistency
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../../../../');

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

class AlignmentValidator {
  private errors: string[] = [];
  private warnings: string[] = [];

  /**
   * Read and parse a TypeScript file
   */
  private readTsFile(filePath: string): string {
    try {
      return readFileSync(filePath, 'utf-8');
    } catch (error) {
      this.errors.push(`Cannot read file: ${filePath}`);
      return '';
    }
  }

  /**
   * Extract table names from Drizzle schema
   */
  private extractDrizzleTables(schemaContent: string): string[] {
    const tableMatches = schemaContent.matchAll(/export const (\w+) = pgTable\(/g);
    return Array.from(tableMatches, m => m[1]);
  }

  /**
   * Extract field names from a Drizzle table definition
   */
  private extractDrizzleFields(tableName: string, schemaContent: string): string[] {
    const tableRegex = new RegExp(
      `export const ${tableName} = pgTable\\([^,]+,\\s*\\{([^}]+)\\}\\s*\\)`,
      's'
    );
    const match = schemaContent.match(tableRegex);
    if (!match) return [];

    const fields: string[] = [];
    const fieldMatches = match[1].matchAll(/(\w+):\s*\w+\(/g);
    for (const m of fieldMatches) {
      fields.push(m[1]);
    }
    return fields;
  }

  /**
   * Extract Zod schema names
   */
  private extractZodSchemas(validationContent: string): string[] {
    const schemaMatches = validationContent.matchAll(/export const (\w+Schema) = z\.object\(/g);
    return Array.from(schemaMatches, m => m[1]);
  }

  /**
   * Extract field names from a Zod schema
   */
  private extractZodFields(schemaName: string, validationContent: string): string[] {
    const schemaRegex = new RegExp(
      `export const ${schemaName} = z\\.object\\(\\{([^}]+)\\}\\)`,
      's'
    );
    const match = validationContent.match(schemaRegex);
    if (!match) return [];

    const fields: string[] = [];
    const fieldMatches = match[1].matchAll(/(\w+):\s*z\./g);
    for (const m of fieldMatches) {
      fields.push(m[1]);
    }
    return fields;
  }

  /**
   * Check if types are using inference
   */
  private checkTypeInference(typesContent: string): void {
    // Check for InferSelectModel or InferInsertModel usage
    const hasInference = typesContent.includes('InferSelectModel') ||
                         typesContent.includes('InferInsertModel');

    if (!hasInference) {
      this.warnings.push('No Drizzle type inference found in types.ts. Consider using InferSelectModel/InferInsertModel.');
    }

    // Check for manual type definitions that might duplicate schemas
    const manualTypePattern = /export type \w+ = \{[^}]+\}/g;
    const manualTypes = typesContent.match(manualTypePattern);
    if (manualTypes && manualTypes.length > 0) {
      this.warnings.push(
        `Found ${manualTypes.length} manual type definition(s). Consider using Drizzle inference instead.`
      );
    }
  }

  /**
   * Check for duplicate type definitions
   */
  private checkDuplicateTypes(): void {
    const dbTypesPath = join(projectRoot, 'packages/db/src/types.ts');
    const sharedTypesPath = join(projectRoot, 'packages/shared/src/types/index.ts');

    if (!existsSync(dbTypesPath) || !existsSync(sharedTypesPath)) {
      return;
    }

    const dbTypesContent = this.readTsFile(dbTypesPath);
    const sharedTypesContent = this.readTsFile(sharedTypesPath);

    // Extract type names
    const dbTypeNames = Array.from(
      dbTypesContent.matchAll(/export type (\w+)/g),
      m => m[1]
    );
    const sharedTypeNames = Array.from(
      sharedTypesContent.matchAll(/export type (\w+)/g),
      m => m[1]
    );

    // Check for duplicates
    const duplicates = dbTypeNames.filter(name => sharedTypeNames.includes(name));
    if (duplicates.length > 0) {
      this.errors.push(
        `Duplicate type definitions found: ${duplicates.join(', ')}. ` +
        `Types should be exported from packages/db/src/types.ts and re-exported in shared package.`
      );
    }
  }

  /**
   * Validate field naming consistency
   */
  private validateFieldNaming(drizzleFields: string[], zodFields: string[]): void {
    // Check for snake_case in Zod (should be camelCase)
    const snakeCaseFields = zodFields.filter(field => field.includes('_'));
    if (snakeCaseFields.length > 0) {
      this.errors.push(
        `Zod schemas use snake_case: ${snakeCaseFields.join(', ')}. ` +
        `Should use camelCase to match Drizzle code layer.`
      );
    }

    // Check for camelCase consistency
    const camelCaseDrizzle = drizzleFields.filter(f => /^[a-z][a-zA-Z0-9]*$/.test(f));
    const camelCaseZod = zodFields.filter(f => /^[a-z][a-zA-Z0-9]*$/.test(f));

    if (camelCaseDrizzle.length !== drizzleFields.length) {
      this.warnings.push('Some Drizzle fields are not using camelCase naming convention.');
    }
  }

  /**
   * Main validation function
   */
  validate(): ValidationResult {
    console.log('🔍 Validating schema alignment...\n');

    // Read schema files
    const schemaPath = join(projectRoot, 'packages/db/src/schema/index.ts');
    const validationPath = join(projectRoot, 'packages/shared/src/validation/index.ts');
    const typesPath = join(projectRoot, 'packages/db/src/types.ts');

    if (!existsSync(schemaPath)) {
      this.errors.push('Drizzle schema file not found: packages/db/src/schema/index.ts');
      return this.getResult();
    }

    if (!existsSync(validationPath)) {
      this.warnings.push('Zod validation file not found: packages/shared/src/validation/index.ts');
    }

    const schemaContent = this.readTsFile(schemaPath);
    const validationContent = existsSync(validationPath)
      ? this.readTsFile(validationPath)
      : '';
    const typesContent = existsSync(typesPath)
      ? this.readTsFile(typesPath)
      : '';

    // Extract tables and schemas
    const drizzleTables = this.extractDrizzleTables(schemaContent);
    const zodSchemas = this.extractZodSchemas(validationContent);

    console.log(`Found ${drizzleTables.length} Drizzle table(s): ${drizzleTables.join(', ')}`);
    console.log(`Found ${zodSchemas.length} Zod schema(s): ${zodSchemas.join(', ')}\n`);

    // Check type inference
    if (typesContent) {
      this.checkTypeInference(typesContent);
    }

    // Check for duplicate types
    this.checkDuplicateTypes();

    // Validate alignment for each table
    for (const tableName of drizzleTables) {
      const drizzleFields = this.extractDrizzleFields(tableName, schemaContent);

      // Try to find matching Zod schema (e.g., properties -> propertySchema)
      const schemaName = tableName.slice(0, -1) + 'Schema'; // properties -> propertySchema
      const matchingSchema = zodSchemas.find(s =>
        s.toLowerCase().includes(tableName.slice(0, -1).toLowerCase())
      );

      if (!matchingSchema && validationContent) {
        this.warnings.push(
          `No Zod schema found for table: ${tableName}. ` +
          `Consider creating a validation schema.`
        );
        continue;
      }

      if (matchingSchema && validationContent) {
        const zodFields = this.extractZodFields(matchingSchema, validationContent);
        this.validateFieldNaming(drizzleFields, zodFields);

        // Check for missing fields (excluding auto-generated)
        const autoGeneratedFields = ['id', 'createdAt', 'updatedAt'];
        const userFields = drizzleFields.filter(f => !autoGeneratedFields.includes(f));
        const missingFields = userFields.filter(f => !zodFields.includes(f));

        if (missingFields.length > 0) {
          this.warnings.push(
            `Table ${tableName}: Missing fields in Zod schema: ${missingFields.join(', ')}`
          );
        }
      }
    }

    return this.getResult();
  }

  private getResult(): ValidationResult {
    return {
      passed: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
    };
  }
}

// Run validation
const validator = new AlignmentValidator();
const result = validator.validate();

console.log('\n📊 Validation Results:\n');

if (result.errors.length > 0) {
  console.log('❌ Errors:');
  result.errors.forEach(error => console.log(`  - ${error}`));
  console.log('');
}

if (result.warnings.length > 0) {
  console.log('⚠️  Warnings:');
  result.warnings.forEach(warning => console.log(`  - ${warning}`));
  console.log('');
}

if (result.errors.length === 0 && result.warnings.length === 0) {
  console.log('✅ All checks passed!\n');
} else if (result.errors.length === 0) {
  console.log('✅ No errors found (warnings may need attention)\n');
}

process.exit(result.passed ? 0 : 1);

