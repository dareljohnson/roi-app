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
global.FormData = jest.fn(() => ({
  append: jest.fn(),
  getAll: jest.fn()
})) as any;

// Mock file reading
Object.defineProperty(global, 'FileReader', {
  writable: true,
  value: jest.fn(() => ({
    readAsDataURL: jest.fn(),
    onload: jest.fn(),
    result: 'data:image/jpeg;base64,mock-data'
  }))
});

describe('PropertyPhotoUpload', () => {
  const mockOnImageChange = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({
      data: { user: { email: 'test@example.com' }, expires: '2024-01-01' },
      status: 'authenticated',
      update: jest.fn()
    } as any);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ 
        success: true, 
        files: [{ fileName: 'test.jpg', publicUrl: '/uploads/property/test.jpg' }] 
      })
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders upload component correctly', () => {
    render(
      <PropertyPhotoUpload 
        onImageChange={mockOnImageChange}
      />
    );

    expect(screen.getByTestId('upload-photo-btn')).toBeInTheDocument();
    expect(screen.getByTestId('no-image-placeholder')).toBeInTheDocument();
  });

  it('shows current image when provided', () => {
    render(
      <PropertyPhotoUpload 
        onImageChange={mockOnImageChange}
        currentImageUrl="/test-image.jpg"
      />
    );

    const image = screen.getByTestId('property-image') as HTMLImageElement;
    expect(image.src).toContain('/test-image.jpg');
  });

  it('shows login prompt when not authenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn()
    } as any);

    render(
      <PropertyPhotoUpload 
        onImageChange={mockOnImageChange}
      />
    );

    expect(screen.getByTestId('login-prompt')).toBeInTheDocument();
  });

  it('handles file upload', async () => {
    render(
      <PropertyPhotoUpload 
        onImageChange={mockOnImageChange}
      />
    );

    const fileInput = screen.getByTestId('upload-file-input') as HTMLInputElement;
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
      const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toBe('/api/upload/property-photos');
      expect(options.method).toBe('POST');
      expect(options.body).toBeDefined();
    });
  });

  it('validates file type', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    render(
      <PropertyPhotoUpload 
        onImageChange={mockOnImageChange}
      />
    );

    const fileInput = screen.getByTestId('upload-file-input') as HTMLInputElement;
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Should not attempt upload for invalid file type
    expect(global.fetch).not.toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  it('handles remove photo', () => {
    render(
      <PropertyPhotoUpload 
        onImageChange={mockOnImageChange}
        currentImageUrl="/test-image.jpg"
      />
    );

    const removeButton = screen.getByTestId('remove-photo-btn');
    fireEvent.click(removeButton);
    
    expect(mockOnImageChange).toHaveBeenCalledWith(null);
  });

  it('detects mobile device', () => {
    // Mock mobile user agent
    Object.defineProperty(window.navigator, 'userAgent', {
      writable: true,
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
    });

    render(
      <PropertyPhotoUpload 
        onImageChange={mockOnImageChange}
      />
    );

    // Should show camera option on mobile
    expect(screen.getByTestId('camera-capture-btn')).toBeInTheDocument();
  });
});