import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminWiki from '@/app/admin/AdminWiki';

beforeEach(() => {
  let entries = [
    {
      id: '1',
      title: 'Test Entry',
      content: 'Test content',
      tags: ['test', 'example'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: { id: 'u1', name: 'Admin', email: 'admin@example.com' },
    },
  ];
  global.fetch = jest.fn((url, options) => {
    if (options && options.method === 'POST') {
      entries = [
        {
          id: '2',
          title: 'New Entry',
          content: 'New content',
          tags: ['added'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          author: { id: 'u1', name: 'Admin', email: 'admin@example.com' },
        },
        ...entries,
      ];
      return Promise.resolve({ ok: true, json: () => Promise.resolve(entries[0]) }) as any;
    }
    // GET
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ entries, totalCount: entries.length }),
    }) as any;
  });
  });

afterEach(() => {
  jest.resetAllMocks();
});

describe('AdminWiki (with add form)', () => {
  it('renders add entry form and adds entry', async () => {
    render(<AdminWiki />);
    // Open the modal first
    fireEvent.click(screen.getByText('Add New'));
    // Wait for modal to appear
    await waitFor(() => expect(screen.getByText(/Add New Entry/i)).toBeInTheDocument());
    // Fill out form in modal
    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'New Entry' } });
    fireEvent.change(screen.getByLabelText(/Content/i), { target: { value: 'New content' } });
    fireEvent.change(screen.getByLabelText(/Tags/i), { target: { value: 'added' } });
    fireEvent.click(screen.getByText('Add'));
    // Debug: log calls to fetch
    // @ts-ignore
    // eslint-disable-next-line no-console
    console.log('fetch mock calls:', global.fetch.mock.calls);
    // Debug: log rendered HTML
    // eslint-disable-next-line no-console
    console.log('Rendered HTML:', document.body.innerHTML);
  // Wait for new entry to appear in the table
  await waitFor(() => expect(screen.getByText('New Entry')).toBeInTheDocument());
  // The table does not display content, only title, tags, created, updated
  // So we check for the title and tags in the table row
  const row = screen.getByText('New Entry').closest('tr');
  expect(row).toBeInTheDocument();
  expect(row).toHaveTextContent('added');
  // Optionally, check that the previous entry is still present
  expect(screen.getByText('Test Entry')).toBeInTheDocument();
  });
});
