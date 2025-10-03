/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PropertyPhotoUpload } from '../components/property/PropertyPhotoUpload';
import { useSession } from 'next-auth/react';

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn()
}));
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

// Mock fetch
global.fetch = jest.fn();

// Mock FormData
const mockFormData = {
  append: jest.fn(),
  getAll: jest.fn()
};
global.FormData = jest.fn(() => mockFormData) as any;

describe('PropertyPhotoUpload - Display Update Fix', () => {
  const mockOnImageChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFormData.append.mockClear();
    mockFormData.getAll.mockClear();
    mockUseSession.mockReturnValue({
      data: { user: { email: 'test@example.com' }, expires: '2024-01-01' },
      status: 'authenticated',
      update: jest.fn()
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should update display immediately after successful upload without waiting for prop update', async () => {
    // Mock successful upload
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        files: [{
          filepath: '/uploads/new-uploaded-photo.jpg',
          filename: 'new-photo.jpg',
          size: 145231
        }]
      })
    });

    render(
      <PropertyPhotoUpload 
        currentImageUrl="/uploads/original-photo.jpg"
        onImageChange={mockOnImageChange}
      />
    );

    // Verify original image is displayed
    const originalImage = screen.getByTestId('property-image');
    expect(originalImage).toHaveAttribute('src', '/uploads/original-photo.jpg');
    expect(screen.getByText('Replace Photo')).toBeInTheDocument();

    // Upload new photo
    const replaceButton = screen.getByTestId('upload-photo-btn');
    fireEvent.click(replaceButton);

    const fileInput = screen.getByTestId('upload-file-input') as HTMLInputElement;
    const newPhotoFile = new File(['new photo data'], 'new-photo.jpg', { type: 'image/jpeg' });
    
    Object.defineProperty(fileInput, 'files', {
      value: [newPhotoFile],
      writable: false
    });

    fireEvent.change(fileInput);

    // Wait for upload to complete
    await waitFor(() => {
      expect(mockOnImageChange).toHaveBeenCalledWith('/uploads/new-uploaded-photo.jpg');
    });

    // FIX VERIFICATION: The image src should now show the new photo immediately
    // This should work now because we're using local state in the component
    const updatedImage = screen.getByTestId('property-image');
    expect(updatedImage).toHaveAttribute('src', '/uploads/new-uploaded-photo.jpg');
    
    // Button text should still say "Replace Photo"
    expect(screen.getByText('Replace Photo')).toBeInTheDocument();
  });

  it('should update display immediately after removing photo', () => {
    render(
      <PropertyPhotoUpload 
        currentImageUrl="/uploads/original-photo.jpg"
        onImageChange={mockOnImageChange}
      />
    );

    // Verify image is displayed
    expect(screen.getByTestId('property-image')).toBeInTheDocument();
    expect(screen.getByTestId('property-image')).toHaveAttribute('src', '/uploads/original-photo.jpg');

    // Remove photo
    const removeButton = screen.getByTestId('remove-photo-btn');
    fireEvent.click(removeButton);

    // Image should disappear immediately
    expect(screen.queryByTestId('property-image')).not.toBeInTheDocument();
    
    // Should show placeholder now
    expect(screen.getByTestId('no-image-placeholder')).toBeInTheDocument();
    
    // Button should say "Upload Photo" now
    expect(screen.getByText('Upload Photo')).toBeInTheDocument();
    
    // Callback should be called
    expect(mockOnImageChange).toHaveBeenCalledWith(null);
  });

  it('should sync with prop changes from parent (external updates)', () => {
    // Test that external prop changes still update the display
    const { rerender } = render(
      <PropertyPhotoUpload 
        currentImageUrl="/uploads/original-photo.jpg"
        onImageChange={mockOnImageChange}
      />
    );

    // Original image displayed
    expect(screen.getByTestId('property-image')).toHaveAttribute('src', '/uploads/original-photo.jpg');

    // Parent component updates the prop
    rerender(
      <PropertyPhotoUpload 
        currentImageUrl="/uploads/external-update-photo.jpg"
        onImageChange={mockOnImageChange}
      />
    );

    // Should sync with new prop value
    expect(screen.getByTestId('property-image')).toHaveAttribute('src', '/uploads/external-update-photo.jpg');
  });

  it('should handle upload failure gracefully without affecting display', async () => {
    // Mock upload failure
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({
        error: 'Upload failed'
      })
    });

    render(
      <PropertyPhotoUpload 
        currentImageUrl="/uploads/original-photo.jpg"
        onImageChange={mockOnImageChange}
      />
    );

    // Verify original image
    expect(screen.getByTestId('property-image')).toHaveAttribute('src', '/uploads/original-photo.jpg');

    // Try to upload
    const replaceButton = screen.getByTestId('upload-photo-btn');
    fireEvent.click(replaceButton);

    const fileInput = screen.getByTestId('upload-file-input') as HTMLInputElement;
    const photoFile = new File(['photo data'], 'photo.jpg', { type: 'image/jpeg' });
    
    Object.defineProperty(fileInput, 'files', {
      value: [photoFile],
      writable: false
    });

    fireEvent.change(fileInput);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByTestId('upload-error')).toBeInTheDocument();
    });

    // Original image should still be displayed (no change on error)
    expect(screen.getByTestId('property-image')).toHaveAttribute('src', '/uploads/original-photo.jpg');
    
    // Callback should NOT be called on error
    expect(mockOnImageChange).not.toHaveBeenCalled();
  });

  it('should work correctly when starting with no image', async () => {
    // Mock successful upload
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        files: [{
          filepath: '/uploads/first-photo.jpg',
          filename: 'first-photo.jpg',
          size: 98765
        }]
      })
    });

    render(
      <PropertyPhotoUpload 
        onImageChange={mockOnImageChange}
      />
    );

    // Should show placeholder initially
    expect(screen.getByTestId('no-image-placeholder')).toBeInTheDocument();
    expect(screen.getByText('Upload Photo')).toBeInTheDocument();
    expect(screen.queryByTestId('property-image')).not.toBeInTheDocument();

    // Upload first photo
    const uploadButton = screen.getByTestId('upload-photo-btn');
    fireEvent.click(uploadButton);

    const fileInput = screen.getByTestId('upload-file-input') as HTMLInputElement;
    const photoFile = new File(['first photo data'], 'first-photo.jpg', { type: 'image/jpeg' });
    
    Object.defineProperty(fileInput, 'files', {
      value: [photoFile],
      writable: false
    });

    fireEvent.change(fileInput);

    // Wait for upload to complete
    await waitFor(() => {
      expect(mockOnImageChange).toHaveBeenCalledWith('/uploads/first-photo.jpg');
    });

    // Image should now be displayed
    expect(screen.getByTestId('property-image')).toBeInTheDocument();
    expect(screen.getByTestId('property-image')).toHaveAttribute('src', '/uploads/first-photo.jpg');
    
    // Button should say "Replace Photo" now
    expect(screen.getByText('Replace Photo')).toBeInTheDocument();
    
    // Placeholder should be gone
    expect(screen.queryByTestId('no-image-placeholder')).not.toBeInTheDocument();
  });
});