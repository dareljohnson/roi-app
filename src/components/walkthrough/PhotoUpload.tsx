'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react'
import { WalkThroughPhoto } from '@/types/walkthrough'

interface PhotoUploadProps {
  photos: WalkThroughPhoto[]
  onPhotosChange: (photos: WalkThroughPhoto[]) => void
  maxPhotos?: number
  disabled?: boolean
}

interface UploadedFile {
  filename: string
  filepath: string
  filesize: number
  mimetype: string
}

export function PhotoUpload({ 
  photos, 
  onPhotosChange, 
  maxPhotos = 10, 
  disabled = false 
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // Detect if we're on mobile
  const isMobile = typeof window !== 'undefined' && 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  const uploadFiles = async (files: FileList) => {
    if (!files || files.length === 0) return

    if (photos.length + files.length > maxPhotos) {
      setUploadError(`Maximum ${maxPhotos} photos allowed`)
      return
    }

    setUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      
      // Add all files to form data
      Array.from(files).forEach((file) => {
        formData.append('photos', file)
      })

      const response = await fetch('/api/upload/walkthrough-photos', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      
      // Convert uploaded files to WalkThroughPhoto format
      const newPhotos: WalkThroughPhoto[] = result.files.map((file: UploadedFile, index: number) => ({
        // Don't include id and noteId for new photos - they'll be assigned when note is saved
        createdAt: new Date().toISOString(),
        filename: file.filename,
        filepath: file.filepath,
        filesize: file.filesize,
        mimetype: file.mimetype,
        description: null,
        order: photos.length + index,
      } as WalkThroughPhoto))

      onPhotosChange([...photos, ...newPhotos])
    } catch (error) {
      console.error('Upload error:', error)
      setUploadError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      uploadFiles(files)
    }
    // Reset input value to allow selecting the same file again
    e.target.value = ''
  }

  const handleRemovePhoto = (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index)
    onPhotosChange(updatedPhotos)
  }

  const handleDescriptionChange = (index: number, description: string) => {
    const updatedPhotos = [...photos]
    updatedPhotos[index] = { ...updatedPhotos[index], description }
    onPhotosChange(updatedPhotos)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Photo Attachments</Label>
        <p className="text-xs text-gray-500 mt-1">
          Add up to {maxPhotos} photos to document your walk-through observations
        </p>
      </div>

      {/* Upload Controls */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Desktop File Upload */}
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading || photos.length >= maxPhotos}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          {isMobile ? 'Choose Photos' : 'Upload Photos'}
        </Button>

        {/* Mobile Camera Capture */}
        {isMobile && (
          <Button
            type="button"
            variant="outline"
            onClick={() => cameraInputRef.current?.click()}
            disabled={disabled || uploading || photos.length >= maxPhotos}
            className="flex items-center gap-2"
          >
            <Camera className="h-4 w-4" />
            Take Photo
          </Button>
        )}

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {isMobile && (
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
        )}
      </div>

      {/* Upload Status */}
      {uploading && (
        <div className="flex items-center gap-2 text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm">Uploading photos...</span>
        </div>
      )}

      {/* Upload Error */}
      {uploadError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">{uploadError}</p>
        </div>
      )}

      {/* Photo Preview Grid */}
      {photos.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo, index) => (
              <div key={index} className="border rounded-lg p-3 bg-gray-50">
                <div className="relative mb-2">
                  <img
                    src={photo.filepath}
                    alt={photo.filename}
                    className="w-full h-32 object-cover rounded"
                    onError={(e) => {
                      // Fallback for broken images
                      const target = e.target as HTMLImageElement
                      target.src = '/placeholder-image.png'
                    }}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemovePhoto(index)}
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                    disabled={disabled}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <div className="text-xs text-gray-600">
                    <div className="truncate">{photo.filename}</div>
                    <div>{formatFileSize(photo.filesize)}</div>
                  </div>
                  
                  <Input
                    type="text"
                    placeholder="Photo description (optional)"
                    value={photo.description || ''}
                    onChange={(e) => handleDescriptionChange(index, e.target.value)}
                    disabled={disabled}
                    className="text-xs h-8"
                    maxLength={500}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-xs text-gray-500">
            {photos.length}/{maxPhotos} photos added
          </div>
        </div>
      )}
    </div>
  )
}