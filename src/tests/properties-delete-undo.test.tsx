import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import PropertiesPage from '@/app/properties/page';
import Providers from '@/components/Providers';
import React from 'react';

// Mock next/router
jest.mock('next/router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

// Helper: mock fetch for GET and DELETE
const mockProperties = [
  {
    id: 'prop1',
    address: '123 Main St',
    propertyType: 'Single Family',
    purchasePrice: 100000,
    createdAt: new Date().toISOString(),
    analysis: {
      id: 'an1',
      roi: 10,
      monthlyCashFlow: 200,
      recommendation: 'BUY',
      recommendationScore: 85,
      createdAt: new Date().toISOString(),
    },
    owner: { name: 'Test User', email: 'test@example.com' },
  },
];

beforeEach(() => {
  jest.resetAllMocks();
  let deleted = false;
  global.fetch = jest.fn((url, opts) => {
    if (typeof url === 'string' && url.startsWith('/api/properties') && (!opts || opts.method === 'GET')) {
      // Return property list, minus deleted if needed
      return Promise.resolve({
        json: () => Promise.resolve({ success: true, analyses: deleted ? [] : mockProperties, total: 1 }),
      }) as any;
    }
    if (typeof url === 'string' && url.startsWith('/api/properties/') && opts && opts.method === 'DELETE') {
      deleted = true;
      return Promise.resolve({ json: () => Promise.resolve({ success: true }) }) as any;
    }
    // Fallback
    return Promise.resolve({ json: () => Promise.resolve({ success: true }) }) as any;
  });
});

describe('PropertiesPage Delete/Undo', () => {
  it('shows undo toast and restores property if undo is clicked', async () => {
    render(
      <Providers>
        <PropertiesPage />
      </Providers>
    );

    // Wait for property to load
    expect(await screen.findByText('123 Main St')).toBeInTheDocument();

    // Click delete button
    const deleteBtn = screen.getByTitle('Delete property');
    fireEvent.click(deleteBtn);

    // Modal should appear (confirm dialog)
    // Simulate modal confirm by finding and clicking the confirm button
    // (Assume modal confirm button has text 'Delete' and is not disabled)
    const confirmBtn = await screen.findByRole('button', { name: /^Delete$/i });
    fireEvent.click(confirmBtn);

    // Property should disappear from UI
    await waitFor(() => {
      expect(screen.queryByText('123 Main St')).not.toBeInTheDocument();
    });

    // Undo toast should appear
    expect(screen.getByText(/Property deleted/i)).toBeInTheDocument();
    const undoBtn = screen.getByText(/Undo/i);

    // Click undo
    fireEvent.click(undoBtn);

    // Property should reappear in UI
    expect(await screen.findByText('123 Main St')).toBeInTheDocument();
  });
});
