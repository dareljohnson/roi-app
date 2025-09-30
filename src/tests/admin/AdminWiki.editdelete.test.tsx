import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act, waitForElementToBeRemoved } from '@testing-library/react';
import AdminWiki from '@/app/admin/AdminWiki';

describe('AdminWiki (edit/delete)', () => {
  let state = 'initial';

  let entry = {
    id: '1',
    title: 'Test Entry',
    content: 'Test content',
    tags: ['test', 'example'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    author: { id: 'u1', name: 'Admin', email: 'admin@example.com' },
  };
  // Remove old global.fetch assignment. Only use per-test fetch mocks.

  afterEach(() => {
    jest.resetAllMocks();
    state = 'initial';
  });

  it('allows admin to edit an entry', async () => {
    // Mock fetch for initial wiki entries
    (global.fetch as any) = jest.fn(async (url: any, opts?: any) => {
      const makeResponse = (bodyObj: { entries?: any[]; total?: number; }) => ({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: { get: () => null },
        redirected: false,
        type: 'basic',
        url: typeof url === 'string' ? url : '',
        clone: () => this,
        body: null,
        bodyUsed: false,
        arrayBuffer: async () => new ArrayBuffer(0),
        blob: async () => new Blob(),
        formData: async () => new FormData(),
        text: async () => JSON.stringify(bodyObj),
        json: async () => bodyObj,
      });
      if (typeof url === 'string' && url.includes('/api/admin/documentation')) {
        if (!opts || opts.method === 'GET') {
          return Promise.resolve(makeResponse({ entries: [entry], total: 1 }));
        }
        if (opts && (opts.method === 'PUT' || opts.method === 'PATCH')) {
          // Simulate update
          entry = { ...entry, title: 'Edited Entry', content: 'Edited content', tags: ['edited'] };
          return Promise.resolve(makeResponse({}));
        }
      }
      return Promise.resolve(makeResponse({}));
    });
    render(<AdminWiki />);
    await waitFor(() => expect(screen.getByText('Test Entry')).toBeInTheDocument());
    // Find the Edit button in the table row for 'Test Entry'
    const row = screen.getByText('Test Entry').closest('tr');
    const editBtn = row?.querySelector('button.btn-info');
    if (!editBtn) throw new Error('Edit button not found');
    fireEvent.click(editBtn as HTMLButtonElement);
    // Wait for modal to appear
    await waitFor(() => expect(screen.getByText(/Add New Entry|Edit Entry/i)).toBeInTheDocument());
    // Fill out form
    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'Edited Entry' } });
    fireEvent.change(screen.getByLabelText(/Content/i), { target: { value: 'Edited content' } });
    fireEvent.change(screen.getByLabelText(/Tags/i), { target: { value: 'edited' } });
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(screen.getByText('Edited Entry')).toBeInTheDocument());
    // Find all elements with text 'edited' and check at least one is in a table cell
    const editedCells = screen.getAllByText('edited');
    expect(editedCells.some(el => el.tagName === 'TD')).toBe(true);
  });

  it('allows admin to delete an entry', async () => {
    jest.resetAllMocks();
    let entries = [{
      id: '1',
      title: 'Test Entry',
      content: 'Test content',
      tags: ['test', 'example'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }];
    (global.fetch as any) = jest.fn(async (url: any, opts?: any) => {
      // Debug: log all fetch calls
      // eslint-disable-next-line no-console
      console.log('fetch called:', url, opts ? opts.method : 'GET');
      const makeResponse = (bodyObj: { entries?: any[]; total?: number; }) => ({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: { get: () => null },
        redirected: false,
        type: 'basic',
        url: typeof url === 'string' ? url : '',
        clone: () => this,
        body: null,
        bodyUsed: false,
        arrayBuffer: async () => new ArrayBuffer(0),
        blob: async () => new Blob(),
        formData: async () => new FormData(),
        text: async () => JSON.stringify(bodyObj),
        json: async () => bodyObj,
      });
      // Match GET for entries (with or without query params)
      if (typeof url === 'string' && url.match(/\/api\/admin\/documentation(\?.*)?$/) && (!opts || opts.method === 'GET')) {
        return Promise.resolve(makeResponse({ entries, total: entries.length }));
      }
      // Match DELETE for entry
      if (typeof url === 'string' && url.match(/\/api\/admin\/documentation\/1$/) && opts && opts.method === 'DELETE') {
        entries = [];
        // eslint-disable-next-line no-console
        console.log('DELETE request handled for', url);
        return Promise.resolve(makeResponse({}));
      }
      // fallback
      return Promise.resolve(makeResponse({ entries, total: entries.length }));
    });
    render(<AdminWiki />);
    await waitFor(() => expect(screen.getAllByText('Test Entry').length).toBeGreaterThan(0));
    // Find the Delete button in the table row for 'Test Entry'
    const row = screen.getAllByText('Test Entry')[0].closest('tr');
    const deleteBtn = row?.querySelector('button.btn-error');
    // Debug: log delete button presence
    // eslint-disable-next-line no-console
    console.log('Delete button found:', !!deleteBtn);
    expect(deleteBtn).toBeTruthy();
    // Click delete button to open modal
    await act(async () => {
      await userEvent.click(deleteBtn as HTMLButtonElement);
    });
    // Wait for modal to appear
    await waitFor(() => expect(screen.getByText('Delete Wiki Entry')).toBeInTheDocument());
    // Find all 'Delete' buttons and select the modal confirm button by class
    const deleteButtons = screen.getAllByRole('button', { name: /^Delete$/ });
    const modalDeleteBtn = deleteButtons.find(btn => btn.className.includes('btn-error') && !btn.className.includes('btn-xs'));
    // Debug: log confirm button presence
    // eslint-disable-next-line no-console
    console.log('Confirm delete button found:', !!modalDeleteBtn);
    expect(modalDeleteBtn).toBeTruthy();
    // Click confirm delete button
    await act(async () => {
      await userEvent.click(modalDeleteBtn as HTMLButtonElement);
    });
    // Wait for 'Test Entry' to be removed from the document
    await waitFor(() => {
      expect(screen.queryByText('Test Entry')).toBeNull();
    }, { timeout: 10000 });
  });
});
