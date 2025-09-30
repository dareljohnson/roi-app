"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import PieChartWithNeedle from "@/components/PieChartWithNeedle";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PropertyAnalysis {
  id: string;
  address: string;
  propertyType: string;
  purchasePrice: number;
  bedrooms?: number;
  bathrooms?: number;
  createdAt: string;
  analysis: {
    id: string;
    roi: number;
    monthlyCashFlow: number;
    recommendation: string;
    recommendationScore: number;
    createdAt: string;
    totalCashInvested?: number;
    npv?: number;
  } | null;
  owner?: {
    name?: string | null;
    email: string;
  };
  grossRent?: number;
  squareFootage?: number;
}

export default function PropertyComparisonCharts({ properties }: { properties: PropertyAnalysis[] }) {
  const chartData = properties.map((p) => ({
    name: p.address,
    ROI: p.analysis?.roi ?? 0,
    "Cash Flow": p.analysis?.monthlyCashFlow ?? 0,
    "Purchase Price": p.purchasePrice,
    "Gross Rent": p.grossRent ?? 0,
    "Rent/SqFt": (typeof p.grossRent === "number" && typeof p.squareFootage === "number") ? (p.grossRent / p.squareFootage) : 0,
    "Score": p.analysis?.recommendationScore ?? 0,
    "Total Cash Invested": p.analysis?.totalCashInvested ?? 0,
    "NPV": p.analysis?.npv ?? 0,
  }));

  return (
    <>
      {/* Grouped Bar Charts for each metric */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">ROI, Cash Flow, and Score Comparison</h2>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} margin={{ top: 16, right: 32, left: 8, bottom: 16 }}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="ROI" fill="#6366f1" />
            <Bar dataKey="Cash Flow" fill="#10b981" />
            <Bar dataKey="Score" fill="#f59e42" />
          </BarChart>
        </ResponsiveContainer>
        {/* PieChartWithNeedle row aligned under each property */}
  <div className="flex flex-row gap-10 justify-center mt-8">
    {properties.map((p) => (
      <div
        key={p.id}
        className="flex flex-col items-center min-w-[140px] print:avoid-break print:break-inside-avoid"
        style={{ pageBreakInside: 'avoid' }}
      >
        <div className="print:fixed-size">
          <PieChartWithNeedle score={typeof p.analysis?.recommendationScore === 'number' ? p.analysis.recommendationScore : 0} width={160} height={160} />
        </div>
        <div className="mt-2 text-sm font-medium text-center max-w-[220px] truncate">{p.address}</div>
        {typeof p.analysis?.recommendationScore !== 'number' && (
          <div className="text-xs text-red-500 mt-1">No score</div>
        )}
      </div>
    ))}
  </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Purchase Price Comparison</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 16, right: 32, left: 8, bottom: 16 }}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="Purchase Price" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Gross Rent Comparison</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 16, right: 32, left: 8, bottom: 16 }}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="Gross Rent" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Rent Per Sq Ft Comparison</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 16, right: 32, left: 8, bottom: 16 }}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="Rent/SqFt" fill="#f59e42" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Total Cash Invested Comparison</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 16, right: 32, left: 8, bottom: 16 }}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="Total Cash Invested" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">NPV Comparison</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 16, right: 32, left: 8, bottom: 16 }}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="NPV" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
