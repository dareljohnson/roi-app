/**
 * @jest-environment node
 */

import { join } from 'path';
import { existsSync, readdirSync } from 'fs';

// Mock the upload persistence module to prevent file creation during testing
jest.mock('@/lib/uploadPersistence', () => ({
  saveUploadedFilesDual: jest.fn().mockResolvedValue([
    {
      filename: 'test-prevention.jpg',
      filepath: '/api/uploads/walkthrough-photos/mocked-file.jpg', 
      filesize: 1024,
      mimetype: 'image/jpeg',
    }
  ]),
  PUBLIC_UPLOAD_DIR: 'mocked/path',
  DATA_ROOT: '/mocked/data',
  DATA_UPLOAD_DIR: '/mocked/data/uploads',
}));

describe('Upload Directory File Duplication Prevention', () => {
  const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'walkthrough-photos');
  let initialFileCount: number;

  beforeAll(() => {
    // Record initial file count
    if (existsSync(UPLOAD_DIR)) {
      initialFileCount = readdirSync(UPLOAD_DIR).length;
    } else {
      initialFileCount = 0;
    }
  });

  afterAll(() => {
    // Check that no new files were created during tests
    if (existsSync(UPLOAD_DIR)) {
      const finalFileCount = readdirSync(UPLOAD_DIR).length;
      const newFilesCreated = finalFileCount - initialFileCount;
      
      if (newFilesCreated > 0) {
        const files = readdirSync(UPLOAD_DIR);
        console.warn(`❌ Test created ${newFilesCreated} unexpected files:`, files);
      }
      
      expect(finalFileCount).toBe(initialFileCount);
    }
  });

  it('should not create real files during testing', async () => {
    // Import and test the mocked function
    const { saveUploadedFilesDual } = await import('@/lib/uploadPersistence');
    
    // Create a mock file
    const mockFile = {
      name: 'test-prevention.jpg',
      size: 1024,
      type: 'image/jpeg',
      arrayBuffer: async () => new ArrayBuffer(1024),
      lastModified: Date.now(),
      webkitRelativePath: '',
      slice: () => new Blob(),
    } as File;

    // This should not create real files since the function is mocked
    const result = await saveUploadedFilesDual([mockFile]);
    
    // Verify upload directory file count hasn't changed
    if (existsSync(UPLOAD_DIR)) {
      const currentFileCount = readdirSync(UPLOAD_DIR).length;
      expect(currentFileCount).toBe(initialFileCount);
    }

    // The result should still be valid from the mock
    expect(result).toBeDefined();
  });

  it('should detect when tests accidentally create real files', () => {
    // This test ensures our file count monitoring works
    const warningThreshold = 5; // If more than 5 files get created, it's likely a problem
    
    if (existsSync(UPLOAD_DIR)) {
      const currentFileCount = readdirSync(UPLOAD_DIR).length;
      const delta = currentFileCount - initialFileCount;

      if (delta > warningThreshold) {
        console.warn(`⚠️  ${delta} new files detected in upload directory during tests (initial: ${initialFileCount}, current: ${currentFileCount}). This may indicate test file duplication.`);

        // List the files for debugging
        const files = readdirSync(UPLOAD_DIR);
        console.log('Files in upload directory:', files.slice(0, 10)); // Show first 10 files
      }

      expect(delta).toBeLessThanOrEqual(warningThreshold);
    }
  });
});