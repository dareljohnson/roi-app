# Photo Update Bug Fix Summary

## Issue

**Original Problem**: When updating a walkthrough note that already has photos, adding new photos would overwrite/delete the existing photos instead of preserving them.

## Root Causes Identified

### 1. Frontend Issue (WalkThroughNotes.tsx)

- The `handleNoteSubmit` function was not passing the `photos` parameter when editing existing notes
- The `initialData` for the form was missing the `photos` property

### 2. Backend Issue (API route)

- The API was deleting ALL existing photos before creating new ones
- No intelligent handling of existing vs new photos

## Fixes Applied

### Frontend Fix (WalkThroughNotes.tsx)

```typescript
// BEFORE: handleNoteSubmit was missing photos parameter
const handleNoteSubmit = async (noteData: Partial<WalkThroughNote>) => {
  // photos parameter was missing
}

// AFTER: handleNoteSubmit now accepts and handles photos
const handleNoteSubmit = async (
  noteData: Partial<WalkThroughNote>, 
  photos?: WalkThroughPhoto[]
) => {
  // photos are now properly passed to API
}

// BEFORE: initialData was missing photos
const initialData = {
  title: editingNote.title,
  content: editingNote.content,
  rating: editingNote.rating
}

// AFTER: initialData includes existing photos
const initialData = {
  title: editingNote.title,
  content: editingNote.content,
  rating: editingNote.rating,
  photos: editingNote.photos || []
}
```

### Backend Fix (API route.ts)

**Old Behavior (Caused Bug):**
```typescript
// PROBLEMATIC: Deleted ALL existing photos first
if (validatedData.photos) {
  await prisma.walkThroughPhoto.deleteMany({
    where: { noteId: params.id }
  })
  // Then created all photos as "new"
}
```

**New Behavior (Fixed):**

```typescript
// INTELLIGENT: Only affects photos that actually changed
if (validatedData.photos) {
  const existingPhotos = await prisma.walkThroughPhoto.findMany({
    where: { noteId: params.id }
  }) || []

  // Separate existing photos from new photos
  const existingPhotoIds = existingPhotos.map(p => p.id)
  const updatedPhotoIds = validatedData.photos
    .filter(p => p.id)
    .map(p => p.id)
  const newPhotos = validatedData.photos.filter(p => !p.id)

  // Only delete photos that are actually removed
  const photosToDelete = existingPhotoIds.filter(id => !updatedPhotoIds.includes(id))
  if (photosToDelete.length > 0) {
    await prisma.walkThroughPhoto.deleteMany({
      where: {
        id: { in: photosToDelete },
        noteId: params.id
      }
    })
  }

  // Update existing photos (preserve them, just update metadata)
  const existingPhotosToUpdate = validatedData.photos.filter(p => p.id && existingPhotoIds.includes(p.id))
  for (const photo of existingPhotosToUpdate) {
    await prisma.walkThroughPhoto.update({
      where: { id: photo.id },
      data: {
        description: photo.description || '',
        order: photo.order ?? 0
      }
    })
  }

  // Only create truly new photos
  if (newPhotos.length > 0) {
    updateData.photos = {
      create: newPhotos.map((photo, index) => ({
        filename: photo.filename,
        filepath: photo.filepath,
        filesize: photo.filesize,
        mimetype: photo.mimetype,
        description: photo.description || '',
        order: photo.order ?? (existingPhotos.length + index)
      }))
    }
  }
}
```

## Verification

### Test Results

- ✅ All existing photo API tests pass
- ✅ Photo integration tests updated and passing  
- ✅ No regression in other functionality

### Behavior Verification

1. **Before Fix**: Adding photos to existing note → All previous photos deleted
2. **After Fix**: Adding photos to existing note → Previous photos preserved, new photos added

## Impact

- **User Experience**: Users can now safely add photos to existing walkthrough notes without losing their previous photos
- **Data Integrity**: No more accidental photo loss during updates
- **System Reliability**: More intelligent photo management that handles complex update scenarios

## Files Modified

1. `src/components/walkthrough/WalkThroughNotes.tsx` - Fixed frontend photo passing
2. `src/app/api/walkthrough-notes/[id]/route.ts` - Completely rewrote photo update logic
3. `src/tests/photo-api-integration.test.ts` - Updated test expectations to match new behavior

The photo update bug is now **COMPLETELY FIXED** and users can safely add photos to existing walkthrough notes without losing their previous photos.