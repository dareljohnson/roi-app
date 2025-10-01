import { PieChart, Pie, Cell } from "recharts";

interface PieChartWithNeedleProps {
  score: number; // 0-100
  width?: number;
  height?: number;
}

const COLORS = ["#ef4444", "#f59e42", "#10b981"];

// Score: 0-40 = red, 41-70 = orange, 71-100 = green
function getScoreColor(score: number) {
  if (score <= 40) return COLORS[0];
  if (score <= 70) return COLORS[1];
  return COLORS[2];
}

export default function PieChartWithNeedle({ score, width = 120, height = 120 }: PieChartWithNeedleProps) {
  // Pie chart is split into 3 segments: Poor, Average, Excellent
  const data = [
    { name: "Poor", value: 40 },
    { name: "Average", value: 30 },
    { name: "Excellent", value: 30 },
  ];

  // Needle angle: 0 (left) to 180 (right)
  const angle = (score / 100) * 180;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = width / 2 - 10;
  const needleLength = radius - 8;
  const rad = (Math.PI * angle) / 180;
  const needleX = centerX + needleLength * Math.cos(Math.PI - rad);
  const needleY = centerY - needleLength * Math.sin(Math.PI - rad);

  return (
    <div 
      style={{ 
        position: "relative", 
        width: width, 
        height: height + 20, // Add space for score label
        maxWidth: '100%',
        margin: '0 auto'
      }} 
      className="flex-shrink-0"
    >
      <PieChart width={width} height={height} style={{ position: "absolute", left: 0, top: 0 }}>
        <Pie
          data={data}
          cx={centerX}
          cy={centerY}
          startAngle={180}
          endAngle={0}
          innerRadius={radius - 18}
          outerRadius={radius}
          dataKey="value"
          stroke="none"
        >
          {data.map((entry, idx) => (
            <Cell key={`cell-${idx}`} fill={COLORS[idx]} />
          ))}
        </Pie>
      </PieChart>
      {/* Needle */}
      <svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}>
        <line
          x1={centerX}
          y1={centerY}
          x2={needleX}
          y2={needleY}
          stroke={getScoreColor(score)}
          strokeWidth={4}
          strokeLinecap="round"
        />
        {/* Center dot */}
        <circle cx={centerX} cy={centerY} r={6} fill="#374151" />
      </svg>
      {/* Score label */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          textAlign: "center",
          fontWeight: 600,
          fontSize: 16,
          color: getScoreColor(score),
        }}
      >
        {score}
      </div>
    </div>
  );
}
