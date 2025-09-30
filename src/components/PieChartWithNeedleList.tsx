"use client";
import PieChartWithNeedle from "@/components/PieChartWithNeedle";

interface PropertyAnalysis {
  id: string;
  address: string;
  analysis: {
    recommendationScore?: number;
  } | null;
}

export default function PieChartWithNeedleList({ properties }: { properties: PropertyAnalysis[] }) {
  return (
    <div className="flex flex-col items-center justify-end md:justify-center h-full">
      <h2 className="text-lg font-semibold mb-2">Investment Recommendation</h2>
      <div className="flex flex-wrap gap-6">
        {properties.map((p) => (
          <div
            key={p.id}
            className="flex flex-col items-center bg-white/80 rounded-lg p-2"
            style={{ minWidth: 140 }}
          >
            <PieChartWithNeedle score={typeof p.analysis?.recommendationScore === 'number' ? p.analysis.recommendationScore : 0} />
            <div className="mt-2 text-sm font-medium text-center max-w-[120px] truncate">{p.address}</div>
            {typeof p.analysis?.recommendationScore !== 'number' && (
              <div className="text-xs text-red-500 mt-1">No score</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
