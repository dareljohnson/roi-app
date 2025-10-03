'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Trash2, Star, X } from 'lucide-react'
import { WalkThroughNote, WalkThroughPhoto } from '@/types/walkthrough'
import { WalkThroughNoteForm } from '@/components/walkthrough/WalkThroughNoteForm'

interface WalkThroughNotesProps {
  propertyId: string
  propertyAddress: string
}

export function WalkThroughNotes({ propertyId, propertyAddress }: WalkThroughNotesProps) {
  const [notes, setNotes] = useState<WalkThroughNote[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingNote, setEditingNote] = useState<WalkThroughNote | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<WalkThroughNote | null>(null)
  const [showDeletePhotoModal, setShowDeletePhotoModal] = useState(false)
  const [photoToDelete, setPhotoToDelete] = useState<{ photoId: string, noteId: string } | null>(null)

  useEffect(() => {
    fetchNotes()
  }, [propertyId])

  const fetchNotes = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/walkthrough-notes?propertyId=${propertyId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch notes')
      }

      const data = await response.json()
      if (data.success) {
        setNotes(data.notes)
      } else {
        setError(data.error || 'Failed to load notes')
      }
    } catch (err) {
      console.error('Error fetching walk-through notes:', err)
      setError('Error fetching walk-through notes')
    } finally {
      setLoading(false)
    }
  }

  const handleNoteSubmit = async (noteData: { title: string; content: string; rating: number; photos: WalkThroughPhoto[] }) => {
    try {
      const url = editingNote 
        ? `/api/walkthrough-notes/${editingNote.id}`
        : '/api/walkthrough-notes'
      
      const method = editingNote ? 'PUT' : 'POST'
      const body = editingNote 
        ? noteData // This now includes photos!
        : { ...noteData, propertyId }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save note')
      }

      const data = await response.json()
      if (data.success) {
        await fetchNotes() // Refresh the notes list
        setShowForm(false)
        setEditingNote(null)
      } else {
        setError(data.error || 'Failed to save note')
      }
    } catch (err) {
      console.error('Error saving note:', err)
      setError(err instanceof Error ? err.message : 'Error saving note')
    }
  }

  const handleDeleteNote = (note: WalkThroughNote) => {
    setNoteToDelete(note)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!noteToDelete) return

    try {
      const response = await fetch(`/api/walkthrough-notes/${noteToDelete.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete note')
      }

      const data = await response.json()
      if (data.success) {
        await fetchNotes() // Refresh the notes list
        setShowDeleteModal(false)
        setNoteToDelete(null)
      } else {
        setError(data.error || 'Failed to delete note')
      }
    } catch (err) {
      console.error('Error deleting note:', err)
      setError(err instanceof Error ? err.message : 'Error deleting note')
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteModal(false)
    setNoteToDelete(null)
  }

  const handleDeletePhoto = (photoId: string, noteId: string) => {
    setPhotoToDelete({ photoId, noteId })
    setShowDeletePhotoModal(true)
  }

  const handleConfirmDeletePhoto = async () => {
    if (!photoToDelete) return

    try {
      const response = await fetch(`/api/walkthrough-photos/${photoToDelete.photoId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete photo')
      }

      const data = await response.json()
      if (data.success) {
        await fetchNotes() // Refresh the notes list to update photo counts
        setShowDeletePhotoModal(false)
        setPhotoToDelete(null)
      } else {
        setError(data.error || 'Failed to delete photo')
      }
    } catch (err) {
      console.error('Error deleting photo:', err)
      setError(err instanceof Error ? err.message : 'Error deleting photo')
    }
  }

  const handleCancelDeletePhoto = () => {
    setShowDeletePhotoModal(false)
    setPhotoToDelete(null)
  }

  const handleEditNote = (note: WalkThroughNote) => {
    setEditingNote(note)
    setShowForm(true)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingNote(null)
    setError(null)
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">
          ({rating}/5)
        </span>
      </div>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Walk-Through Notes</CardTitle>
          <CardDescription>Loading your notes...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Walk-Through Notes</CardTitle>
            <CardDescription>
              Your personal observations and notes from visiting {propertyAddress}
            </CardDescription>
          </div>
          <Button 
            onClick={() => setShowForm(true)} 
            size="sm"
            disabled={showForm}
            className="self-start sm:self-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {showForm && (
          <div className="mb-6">
            <WalkThroughNoteForm
              initialData={editingNote ? {
                title: editingNote.title,
                content: editingNote.content,
                rating: editingNote.rating ?? 0,
                photos: editingNote.photos || []
              } : undefined}
              onSubmit={handleNoteSubmit}
              onCancel={handleCancelForm}
              isEditing={!!editingNote}
            />
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading notes...</p>
          </div>
        ) : error ? (
          // Error is displayed above, so just show nothing here  
          null
        ) : !notes || notes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">
              No walk-through notes yet for this property.
            </p>
            <p className="text-sm text-gray-400">
              Add your first note to track your observations and impressions from visiting this property.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes?.map((note) => (
              <div
                key={note.id}
                className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg text-gray-900 mb-1">
                      {note.title}
                    </h4>
                    {renderStars(note.rating || 0)}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditNote(note)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteNote(note)}
                      className="text-red-600 hover:text-red-700"
                      aria-label="Delete note"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </p>

                {/* Photo Gallery */}
                {note.photos && note.photos.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-medium text-gray-700">
                        Attached Photos
                      </h5>
                      <span className="text-xs text-gray-500">
                        {note.photos.length} {note.photos.length === 1 ? 'photo' : 'photos'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {note.photos
                        .sort((a, b) => a.order - b.order)
                        .map((photo) => (
                          <div key={photo.id} className="relative group">
                            {/* Delete button */}
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeletePhoto(photo.id, note.id)
                              }}
                              aria-label="Delete photo"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                            
                            <img
                              src={photo.filepath}
                              alt={photo.description || photo.filename}
                              className="w-full h-24 object-cover rounded-lg border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = '/placeholder-image.png'
                              }}
                              onClick={() => {
                                // Open full-size image in new tab/window
                                window.open(photo.filepath, '_blank')
                              }}
                            />
                            {photo.description && (
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-75 transition-all duration-200 rounded-lg flex items-center justify-center">
                                <p className="text-white text-xs text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-2">
                                  {photo.description}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div className="mt-3 text-xs text-gray-500">
                  {note.updatedAt !== note.createdAt ? 'Updated' : 'Created'} on{' '}
                  {new Date(note.updatedAt).toLocaleDateString()} at{' '}
                  {new Date(note.updatedAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && noteToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Delete Walk-Through Note
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete the note "{noteToDelete.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={handleCancelDelete}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Photo Confirmation Modal */}
      {showDeletePhotoModal && photoToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Delete Photo
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this photo? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={handleCancelDeletePhoto}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDeletePhoto}
              >
                Delete Photo
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}