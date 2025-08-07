import React, { useEffect, useRef, useState } from "react";
// 1. 타입과 구조체는 named import로 가져옵니다.
import init, { Universe, Cell } from "../pkg";
import Menu from "./pattern/Menu";
import Rule from "./Rule";
import { useDarkMode } from "./DarkModeContext";

const GRID_COLOR = "#E5E7EB";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#667eea";

// 다크모드 색상
const DARK_GRID_COLOR = "#374151";
const DARK_DEAD_COLOR = "#1f2937";
const DARK_ALIVE_COLOR = "#8b5cf6";

function GameOfLife() {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [universe, setUniverse] = useState(null);
  const [wasmMemory, setWasmMemory] = useState(null);
  const [isRunning, setIsRunning] = useState(true);
  const [isWasmLoaded, setIsWasmLoaded] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [aliveCells, setAliveCells] = useState(0);
  const [cellSize, setCellSize] = useState(8); // 동적 셀 크기
  const [speed, setSpeed] = useState(100); // 진행 속도(ms)
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [previewPos, setPreviewPos] = useState(null); // {row, col} | null
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);

  const animationRef = useRef(null);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const containerRef = useRef(null);
  const fpsRef = useRef(null);

  // 컨테이너 크기에 맞춰 셀 크기 동적 계산
  useEffect(() => {
    if (!universe) return;
    const width = universe.width();
    const height = universe.height();
    const container = containerRef.current;
    if (!container) return;

    const resize = () => {
      const padding = 32; // 컨테이너 내부 여백 고려
      const maxW = container.clientWidth - padding;
      const maxH = container.clientHeight - padding - 120; // 컨트롤/통계 영역 높이 여유
      const sizeW = Math.floor((maxW - 1) / width) - 1;
      const sizeH = Math.floor((maxH - 1) / height) - 1;
      const newCellSize = Math.max(2, Math.min(sizeW, sizeH));
      setCellSize(newCellSize);
    };
    resize();
    const observer = new window.ResizeObserver(resize);
    observer.observe(container);

    window.addEventListener("resize", resize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [universe]);

  // Wasm 모듈 초기화
  useEffect(() => {
    const loadWasm = async () => {
      try {
        const wasmModule = await init();
        console.log("WebAssembly 모듈 초기화 완료");

        setWasmMemory(wasmModule.memory);

        const newUniverse = Universe.new();
        setUniverse(newUniverse);
        setIsWasmLoaded(true);
      } catch (error) {
        console.error("WebAssembly 모듈 초기화 실패:", error);
      }
    };

    loadWasm();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // 캔버스 마우스 이동 시 프리뷰 위치 계산
  const handleCanvasMouseMove = (event) => {
    if (!selectedPattern || !universe || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const offsetX = (event.clientX - rect.left) * scaleX;
    const offsetY = (event.clientY - rect.top) * scaleY;
    const width = universe.width();
    const height = universe.height();
    const row = Math.min(Math.floor(offsetY / (cellSize + 1)), height - 1);
    const col = Math.min(Math.floor(offsetX / (cellSize + 1)), width - 1);
    setPreviewPos({ row, col });
  };
  // 캔버스에서 마우스가 나가면 프리뷰 숨김
  const handleCanvasMouseLeave = () => {
    setPreviewPos(null);
  };

  // 캔버스 클릭 시 패턴 배치
  const handleCanvasClick = (event) => {
    if (selectedPattern && previewPos && universe && wasmMemory) {
      const { row, col } = previewPos;
      const pattern = selectedPattern.data;
      const width = universe.width();
      const height = universe.height();
      for (let r = 0; r < pattern.length; r++) {
        for (let c = 0; c < pattern[0].length; c++) {
          const cellRow = row + r;
          const cellCol = col + c;
          if (
            cellRow >= 0 &&
            cellRow < height &&
            cellCol >= 0 &&
            cellCol < width
          ) {
            universe.set_cell(
              cellRow,
              cellCol,
              pattern[r][c] ? Cell.Alive : Cell.Dead
            );
          }
        }
      }
      setSelectedPattern(null); // 한 번 배치 후 선택 해제
      setPreviewPos(null);
      // 즉시 그리기 갱신
      drawGrid(ctxRef.current, width, height, cellSize);
      drawCells(ctxRef.current, wasmMemory, universe, width, height, cellSize);
      return;
    }
    // 기존 셀 토글 로직
    if (!universe || !wasmMemory || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const offsetX = (event.clientX - rect.left) * scaleX;
    const offsetY = (event.clientY - rect.top) * scaleY;
    const width = universe.width();
    const height = universe.height();
    const row = Math.min(Math.floor(offsetY / (cellSize + 1)), height - 1);
    const col = Math.min(Math.floor(offsetX / (cellSize + 1)), width - 1);
    const cellsPtr = universe.cells();
    const cells = new Uint8Array(wasmMemory.buffer, cellsPtr, width * height);
    const idx = getIndex(row, col, width);
    const current = cells[idx];
    if (current === Cell.Dead) {
      universe.set_cell(row, col, Cell.Alive);
    } else {
      universe.set_cell(row, col, Cell.Dead);
    }
    drawGrid(ctxRef.current, width, height, cellSize);
    drawCells(ctxRef.current, wasmMemory, universe, width, height, cellSize);
  };

  // 캔버스에 프리뷰 패턴 그리기 (drawCells 이후 호출)
  const drawPatternPreview = (ctx, pattern, pos, CELL_SIZE) => {
    if (!pattern || !pos) return;
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    for (let r = 0; r < pattern.length; r++) {
      for (let c = 0; c < pattern[0].length; c++) {
        if (pattern[r][c]) {
          ctx.fillStyle = isDarkMode ? DARK_ALIVE_COLOR : ALIVE_COLOR;
          ctx.fillRect(
            (pos.col + c) * (CELL_SIZE + 1) + 1,
            (pos.row + r) * (CELL_SIZE + 1) + 1,
            CELL_SIZE,
            CELL_SIZE
          );
        }
      }
    }
    ctx.restore();
  };

  // 캔버스 초기 설정
  useEffect(() => {
    if (!universe || !wasmMemory || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctxRef.current = ctx;
    const width = universe.width();
    const height = universe.height();
    canvas.height = (cellSize + 1) * height + 1;
    canvas.width = (cellSize + 1) * width + 1;
    drawGrid(ctx, width, height, cellSize);
    drawCells(ctx, wasmMemory, universe, width, height, cellSize);
  }, [universe, wasmMemory, cellSize, isDarkMode]);

  // 프리뷰 그리기 (애니메이션 루프와 분리)
  useEffect(() => {
    if (!ctxRef.current || !selectedPattern || !previewPos) return;

    const ctx = ctxRef.current;
    const width = universe.width();
    const height = universe.height();

    // 기존 그리기 유지하면서 프리뷰만 추가
    drawGrid(ctx, width, height, cellSize);
    drawCells(ctx, wasmMemory, universe, width, height, cellSize);
    drawPatternPreview(ctx, selectedPattern.data, previewPos, cellSize);
  }, [selectedPattern, previewPos, cellSize, isDarkMode]);

  const drawGrid = (ctx, width, height, CELL_SIZE) => {
    ctx.beginPath();
    ctx.strokeStyle = isDarkMode ? DARK_GRID_COLOR : GRID_COLOR;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= width; i++) {
      ctx.moveTo(i * (CELL_SIZE + 1) + 1, 0);
      ctx.lineTo(i * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * height + 1);
    }
    for (let j = 0; j <= height; j++) {
      ctx.moveTo(0, j * (CELL_SIZE + 1) + 1);
      ctx.lineTo((CELL_SIZE + 1) * width + 1, j * (CELL_SIZE + 1) + 1);
    }
    ctx.stroke();
  };

  const getIndex = (row, column, width) => {
    return row * width + column;
  };

  // 7. drawCells는 이제 memory 객체를 인자로 받습니다.
  const drawCells = (ctx, memory, universe, width, height, CELL_SIZE) => {
    const cellsPtr = universe.cells();
    const cells = new Uint8Array(memory.buffer, cellsPtr, width * height);

    ctx.beginPath();
    let aliveCount = 0;
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const idx = getIndex(row, col, width);
        if (cells[idx] === Cell.Alive) {
          aliveCount++;
        }
        const deadColor = isDarkMode ? DARK_DEAD_COLOR : DEAD_COLOR;
        const aliveColor = isDarkMode ? DARK_ALIVE_COLOR : ALIVE_COLOR;
        ctx.fillStyle = cells[idx] === Cell.Dead ? deadColor : aliveColor;
        ctx.fillRect(
          col * (CELL_SIZE + 1) + 1,
          row * (CELL_SIZE + 1) + 1,
          CELL_SIZE,
          CELL_SIZE
        );
      }
    }
    setAliveCells(aliveCount);
    ctx.stroke();
  };

  // 애니메이션 루프
  useEffect(() => {
    // const fps = new FPS(fpsRef);
    if (!universe || !wasmMemory || !isRunning || !ctxRef.current) return;

    let lastTime = 0;
    // const interval = 100; // 1초에 10번 = 100ms 간격

    const renderLoop = (currentTime) => {
      if (currentTime - lastTime >= speed) {
        // fps.render();
        universe.tick();
        setGeneration((prev) => prev + 1);

        const width = universe.width();
        const height = universe.height();
        drawGrid(ctxRef.current, width, height, cellSize);
        drawCells(
          ctxRef.current,
          wasmMemory,
          universe,
          width,
          height,
          cellSize
        );

        // 프리뷰가 있으면 다시 그리기
        if (selectedPattern && previewPos) {
          drawPatternPreview(
            ctxRef.current,
            selectedPattern.data,
            previewPos,
            cellSize
          );
        }

        lastTime = currentTime;
      }

      animationRef.current = requestAnimationFrame(renderLoop);
    };

    animationRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [universe, wasmMemory, isRunning, cellSize, speed, isDarkMode]); // isDarkMode 의존성 추가

  const toggleRunning = () => {
    setIsRunning(!isRunning);
  };

  const reset = () => {
    if (isWasmLoaded) {
      setUniverse(Universe.new());
      setGeneration(0);
      const width = universe.width();
      const height = universe.height();
      drawGrid(ctxRef.current, width, height, cellSize);
      drawCells(
        ctxRef.current,
        wasmMemory,
        universe,
        width,
        height,
        cellSize
      );
    }
  };

  const clear = () => {
    if (isWasmLoaded && universe) {
      // 모든 셀을 죽인 상태로 초기화
      const width = universe.width();
      const height = universe.height();
      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          universe.set_cell(row, col, Cell.Dead);
        }
      }
      setGeneration(0);
    }
  };

  if (!isWasmLoaded) {
    return (
      <div className="min-w-screen min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-400 to-purple-500 dark:from-indigo-900 dark:to-purple-900">
        <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-gray-700/20 max-w-[90vw] max-h-[90vh] overflow-auto">
          <div className="flex flex-col items-center gap-4 py-10">
            <div className="loading-spinner w-10 h-10 border-4 border-indigo-200 dark:border-indigo-700 border-t-indigo-500 dark:border-t-indigo-400 rounded-full animate-spin"></div>
            <div className="text-lg text-gray-600 dark:text-gray-300 font-semibold">Loading WebAssembly module...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl p-8 pt-4 shadow-2xl border border-white/20 dark:border-gray-700/20 w-[90vw] h-[95vh] overflow-auto flex flex-col"
      ref={containerRef}
    >
      <div className="relative flex flex-col items-center gap-3 flex-1 min-h-0">
        {/* 버튼 영역 */}
        <div className="flex flex-wrap gap-2 justify-center w-full p-2 pb-4 border-b border-indigo-100 dark:border-indigo-800">
          <button
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-all duration-300 relative overflow-hidden font-inherit cursor-pointer ${isRunning ? "bg-indigo-50 dark:bg-indigo-900/50 text-indigo-500 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-800" : "bg-gradient-to-br from-indigo-400 to-purple-500 dark:from-indigo-500 dark:to-purple-600 text-white shadow-lg hover:-translate-y-0.5 hover:shadow-xl"}`}
            onClick={toggleRunning}
          >
            {isRunning ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
                Pause
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Start
              </>
            )}
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-all duration-300 relative overflow-hidden font-inherit cursor-pointer bg-indigo-50 dark:bg-indigo-900/50 text-indigo-500 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-800" onClick={reset}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
            </svg>
            Restart
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-all duration-300 relative overflow-hidden font-inherit cursor-pointer bg-indigo-50 dark:bg-indigo-900/50 text-indigo-500 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-800" onClick={clear}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
            Reset
          </button>
          <button
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-all duration-300 relative overflow-hidden font-inherit cursor-pointer bg-indigo-50 dark:bg-indigo-900/50 text-indigo-500 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-800"
            onClick={() => setIsModalOpen(true)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Pattern
          </button>
          <button
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-all duration-300 relative overflow-hidden font-inherit cursor-pointer bg-indigo-50 dark:bg-indigo-900/50 text-indigo-500 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-800"
            onClick={() => setIsRuleModalOpen(true)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Rule
          </button>
          <button
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-all duration-300 relative overflow-hidden font-inherit cursor-pointer bg-indigo-50 dark:bg-indigo-900/50 text-indigo-500 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-800"
            onClick={toggleDarkMode}
          >
            {isDarkMode ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            )}
            {isDarkMode ? 'Light' : 'Dark'}
          </button>
          <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/50 px-3 py-2 rounded-lg border border-indigo-100 dark:border-indigo-800 text-indigo-500 dark:text-indigo-400 font-medium text-xs transition-all duration-300 hover:bg-indigo-100 dark:hover:bg-indigo-800">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            <span className="whitespace-nowrap">Speed</span>
            <input
              id="speed-range"
              type="range"
              min="20"
              max="1000"
              step="10"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-24 h-1 rounded bg-indigo-200 dark:bg-indigo-700 outline-none transition-all duration-300 appearance-none"
            />
            <span className="min-w-[40px] text-center font-semibold text-xs">{(1000 / speed).toFixed(1)}/s</span>
          </div>
        </div>
        {/* 통계 영역 */}
        <div className="flex gap-3 justify-center flex-wrap">
          {/* Generation 카드 */}
          <div className="flex flex-col items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 shadow-lg rounded-xl px-2 py-2 min-w-[100px]">
            {/* <div className="mb-1 text-indigo-400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2v2m0 16v2m8-8h2M2 12H4m13.66-6.34l1.42 1.42M4.92 19.08l1.42-1.42M19.08 19.08l-1.42-1.42M6.34 6.34L4.92 4.92" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </div> */}
            <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 leading-tight">{generation}</div>
            <div className="text-xs text-indigo-400 dark:text-indigo-500 font-semibold mt-1 tracking-wider">Generation</div>
          </div>
          {/* Alive Cells 카드 */}
          <div className="flex flex-col items-center justify-center bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/50 dark:to-indigo-900/50 shadow-lg rounded-xl px-2 py-2 min-w-[100px]">
            <div className="text-xl font-extrabold text-purple-600 dark:text-purple-400 leading-tight">{aliveCells}</div>
            <div className="text-xs text-purple-400 dark:text-purple-500 font-semibold mt-1 tracking-wider">Alive</div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center w-full flex-1 min-h-0">
          <canvas
            ref={canvasRef}
            id="game-of-life-canvas"
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 block mx-auto"
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={handleCanvasMouseLeave}
          ></canvas>
        </div>
      </div>
      <Menu
        onPatternSelect={setSelectedPattern}
        selectedPattern={selectedPattern}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      <Rule
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
      />
    </div>
  );
}

export default GameOfLife;
