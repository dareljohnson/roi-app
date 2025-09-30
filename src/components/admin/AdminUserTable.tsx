"use client";
import React, { useState } from "react";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  lastLogin?: string | null;
  lastIp?: string | null;
  active: boolean;
  properties: { id: string; createdAt: string }[];
};

type Props = {
  users: User[];
  total: number;
  pageSize: number;
};

export default function AdminUserTable({ users, total, pageSize }: Props) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const pageCount = Math.ceil(total / pageSize);

  // Filter users by search
  const filteredUsers = search.trim()
    ? users.filter(u => {
        const q = search.toLowerCase();
        return (
          u.email.toLowerCase().includes(q) ||
          (u.name && u.name.toLowerCase().includes(q)) ||
          u.role.toLowerCase().includes(q)
        );
      })
    : users;

  const [userList, setUserList] = useState(users);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleToggleActive = async (userId: string) => {
    setLoadingId(userId);
    try {
      const res = await fetch(`/api/admin/user/${userId}/toggle-active`, { method: 'PATCH' });
      if (res.ok) {
        const data = await res.json();
        setUserList(prev => prev.map(u => u.id === userId ? { ...u, active: data.active } : u));
      }
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search users by email, name, or role..."
          className="border border-gray-300 rounded px-3 py-1 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Search users"
        />
      </div>
      <table className="min-w-full bg-white rounded shadow">
        <thead>
          <tr className="text-left border-b">
            <th className="p-3">Email</th>
            <th className="p-3">Name</th>
            <th className="p-3">Role</th>
            <th className="p-3">Active</th>
            <th className="p-3">Properties</th>
            <th className="p-3">Last Activity</th>
            <th className="p-3">Last Login</th>
            <th className="p-3">Last IP</th>
            <th className="p-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.length === 0 ? (
            <tr>
              <td colSpan={9} className="p-3 text-center text-gray-500">No users found{search ? ' for this search.' : '.'}</td>
            </tr>
          ) : (
            userList.filter(u => {
              const q = search.toLowerCase();
              return (
                u.email.toLowerCase().includes(q) ||
                (u.name && u.name.toLowerCase().includes(q)) ||
                u.role.toLowerCase().includes(q)
              );
            }).map((u) => {
              const last = [...u.properties].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
              return (
                <tr key={u.id} className="border-b">
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{u.name}</td>
                  <td className="p-3">{u.role}</td>
                  <td className="p-3">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${u.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {u.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-3">{u.properties.length}</td>
                  <td className="p-3">{last ? new Date(last.createdAt).toLocaleString() : "—"}</td>
                  <td className="p-3">{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "—"}</td>
                  <td className="p-3">{u.lastIp || "—"}</td>
                  <td className="p-3">
                    <button
                      className={`px-2 py-1 rounded text-xs font-semibold border ${u.active ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-green-500 text-white hover:bg-green-600'} ${loadingId === u.id ? 'opacity-50 cursor-wait' : ''}`}
                      onClick={() => handleToggleActive(u.id)}
                      disabled={loadingId === u.id}
                    >
                      {u.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      <div className="flex justify-center mt-6">
        <nav className="inline-flex rounded-md shadow-sm" aria-label="Pagination">
          <button
            className={`px-3 py-1 border border-gray-300 bg-white text-gray-700 rounded-l-md hover:bg-indigo-50 ${page === 1 ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          {[...Array(pageCount)].map((_, i) => (
            <button
              key={i}
              className={`px-3 py-1 border-t border-b border-gray-300 bg-white text-gray-700 hover:bg-indigo-50 ${page === i + 1 ? "bg-indigo-600 text-white" : ""}`}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button
            className={`px-3 py-1 border border-gray-300 bg-white text-gray-700 rounded-r-md hover:bg-indigo-50 ${page === pageCount ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={page === pageCount}
          >
            Next
          </button>
        </nav>
      </div>
    </div>
  );
}
