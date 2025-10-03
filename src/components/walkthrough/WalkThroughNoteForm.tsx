'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Star } from 'lucide-react'
import { PhotoUpload } from './PhotoUpload'
import { WalkThroughPhoto } from '@/types/walkthrough'

interface WalkThroughNoteFormProps {
  initialData?: {
    title: string
    content: string
    rating: number
    photos?: WalkThroughPhoto[]
  }
  onSubmit: (data: { 
    title: string; 
    content: string; 
    rating: number; 
    photos: WalkThroughPhoto[] 
  }) => Promise<void>
  onCancel: () => void
  isEditing?: boolean
}

export function WalkThroughNoteForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isEditing = false 
}: WalkThroughNoteFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [content, setContent] = useState(initialData?.content || '')
  const [rating, setRating] = useState(initialData?.rating || 3)
  const [photos, setPhotos] = useState<WalkThroughPhoto[]>(initialData?.photos || [])
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title)
      setContent(initialData.content)
      setRating(initialData.rating)
      setPhotos(initialData.photos || [])
    }
  }, [initialData])

  const validateForm = (): boolean => {
    if (!title.trim()) {
      setValidationError('Title is required')
      return false
    }
    if (title.trim().length > 200) {
      setValidationError('Title must be 200 characters or less')
      return false
    }
    if (!content.trim()) {
      setValidationError('Content is required')
      return false
    }
    if (content.trim().length > 5000) {
      setValidationError('Content must be 5000 characters or less')
      return false
    }
    if (rating < 1 || rating > 5) {
      setValidationError('Rating must be between 1 and 5')
      return false
    }
    setValidationError(null)
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setIsSubmitting(true)
      setValidationError(null)
      
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        rating,
        photos
      })
    } catch (error) {
      console.error('Error submitting form:', error)
      setValidationError('Failed to save note. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRatingClick = (clickedRating: number) => {
    setRating(clickedRating)
  }

  const renderStarRating = () => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = star <= (hoveredRating ?? rating)
          return (
            <button
              key={star}
              type="button"
              className="p-1 rounded-sm hover:bg-gray-100 transition-colors"
              onClick={() => handleRatingClick(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(null)}
            >
              <Star
                className={`h-6 w-6 cursor-pointer transition-colors ${
                  isActive 
                    ? 'fill-yellow-400 text-yellow-400' 
                    : 'text-gray-300 hover:text-yellow-300'
                }`}
              />
            </button>
          )
        })}
        <span className="ml-2 text-sm text-gray-600">
          ({hoveredRating ?? rating}/5)
        </span>
      </div>
    )
  }

  return (
    <div className="border rounded-lg p-4 bg-white">
      <h3 className="text-lg font-semibold mb-4">
        {isEditing ? 'Edit Walk-Through Note' : 'Add Walk-Through Note'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {validationError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{validationError}</p>
          </div>
        )}

        <div>
          <Label htmlFor="note-title">Title</Label>
          <Input
            id="note-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief title for your observation..."
            maxLength={200}
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            {title.length}/200 characters
          </p>
        </div>

        <div>
          <Label htmlFor="note-content">Your Observations</Label>
          <Textarea
            id="note-content"
            value={content}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
            placeholder="Describe what you observed during your walk-through: condition of the property, neighborhood, potential issues, positive aspects, etc..."
            maxLength={5000}
            rows={6}
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            {content.length}/5000 characters
          </p>
        </div>

        <div>
          <Label>Overall Rating</Label>
          <div className="mt-2">
            {renderStarRating()}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Rate your overall impression of this property (1 = Poor, 5 = Excellent)
          </p>
        </div>

        <PhotoUpload
          photos={photos}
          onPhotosChange={setPhotos}
          maxPhotos={10}
          disabled={isSubmitting}
        />

        <div className="flex items-center gap-3 pt-2">
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="min-w-[100px]"
          >
            {isSubmitting ? 'Saving...' : (isEditing ? 'Update' : 'Save Note')}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}