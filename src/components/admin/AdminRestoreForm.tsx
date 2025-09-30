"use client";
import React from "react";

export default function AdminRestoreForm() {
  const [restoreFile, setRestoreFile] = React.useState<File | null>(null);
  const [restoreStatus, setRestoreStatus] = React.useState<string | null>(null);
  const [restoreWarning, setRestoreWarning] = React.useState(false);
  const [restoreMode, setRestoreMode] = React.useState<'json' | 'csv'>('json');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  async function handleRestoreSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRestoreStatus(null);
    if (!restoreFile) {
      setRestoreStatus('Please select an export file.');
      return;
    }
    if (!restoreWarning) {
      setRestoreWarning(true);
      setRestoreStatus('Are you sure? This will OVERWRITE all data. Click Restore again to confirm.');
      return;
    }
    try {
      let body: any = {};
      if (restoreMode === 'json') {
        const text = await restoreFile.text();
        const json = JSON.parse(text);
        body.jsonExport = json.jsonExport || json;
      } else if (restoreMode === 'csv') {
        const JSZip = (await import('jszip')).default;
        const zip = await JSZip.loadAsync(restoreFile);
        const csvExport: Record<string, string> = {};
        for (const filename of Object.keys(zip.files)) {
          if (filename.endsWith('.csv')) {
            const table = filename.replace(/\.csv$/, '');
            csvExport[table] = await zip.files[filename].async('string');
          }
        }
        body.csvExport = csvExport;
      }
      const res = await fetch('/api/admin/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setRestoreStatus('Database restored successfully.');
        setRestoreWarning(false);
        setRestoreFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        const err = await res.json();
        setRestoreStatus('Restore failed: ' + (err.error || 'Unknown error'));
      }
    } catch (err: any) {
      setRestoreStatus('Restore failed: ' + (err.message || 'Invalid file'));
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mt-8">Restore Database from Export</h2>
      <form className="flex flex-col gap-2 max-w-md" onSubmit={handleRestoreSubmit}>
        <div className="flex gap-2 mb-2">
          <label>
            <input
              type="radio"
              name="restoreMode"
              value="json"
              checked={restoreMode === 'json'}
              onChange={() => setRestoreMode('json')}
            /> JSON
          </label>
          <label>
            <input
              type="radio"
              name="restoreMode"
              value="csv"
              checked={restoreMode === 'csv'}
              onChange={() => setRestoreMode('csv')}
            /> CSV (zip)
          </label>
        </div>
        <input
          type="file"
          accept={restoreMode === 'json' ? 'application/json,.json' : '.zip,application/zip'}
          ref={fileInputRef}
          onChange={e => {
            setRestoreFile(e.target.files?.[0] || null);
            setRestoreWarning(false);
            setRestoreStatus(null);
          }}
        />
        <button
          type="submit"
          className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={!restoreFile}
        >
          {restoreWarning ? 'Confirm Restore (Overwrite ALL Data)' : 'Restore Database'}
        </button>
        {restoreStatus && (
          <div className={restoreStatus.includes('success') ? 'text-green-700' : 'text-red-700'}>{restoreStatus}</div>
        )}
      </form>
    </div>
  );
}
