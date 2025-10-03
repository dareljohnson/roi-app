'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Camera, Upload, X, Image as ImageIcon, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useSession } from 'next-auth/react'

interface PropertyPhotoUploadProps {
  currentImageUrl?: string
  onImageChange: (imageUrl: string | null) => void
  disabled?: boolean
  className?: string
}

interface UploadedFile {
  filename: string
  filepath: string
  filesize: number
  mimetype: string
}

export function PropertyPhotoUpload({ 
  currentImageUrl, 
  onImageChange, 
  disabled = false,
  className = ''
}: PropertyPhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [displayImageUrl, setDisplayImageUrl] = useState<string | undefined>(currentImageUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // Detect if we're on mobile
  const isMobile = typeof window !== 'undefined' && 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  // Use NextAuth session for authentication
  const { data: session, status } = useSession()
  const isAuthenticated = status === 'authenticated' && !!session?.user

  // Sync display image with prop changes (for external updates)
  useEffect(() => {
    setDisplayImageUrl(currentImageUrl)
  }, [currentImageUrl])

  const uploadFile = async (file: File) => {
    setUploading(true)
    setUploadError(null)

    // Validate file type and size before upload
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Only image files are allowed (jpeg, png, gif, webp).')
      setUploading(false)
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB.')
      setUploading(false)
      return
    }

    try {
      const formData = new FormData()
      formData.append('photos', file)

      const response = await fetch('/api/upload/property-photos', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      
      if (result.files && result.files.length > 0) {
        const uploadedFile: UploadedFile = result.files[0]
        // Update display immediately for instant user feedback
        setDisplayImageUrl(uploadedFile.filepath)
        // Notify parent component of the change
        onImageChange(uploadedFile.filepath)
      }
    } catch (error) {
      console.error('Upload error:', error)
      setUploadError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      uploadFile(files[0])
    }
    // Reset input value to allow selecting the same file again
    e.target.value = ''
  }

  const handleRemovePhoto = () => {
    // Update display immediately
    setDisplayImageUrl(undefined)
    // Notify parent component
    onImageChange(null)
  }

  const handleDesktopUpload = () => {
    fileInputRef.current?.click()
  }

  const handleCameraCapture = () => {
    cameraInputRef.current?.click()
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Login Prompt */}
      {!isAuthenticated && (
        <div className="text-center text-sm text-red-600" data-testid="login-prompt">
          Please log in to upload or replace property photos.
        </div>
      )}

      {/* Current Image Display */}
      {displayImageUrl && (
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <img
                src={displayImageUrl}
                alt="Property"
                className="w-full h-48 object-cover rounded-lg shadow border border-gray-200"
                data-testid="property-image"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleRemovePhoto}
                disabled={disabled || uploading}
                aria-label="Remove Photo"
                data-testid="remove-photo-btn"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Controls */}
      <div className="space-y-3">
        {/* Desktop File Upload */}
        <Button
          type="button"
          variant={displayImageUrl ? "outline" : "default"}
          className="w-full"
          onClick={handleDesktopUpload}
          disabled={disabled || uploading || !isAuthenticated}
          aria-label={displayImageUrl ? "Replace Photo" : "Upload Photo"}
          data-testid="upload-photo-btn"
        >
          {uploading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : displayImageUrl ? (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Replace Photo
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Photo
            </>
          )}
        </Button>

        {/* Mobile Camera Capture */}
        {isMobile && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleCameraCapture}
            disabled={disabled || uploading || !isAuthenticated}
            aria-label="Camera Capture"
            data-testid="camera-capture-btn"
          >
            <Camera className="mr-2 h-4 w-4" />
            {displayImageUrl ? 'Retake Photo' : 'Take Photo'}
          </Button>
        )}

        {/* No Image Placeholder */}
        {!displayImageUrl && !uploading && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center" data-testid="no-image-placeholder">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              {isMobile ? 'Upload a photo or take one with your camera' : 'Upload a property photo'}
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {uploadError && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200" data-testid="upload-error">
          {uploadError}
        </div>
      )}

      {/* Hidden File Inputs */}
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled || uploading || !isAuthenticated}
        aria-label="Upload File"
        data-testid="upload-file-input"
      />

      {/* Hidden Camera Input for Mobile */}
      <Input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled || uploading || !isAuthenticated}
        aria-label="Camera File"
        data-testid="camera-file-input"
      />
    </div>
  )
}