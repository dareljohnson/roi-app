import { render, screen, waitFor, act } from '@testing-library/react';
import AdminWiki from '@/app/admin/AdminWiki';

// Mock fetch for documentation entries
beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({
        entries: [
          {
            id: '1',
            title: 'Test Entry',
            content: 'Test content',
            tags: ['test', 'example'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            author: { id: 'u1', name: 'Admin', email: 'admin@example.com' },
          },
        ],
        total: 1
      }),
    })
  ) as jest.Mock;
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('AdminWiki', () => {
  it('shows Table of Contents for long entries with headings', async () => {
    const entryWithHeadings = {
      id: '2',
      title: 'Long Entry',
      content: '# Introduction\nSome intro text\n## Details\nMore details here\n### Subsection\nEven more details\n# Conclusion\nSummary',
      tags: ['long', 'toc'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: { id: 'u2', name: 'Admin', email: 'admin@example.com' },
    };
    global.fetch = jest.fn((url) => {
      if (typeof url === 'string' && url.startsWith('/api/admin/documentation')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ entries: [entryWithHeadings], total: 1 }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    }) as jest.Mock;
    render(<AdminWiki />);
    await waitFor(() => expect(screen.getByText('Long Entry')).toBeInTheDocument());
    // Expand the entry
    await act(async () => {
      screen.getByText('Long Entry').click();
    });
    await waitFor(() => expect(screen.getByText('Table of Contents')).toBeInTheDocument());
  // Check TOC links (should be anchor tags)
  const tocLinks = screen.getAllByText('Introduction');
  // One should be the TOC link (an <a>), one the heading (<h1>)
  expect(tocLinks.some(el => el.closest('a'))).toBe(true);
  expect(tocLinks.some(el => el.closest('h1'))).toBe(true);
  // Repeat for other headings
  expect(screen.getAllByText('Details').some(el => el.closest('a'))).toBe(true);
  expect(screen.getAllByText('Details').some(el => el.closest('h2'))).toBe(true);
  expect(screen.getAllByText('Subsection').some(el => el.closest('a'))).toBe(true);
  expect(screen.getAllByText('Subsection').some(el => el.closest('h3'))).toBe(true);
  expect(screen.getAllByText('Conclusion').some(el => el.closest('a'))).toBe(true);
  expect(screen.getAllByText('Conclusion').some(el => el.closest('h1'))).toBe(true);
  // Check anchor href
  const detailsTocLink = screen.getAllByText('Details').find(el => el.closest('a'));
  expect(detailsTocLink?.closest('a')).toHaveAttribute('href', '#details');
  // Check heading anchors rendered in content
  const detailsHeading = screen.getAllByText('Details').find(el => el.closest('h2'));
  expect(detailsHeading?.closest('h2')).toBeInTheDocument();
  });
  it('renders documentation entries', async () => {
    global.fetch = jest.fn((url) => {
      if (typeof url === 'string' && url.startsWith('/api/admin/documentation')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            entries: [
              {
                id: '1',
                title: 'Test Entry',
                content: 'Test content',
                tags: ['test', 'example'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                author: { id: 'u1', name: 'Admin', email: 'admin@example.com' },
              },
            ],
            total: 1
          }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    }) as jest.Mock;
    render(<AdminWiki />);
    await waitFor(() => expect(screen.getByText('Test Entry')).toBeInTheDocument());
    expect(screen.getByText('test, example')).toBeInTheDocument();
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(1);
    expect(rows[1]).toHaveTextContent('Test Entry');
    expect(rows[1]).toHaveTextContent('test, example');
  });

  it('shows loading state', () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));
    render(<AdminWiki />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows empty state', async () => {
    global.fetch = jest.fn((url) => {
      if (typeof url === 'string' && url.startsWith('/api/admin/documentation')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ entries: [], total: 0 }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    }) as jest.Mock;
    render(<AdminWiki />);
    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBe(2); // 1 header row + 1 empty state row
      expect(rows[1]).toHaveTextContent('No entries found');
    });
  });

    afterEach(() => {
      jest.resetAllMocks();
    });

    describe('AdminWiki pagination', () => {
      function makeEntries(count: number) {
        return Array.from({ length: count }, (_, i) => ({
          id: String(i + 1),
          title: `Entry ${i + 1}`,
          content: `Content ${i + 1}`,
          tags: ['tag1', 'tag2'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          author: { id: 'u1', name: 'Admin', email: 'admin@example.com' },
        }));
      }

      it('shows only the first page of entries and paginates', async () => {
        const entries = makeEntries(25);
        (global.fetch as jest.Mock).mockImplementation((url) => {
          const match = typeof url === 'string' && url.match(/offset=(\d+)/);
          const offset = match ? parseInt(match[1], 10) : 0;
          let pageEntries: any[];
          if (offset === 0) pageEntries = entries.slice(0, 10);
          else if (offset === 10) pageEntries = entries.slice(10, 20);
          else if (offset === 20) pageEntries = entries.slice(20, 25);
          else pageEntries = [];
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ entries: pageEntries, total: 25, limit: 10, offset }),
          });
        });
        render(<AdminWiki />);
        // Wait for first page
        await waitFor(() => expect(screen.getByText('Entry 1')).toBeInTheDocument());
        for (let i = 1; i <= 10; i++) {
          expect(screen.getByText(`Entry ${i}`)).toBeInTheDocument();
        }
        expect(screen.queryByText('Entry 11')).not.toBeInTheDocument();
        expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument();
        // Go to next page
        await act(async () => {
          screen.getByText('Next').click();
        });
        await waitFor(() => expect(screen.getByText('Entry 11')).toBeInTheDocument());
        for (let i = 11; i <= 20; i++) {
          expect(screen.getByText(`Entry ${i}`)).toBeInTheDocument();
        }
        expect(screen.queryByText('Entry 10')).not.toBeInTheDocument();
        expect(screen.getByText(/Page 2 of 3/)).toBeInTheDocument();
        // Go to last page
        await act(async () => {
          screen.getByText('Next').click();
        });
        await waitFor(() => expect(screen.getByText('Entry 21')).toBeInTheDocument());
        for (let i = 21; i <= 25; i++) {
          expect(screen.getByText(`Entry ${i}`)).toBeInTheDocument();
        }
        expect(screen.queryByText('Entry 20')).not.toBeInTheDocument();
        expect(screen.getByText(/Page 3 of 3/)).toBeInTheDocument();
        // Previous page
        await act(async () => {
          screen.getByText('Prev').click();
        });
        await waitFor(() => expect(screen.getByText('Entry 11')).toBeInTheDocument());
        expect(screen.getByText(/Page 2 of 3/)).toBeInTheDocument();
      });

      it('disables Previous on first page and Next on last page', async () => {
        const entries = makeEntries(25);
        (global.fetch as jest.Mock).mockImplementation((url) => {
          const match = typeof url === 'string' && url.match(/offset=(\d+)/);
          const offset = match ? parseInt(match[1], 10) : 0;
          let pageEntries: any[];
          if (offset === 0) pageEntries = entries.slice(0, 10);
          else if (offset === 10) pageEntries = entries.slice(10, 20);
          else if (offset === 20) pageEntries = entries.slice(20, 25);
          else pageEntries = [];
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ entries: pageEntries, total: 25, limit: 10, offset }),
          });
        });
        render(<AdminWiki />);
        await waitFor(() => expect(screen.getByText('Entry 1')).toBeInTheDocument());
        expect(screen.getByText('Prev')).toBeDisabled();
        // Go to last page
        await act(async () => {
          screen.getByText('Next').click(); // page 2
        });
        await waitFor(() => expect(screen.getByText('Entry 11')).toBeInTheDocument());
        await act(async () => {
          screen.getByText('Next').click(); // page 3
        });
        await waitFor(() => expect(screen.getByText('Entry 25')).toBeInTheDocument());
        expect(screen.getByText('Next')).toBeDisabled();
      });
    });
});
