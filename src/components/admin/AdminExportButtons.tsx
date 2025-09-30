"use client";
import React from "react";

export default function AdminExportButtons() {
  async function handleExport(type: "schema" | "json" | "csv") {
    const res = await fetch("/api/admin/export");
    const data = await res.json();
    if (type === "schema") {
      const blob = new Blob([data.schema], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "schema.prisma";
      a.click();
      URL.revokeObjectURL(url);
    } else if (type === "json") {
      const blob = new Blob([
        JSON.stringify(data.jsonExport, null, 2),
      ], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "db-export.json";
      a.click();
      URL.revokeObjectURL(url);
    } else if (type === "csv") {
      const zip = await import("jszip").then((m) => new m.default());
      for (const [table, csv] of Object.entries(data.csvExport)) {
        let csvString = typeof csv === "string" ? csv : String(csv);
        // Fix: For Wiki/documentation table, convert array fields to comma-separated strings
        if (table === "documentation" || table === "wiki") {
          const lines = csvString.split(/\r?\n/);
          if (lines.length > 1) {
            const headers = lines[0].split(",");
            const tagIdx = headers.findIndex(h => h.trim().toLowerCase() === "tags");
            if (tagIdx !== -1) {
              csvString = [lines[0]].concat(
                lines.slice(1).map(line => {
                  const cols = line.split(",");
                  // If tags column looks like JSON, convert to comma-separated
                  if (cols[tagIdx] && cols[tagIdx].startsWith("[") && cols[tagIdx].endsWith("]")) {
                    try {
                      const arr = JSON.parse(cols[tagIdx]);
                      if (Array.isArray(arr)) cols[tagIdx] = arr.join(",");
                    } catch {}
                  }
                  return cols.join(",");
                })
              ).join("\n");
            }
          }
        }
        zip.file(`${table}.csv`, csvString);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "db-export-csv.zip";
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  return (
    <div className="flex gap-4 mb-4">
      <button
        className="bg-indigo-600 text-white px-4 py-2 rounded"
        onClick={() => handleExport("schema")}
      >
        Export Schema
      </button>
      <button
        className="bg-indigo-600 text-white px-4 py-2 rounded"
        onClick={() => handleExport("json")}
      >
        Export Data (JSON)
      </button>
      <button
        className="bg-indigo-600 text-white px-4 py-2 rounded"
        onClick={() => handleExport("csv")}
      >
        Export Data (CSV)
      </button>
    </div>
  );
}
