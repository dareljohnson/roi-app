
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import PropertiesPage from '@/app/properties/page'
import Providers from '@/components/Providers'
import React from 'react'

// Mock next/router
jest.mock('next/router', () => ({ useRouter: () => ({ push: jest.fn() }) }))

// Mock fetch
global.fetch = jest.fn()

describe('Property Archive UI', () => {
  it('should show an Archived badge and faded style for archived properties', async () => {
    const mockArchivedProperties = {
      success: true,
      analyses: [
        {
          id: 'prop-archived',
          address: '789 Old St',
          propertyType: 'Townhouse',
          purchasePrice: 200000,
          createdAt: '2023-01-01T00:00:00.000Z',
          archived: true,
          analysis: null,
        },
      ],
      total: 1,
    };
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/properties?archived=true')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockArchivedProperties,
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, analyses: [], total: 0 }),
      });
    });
    renderWithProviders(<PropertiesPage />);
    // Simulate clicking the archive toggle to show archived
    await waitFor(() => {
      expect(screen.getByTitle('Show archived properties')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTitle('Show archived properties'));
    // Badge should appear
    await waitFor(() => {
      expect(screen.getByTestId('archived-badge')).toBeInTheDocument();
      // Card should have faded style
      const card = screen.getByText('789 Old St').closest('.hover\\:shadow-md');
      expect(card).toHaveClass('opacity-60');
    });
  });
  beforeEach(() => {
    jest.resetAllMocks();
    // Default mock response - empty properties array
    (global.fetch as jest.Mock).mockImplementation((url) => {
      // Return empty for any call unless overridden in test
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, analyses: [], total: 0 }),
      });
    });
  });

  const renderWithProviders = (component: React.ReactNode) => {
    return render(<Providers>{component}</Providers>)
  }

  it('should show an Archived badge and faded style for archived properties', async () => {
    const mockArchivedProperties = {
      success: true,
      analyses: [
        {
          id: 'prop-archived',
          address: '789 Old St',
          propertyType: 'Townhouse',
          purchasePrice: 200000,
          createdAt: '2023-01-01T00:00:00.000Z',
          archived: true,
          analysis: null,
        },
      ],
      total: 1,
    };
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/properties?archived=true')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockArchivedProperties,
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, analyses: [], total: 0 }),
      });
    });
    renderWithProviders(<PropertiesPage />);
    // Simulate clicking the archive toggle to show archived
    await waitFor(() => {
      expect(screen.getByTitle('Show archived properties')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTitle('Show archived properties'));
    // Badge should appear
    await waitFor(() => {
      expect(screen.getByTestId('archived-badge')).toBeInTheDocument();
      // Card should have faded style
      const card = screen.getByText('789 Old St').closest('.hover\\:shadow-md');
      expect(card).toHaveClass('opacity-60');
    });
  });

  describe('Archive/Unarchive Buttons', () => {
    it('should show archive button for active properties', async () => {
      const mockProperties = {
        success: true,
        analyses: [
          {
            id: 'prop-1',
            address: '123 Test St',
            propertyType: 'Single Family',
            purchasePrice: 250000,
            createdAt: '2023-01-01T00:00:00.000Z',
            archived: false,
            analysis: {
              id: 'analysis-1',
              roi: 0.15,
              monthlyCashFlow: 500,
              recommendation: 'BUY',
              recommendationScore: 85,
              createdAt: '2023-01-01T00:00:00.000Z',
            },
          },
        ],
        total: 1,
      };
      (global.fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes('/api/properties?archived=false')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockProperties,
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, analyses: [], total: 0 }),
        });
      });
      renderWithProviders(<PropertiesPage />);
      await waitFor(() => {
        expect(screen.getByTitle('Archive property')).toBeInTheDocument();
      });
    });

    it('should show unarchive button for archived properties when viewing archived', async () => {
      const mockArchivedProperties = {
        success: true,
        analyses: [
          {
            id: 'prop-1',
            address: '123 Test St',
            propertyType: 'Single Family',
            purchasePrice: 250000,
            createdAt: '2023-01-01T00:00:00.000Z',
            archived: true,
            analysis: {
              id: 'analysis-1',
              roi: 0.15,
              monthlyCashFlow: 500,
              recommendation: 'BUY',
              recommendationScore: 85,
              createdAt: '2023-01-01T00:00:00.000Z',
            },
          },
        ],
        total: 1,
      };
      (global.fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes('/api/properties?archived=true')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockArchivedProperties,
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, analyses: [], total: 0 }),
        });
      });
      // Set showArchived to true by default for this test
      renderWithProviders(<PropertiesPage />);
      // Simulate clicking the archive toggle to show archived
      await waitFor(() => {
        expect(screen.getByTitle('Show archived properties')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTitle('Show archived properties'));
      await waitFor(() => {
        expect(screen.getByTitle('Unarchive property')).toBeInTheDocument();
      });
    });

    it('should call archive API when archive button is clicked', async () => {
      const mockProperties = {
        success: true,
        analyses: [
          {
            id: 'prop-1',
            address: '123 Test St',
            propertyType: 'Single Family',
            purchasePrice: 250000,
            createdAt: '2023-01-01T00:00:00.000Z',
            archived: false,
            analysis: {
              id: 'analysis-1',
              roi: 0.15,
              monthlyCashFlow: 500,
              recommendation: 'BUY',
              recommendationScore: 85,
              createdAt: '2023-01-01T00:00:00.000Z',
            },
          },
        ],
        total: 1,
      };
      (global.fetch as jest.Mock).mockImplementation((url, options) => {
        if (url.includes('/api/properties?archived=false')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockProperties,
          });
        }
        if (url.includes('/api/properties/prop-1/archive')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              message: 'Property archived successfully',
              property: { id: 'prop-1', address: '123 Test St', archived: true },
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, analyses: [], total: 0 }),
        });
      });
      renderWithProviders(<PropertiesPage />);
      await waitFor(() => {
        expect(screen.getByTitle('Archive property')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTitle('Archive property'));
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/properties/prop-1/archive', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ archived: true }),
        });
      });
    });

    it('should call unarchive API when unarchive button is clicked', async () => {
      const mockArchivedProperties = {
        success: true,
        analyses: [
          {
            id: 'prop-2',
            address: '456 Archived St',
            propertyType: 'Condo',
            purchasePrice: 180000,
            createdAt: '2023-01-01T00:00:00.000Z',
            archived: true,
            analysis: {
              id: 'analysis-2',
              roi: 0.12,
              monthlyCashFlow: 300,
              recommendation: 'HOLD',
              recommendationScore: 70,
              createdAt: '2023-01-01T00:00:00.000Z',
            },
          },
        ],
        total: 1,
      };
      (global.fetch as jest.Mock).mockImplementation((url, options) => {
        if (url.includes('/api/properties?archived=true')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockArchivedProperties,
          });
        }
        if (url.includes('/api/properties/prop-2/archive')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              message: 'Property unarchived successfully',
              property: { id: 'prop-2', address: '456 Archived St', archived: false },
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, analyses: [], total: 0 }),
        });
      });
      renderWithProviders(<PropertiesPage />);
      // Simulate clicking the archive toggle to show archived
      await waitFor(() => {
        expect(screen.getByTitle('Show archived properties')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTitle('Show archived properties'));
      await waitFor(() => {
        expect(screen.getByTitle('Unarchive property')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTitle('Unarchive property'));
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/properties/prop-2/archive', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ archived: false }),
        });
      });
    });
  })

  describe('Archive Filter Toggle', () => {
    it('should show archive filter toggle', async () => {
      const mockProperties = {
        success: true,
        analyses: [],
        total: 0,
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProperties,
      })

      renderWithProviders(<PropertiesPage />)

      await waitFor(() => {
        expect(screen.getByText('Show Archived')).toBeInTheDocument()
      })
    })

    it('should toggle to show archived properties when clicked', async () => {
      const mockActiveProperties = {
        success: true,
        analyses: [
          {
            id: 'prop-1',
            address: '123 Active St',
            propertyType: 'Single Family',
            purchasePrice: 250000,
            createdAt: '2023-01-01T00:00:00.000Z',
            archived: false,
            analysis: {
              id: 'analysis-1',
              roi: 0.15,
              monthlyCashFlow: 500,
              recommendation: 'BUY',
              recommendationScore: 85,
              createdAt: '2023-01-01T00:00:00.000Z',
            },
          },
        ],
        total: 1,
      };
      const mockArchivedProperties = {
        success: true,
        analyses: [
          {
            id: 'prop-2',
            address: '456 Archived St',
            propertyType: 'Condo',
            purchasePrice: 180000,
            createdAt: '2023-01-01T00:00:00.000Z',
            archived: true,
            analysis: {
              id: 'analysis-2',
              roi: 0.12,
              monthlyCashFlow: 300,
              recommendation: 'HOLD',
              recommendationScore: 70,
              createdAt: '2023-01-01T00:00:00.000Z',
            },
          },
        ],
        total: 1,
      };
      (global.fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes('/api/properties?archived=false')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockActiveProperties,
          });
        }
        if (url.includes('/api/properties?archived=true')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockArchivedProperties,
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, analyses: [], total: 0 }),
        });
      });
      renderWithProviders(<PropertiesPage />);
      // Initially should show active properties
      await waitFor(() => {
        expect(screen.getByText('123 Active St')).toBeInTheDocument();
      });
      // Click show archived toggle
      fireEvent.click(screen.getByText('Show Archived'));
      // Should now show archived properties
      await waitFor(() => {
        expect(screen.getByText('456 Archived St')).toBeInTheDocument();
      });
    });
  })
})