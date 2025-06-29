import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RotateCcw, Trophy, Gamepad2, Zap } from 'lucide-react';

const GRID_SIZE = 20;
const CANVAS_SIZE = 400;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const INITIAL_APPLE = { x: 15, y: 15 };

interface Position {
  x: number;
  y: number;
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Position>(INITIAL_DIRECTION);
  const [apple, setApple] = useState<Position>(INITIAL_APPLE);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('snakeHighScore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [gameStarted, setGameStarted] = useState(false);
  
  const gameSpeed = Math.max(100, 200 - score * 2); // Increase speed as score grows

  const generateApple = useCallback((currentSnake: Position[]) => {
    let newApple: Position;
    do {
      newApple = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (currentSnake.some(segment => segment.x === newApple.x && segment.y === newApple.y));
    return newApple;
  }, []);

  const resetGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setApple(INITIAL_APPLE);
    setGameOver(false);
    setScore(0);
    setGameStarted(true);
  }, []);

  const moveSnake = useCallback(() => {
    if (gameOver || !gameStarted) return;

    setSnake(currentSnake => {
      const newSnake = [...currentSnake];
      const head = { ...newSnake[0] };
      
      head.x += direction.x;
      head.y += direction.y;

      // Check wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameOver(true);
        return currentSnake;
      }

      // Check self collision
      if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true);
        return currentSnake;
      }

      newSnake.unshift(head);

      // Check apple collision
      if (head.x === apple.x && head.y === apple.y) {
        setScore(prev => {
          const newScore = prev + 10;
          if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem('snakeHighScore', newScore.toString());
          }
          return newScore;
        });
        setApple(generateApple(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, apple, gameOver, gameStarted, generateApple, highScore]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (!gameStarted || gameOver) return;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        setDirection(prev => prev.y === 0 ? { x: 0, y: -1 } : prev);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setDirection(prev => prev.y === 0 ? { x: 0, y: 1 } : prev);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        setDirection(prev => prev.x === 0 ? { x: -1, y: 0 } : prev);
        break;
      case 'ArrowRight':
        e.preventDefault();
        setDirection(prev => prev.x === 0 ? { x: 1, y: 0 } : prev);
        break;
    }
  }, [gameStarted, gameOver]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  useEffect(() => {
    const gameInterval = setInterval(moveSnake, gameSpeed);
    return () => clearInterval(gameInterval);
  }, [moveSnake, gameSpeed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw grid lines
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      const pos = (i * CANVAS_SIZE) / GRID_SIZE;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, CANVAS_SIZE);
      ctx.moveTo(0, pos);
      ctx.lineTo(CANVAS_SIZE, pos);
      ctx.stroke();
    }

    // Draw snake
    snake.forEach((segment, index) => {
      const x = (segment.x * CANVAS_SIZE) / GRID_SIZE + 2;
      const y = (segment.y * CANVAS_SIZE) / GRID_SIZE + 2;
      const size = (CANVAS_SIZE / GRID_SIZE) - 4;

      if (index === 0) {
        // Snake head - brighter green
        ctx.fillStyle = '#00ff41';
        ctx.shadowColor = '#00ff41';
        ctx.shadowBlur = 10;
        ctx.fillRect(x, y, size, size);
        ctx.shadowBlur = 0;
      } else {
        // Snake body - gradient green
        const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
        gradient.addColorStop(0, '#22c55e');
        gradient.addColorStop(1, '#15803d');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, size, size);
      }
    });

    // Draw apple
    const appleX = (apple.x * CANVAS_SIZE) / GRID_SIZE + 2;
    const appleY = (apple.y * CANVAS_SIZE) / GRID_SIZE + 2;
    const appleSize = (CANVAS_SIZE / GRID_SIZE) - 4;
    
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(appleX + appleSize/2, appleY + appleSize/2, appleSize/2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.shadowBlur = 0;
  }, [snake, apple]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4 relative">
      {/* Bolt Badge */}
      <div className="absolute top-4 right-4 z-10">
        <a
          href="https://bolt.new"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
        >
          <Zap size={16} className="text-yellow-300" />
          <span>Made with Bolt</span>
        </a>
      </div>

      <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Gamepad2 className="text-green-400" size={24} />
            <h1 className="text-2xl font-bold text-white">Snake Game</h1>
          </div>
          
          {/* Score Display */}
          <div className="flex justify-between items-center bg-gray-700 rounded-lg p-3">
            <div className="text-center">
              <div className="text-green-400 text-sm font-medium">Score</div>
              <div className="text-white text-xl font-bold">{score}</div>
            </div>
            <div className="text-center flex items-center gap-1">
              <Trophy className="text-yellow-400" size={16} />
              <div>
                <div className="text-yellow-400 text-sm font-medium">Best</div>
                <div className="text-white text-xl font-bold">{highScore}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Game Canvas */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="border-2 border-gray-600 rounded-lg bg-gray-900"
            />
            
            {/* Game Over Overlay */}
            {gameOver && (
              <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center rounded-lg">
                <div className="text-center">
                  <div className="text-red-400 text-xl font-bold mb-2">Game Over!</div>
                  <div className="text-white text-sm">Final Score: {score}</div>
                </div>
              </div>
            )}

            {/* Start Game Overlay */}
            {!gameStarted && !gameOver && (
              <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center rounded-lg">
                <div className="text-center">
                  <div className="text-green-400 text-xl font-bold mb-2">Ready to Play?</div>
                  <div className="text-white text-sm">Use arrow keys to control</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* Play Again Button */}
          <button
            onClick={resetGame}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-green-500/25"
          >
            <RotateCcw size={18} />
            {gameStarted ? 'Play Again' : 'Start Game'}
          </button>

          {/* Instructions */}
          <div className="text-center text-gray-400 text-sm">
            <div className="mb-2">Use arrow keys to control the snake</div>
            <div className="grid grid-cols-3 gap-1 max-w-32 mx-auto">
              <div></div>
              <div className="bg-gray-700 rounded text-xs py-1">↑</div>
              <div></div>
              <div className="bg-gray-700 rounded text-xs py-1">←</div>
              <div className="bg-gray-700 rounded text-xs py-1">↓</div>
              <div className="bg-gray-700 rounded text-xs py-1">→</div>
            </div>
          </div>
        </div>

        {/* Game Stats */}
        <div className="mt-6 p-4 bg-gray-700 rounded-lg">
          <div className="text-center text-gray-300 text-sm">
            <div>Snake Length: {snake.length}</div>
            <div>Speed Level: {Math.floor(score / 50) + 1}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;