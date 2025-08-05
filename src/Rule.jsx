import React from "react";
import { createPortal } from 'react-dom';
import { useDarkMode } from './DarkModeContext';

export default function Rule({ isOpen, onClose }) {
  const { isDarkMode } = useDarkMode();

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-5" onClick={onClose}>
      <div 
        className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-[modalSlideIn_0.3s_cubic-bezier(0.4,0,0.2,1)] border border-white/20 dark:border-gray-700/20"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-indigo-100 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-t-3xl">
          <h2 className="text-xl font-semibold m-0">Conway's Game of Life Rules</h2>
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
          <div className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
            <p>
              Conway's Game of Life is based on simple rules that determine the next generation state of living and dead cells. 
              Each cell changes based on the state of its 8 neighboring cells.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 transition-all duration-300">
              <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                Birth
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                A dead cell with <strong className="text-green-600 dark:text-green-400">exactly 3</strong> living neighbors becomes alive in the next generation.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 transition-all duration-300">
              <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                Survival
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                A living cell with <strong className="text-blue-600 dark:text-blue-400">2 or 3</strong> living neighbors survives to the next generation.
              </p>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 transition-all duration-300">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
                </svg>
                Death
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                A living cell with <strong className="text-red-600 dark:text-red-400">1 or fewer</strong> living neighbors (loneliness) or 
                <strong className="text-red-600 dark:text-red-400"> 4 or more</strong> living neighbors (overcrowding) dies in the next generation.
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 transition-all duration-300">
              <p className="text-gray-700 dark:text-gray-300">
                Conway's Game of Life is a cellular automaton devised by John Conway in 1970. 
                It demonstrates how simple rules can create complex patterns and behaviors, 
                making it a beautiful example studied in mathematics, computer science, and biology.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}