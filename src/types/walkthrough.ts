import { z } from 'zod'

// Walk-through note validation schema (for creating new notes)
export const WalkThroughNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  content: z.string().min(1, 'Content is required').max(5000, 'Content must be less than 5000 characters'),
  rating: z.number().min(1).max(5).optional(),
  propertyId: z.string().min(1, 'Property ID is required'),
})

// Walk-through note update validation schema (propertyId not required for updates)
export const WalkThroughNoteUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  content: z.string().min(1, 'Content is required').max(5000, 'Content must be less than 5000 characters'),
  rating: z.number().min(1).max(5).optional(),
})

// TypeScript types derived from schemas
export type WalkThroughNoteInput = z.infer<typeof WalkThroughNoteSchema>

export interface WalkThroughNote {
  id: string
  createdAt: string
  updatedAt: string
  title: string
  content: string
  rating?: number
  propertyId: string
  userId: string
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