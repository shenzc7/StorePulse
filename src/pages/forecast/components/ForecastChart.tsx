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
        <div className="border border-slate-300 bg-white mb-8 rounded-sm shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-300 bg-slate-50 flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Traffic Trend Analysis</h2>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-slate-200 border border-slate-300 rounded-none"></div>
                        <span>Confidence Band</span>
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
                                stroke="#e2e8f0"
                                strokeWidth="1"
                                strokeDasharray="2 2"
                            />
                        ))}

                        {/* Confidence Area */}
                        {areaPath && (
                            <path d={areaPath} fill="currentColor" className="text-slate-200 opacity-50 transition-opacity" stroke="none" />
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
                                        textAnchor={chartData.points.find(p => p.data.date === maxVisitDay.date)!.x > width * 0.9 ? 'end' : chartData.points.find(p => p.data.date === maxVisitDay.date)!.x < width * 0.1 ? 'start' : 'middle'}
                                        dx={chartData.points.find(p => p.data.date === maxVisitDay.date)!.x > width * 0.9 ? -5 : chartData.points.find(p => p.data.date === maxVisitDay.date)!.x < width * 0.1 ? 5 : 0}
                                        className="text-[10px] font-black fill-slate-400 uppercase"
                                    >
                                        Weekly Peak
                                    </text>
                                </g>
                            )
                        )}

                        {/* Main Trend Line */}
                        {linePath && (
                            <polyline points={linePath} fill="none" stroke="currentColor" className="text-slate-800" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" />
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
                                    r={hoveredIndex === i ? 6 : 4}
                                    className={`transition-all duration-300 shadow-sm ${p.data.is_payday ? 'fill-white stroke-yellow-500' :
                                        p.data.is_holiday ? 'fill-white stroke-red-500' :
                                            'fill-white stroke-slate-800'
                                        }`}
                                    strokeWidth="2"
                                />
                            </g>
                        ))}
                    </svg>

                    {/* Tooltip Overlay */}
                    {hoveredIndex !== null && points[hoveredIndex] && (
                        <div
                            className="absolute z-10 p-3 bg-white border border-slate-800 text-slate-900 rounded-none shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 text-sm transition-all duration-100"
                            style={{
                                left: `${(hoveredIndex * (100 / Math.max(1, points.length - 1)))}%`,
                                top: `${100 - (points[hoveredIndex].data.predicted_visits / maxVal) * 100}%`
                            }}
                        >
                            <div className="flex flex-col gap-1 min-w-[140px]">
                                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                                    <span className="font-mono text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                        {new Date(points[hoveredIndex].data.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
                                    </span>
                                    {points[hoveredIndex].data.is_payday && <span className="text-[9px] font-bold text-yellow-700 bg-yellow-50 border border-yellow-200 px-1 py-0.5 rounded-none uppercase">Payday</span>}
                                </div>
                                <div className="flex items-baseline justify-between">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Forecast</span>
                                    <span className="text-xl font-black text-slate-900 leading-none">
                                        {formatIndianNumber(Math.round(points[hoveredIndex].data.predicted_visits))}
                                    </span>
                                </div>

                                <div className="space-y-1 mt-2">
                                    <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-500">
                                        <span>Upper Limit</span>
                                        <span className="text-slate-800 font-mono">{Math.round(points[hoveredIndex].data.upper_bound)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-500">
                                        <span>Lower Limit</span>
                                        <span className="text-slate-800 font-mono">{Math.round(points[hoveredIndex].data.lower_bound)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-between mt-6 pt-3 border-t border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
                    {points.map((p, i) => (
                        <div key={i} className={`flex flex-col items-center gap-1 ${i % (points.length > 10 ? 2 : 1) === 0 ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>
                            <div className={`w-1 h-3 rounded-none ${p.data.is_weekend ? 'bg-slate-400' : 'bg-slate-200'}`}></div>
                            {new Date(p.data.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
