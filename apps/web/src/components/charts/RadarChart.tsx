interface RadarDataPoint {
  label: string
  val: number
  angle: number
}

interface RadarChartProps {
  points?: Array<RadarDataPoint>
  size?: number
}

const defaultPoints: Array<RadarDataPoint> = [
  { label: 'Financial', val: 88, angle: 0 },
  { label: 'Market', val: 72, angle: 72 },
  { label: 'Ops', val: 94, angle: 144 },
  { label: 'Risk', val: 68, angle: 216 },
  { label: 'Goal', val: 82, angle: 288 },
]

export function RadarChart({
  points = defaultPoints,
  size = 260,
}: RadarChartProps) {
  const center = size / 2

  const getCoord = (val: number, angle: number) => {
    const r = (val / 100) * (size / 2 - 40)
    const rad = (angle - 90) * (Math.PI / 180)
    return {
      x: center + r * Math.cos(rad),
      y: center + r * Math.sin(rad),
    }
  }

  const pathData = points
    .map((p) => {
      const { x, y } = getCoord(p.val, p.angle)
      return `${x},${y}`
    })
    .join(' ')

  return (
    <div className="relative flex items-center justify-center p-4">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background circles */}
        {[25, 50, 75, 100].map((r) => (
          <circle
            key={r}
            cx={center}
            cy={center}
            r={(r / 100) * (size / 2 - 40)}
            fill="none"
            stroke="currentColor"
            className="opacity-10"
          />
        ))}
        {/* Axis lines */}
        {points.map((p) => {
          const { x, y } = getCoord(100, p.angle)
          return (
            <line
              key={p.label}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="currentColor"
              className="opacity-10"
            />
          )
        })}
        {/* Data shape */}
        <polygon
          points={pathData}
          fill="#8B5CF6"
          fillOpacity="0.25"
          stroke="#8B5CF6"
          strokeWidth="4"
          className="filter drop-shadow-xl dark:fill-[#E8FF4D] dark:stroke-[#E8FF4D]"
        />
        {/* Labels */}
        {points.map((p) => {
          const { x, y } = getCoord(118, p.angle)
          return (
            <text
              key={p.label}
              x={x}
              y={y}
              textAnchor="middle"
              className="text-[10px] font-black uppercase tracking-widest fill-current opacity-60 dark:text-white/40"
            >
              {p.label}
            </text>
          )
        })}
      </svg>
    </div>
  )
}
