import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, FastForward, Rewind, AlertTriangle, Cpu } from 'lucide-react';

const TRACKS = [
  {
    id: 1,
    title: 'SECTOR_1_ANOMALY.WAV',
    artist: 'SYS_ADMIN',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    id: 2,
    title: 'CORRUPTED_CACHE_DUMP',
    artist: 'KERNEL_PANIC',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'
  },
  {
    id: 3,
    title: 'M:\\AUD_LOG_0X9A',
    artist: 'UNKNOWN_ENTITY',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3'
  }
];

const GRID_SIZE = 20;
const CANVAS_SIZE = 400;
const CELL_SIZE = CANVAS_SIZE / GRID_SIZE;
const SPEED_MS = 80;

function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);
  
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => savedCallback.current(), delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

export default function App() {
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [gameOver, setGameOver] = useState(false);
  const [isGaming, setIsGaming] = useState(false);
  const [score, setScore] = useState(0);

  const dirRef = useRef({ x: 0, y: -1 });
  const lastTickDir = useRef({ x: 0, y: -1 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const startGame = useCallback(() => {
    setSnake([{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }]);
    dirRef.current = { x: 0, y: -1 };
    lastTickDir.current = { x: 0, y: -1 };
    setScore(0);
    setGameOver(false);
    setIsGaming(true);
    setFood({
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    });
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }
    if (!isGaming) {
      if (e.key === ' ' || e.key === 'Enter') {
        startGame();
      }
      return;
    }
    const { x, y } = lastTickDir.current;
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W': if (y !== 1) dirRef.current = { x: 0, y: -1 }; break;
      case 'ArrowDown':
      case 's':
      case 'S': if (y !== -1) dirRef.current = { x: 0, y: 1 }; break;
      case 'ArrowLeft':
      case 'a':
      case 'A': if (x !== 1) dirRef.current = { x: -1, y: 0 }; break;
      case 'ArrowRight':
      case 'd':
      case 'D': if (x !== -1) dirRef.current = { x: 1, y: 0 }; break;
    }
  }, [isGaming, startGame]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const gameLoop = useCallback(() => {
    if (gameOver || !isGaming) return;
    setSnake((prev) => {
      const head = prev[0];
      const dir = dirRef.current;
      lastTickDir.current = dir;
      const newHead = { x: head.x + dir.x, y: head.y + dir.y };
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        setGameOver(true); setIsGaming(false); return prev;
      }
      if (prev.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
        setGameOver(true); setIsGaming(false); return prev;
      }
      const newSnake = [newHead, ...prev];
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        let freshFood = {
          x: Math.floor(Math.random() * GRID_SIZE),
          y: Math.floor(Math.random() * GRID_SIZE)
        };
        while (newSnake.some(seg => seg.x === freshFood.x && seg.y === freshFood.y)) {
          freshFood = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
          };
        }
        setFood(freshFood);
      } else {
        newSnake.pop();
      }
      return newSnake;
    });
  }, [gameOver, isGaming, food]);

  useInterval(gameLoop, isGaming && !gameOver ? SPEED_MS : null);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = '#010101';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // Abstract grid
    ctx.strokeStyle = '#ff00ff22';
    ctx.lineWidth = 1;
    for (let i = 0; i <= CANVAS_SIZE; i += CELL_SIZE) {
      if (i % (CELL_SIZE * 4) === 0) {
        ctx.strokeStyle = '#00ffff33'; 
      } else {
        ctx.strokeStyle = '#ff00ff22';
      }
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_SIZE); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(CANVAS_SIZE, i); ctx.stroke();
    }

    // Draw Food (magenta block with cyan outline)
    ctx.fillStyle = '#ff00ff';
    ctx.shadowBlur = 0;
    ctx.fillRect(food.x * CELL_SIZE + 1, food.y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(food.x * CELL_SIZE, food.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

    // Draw Snake
    snake.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? '#ffffff' : '#00ffff';
      ctx.fillRect(seg.x * CELL_SIZE, seg.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      ctx.strokeStyle = '#ff00ff';
      ctx.lineWidth = 1;
      ctx.strokeRect(seg.x * CELL_SIZE, seg.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    });

  }, [snake, food]);

  const togglePlay = () => {
    if (isPlaying) { audioRef.current?.pause(); } 
    else { audioRef.current?.play().catch(() => setIsPlaying(false)); }
    setIsPlaying(!isPlaying);
  };

  const skipNext = useCallback(() => { setCurrentTrack(t => (t + 1) % TRACKS.length); }, []);
  const skipPrev = () => { setCurrentTrack(t => (t - 1 + TRACKS.length) % TRACKS.length); };

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const updateProgress = () => { setProgress((audio.currentTime / audio.duration) * 100 || 0); };
    audio.addEventListener('timeupdate', updateProgress);
    return () => audio.removeEventListener('timeupdate', updateProgress);
  }, []);

  return (
    <div className="min-h-screen bg-[#010101] text-[#00ffff] flex flex-col items-center justify-center p-4 relative select-none">
      <div className="static-noise"></div>
      <div className="scanlines"></div>
      
      <div className="absolute top-4 left-4 flex gap-2 items-center text-sm opacity-80 animate-pulse font-mono tracking-widest z-10 text-[#00ffff]">
        <Cpu size={16} className="text-[#ff00ff]" />
        <span>SYS.MEM_ALLOC: OK</span>
      </div>
      
      <div className="z-10 flex flex-col xl:flex-row gap-12 items-center xl:items-stretch justify-center max-w-6xl w-full">
        
        {/* LEFT COLUMN: IDENT/SYS_STATUS */}
        <div className="flex flex-col gap-8 w-full max-w-[380px] xl:w-1/3 text-lg font-mono tracking-wide">
          <div className="border-4 border-[#00ffff] bg-[#010101] p-6 box-glitch relative">
            <h1 className="text-4xl sm:text-5xl font-display uppercase text-white glitch-text mb-4" data-text="Ouroboros.EXE">
              Ouroboros.EXE
            </h1>
            <div className="h-px w-full bg-[#ff00ff] mb-4"></div>
            <div className="space-y-4 mb-8 text-[#00ffff]">
               <p>{'>'} STATUS: <br/><span className={isGaming ? 'text-white' : gameOver ? 'text-[#ff00ff]' : ''}>{isGaming ? 'EXECUTING DYNAMICS' : gameOver ? 'FATAL COLLISION' : 'AWAITING INPUT'}</span></p>
               <p>{'>'} CYCLE_COUNT: <br/><span className="text-[#ff00ff] font-bold text-3xl">{score}</span> / MAX_BUFF</p>
               <p>{'>'} ENTITY_LOC: <br/>[{snake[0].x.toString().padStart(2, '0')}, {snake[0].y.toString().padStart(2, '0')}]</p>
            </div>
            <button 
              onClick={startGame}
              className="w-full py-4 border-2 border-[#ff00ff] bg-[#ff00ff]/10 hover:bg-[#ff00ff] hover:text-black text-[#ff00ff] font-display text-xl uppercase tracking-widest transition-all box-glitch group"
            >
              <span className="group-hover:animate-ping absolute inset-0 bg-[#ff00ff] opacity-0 group-hover:opacity-20 transition-all"></span>
              {isGaming ? 'OVERRIDE PROTOCOL' : gameOver ? 'REBOOT INSTANCE' : 'INITIATE KINETIC SEQ'}
            </button>
          </div>
        </div>

        {/* CENTER COLUMN: OVERRIDE SIGHT */}
        <div className="flex-shrink-0 bg-[#010101] border-4 border-[#ff00ff] p-2 box-glitch relative overflow-hidden h-fit self-center">
          <div className="scan-line-horizontal"></div>
          <div className="relative">
            <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} className="bg-[#010101] block max-w-full h-auto aspect-square" />
            
            {!isGaming && !gameOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-[2px] cursor-pointer" onClick={startGame}>
                <div className="text-center font-display glitch-text" data-text="AWAITING LINK">
                  <span className="text-4xl text-white">AWAITING LINK</span>
                  <div className="mt-8 text-[#ff00ff] text-xl animate-pulse tracking-widest font-mono">[ CLICK TO ENGAGE ]</div>
                </div>
              </div>
            )}
            {gameOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="text-center border-4 border-[#ff00ff] p-8 bg-[#000] box-glitch">
                  <AlertTriangle size={56} className="mx-auto mb-6 text-[#ff00ff]" />
                  <h2 className="text-4xl font-display text-white glitch-text uppercase tracking-widest" data-text="KERNEL PANIC">KERNEL PANIC</h2>
                  <p className="mt-6 text-xl font-mono text-[#00ffff]">SEGMENTATION FAULT AT CYCLE <span className="text-white">{score}</span></p>
                  <button onClick={startGame} className="mt-8 px-6 py-2 border-2 border-[#ff00ff] text-[#ff00ff] font-mono hover:bg-[#ff00ff] hover:text-black uppercase tracking-widest transition-colors box-glitch">
                    RECONNECT PIPELINE
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: AUDIO SUBSYSTEM */}
        <div className="flex flex-col gap-8 w-full max-w-[380px] xl:w-1/3 font-mono text-lg tracking-wide">
          <div className="border-4 border-[#ff00ff] bg-[#010101] p-6 box-glitch">
            <h2 className="text-xl uppercase tracking-widest text-[#ff00ff] border-b-2 border-[#00ffff] pb-2 mb-6 font-display">
              AUD_CONTROLLER_V1.0
            </h2>
            
            <div className="bg-black border-2 border-[#00ffff] p-4 mb-6 relative">
               <div className="absolute top-0 right-0 p-1 text-[#ff00ff] text-xs">ACTV</div>
               <p className="text-white mb-2 whitespace-nowrap overflow-hidden text-ellipsis uppercase">
                 {'> '} <span className={isPlaying ? 'glitch-text text-[#00ffff]' : ''} data-text={TRACKS[currentTrack].title}>{TRACKS[currentTrack].title}</span>
               </p>
               <p className="text-[#ff00ff] text-sm uppercase opacity-90 mb-6 font-bold tracking-widest">OP: {TRACKS[currentTrack].artist}</p>
               
               {/* Progress bar */}
               <div className="w-full h-6 border-2 border-[#ff00ff] relative overflow-hidden bg-black mt-2">
                 <div className="h-full bg-[#00ffff] opacity-80" style={{ width: `${progress}%` }}></div>
                 <div className="absolute inset-0 flex space-x-[2px] p-[2px]">
                    {[...Array(30)].map((_, i) => (
                      <div key={i} className="h-full w-2 bg-black/40"></div>
                    ))}
                 </div>
               </div>
            </div>
            
            <div className="flex justify-between items-center gap-4">
              <button onClick={skipPrev} className="flex-1 py-4 bg-[#010101] border-2 border-[#00ffff] text-[#00ffff] flex justify-center hover:bg-[#00ffff] hover:text-black transition-colors">
                <Rewind size={24} />
              </button>
              <button onClick={togglePlay} className="flex-[2] py-4 bg-[#ff00ff] text-black font-display text-xl tracking-widest flex justify-center items-center gap-2 hover:bg-white transition-colors">
                {isPlaying ? <><Pause size={24}/> STALL</> : <><Play size={24}/> PUSH</>}
              </button>
              <button onClick={skipNext} className="flex-1 py-4 bg-[#010101] border-2 border-[#00ffff] text-[#00ffff] flex justify-center hover:bg-[#00ffff] hover:text-black transition-colors">
                <FastForward size={24} />
              </button>
            </div>
            
            <div className="mt-8 pt-4 border-t-2 border-dashed border-[#ff00ff]/50 text-sm text-[#ff00ff] opacity-80 uppercase leading-relaxed text-center">
              [WARNING: AUDIO STREAM MAY INDUCE COGNITIVE LEAKAGE]
            </div>
          </div>
        </div>

      </div>
      
      <audio ref={audioRef} src={TRACKS[currentTrack].url} onEnded={skipNext} preload="auto" />
    </div>
  );
}
