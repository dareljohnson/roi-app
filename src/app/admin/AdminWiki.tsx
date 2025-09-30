"use client";
import React, { useEffect, useState } from 'react';
import Modal from '../../components/ui/Modal';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import { saveAs } from 'file-saver';
import { FaPlus, FaFileExport, FaFileImport } from 'react-icons/fa';

interface WikiEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Utility: Parse markdown headings from content
function extractHeadings(content: string): { text: string; level: number; id: string }[] {
  const lines = content.split('\n');
  const headings: { text: string; level: number; id: string }[] = [];
  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      // Generate a slug/id for anchor
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      headings.push({ text, level, id });
    }
  }
  return headings;
}

const PAGE_SIZE = 10;

interface AdminWikiProps {
  isAdmin?: boolean;
}

const AdminWiki: React.FC<AdminWikiProps> = ({ isAdmin: isAdminProp }) => {
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  // Determine admin status from prop or session
  const isAdmin = typeof isAdminProp === 'boolean'
    ? isAdminProp
    : !!session?.user && (session.user as any).role && (session.user as any).role.trim().toLowerCase() === 'admin';

  const toggleExpandEntry = (id: string) => {
    setExpandedEntryId(prev => (prev === id ? null : id));
  };
  const [entries, setEntries] = useState<WikiEntry[]>([]);
  const [search, setSearch] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentEntry, setCurrentEntry] = useState<WikiEntry | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<WikiEntry | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [entryTags, setEntryTags] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchEntries();
    // eslint-disable-next-line
  }, [page, selectedTag]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/documentation?limit=${PAGE_SIZE}&offset=${(page - 1) * PAGE_SIZE}`;
      if (selectedTag) url += `&tag=${encodeURIComponent(selectedTag)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch entries');
      const data = await res.json();
  setEntries(data.entries);
  setTotalCount(data.total);
      // Parse tags from string to array for each entry
      const parsedEntries = data.entries.map((e: any) => ({
        ...e,
        tags: typeof e.tags === 'string' ? e.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : Array.isArray(e.tags) ? e.tags : [],
      }));
      setEntries(parsedEntries);
      // Collect unique tags
      const allTags = new Set<string>();
      parsedEntries.forEach((e: WikiEntry) => e.tags.forEach((t: string) => allTags.add(t)));
      setTags(Array.from(allTags));
    } catch (err: any) {
      toast.error(err.message || 'Error loading entries');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setCurrentEntry(null);
    setTitle('');
    setContent('');
    setEntryTags('');
    setShowModal(true);
  };

  const openEditModal = (entry: WikiEntry) => {
    setModalMode('edit');
    setCurrentEntry(entry);
    setTitle(entry.title);
    setContent(entry.content);
    setEntryTags(entry.tags.join(', '));
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    const payload = {
      title,
      content,
      tags: entryTags.split(',').map(t => t.trim()).filter(Boolean),
    };
    try {
      let res;
      if (modalMode === 'add') {
        res = await fetch('/api/admin/documentation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else if (modalMode === 'edit' && currentEntry) {
        res = await fetch(`/api/admin/documentation/${currentEntry.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: currentEntry.id, ...payload }),
        });
      }
      if (!res?.ok) throw new Error('Failed to save entry');
  toast.success('Entry saved');
  setShowModal(false);
  await fetchEntries();
    } catch (err: any) {
      toast.error(err.message || 'Error saving entry');
    }
  };

  const openDeleteModal = (entry: WikiEntry) => {
    setEntryToDelete(entry);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmed = async () => {
  // Debug: log entryToDelete and function call
  // eslint-disable-next-line no-console
  console.log('handleDeleteConfirmed called', entryToDelete);
    if (!entryToDelete) return;
    try {
      const res = await fetch(`/api/admin/documentation/${entryToDelete.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete entry');
      toast.success('Entry deleted');
      setShowDeleteModal(false);
      setEntryToDelete(null);
      // Ensure React state updates are flushed in tests
      if (typeof window !== 'undefined' && (window as any).IS_REACT_ACT_ENV) {
        const { act } = await import('react-dom/test-utils');
        await act(async () => {
          await fetchEntries();
        });
      } else {
        fetchEntries();
      }
    } catch (err: any) {
      toast.error(err.message || 'Error deleting entry');
      setShowDeleteModal(false);
      setEntryToDelete(null);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const res = await fetch(`/api/admin/documentation/exportimport?format=${format}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      saveAs(blob, `wiki-entries.${format}`);
    } catch (err: any) {
      toast.error(err.message || 'Export error');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/documentation/exportimport', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Import failed');
      toast.success('Import successful');
      fetchEntries();
    } catch (err: any) {
      toast.error(err.message || 'Import error');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Filtered entries by search and tag
  const filteredEntries = entries.filter(entry => {
    const matchesTag = !selectedTag || entry.tags.includes(selectedTag);
    const matchesSearch = !search.trim() ||
      entry.title.toLowerCase().includes(search.trim().toLowerCase()) ||
      entry.content.toLowerCase().includes(search.trim().toLowerCase()) ||
      entry.tags.some(tag => tag.toLowerCase().includes(search.trim().toLowerCase()));
    return matchesTag && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full min-h-screen">
      {/* Top Header */}
      <header className="bg-white border-b shadow flex items-center px-6 py-3 justify-between">
        <div className="flex items-center gap-4">
          {/* Sidebar toggle for mobile */}
          <button className="lg:hidden mr-2 p-2 rounded hover:bg-gray-200" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle sidebar">
            <svg className="h-6 w-6 text-blue-800" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <img src="/wiki_logo.jpg" alt="Wiki Logo" className="h-8 w-8" />
          <span className="text-2xl font-bold text-blue-800">Admin Wiki</span>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search Wiki..."
            className="input input-bordered w-64"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            aria-label="Search Wiki"
          />
          {session?.user && (
            <div className="flex items-center gap-2">
              <span className="font-semibold">{session.user.name}</span>
              <img
                src={
                  (session.user as any)?.role && typeof (session.user as any).role === 'string' && (session.user as any).role.trim().toLowerCase() === 'admin'
                    ? '/Admin.png'
                    : (session.user.image || '/default-avatar.png')
                }
                alt="User"
                className="h-8 w-8 rounded-full border"
              />
            </div>
          )}
        </div>
      </header>
      <div className="flex flex-1 h-full">
        {/* MediaWiki-style Sidebar (collapsible on mobile) */}
        <aside
          className={`w-56 bg-gray-100 p-4 border-r flex flex-col gap-6 min-h-full z-20 fixed lg:static top-0 left-0 h-full transition-transform duration-200 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0 lg:relative lg:block`}
          style={{ maxWidth: '16rem' }}
        >
          {/* Close button for mobile */}
          <button
            className="lg:hidden mb-4 p-2 rounded hover:bg-gray-200 self-end"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <svg className="h-6 w-6 text-blue-800" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          {/* Search Box (removed non-functional sidebar search) */}
          {/* Navigation Section */}
          <nav className="mb-4">
            <div className="font-bold text-gray-700 mb-1">Navigation</div>
            <ul className="space-y-1">
              <li><a href="/admin/documentation" className="text-blue-700 hover:underline">Wiki Home</a></li>
              <li><a href="/admin" className="text-blue-700 hover:underline">Admin Dashboard</a></li>
            </ul>
          </nav>
          {/* Categories Section (placeholder) */}
          <div className="mb-4">
            <div className="font-bold text-gray-700 mb-1">Categories</div>
            <ul className="space-y-1 text-gray-600 text-sm">
              <li className="italic">(Coming soon)</li>
            </ul>
          </div>
          {/* Tag Filter Section */}
          <div>
            <div className="font-bold mb-2">Tags</div>
            <button
              className={`block w-full text-left px-2 py-1 rounded mb-1 ${!selectedTag ? 'bg-blue-200' : ''}`}
              onClick={() => { setSelectedTag(null); setPage(1); }}
            >
              All
            </button>
            {tags.map(tag => (
              <button
                key={tag}
                className={`block w-full text-left px-2 py-1 rounded mb-1 ${selectedTag === tag ? 'bg-blue-200' : ''}`}
                onClick={() => { setSelectedTag(tag); setPage(1); }}
              >
                {tag}
              </button>
            ))}
          </div>
        </aside>
        {/* Main Content */}
        <main className="flex-1 p-8 overflow-auto bg-gray-50 lg:ml-0" style={{ marginLeft: 0 }}>
          <div className="max-w-5xl mx-auto">
            <section className="bg-white rounded-lg shadow-md p-8 border border-gray-200">
              <header className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight">Admin Wiki</h1>
                <div className="flex items-center gap-2">
                  <button onClick={openAddModal} className="btn btn-primary flex items-center gap-1 text-base px-4 py-2"><FaPlus /> Add New</button>
                  <button onClick={() => handleExport('json')} className="btn btn-secondary flex items-center gap-1 text-base px-4 py-2"><FaFileExport /> Export JSON</button>
                  <button onClick={() => handleExport('csv')} className="btn btn-secondary flex items-center gap-1 text-base px-4 py-2"><FaFileExport /> Export CSV</button>
                  <label className="btn btn-secondary flex items-center gap-1 cursor-pointer text-base px-4 py-2">
                    <FaFileImport /> Import
                    <input type="file" accept=".json,.csv" className="hidden" onChange={handleImport} disabled={importing} />
                  </label>
                </div>
              </header>
              {loading ? (
                <div className="text-lg text-gray-500 py-12 text-center">Loading...</div>
              ) : (
                <>
                  <table className="w-full border mb-8 bg-white rounded-lg overflow-hidden text-base">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700 text-lg">
                        <th className="p-3 border-b font-semibold">Title</th>
                        <th className="p-3 border-b font-semibold">Tags</th>
                        <th className="p-3 border-b font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntries.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-gray-500">No entries found{search ? ' for this search.' : '.'}</td>
                        </tr>
                      ) : (
                        filteredEntries.map(entry => (
                          <React.Fragment key={entry.id}>
                            <tr className={`border-b hover:bg-blue-50 transition ${expandedEntryId === entry.id ? 'bg-blue-50' : ''}`}>
                              <td className="p-3 border-b font-semibold text-blue-800 cursor-pointer underline" onClick={() => toggleExpandEntry(entry.id)}>
                                {entry.title}
                                {expandedEntryId === entry.id && <span className="ml-2 text-xs text-blue-700">(click to collapse)</span>}
                              </td>
                              <td className="p-3 border-b text-gray-700">{entry.tags.join(', ')}</td>
                              <td className="p-3 border-b">
                                <button className="btn btn-xs btn-info mr-1" onClick={() => openEditModal(entry)}>Edit</button>
                                <button className="btn btn-xs btn-error" onClick={() => openDeleteModal(entry)}>Delete</button>
                              </td>
                            </tr>
                            {expandedEntryId === entry.id && (
                              <tr>
                                <td colSpan={3} className="p-4 bg-blue-50">
                                  <div className="prose max-w-none text-gray-900 whitespace-pre-line">
                                    <h2 className="text-xl font-bold mb-2">{entry.title}</h2>
                                    <div className="mb-2 text-sm text-gray-500">Tags: {entry.tags.join(', ')} | Created: {new Date(entry.createdAt).toLocaleString()} | Updated: {new Date(entry.updatedAt).toLocaleString()}</div>
                                    {/* Table of Contents for long entries */}
                                    {(() => {
                                      const headings = extractHeadings(entry.content);
                                      if (headings.length >= 2) {
                                        return (
                                          <nav className="mb-4 border rounded bg-white/80 p-3">
                                            <div className="font-bold text-blue-800 mb-2">Table of Contents</div>
                                            <ul className="ml-2">
                                              {headings.map(h => (
                                                <li key={h.id} style={{ marginLeft: (h.level - 1) * 16 }}>
                                                  <a href={`#${h.id}`} className="text-blue-700 hover:underline">{h.text}</a>
                                                </li>
                                              ))}
                                            </ul>
                                          </nav>
                                        );
                                      }
                                      return null;
                                    })()}
                                    {/* Render content with heading anchors */}
                                    <div>
                                      {entry.content.split('\n').map((line, idx) => {
                                        const match = line.match(/^(#{1,6})\s+(.+)/);
                                        if (match) {
                                          const level = match[1].length;
                                          const text = match[2].trim();
                                          const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                                          const Tag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements;
                                          return <Tag key={idx} id={id} className="mt-4 mb-2 font-bold text-blue-900">{text}</Tag>;
                                        }
                                        return <div key={idx}>{line}</div>;
                                      })}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))
                      )}
                    </tbody>
                  </table>
                  {/* Pagination Controls */}
                  <div className="flex items-center gap-4 mb-2 justify-center">
                    <button className="btn btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
                    <span className="text-lg font-medium">Page {page} of {totalPages}</span>
                    <button className="btn btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
                  </div>
                </>
              )}
            </section>
          </div>
        </main>
        {/* Modal for Add/Edit */}
        <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
          <div className="p-4">
            <h2 className="text-xl font-bold mb-2">{modalMode === 'add' ? 'Add New Entry' : 'Edit Entry'}</h2>
            <div className="mb-2">
              <label className="block font-semibold" htmlFor="wiki-title">Title</label>
              <input id="wiki-title" className="input input-bordered w-full" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="mb-2">
              <label className="block font-semibold" htmlFor="wiki-content">Content</label>
              <textarea id="wiki-content" className="textarea textarea-bordered w-full min-h-[100px]" value={content} onChange={e => setContent(e.target.value)} />
            </div>
            <div className="mb-2">
              <label className="block font-semibold" htmlFor="wiki-tags">Tags (comma separated)</label>
              <input id="wiki-tags" className="input input-bordered w-full" value={entryTags} onChange={e => setEntryTags(e.target.value)} />
            </div>
            <div className="flex gap-2 mt-4">
              <button className="btn btn-primary" onClick={handleSave}>{modalMode === 'add' ? 'Add' : 'Save'}</button>
              <button className="btn" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </Modal>
        {/* Modal for Delete Confirmation */}
        <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setEntryToDelete(null); }}>
          <div className="p-6 text-center">
            <h2 className="text-xl font-bold mb-4 text-red-700">Delete Wiki Entry</h2>
            <div className="mb-4 text-gray-800">Are you sure you want to delete <span className="font-semibold">{entryToDelete?.title}</span>? This action cannot be undone.</div>
            <div className="flex gap-4 justify-center">
              <button className="btn btn-error" onClick={() => { console.log('Confirm delete button clicked'); handleDeleteConfirmed(); }}>Delete</button>
              <button className="btn" onClick={() => { setShowDeleteModal(false); setEntryToDelete(null); }}>Cancel</button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default AdminWiki;
