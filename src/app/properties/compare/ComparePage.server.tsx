import PropertyComparisonCharts from "@/components/PropertyComparisonCharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
const PrintButton = dynamic(() => import("./PrintButton.client"), { ssr: false });
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";

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

async function getPropertiesByIds(ids: string[]): Promise<PropertyAnalysis[]> {
  // Use absolute URL for server-side fetch
  // Use correct port for local dev (matching NEXTAUTH_URL)
  const base = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXTAUTH_URL
      ? process.env.NEXTAUTH_URL.replace(/\/$/, "")
      : "http://localhost:3002";
  // Forward cookies for authentication
  const cookieHeader = cookies().toString();
  const res = await fetch(`${base}/api/properties`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
    },
  });
  if (!res.ok) throw new Error("Failed to fetch properties");
  const data = await res.json();
  if (!data.success) throw new Error("API error");
  return data.analyses.filter((p: PropertyAnalysis) => ids.includes(p.id));
}

export default async function ComparePage({ searchParams }: { searchParams: { ids?: string } }) {
  const ids = searchParams.ids?.split(",").filter(Boolean) || [];
  if (ids.length < 2) {
    return (
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 w-full">
        <Card className="max-w-md mx-auto w-full">
          <CardContent className="pt-6">
            <div className="text-center text-red-600">Select at least two properties to compare.</div>
            <div className="text-center mt-4">
              <Link href="/properties">
                <Button>Back to Properties</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  let properties: PropertyAnalysis[] = [];
  let error: string | null = null;
  try {
    properties = await getPropertiesByIds(ids);
    if (!properties.length) error = "No properties found.";
  } catch (e) {
    error = (e as Error).message || "Failed to load properties.";
  }

  return (
    <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 w-full">
      <div className="flex items-center gap-4 mb-6 print:flex-col print:items-start print:gap-2">
        <Link href="/properties" className="print:hidden">
          <Button variant="outline" size="sm">Back</Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold flex-1">Compare Properties</h1>
        <div className="ml-auto print:hidden">
          <PrintButton />
        </div>
      </div>
      {error ? (
        <Card className="max-w-md mx-auto w-full">
          <CardContent className="pt-6">
            <div className="text-center text-red-600">{error}</div>
            <div className="text-center mt-4">
              <Link href="/properties">
                <Button>Back to Properties</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Table comparison */}
          <div className="overflow-x-auto mb-8">
            <table className="min-w-full border text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">Address</th>
                  <th className="p-2 border">Type</th>
                  <th className="p-2 border">Price</th>
                  <th className="p-2 border">Gross Rent</th>
                  <th className="p-2 border">Rent/SqFt</th>
                  <th className="p-2 border">ROI (%)</th>
                  <th className="p-2 border">Cash Flow</th>
                  <th className="p-2 border">Score</th>
                  <th className="p-2 border">Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((p) => (
                  <tr key={p.id}>
                    <td className="p-2 border font-semibold">{p.address}</td>
                    <td className="p-2 border">{p.propertyType}</td>
                    <td className="p-2 border">${p.purchasePrice.toLocaleString()}</td>
                    <td className="p-2 border">{typeof p.grossRent === "number" ? `$${p.grossRent}` : "N/A"}</td>
                    <td className="p-2 border">{(typeof p.grossRent === "number" && typeof p.squareFootage === "number") ? (p.grossRent / p.squareFootage).toFixed(2) : "N/A"}</td>
                    <td className="p-2 border">{p.analysis?.roi?.toFixed(2) ?? "N/A"}</td>
                    <td className="p-2 border">{p.analysis ? `$${p.analysis.monthlyCashFlow.toLocaleString()}` : "N/A"}</td>
                    <td className="p-2 border">{p.analysis?.recommendationScore ?? "N/A"}</td>
                    <td className="p-2 border">{p.analysis?.recommendation ?? "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Charts */}
          <PropertyComparisonCharts properties={properties} />
        </>
      )}
    </main>
  );
}
