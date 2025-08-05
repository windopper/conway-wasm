import React from 'react';
import { createPortal } from 'react-dom';
import { PATTERNS } from './pattern.js';
import { useDarkMode } from '../DarkModeContext';

// 패턴 미리보기 컴포넌트
const PatternPreview = ({ pattern, size = 60 }) => {
    const { isDarkMode } = useDarkMode();
    const cellSize = Math.min(size / Math.max(pattern.length, pattern[0].length), 8);
    const canvasWidth = pattern[0].length * (cellSize + 1) + 1;
    const canvasHeight = pattern.length * (cellSize + 1) + 1;
    
    const drawPattern = (ctx) => {
        // 배경
        ctx.fillStyle = isDarkMode ? '#1f2937' : '#FFFFFF';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // 격자
        ctx.strokeStyle = isDarkMode ? '#374151' : '#E5E7EB';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        for (let i = 0; i <= pattern[0].length; i++) {
            ctx.moveTo(i * (cellSize + 1) + 1, 0);
            ctx.lineTo(i * (cellSize + 1) + 1, canvasHeight);
        }
        for (let j = 0; j <= pattern.length; j++) {
            ctx.moveTo(0, j * (cellSize + 1) + 1);
            ctx.lineTo(canvasWidth, j * (cellSize + 1) + 1);
        }
        ctx.stroke();
        
        // 셀
        ctx.fillStyle = isDarkMode ? '#8b5cf6' : '#667eea';
        for (let r = 0; r < pattern.length; r++) {
            for (let c = 0; c < pattern[0].length; c++) {
                if (pattern[r][c]) {
                    ctx.fillRect(
                        c * (cellSize + 1) + 1,
                        r * (cellSize + 1) + 1,
                        cellSize,
                        cellSize
                    );
                }
            }
        }
    };

    return (
        <canvas
            width={canvasWidth}
            height={canvasHeight}
            style={{ 
                border: `1px solid ${isDarkMode ? '#374151' : '#E5E7EB'}`,
                borderRadius: '4px',
                backgroundColor: isDarkMode ? '#1f2937' : '#FFFFFF'
            }}
            ref={(canvas) => {
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    drawPattern(ctx);
                }
            }}
        />
    );
};

export default function Menu({ onPatternSelect, selectedPattern, isOpen, onClose }) {
    const { isDarkMode } = useDarkMode();
    // 패턴 타입별로 그룹화
    const grouped = PATTERNS.reduce((acc, p) => {
        acc[p.type] = acc[p.type] || [];
        acc[p.type].push(p);
        return acc;
    }, {});

    const handlePatternSelect = (pattern) => {
        onPatternSelect(pattern);
        onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-5" onClick={onClose}>
            <div 
                className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-[90vw] max-h-[90vh] overflow-hidden animate-[modalSlideIn_0.3s_cubic-bezier(0.4,0,0.2,1)] border border-white/20 dark:border-gray-700/20"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-8 py-6 border-b border-indigo-100 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-t-3xl">
                    <h2 className="text-xl font-semibold m-0">Pattern</h2>
                    <button 
                        className="bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-400 cursor-pointer p-2 rounded-lg transition-all duration-200 flex items-center justify-center hover:bg-indigo-200 dark:hover:bg-indigo-700" 
                        onClick={onClose}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
                
                <div className="px-8 py-8 max-h-[60vh] overflow-y-auto">
                    {Object.entries(grouped).map(([type, patterns]) => (
                        <div key={type} className="mb-8">
                            <div className="text-indigo-500 dark:text-indigo-400 text-lg font-semibold mb-4 pb-2 border-b-2 border-indigo-100 dark:border-indigo-800">{type}</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {patterns.map(pattern => (
                                    <button
                                        key={pattern.name}
                                        className={`bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl p-4 cursor-pointer transition-all duration-300 text-left font-inherit ${selectedPattern && selectedPattern.name === pattern.name ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/50 shadow-lg' : 'hover:border-indigo-500 dark:hover:border-indigo-400 hover:-translate-y-0.5 hover:shadow-lg'}`}
                                        onClick={() => handlePatternSelect(pattern)}
                                    >
                                        <div className="flex flex-col items-center gap-3">
                                            <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{pattern.name}</span>
                                            <PatternPreview pattern={pattern.data} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>,
        document.body
    );
}