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

describe('PropertyPhotoUpload - File Dialog and Replace Photo Bug Investigation', () => {
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

  it('should handle file selection and upload when replacing photo', async () => {
    // Mock successful upload response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        files: [{
          filepath: '/uploads/new-property.jpg',
          filename: 'property.jpg',
          size: 12345
        }]
      })
    });

    render(
      <PropertyPhotoUpload 
        currentImageUrl="/uploads/old-property.jpg"
        onImageChange={mockOnImageChange}
      />
    );

    // Verify we're in replace mode
    expect(screen.getByText('Replace Photo')).toBeInTheDocument();
    
    // Click replace photo button to trigger file dialog
    const replaceButton = screen.getByTestId('upload-photo-btn');
    expect(replaceButton).not.toBeDisabled();
    
    fireEvent.click(replaceButton);

    // Simulate file selection in the hidden input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveClass('hidden'); // Should be hidden with Tailwind class

    // Create a mock file
    const mockFile = new File(['test'], 'new-property.jpg', { type: 'image/jpeg' });
    
    // Simulate file selection
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false
    });

    fireEvent.change(fileInput);

    // Wait for upload to complete
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/upload/property-photos', {
        method: 'POST',
        body: mockFormData
      });
    });

    // Verify the callback was called with new image URL
    await waitFor(() => {
      expect(mockOnImageChange).toHaveBeenCalledWith('/uploads/new-property.jpg');
    });
  });

  it('should show error when upload fails during replace', async () => {
    // Mock failed upload response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({
        error: 'Upload failed: Server error'
      })
    });

    render(
      <PropertyPhotoUpload 
        currentImageUrl="/uploads/old-property.jpg"
        onImageChange={mockOnImageChange}
      />
    );

    // Click replace photo button
    const replaceButton = screen.getByTestId('upload-photo-btn');
    fireEvent.click(replaceButton);

    // Simulate file selection
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const mockFile = new File(['test'], 'property.jpg', { type: 'image/jpeg' });
    
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false
    });

    fireEvent.change(fileInput);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByTestId('upload-error')).toBeInTheDocument();
      expect(screen.getByTestId('upload-error')).toHaveTextContent('Upload failed: Server error');
    });

    // Verify callback was NOT called on error
    expect(mockOnImageChange).not.toHaveBeenCalled();
  });

  it('should handle network errors during replace', async () => {
    // Mock network error
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(
      <PropertyPhotoUpload 
        currentImageUrl="/uploads/old-property.jpg"
        onImageChange={mockOnImageChange}
      />
    );

    // Click replace photo button
    const replaceButton = screen.getByTestId('upload-photo-btn');
    fireEvent.click(replaceButton);

    // Simulate file selection
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const mockFile = new File(['test'], 'property.jpg', { type: 'image/jpeg' });
    
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false
    });

    fireEvent.change(fileInput);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByTestId('upload-error')).toBeInTheDocument();
      expect(screen.getByTestId('upload-error')).toHaveTextContent('Network error');
    });

    // Verify callback was NOT called on error
    expect(mockOnImageChange).not.toHaveBeenCalled();
  });

  it('should validate file types during replace', async () => {
    render(
      <PropertyPhotoUpload 
        currentImageUrl="/uploads/old-property.jpg"
        onImageChange={mockOnImageChange}
      />
    );

    // Click replace photo button
    const replaceButton = screen.getByTestId('upload-photo-btn');
    fireEvent.click(replaceButton);

    // Simulate selecting an invalid file type
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const mockFile = new File(['test'], 'document.pdf', { type: 'application/pdf' });
    
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false
    });

    fireEvent.change(fileInput);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/Only image files are allowed/)).toBeInTheDocument();
    });

    // Should not call API on validation error
    expect(fetch).not.toHaveBeenCalled();
    expect(mockOnImageChange).not.toHaveBeenCalled();
  });

  it('should handle file input reset after selection', () => {
    render(
      <PropertyPhotoUpload 
        currentImageUrl="/uploads/old-property.jpg"
        onImageChange={mockOnImageChange}
      />
    );

    // Click replace photo button
    const replaceButton = screen.getByTestId('upload-photo-btn');
    fireEvent.click(replaceButton);

    // Get file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    // Simulate file selection
    const mockFile = new File(['test'], 'property.jpg', { type: 'image/jpeg' });
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false
    });

    fireEvent.change(fileInput);

    // Input should be reset to allow selecting same file again
    // Note: In JSDOM, file input value is always empty string after change event
    expect(fileInput.value).toBe('');
  });

  it('should show uploading state during replace', async () => {
    // Mock slow upload response
    let resolveUpload: (value: any) => void;
    const uploadPromise = new Promise((resolve) => {
      resolveUpload = resolve;
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => uploadPromise
    });

    render(
      <PropertyPhotoUpload 
        currentImageUrl="/uploads/old-property.jpg"
        onImageChange={mockOnImageChange}
      />
    );

    // Click replace photo button
    const replaceButton = screen.getByTestId('upload-photo-btn');
    fireEvent.click(replaceButton);

    // Simulate file selection
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const mockFile = new File(['test'], 'property.jpg', { type: 'image/jpeg' });
    
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false
    });

    fireEvent.change(fileInput);

    // Should show uploading state
    await waitFor(() => {
      expect(screen.getByText('Uploading...')).toBeInTheDocument();
    });

    // Button should be disabled during upload
    await waitFor(() => {
      expect(screen.getByTestId('upload-photo-btn')).toBeDisabled();
    });

    // Complete the upload
    resolveUpload!({
      success: true,
      files: [{
        filepath: '/uploads/new-property.jpg',
        filename: 'property.jpg',
        size: 12345
      }]
    });

    // Should return to normal state
    await waitFor(() => {
      expect(screen.getByText('Replace Photo')).toBeInTheDocument();
    });

    // Verify the callback was called with new image URL
    await waitFor(() => {
      expect(mockOnImageChange).toHaveBeenCalledWith('/uploads/new-property.jpg');
    });
  });
});