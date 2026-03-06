import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface InfoTipProps {
    text: string;
    /** When 'inline', renders description text below. When 'icon' (default), renders a hoverable ⓘ icon. */
    variant?: 'icon' | 'inline';
    className?: string;
}

export function InfoTip({ text, variant = 'icon', className = '' }: InfoTipProps) {
    const [visible, setVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, align: 'top' });
    const iconRef = useRef<HTMLButtonElement>(null);

    const updatePosition = () => {
        if (visible && iconRef.current) {
            const rect = iconRef.current.getBoundingClientRect();
            const align = rect.top < 150 ? 'bottom' : 'top';
            setCoords({
                top: rect.top + window.scrollY + (align === 'bottom' ? rect.height + 8 : -8),
                left: rect.left + window.scrollX + rect.width / 2,
                align
            });
        }
    };

    useEffect(() => {
        updatePosition();
        if (visible) {
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
        }
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [visible]);

    if (variant === 'inline') {
        return (
            <p className={`text-[11px] text-slate-400 leading-relaxed mt-1 font-medium ${className}`}>
                {text}
            </p>
        );
    }

    const tooltipContent = visible ? createPortal(
        <div
            className="absolute z-[9999] w-64 px-3 py-2.5 text-[11px] leading-relaxed font-normal normal-case tracking-normal text-slate-700 bg-white border border-slate-200 rounded-xl shadow-2xl pointer-events-none transition-opacity duration-150 transform -translate-x-1/2 animate-in fade-in zoom-in-95"
            style={{ top: coords.top, left: coords.left, transform: `translate(-50%, ${coords.align === 'top' ? '-100%' : '0'})` }}
        >
            <div className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-slate-200 rotate-45
                ${coords.align === 'top' ? 'bottom-[-5px] border-b border-r' : 'top-[-5px] border-t border-l'}`}
            />
            {text}
        </div>,
        document.body
    ) : null;

    return (
        <span className={`relative inline-flex items-center ${className}`}>
            <button
                ref={iconRef}
                type="button"
                onMouseEnter={() => setVisible(true)}
                onMouseLeave={() => setVisible(false)}
                onClick={(e) => { e.stopPropagation(); setVisible(v => !v); }}
                className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-all cursor-help focus:outline-none focus:ring-2 focus:ring-blue-200"
                aria-label="More information"
            >
                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
            </button>
            {tooltipContent}
        </span>
    );
}
