import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminUserTable from '@/components/admin/AdminUserTable';

describe('AdminUserTable', () => {
  const users = [
    {
      id: '1',
      email: 'user1@example.com',
      name: 'User One',
      role: 'USER',
      lastLogin: null,
      lastIp: null,
      active: true,
      properties: [],
    },
    {
      id: '2',
      email: 'user2@example.com',
      name: 'User Two',
      role: 'USER',
      lastLogin: null,
      lastIp: null,
      active: false,
      properties: [],
    },
  ];

  it('renders user active status and action button', () => {
    render(<AdminUserTable users={users} total={2} pageSize={20} />);
    // There is a header cell with 'Active', so check for at least one badge
    expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
    expect(screen.getByText('Inactive')).toBeInTheDocument();
    expect(screen.getByText('Deactivate')).toBeInTheDocument();
    expect(screen.getByText('Activate')).toBeInTheDocument();
  });

  it('calls API and updates status on button click', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: '1', active: false }),
    });
    render(<AdminUserTable users={users} total={2} pageSize={20} />);
    const deactivateBtn = screen.getByText('Deactivate');
    fireEvent.click(deactivateBtn);
    await waitFor(() => expect(screen.getAllByText('Inactive').length).toBeGreaterThan(0));
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/user/1/toggle-active', { method: 'PATCH' });
  });
});
