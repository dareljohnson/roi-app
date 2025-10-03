import { z } from 'zod'

// Photo validation schema
export const WalkThroughPhotoSchema = z.object({
  id: z.string().optional(),
  filename: z.string().min(1, 'Filename is required'),
  filepath: z.string().min(1, 'File path is required'),
  filesize: z.number().positive('File size must be positive'),
  mimetype: z.string().regex(/^image\/(jpeg|jpg|png|gif|webp)$/i, 'Invalid image type'),
  description: z.string().max(500, 'Description must be less than 500 characters').nullable().optional(),
  order: z.number().int().min(0).default(0),
})

// Walk-through note validation schema (for creating new notes)
export const WalkThroughNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  content: z.string().min(1, 'Content is required').max(5000, 'Content must be less than 5000 characters'),
  rating: z.number().min(1).max(5).optional(),
  propertyId: z.string().min(1, 'Property ID is required'),
  photos: z.array(WalkThroughPhotoSchema).max(10, 'Maximum 10 photos allowed').optional(),
})

// Walk-through note update validation schema (propertyId not required for updates)
export const WalkThroughNoteUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  content: z.string().min(1, 'Content is required').max(5000, 'Content must be less than 5000 characters'),
  rating: z.number().min(1).max(5).optional(),
  photos: z.array(WalkThroughPhotoSchema).max(10, 'Maximum 10 photos allowed').optional(),
})

// TypeScript types derived from schemas
export type WalkThroughNoteInput = z.infer<typeof WalkThroughNoteSchema>
export type WalkThroughPhotoInput = z.infer<typeof WalkThroughPhotoSchema>

export interface WalkThroughPhoto {
  id: string
  createdAt: string
  filename: string
  filepath: string
  filesize: number
  mimetype: string
  description?: string | null
  order: number
  noteId: string
}

export interface WalkThroughNote {
  id: string
  createdAt: string
  updatedAt: string
  title: string
  content: string
  rating?: number
  propertyId: string
  userId: string
  photos?: WalkThroughPhoto[]
  user?: {
    name?: string | null
    email: string
  }
  property?: {
    address: string
  }
}

export interface WalkThroughNotesResponse {
  success: boolean
  notes: WalkThroughNote[]
  total: number
}

export interface WalkThroughNoteResponse {
  success: boolean
  note?: WalkThroughNote
  error?: string
}