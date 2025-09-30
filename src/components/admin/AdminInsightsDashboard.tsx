"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

export default function AdminInsightsDashboard() {
  const [apiStats, setApiStats] = useState({ total: 0, errors: 0, last24h: 0, timeSeries: [] });
  const [apiLog, setApiLog] = useState<any[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);

  useEffect(() => {
    // Fetch API stats from a new admin endpoint
    fetch("/api/admin/insights")
      .then((res) => res.json())
      .then((data) => setApiStats(data));
    // Fetch API log data from a new admin endpoint
    fetch("/api/admin/apilog")
      .then((res) => res.json())
      .then((data) => setApiLog(data.log || []));
  }, []);

  // Get unique endpoints for dropdown
  const endpoints = Array.from(new Set(apiLog.map(l => l.endpoint))).filter(Boolean);
  const filteredLog = selectedEndpoint ? apiLog.filter(l => l.endpoint === selectedEndpoint) : apiLog;

  return (
    <div className="grid grid-cols-1 gap-8 mt-8">
      <div className="bg-white rounded-lg shadow p-6 w-full">
        <h2 className="text-xl font-bold mb-4">API Call Snapshot</h2>
        <ul className="space-y-2 mb-6">
          <li>Total API Calls: <span className="font-mono">{apiStats.total}</span></li>
          <li>API Errors: <span className="font-mono text-red-600">{apiStats.errors}</span></li>
          <li>API Calls (Last 24h): <span className="font-mono">{apiStats.last24h}</span></li>
        </ul>
        <div className="h-64 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={apiStats.timeSeries || []} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tickFormatter={t => new Date(t).getHours() + ':00'} />
              <YAxis allowDecimals={false} />
              <Tooltip labelFormatter={t => new Date(t).toLocaleString()} />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#2563eb" name="API Calls" />
              <Line type="monotone" dataKey="errors" stroke="#dc2626" name="Errors" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mb-2">
          <label className="font-semibold mr-2">Drill down by endpoint:</label>
          <select value={selectedEndpoint || ''} onChange={e => setSelectedEndpoint(e.target.value || null)} className="border rounded px-2 py-1">
            <option value="">All</option>
            {endpoints.map(ep => <option key={ep} value={ep}>{ep}</option>)}
          </select>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredLog.map(l => ({
              ...l,
              time: new Date(l.ts).toLocaleTimeString(),
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis allowDecimals={false} domain={[0, 'dataMax']} />
              <Tooltip />
              <Legend />
              <Line type="stepAfter" dataKey="status" stroke="#2563eb" name="Status Code" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Console Output section removed to stop polling */}
    </div>
  );
}
