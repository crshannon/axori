# Property Wizard Save Strategy

## Recommendation: **Yes, save after each step as a draft**

### Why Auto-Save/Draft Approach?

**Benefits:**

- ✅ **Prevents data loss** - User can refresh/close browser without losing progress
- ✅ **Better UX** - Users can resume later
- ✅ **Reduces abandonment** - Long 6-step forms are more likely to be completed if progress is saved
- ✅ **Enables validation** - Can validate data incrementally

**Considerations:**

- Need to handle incomplete/draft records
- Require portfolio context (from our portfolio system)
- Need to track draft vs. complete status

## Implementation Plan

### Phase 1: Schema Updates

#### 1.1 Add Status Field to Properties Table

```typescript
// Add to packages/db/src/schema/index.ts

export const propertyStatusEnum = pgEnum("property_status", [
  "draft", // Incomplete - still in wizard
  "active", // Complete - ready for use
  "archived", // Archived/hidden (future)
]);

export const properties = pgTable("properties", {
  // ... existing fields
  status: propertyStatusEnum("status").notNull().default("draft"),
  // ... rest of fields
});
```

**Rationale:**

- Allows filtering drafts vs. active properties
- Enables draft management UI
- Clean separation of incomplete vs. complete records

#### 1.2 Make propertyType Nullable for Drafts

**Option A**: Make `propertyType` nullable

```typescript
propertyType: text("property_type"), // Remove .notNull()
```

**Option B**: Set default value for drafts

```typescript
propertyType: text("property_type").notNull().default("Unknown"),
```

**Recommendation**: Option A (nullable) - cleaner separation, can validate on final save.

### Phase 2: Save Strategy

#### Save Points:

1. **After Step 1** (Address selected) - Create draft record
2. **After each subsequent step** - Update draft record
3. **On final step** - Mark as `active` (complete)
4. **On wizard close** - Keep draft (allow resume later)

#### Minimum Required Fields for Draft:

- `portfolioId` - From portfolio context
- `addedBy` - From auth context
- `address` - Required (from Step 1)
- `city` - Required (from Step 1)
- `state` - Required (from Step 1)
- `zipCode` - Required (from Step 1)
- `status` - Set to "draft"
- `propertyType` - Optional for draft, required for active

### Phase 3: Context & API Requirements

#### 3.1 Portfolio Context

Need to access current portfolio:

- Could use React Context
- Could pass as prop to wizard
- Could use URL param (if portfolio-specific routes)

#### 3.2 User Context

Using Clerk for auth - need user ID:

```typescript
import { useUser } from "@clerk/tanstack-react-start";

const { user } = useUser();
const userId = user?.id; // Need to map Clerk ID to internal user ID
```

#### 3.3 API Endpoints Needed

**Create/Update Draft:**

```
POST   /api/properties/drafts      - Create new draft
PUT    /api/properties/drafts/:id  - Update existing draft
GET    /api/properties/drafts/:id  - Resume draft
DELETE /api/properties/drafts/:id  - Delete draft
```

**Finalize:**

```
POST   /api/properties/:id/complete - Mark draft as active/complete
```

### Phase 4: Component Updates

#### 4.1 Add Draft ID to Wizard State

```typescript
const [draftId, setDraftId] = useState<string | null>(null);
const [isSaving, setIsSaving] = useState(false);
```

#### 4.2 Auto-Save Function

```typescript
const saveDraft = async (step: number) => {
  if (!portfolioId || !userId) return;

  setIsSaving(true);
  try {
    const data = {
      ...formData,
      portfolioId,
      addedBy: userId,
      status: "draft",
    };

    if (draftId) {
      // Update existing draft
      await updateDraft(draftId, data);
    } else {
      // Create new draft
      const newDraft = await createDraft(data);
      setDraftId(newDraft.id);
    }
  } catch (error) {
    console.error("Failed to save draft:", error);
    // Optionally show toast notification
  } finally {
    setIsSaving(false);
  }
};
```

#### 4.3 Hook up Auto-Save

```typescript
useEffect(() => {
  // Auto-save after Step 1 (address selected)
  if (step >= 2 && isAddressSelected && !draftId) {
    saveDraft(step);
  }

  // Auto-save on step changes (debounced)
  if (step > 1 && draftId) {
    const timer = setTimeout(() => {
      saveDraft(step);
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }
}, [step, formData, isAddressSelected]);
```

#### 4.4 Final Save

```typescript
const handleFinalSave = async () => {
  if (!draftId) {
    // Create new property if no draft
    await saveDraft(totalSteps);
    setDraftId(/* returned id */);
  }

  // Mark as complete
  await completeProperty(draftId);
  setIsSuccess(true);
};
```

### Phase 5: Draft Management UI

#### Future Enhancements:

- Show draft properties in property list (with "Draft" badge)
- Allow resume from property list
- Clean up old drafts (auto-delete after X days)

## Alternative: LocalStorage First (Quick Win)

If portfolio context isn't ready yet, use localStorage as interim solution:

```typescript
// Save to localStorage after each step
useEffect(() => {
  if (step > 1) {
    localStorage.setItem(
      "property-wizard-draft",
      JSON.stringify({
        formData,
        step,
        timestamp: Date.now(),
      })
    );
  }
}, [step, formData]);

// Load on mount
useEffect(() => {
  const draft = localStorage.getItem("property-wizard-draft");
  if (draft) {
    const parsed = JSON.parse(draft);
    // Check if recent (e.g., within 24 hours)
    if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
      setFormData(parsed.formData);
      setStep(parsed.step);
    }
  }
}, []);
```

**Pros:**

- Quick to implement
- No API changes needed
- No schema changes needed initially

**Cons:**

- Not cross-device
- Lost if user clears browser data
- Not available for other users

## Recommendation Summary

**Immediate (MVP):**

1. ✅ Add `status` enum to properties schema
2. ✅ Make `propertyType` nullable for drafts
3. ✅ Save draft after Step 1 (once address selected)
4. ✅ Update draft after each subsequent step
5. ✅ Mark as `active` on final save

**Future Enhancements:**

- Draft management UI
- Resume draft functionality
- Auto-cleanup of old drafts
- Cross-device sync (already handled by DB)

## Next Steps

1. **Add status field** to schema (with migration)
2. **Make propertyType nullable** (with migration)
3. **Create draft API endpoints**
4. **Implement portfolio context** (or pass as prop initially)
5. **Update wizard** to auto-save on step completion
6. **Update validation** to allow partial data for drafts
