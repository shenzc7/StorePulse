import * as React from 'react';
import { formatIndianNumber } from '../../../src/lib/api';

interface Prediction {
    date: string;
    predicted_visits: number;
    lower_bound: number;
    upper_bound: number;
    is_weekend: boolean;
    is_holiday: boolean;
    is_payday: boolean;
}

interface ForecastChartProps {
    predictions: Prediction[];
    height?: number;
}

export function ForecastChart({ predictions, height = 300 }: ForecastChartProps) {
    const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

    const chartData = React.useMemo(() => {
        if (!predictions || predictions.length === 0) {
            return { points: [], areaPath: '', linePath: '', maxVal: 0, width: 0, maxVisitDay: null };
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

        return { points, areaPath, linePath, maxVal, width, maxVisitDay };
    }, [predictions, height]);

    if (!predictions || predictions.length === 0) return null;

    const { points, areaPath, linePath, maxVal, width, maxVisitDay } = chartData;

    return (
        <div className="card border border-border bg-white shadow-sm mb-8 overflow-hidden">
            <div className="p-6 border-b border-border bg-surface-50/30 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-ink-900">Traffic Trend Analysis</h2>
                    <p className="text-sm text-ink-600">Decision-ready forecast with risk boundaries</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold text-ink-500 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-primary-100/50 border border-primary-300 rounded-sm"></div>
                        <span>Risk Band</span>
                    </div>
                </div>
            </div>

            <div className="p-6">
                <div className="relative" style={{ height: height }}>
                    <svg
                        viewBox={`0 0 ${width} ${height}`}
                        preserveAspectRatio="none"
                        className="w-full h-full overflow-visible"
                    >
                        {/* Grid lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map(tick => (
                            <line
                                key={tick}
                                x1={0}
                                y1={height * tick}
                                x2={width}
                                y2={height * tick}
                                stroke="#f1f5f9"
                                strokeWidth="2"
                            />
                        ))}

                        {/* Confidence Area */}
                        {areaPath && (
                            <path d={areaPath} fill="currentColor" className="text-primary-100 opacity-40 hover:opacity-60 transition-opacity" stroke="none" />
                        )}

                        {/* Peak Line Indicator */}
                        {maxVisitDay && points.length > 0 && (
                            chartData.points.find(p => p.data.date === maxVisitDay.date) && (
                                <g>
                                    <line
                                        x1={chartData.points.find(p => p.data.date === maxVisitDay.date)!.x}
                                        y1={0}
                                        x2={chartData.points.find(p => p.data.date === maxVisitDay.date)!.x}
                                        y2={height}
                                        stroke="#cbd5e1"
                                        strokeDasharray="4 4"
                                    />
                                    <text
                                        x={chartData.points.find(p => p.data.date === maxVisitDay.date)!.x}
                                        y={15}
                                        textAnchor="middle"
                                        className="text-[10px] font-black fill-ink-400 uppercase"
                                    >
                                        Weekly Peak
                                    </text>
                                </g>
                            )
                        )}

                        {/* Main Trend Line */}
                        {linePath && (
                            <polyline points={linePath} fill="none" stroke="currentColor" className="text-primary-600" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        )}

                        {/* Data Points */}
                        {points.map((p, i) => (
                            <g key={i} className="group pointer-events-auto">
                                <circle cx={p.x} cy={p.y} r={20} fill="transparent"
                                    className="cursor-crosshair"
                                    onMouseEnter={() => setHoveredIndex(i)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                />

                                <circle
                                    cx={p.x}
                                    cy={p.y}
                                    r={hoveredIndex === i ? 7 : 4}
                                    className={`transition-all duration-300 shadow-sm ${p.data.is_payday ? 'fill-yellow-400 stroke-yellow-600' :
                                            p.data.is_holiday ? 'fill-red-400 stroke-red-600' :
                                                'fill-white stroke-primary-600'
                                        }`}
                                    strokeWidth="2.5"
                                />
                            </g>
                        ))}
                    </svg>

                    {/* Tooltip Overlay */}
                    {hoveredIndex !== null && points[hoveredIndex] && (
                        <div
                            className="absolute z-10 p-4 bg-white border border-border text-ink-900 rounded-xl shadow-2xl pointer-events-none transform -translate-x-1/2 -translate-y-full mb-4 text-sm transition-all duration-200 ring-4 ring-black/5"
                            style={{
                                left: `${(hoveredIndex * (100 / Math.max(1, points.length - 1)))}%`,
                                top: `${100 - (points[hoveredIndex].data.predicted_visits / maxVal) * 100}%`
                            }}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className="font-black text-ink-900 uppercase text-[10px] tracking-widest bg-surface-100 px-2 py-0.5 rounded">
                                    {new Date(points[hoveredIndex].data.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })}
                                </span>
                                {points[hoveredIndex].data.is_payday && <span className="text-[10px] font-bold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded uppercase">Payday</span>}
                            </div>
                            <div className="text-2xl font-black text-ink-900 leading-none mb-1">
                                {formatIndianNumber(Math.round(points[hoveredIndex].data.predicted_visits))}
                            </div>
                            <div className="text-[11px] font-medium text-ink-500 uppercase tracking-wide">
                                Expected Traffic
                            </div>
                            <div className="mt-3 pt-3 border-t border-border space-y-1">
                                <div className="flex justify-between text-[10px] text-ink-400 font-bold uppercase">
                                    <span>Lower Bound</span>
                                    <span className="text-ink-700">{Math.round(points[hoveredIndex].data.lower_bound)}</span>
                                </div>
                                <div className="flex justify-between text-[10px] text-ink-400 font-bold uppercase">
                                    <span>Upper Bound</span>
                                    <span className="text-ink-700">{Math.round(points[hoveredIndex].data.upper_bound)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-between mt-6 pt-4 border-t border-border/50 text-[10px] font-black text-ink-400 uppercase tracking-widest px-2">
                    {points.map((p, i) => (
                        <div key={i} className={`flex flex-col items-center gap-1 ${i % (points.length > 10 ? 2 : 1) === 0 ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>
                            <div className={`w-1 h-1 rounded-full ${p.data.is_weekend ? 'bg-accent-500' : 'bg-border'}`}></div>
                            {new Date(p.data.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
