import * as React from 'react';
import { formatIndianNumber } from '../../../src/lib/api';
import { InfoTip } from './InfoTip';

interface Prediction {
    date: string;
    predicted_visits: number;
    lower_bound: number;
    upper_bound: number;
    day_of_week?: string;
    is_weekend: boolean;
    is_holiday: boolean;
    is_payday: boolean;
    confidence_level?: string;
    weather?: string;
}

interface ForecastChartProps {
    predictions: Prediction[];
    height?: number;
}

export function ForecastChart({ predictions, height = 340 }: ForecastChartProps) {
    const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

    const chartData = React.useMemo(() => {
        if (!predictions || predictions.length === 0) {
            return { points: [], areaPath: '', linePath: '', maxVal: 0, width: 0, maxVisitDay: null, minVisitDay: null };
        }

        const maxVal = Math.max(...predictions.map(p => p.upper_bound), 10) * 1.15;
        const width = 1000;
        const h = height;
        const itemCount = predictions.length;
        const xStep = itemCount > 1 ? width / (itemCount - 1) : 0;

        const points = predictions.map((p, i) => {
            const x = i * xStep;
            const y = h - (p.predicted_visits / maxVal) * h;
            const yUpper = h - (p.upper_bound / maxVal) * h;
            const yLower = h - (p.lower_bound / maxVal) * h;
            return { x, y, yUpper, yLower, data: p };
        });

        // Paths
        const linePath = points.map(p => `${p.x},${p.y}`).join(' ');
        const upperPath = points.map(p => `${p.x},${p.yUpper}`).join(' L ');
        const lowerPath = points.slice().reverse().map(p => `${p.x},${p.yLower}`).join(' L ');
        const areaPath = points.length > 1 ? `M ${upperPath} L ${lowerPath} Z` : '';

        const maxVisitDay = predictions.reduce((prev, current) =>
            (prev.predicted_visits > current.predicted_visits) ? prev : current
            , predictions[0]);

        const minVisitDay = predictions.reduce((prev, current) =>
            (prev.predicted_visits < current.predicted_visits) ? prev : current
            , predictions[0]);

        return { points, areaPath, linePath, maxVal, width, maxVisitDay, minVisitDay };
    }, [predictions, height]);

    if (!predictions || predictions.length === 0) return null;

    const { points, areaPath, linePath, maxVal, width, maxVisitDay, minVisitDay } = chartData;
    const avgVisits = predictions.reduce((s, p) => s + p.predicted_visits, 0) / predictions.length;

    return (
        <div className="bg-white mb-4 rounded-2xl shadow-xl overflow-hidden border border-slate-100">
            <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-blue-50/80 to-indigo-50/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold font-display text-slate-800 tracking-tight flex items-center gap-2">Traffic Trend Analysis <InfoTip text="This chart shows the AI's predicted daily visitor count for the forecast window. The shaded area represents the confidence band — the range where the actual count is 80% likely to fall. Colored dots mark special days (weekends, holidays, paydays) that affect traffic patterns." /></h2>
                    <p className="text-sm text-slate-500 mt-1 font-medium">Predicted daily visits vs confidence boundaries • {predictions.length}-day horizon</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-100/50">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border border-indigo-200 bg-indigo-50/50 backdrop-blur-sm"></div>
                        <span>Confidence Band</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-600 shadow-sm"></div>
                        <span>Trend Line</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-400 shadow-sm border border-yellow-500"></div>
                        <span>Payday</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
                        <span>Holiday</span>
                    </div>
                </div>
            </div>

            <div className="p-6 md:p-8">
                <div className="relative mt-4" style={{ height: height }}>
                    <svg
                        viewBox={`0 0 ${width} ${height}`}
                        preserveAspectRatio="none"
                        className="w-full h-full overflow-visible"
                    >
                        <defs>
                            <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="#818cf8" stopOpacity="0.05" />
                            </linearGradient>
                            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#4f46e5" />
                                <stop offset="50%" stopColor="#2563eb" />
                                <stop offset="100%" stopColor="#0ea5e9" />
                            </linearGradient>
                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="3" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </defs>

                        {/* Grid lines with Y-axis labels */}
                        {[0, 0.25, 0.5, 0.75, 1].map(tick => (
                            <g key={tick}>
                                <line
                                    x1={0}
                                    y1={height * tick}
                                    x2={width}
                                    y2={height * tick}
                                    stroke="#f1f5f9"
                                    strokeWidth="2"
                                    strokeDasharray="6 6"
                                />
                            </g>
                        ))}

                        {/* Average line */}
                        <line
                            x1={0}
                            y1={height - (avgVisits / maxVal) * height}
                            x2={width}
                            y2={height - (avgVisits / maxVal) * height}
                            stroke="#94a3b8"
                            strokeWidth="1.5"
                            strokeDasharray="4 6"
                            opacity="0.5"
                        />

                        {/* Confidence Area */}
                        {areaPath && (
                            <path d={areaPath} fill="url(#confidenceGradient)" className="transition-all duration-700 ease-in-out" stroke="none" />
                        )}

                        {/* Weekend/holiday background bands */}
                        {points.map((p, i) => {
                            if (!p.data.is_weekend && !p.data.is_holiday) return null;
                            const bandWidth = i === 0 || i === points.length - 1
                                ? (width / (points.length - 1)) / 2
                                : (width / (points.length - 1));
                            const bandX = i === 0 ? 0 : p.x - bandWidth / 2;
                            return (
                                <rect
                                    key={`band-${i}`}
                                    x={bandX}
                                    y={0}
                                    width={bandWidth}
                                    height={height}
                                    fill={p.data.is_holiday ? '#fef2f2' : '#eff6ff'}
                                    opacity="0.5"
                                />
                            );
                        })}

                        {/* Peak Line Indicator */}
                        {maxVisitDay && points.length > 0 && (
                            chartData.points.find(p => p.data.date === maxVisitDay.date) && (
                                <g>
                                    <line
                                        x1={chartData.points.find(p => p.data.date === maxVisitDay.date)!.x}
                                        y1={0}
                                        x2={chartData.points.find(p => p.data.date === maxVisitDay.date)!.x}
                                        y2={height}
                                        stroke="#c7d2fe"
                                        strokeWidth="2"
                                        strokeDasharray="4 4"
                                    />
                                    <rect
                                        x={chartData.points.find(p => p.data.date === maxVisitDay.date)!.x - 45}
                                        y={-30}
                                        width="90"
                                        height="24"
                                        rx="12"
                                        fill="#eef2ff"
                                        stroke="#818cf8"
                                        strokeWidth="1"
                                    />
                                    <text
                                        x={chartData.points.find(p => p.data.date === maxVisitDay.date)!.x}
                                        y={-14}
                                        textAnchor="middle"
                                        className="text-[10px] font-bold fill-indigo-700 uppercase tracking-widest"
                                    >
                                        Weekly Peak
                                    </text>
                                </g>
                            )
                        )}

                        {/* Main Trend Line */}
                        {linePath && (
                            <polyline
                                points={linePath}
                                fill="none"
                                stroke="url(#lineGradient)"
                                filter="url(#glow)"
                                className="transition-all duration-700 ease-in-out"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        )}

                        {/* Hover vertical guide */}
                        {hoveredIndex !== null && points[hoveredIndex] && (
                            <line
                                x1={points[hoveredIndex].x}
                                y1={0}
                                x2={points[hoveredIndex].x}
                                y2={height}
                                stroke="#cbd5e1"
                                strokeWidth="1"
                                strokeDasharray="3 3"
                            />
                        )}

                        {/* Data Points */}
                        {points.map((p, i) => (
                            <g key={i} className="group pointer-events-auto cursor-pointer"
                                onMouseEnter={() => setHoveredIndex(i)}
                                onMouseLeave={() => setHoveredIndex(null)}
                            >
                                <circle cx={p.x} cy={p.y} r={24} fill="transparent" />

                                {/* Outer ring for special days */}
                                {(p.data.is_payday || p.data.is_holiday || p.data.is_weekend) && (
                                    <circle
                                        cx={p.x} cy={p.y}
                                        r={hoveredIndex === i ? 14 : 10}
                                        fill="none"
                                        stroke={p.data.is_payday ? '#facc15' : p.data.is_holiday ? '#ef4444' : '#93c5fd'}
                                        strokeWidth="1.5"
                                        strokeDasharray="3 3"
                                        className="transition-all duration-300"
                                        opacity="0.6"
                                    />
                                )}

                                <circle
                                    cx={p.x}
                                    cy={p.y}
                                    r={hoveredIndex === i ? 8 : 5}
                                    className={`transition-all duration-300 shadow-md ${p.data.is_payday ? 'fill-yellow-400 stroke-white' :
                                        p.data.is_holiday ? 'fill-red-500 stroke-white' :
                                            p.data.is_weekend ? 'fill-blue-400 stroke-white' :
                                                'fill-blue-600 stroke-white'
                                        }`}
                                    strokeWidth={hoveredIndex === i ? "4" : "3"}
                                />
                            </g>
                        ))}
                    </svg>

                    {/* Tooltip Overlay */}
                    {hoveredIndex !== null && points[hoveredIndex] && (
                        <div
                            className="absolute z-20 p-4 bg-slate-900 border border-slate-700 text-white rounded-xl shadow-2xl pointer-events-none transform -translate-x-1/2 -translate-y-full mb-4 transition-all duration-200 origin-bottom"
                            style={{
                                left: `${(hoveredIndex * (100 / Math.max(1, points.length - 1)))}%`,
                                top: `${100 - (points[hoveredIndex].data.predicted_visits / maxVal) * 100}%`
                            }}
                        >
                            <div className="absolute bottom-[-6px] left-[50%] transform -translate-x-[50%] w-3 h-3 bg-slate-900 border-b border-r border-slate-700 rotate-45"></div>
                            <div className="flex flex-col gap-2 min-w-[200px] relative z-10">
                                <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-1 gap-3">
                                    <div>
                                        <span className="font-mono text-xs font-bold text-slate-300 uppercase tracking-widest">
                                            {new Date(points[hoveredIndex].data.date).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short' })}
                                        </span>
                                    </div>
                                    <div className="flex gap-1">
                                        {points[hoveredIndex].data.is_payday && <span className="text-[9px] font-bold text-yellow-900 bg-yellow-400 px-1.5 py-0.5 rounded-full uppercase">Payday</span>}
                                        {points[hoveredIndex].data.is_holiday && <span className="text-[9px] font-bold text-red-900 bg-red-400 px-1.5 py-0.5 rounded-full uppercase">Holiday</span>}
                                        {points[hoveredIndex].data.is_weekend && !points[hoveredIndex].data.is_holiday && <span className="text-[9px] font-bold text-blue-900 bg-blue-300 px-1.5 py-0.5 rounded-full uppercase">Weekend</span>}
                                    </div>
                                </div>

                                <div className="flex items-baseline justify-between py-1">
                                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Forecast</span>
                                    <span className="text-2xl font-black text-white leading-none tabular-nums">
                                        {formatIndianNumber(Math.round(points[hoveredIndex].data.predicted_visits))}
                                    </span>
                                </div>

                                <div className="space-y-1.5 bg-slate-800/50 p-2.5 rounded-lg">
                                    <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400">
                                        <span>Upper Limit (P90)</span>
                                        <span className="text-slate-200 font-mono tracking-wide tabular-nums">{formatIndianNumber(Math.round(points[hoveredIndex].data.upper_bound))}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400">
                                        <span>Lower Limit (P10)</span>
                                        <span className="text-slate-200 font-mono tracking-wide tabular-nums">{formatIndianNumber(Math.round(points[hoveredIndex].data.lower_bound))}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400 pt-1 border-t border-slate-700">
                                        <span>Band Width</span>
                                        <span className="text-amber-300 font-mono tracking-wide tabular-nums">±{Math.round((points[hoveredIndex].data.upper_bound - points[hoveredIndex].data.lower_bound) / 2)}</span>
                                    </div>
                                    {points[hoveredIndex].data.confidence_level && (
                                        <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400">
                                            <span>Confidence</span>
                                            <span className="text-emerald-300 font-mono tracking-wide">{points[hoveredIndex].data.confidence_level}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold pt-1">
                                    <span>vs Weekly Avg</span>
                                    <span className={points[hoveredIndex].data.predicted_visits > avgVisits ? 'text-emerald-400' : 'text-red-400'}>
                                        {points[hoveredIndex].data.predicted_visits > avgVisits ? '+' : ''}
                                        {((points[hoveredIndex].data.predicted_visits - avgVisits) / avgVisits * 100).toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* X-axis labels */}
                <div className="flex justify-between mt-6 pt-4 border-t border-slate-100 px-2">
                    {points.map((p, i) => (
                        <div key={i}
                            className={`flex flex-col items-center gap-1.5 cursor-pointer transition-all ${hoveredIndex === i ? 'opacity-100 scale-110' : 'opacity-100'}`}
                            onMouseEnter={() => setHoveredIndex(i)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            <div className={`w-2 h-2 rounded-full transition-colors ${p.data.is_payday ? 'bg-yellow-400' :
                                p.data.is_holiday ? 'bg-red-400' :
                                    p.data.is_weekend ? 'bg-blue-400' : 'bg-slate-300'
                                }`}></div>
                            <span className={`text-xs font-semibold uppercase ${p.data.is_weekend || p.data.is_holiday ? 'text-slate-700 font-bold' : 'text-slate-500'}`}>
                                {new Date(p.data.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400">
                                {new Date(p.data.date).toLocaleDateString('en-IN', { weekday: 'short' })}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
