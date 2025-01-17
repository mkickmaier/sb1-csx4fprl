import React, { useState, useRef, useEffect } from 'react';
import { CircleDot, Save, RotateCcw, List, X, Trash2, MousePointer2, Undo2 } from 'lucide-react';

interface Position {
  x: number;
  y: number;
}

interface Token {
  id: string;
  position: Position;
  team: 'home' | 'away';
  isHighlighted?: boolean;
}

interface Zone {
  id: string;
  start: Position;
  end: Position;
}

interface SavedState {
  name: string;
  state: {
    tokens: Token[];
    ball: Position;
    zones: Zone[];
  };
}

interface HistoryState {
  tokens: Token[];
  ball: Position;
  zones: Zone[];
}

// Initial formation configuration
const getInitialTokens = (): Token[] => [
  // Home team (orange) 4-3-3
  { id: 'h1', position: { x: 50, y: 90 }, team: 'home' }, // GK
  { id: 'h2', position: { x: 20, y: 65 }, team: 'home' }, // Defenders
  { id: 'h3', position: { x: 40, y: 70 }, team: 'home' },
  { id: 'h4', position: { x: 60, y: 70 }, team: 'home' },
  { id: 'h5', position: { x: 80, y: 65 }, team: 'home' },
  { id: 'h6', position: { x: 30, y: 45 }, team: 'home' }, // Midfielders
  { id: 'h7', position: { x: 50, y: 55 }, team: 'home' },
  { id: 'h8', position: { x: 70, y: 45 }, team: 'home' },
  { id: 'h9', position: { x: 10, y: 30 }, team: 'home' }, // Forwards
  { id: 'h10', position: { x: 50, y: 30 }, team: 'home' },
  { id: 'h11', position: { x: 90, y: 30 }, team: 'home' },
  // Away team (white) 4-2-3-1
  { id: 'a1', position: { x: 50, y: 10 }, team: 'away' }, // GK
  { id: 'a2', position: { x: 20, y: 30 }, team: 'away' }, // Defenders
  { id: 'a3', position: { x: 40, y: 30 }, team: 'away' },
  { id: 'a4', position: { x: 60, y: 30 }, team: 'away' },
  { id: 'a5', position: { x: 80, y: 30 }, team: 'away' },
  { id: 'a6', position: { x: 35, y: 40 }, team: 'away' }, // Defensive Midfielders
  { id: 'a7', position: { x: 65, y: 40 }, team: 'away' },
  { id: 'a8', position: { x: 25, y: 50 }, team: 'away' }, // Attacking Midfielders
  { id: 'a9', position: { x: 50, y: 50 }, team: 'away' },
  { id: 'a10', position: { x: 75, y: 50 }, team: 'away' },
  { id: 'a11', position: { x: 50, y: 65 }, team: 'away' }, // Striker
];

function App() {
  const [tokens, setTokens] = useState<Token[]>(getInitialTokens());
  const [ball, setBall] = useState<Position>({ x: 50, y: 50 });
  const [draggingToken, setDraggingToken] = useState<string | null>(null);
  const [isDraggingBall, setIsDraggingBall] = useState(false);
  const [isSaveModalOpen, setSaveModalOpen] = useState(false);
  const [isLoadModalOpen, setLoadModalOpen] = useState(false);
  const [stateName, setStateName] = useState('');
  const [savedStates, setSavedStates] = useState<SavedState[]>([]);
  const [isHighlightMode, setIsHighlightMode] = useState(false);
  const [isDrawingZone, setIsDrawingZone] = useState(false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [currentZone, setCurrentZone] = useState<Partial<Zone> | null>(null);
  const [isDrawingFirstPoint, setIsDrawingFirstPoint] = useState(false);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('footballTacticsStates');
    if (saved) {
      setSavedStates(JSON.parse(saved));
    }
  }, []);

  const saveToHistory = () => {
    setHistory(prev => [...prev, { tokens, ball, zones }]);
  };

  const handleUndo = () => {
    const previousState = history[history.length - 1];
    if (previousState) {
      setTokens(previousState.tokens);
      setBall(previousState.ball);
      setZones(previousState.zones);
      setHistory(prev => prev.slice(0, -1));
    }
  };

  const clearHighlights = () => {
    setTokens(tokens.map(token => ({ ...token, isHighlighted: false })));
  };

  const handleBoardClick = (e: React.MouseEvent) => {
    if (!isDrawingZone) return;

    if (!boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (!isDrawingFirstPoint) {
      setCurrentZone({ id: crypto.randomUUID(), start: { x, y } });
      setIsDrawingFirstPoint(true);
    } else {
      if (currentZone?.start) {
        const newZone = { ...currentZone, end: { x, y } } as Zone;
        saveToHistory();
        setZones([...zones, newZone]);
        setCurrentZone(null);
        setIsDrawingFirstPoint(false);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!boardRef.current) return;

    const rect = boardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (draggingToken) {
      setTokens(tokens.map(token =>
        token.id === draggingToken
          ? { ...token, position: { x, y } }
          : token
      ));
    }

    if (isDraggingBall) {
      setBall({ x, y });
    }

    if (isDrawingZone && isDrawingFirstPoint && currentZone?.start) {
      setCurrentZone(prev => prev ? { ...prev, end: { x, y } } : null);
    }
  };

  const handleMouseDown = (tokenId: string) => {
    if (!isHighlightMode && !isDrawingZone) {
      setDraggingToken(tokenId);
    }
  };

  const handleBallMouseDown = () => {
    if (!isHighlightMode && !isDrawingZone) {
      setIsDraggingBall(true);
    }
  };

  const handleMouseUp = () => {
    if (draggingToken || isDraggingBall) {
      saveToHistory();
    }
    setDraggingToken(null);
    setIsDraggingBall(false);
  };

  const handleDeleteZone = (zoneId: string) => {
    saveToHistory();
    setZones(zones.filter(zone => zone.id !== zoneId));
  };

  const handleDrawingModeToggle = () => {
    setIsDrawingZone(!isDrawingZone);
    setIsHighlightMode(false);
    setCurrentZone(null);
    setIsDrawingFirstPoint(false);
  };

  const handleSaveState = () => {
    if (!stateName.trim()) return;

    const newState: SavedState = {
      name: stateName,
      state: {
        tokens,
        ball,
        zones
      }
    };

    const newStates = [...savedStates, newState];
    setSavedStates(newStates);
    localStorage.setItem('footballTacticsStates', JSON.stringify(newStates));
    setStateName('');
    setSaveModalOpen(false);
  };

  const handleLoadState = (state: SavedState) => {
    saveToHistory();
    setTokens(state.state.tokens);
    setBall(state.state.ball);
    setZones(state.state.zones);
    setLoadModalOpen(false);
  };

  const handleDeleteState = (index: number) => {
    const newStates = savedStates.filter((_, i) => i !== index);
    setSavedStates(newStates);
    localStorage.setItem('footballTacticsStates', JSON.stringify(newStates));
  };

  const handleReset = () => {
    saveToHistory();
    setTokens(getInitialTokens());
    setBall({ x: 50, y: 50 });
    setZones([]);
    clearHighlights();
  };

  return (
    <div className="h-screen bg-gray-900 flex items-center justify-center p-4">
      {/* Controls - Now on the left side */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
        <div className="bg-gray-800 p-3 rounded-lg space-y-2">
          {/* Mode Controls */}
          <div className="space-y-2 border-b border-gray-700 pb-2 mb-2">
            <button
              onClick={() => {
                setIsHighlightMode(!isHighlightMode);
                setIsDrawingZone(false);
                setCurrentZone(null);
                setIsDrawingFirstPoint(false);
                if (!isHighlightMode) clearHighlights();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors w-full
                ${isHighlightMode
                  ? 'bg-yellow-600 hover:bg-yellow-700'
                  : 'bg-gray-600 hover:bg-gray-700'} text-white`}
            >
              <MousePointer2 className="w-4 h-4" />
              <span className="whitespace-nowrap">{isHighlightMode ? 'Exit Highlight' : 'Highlight'}</span>
            </button>
            <button
              onClick={handleDrawingModeToggle}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors w-full
                ${isDrawingZone
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'bg-gray-600 hover:bg-gray-700'} text-white`}
            >
              <span className="whitespace-nowrap">
                {isDrawingZone
                  ? isDrawingFirstPoint
                    ? 'Click to complete zone'
                    : 'Click to start zone'
                  : 'Draw Zone'}
              </span>
            </button>
          </div>

          {/* State Controls */}
          <div className="space-y-2 border-b border-gray-700 pb-2">
            <button
              onClick={() => setSaveModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors w-full"
            >
              <Save className="w-4 h-4" />
              <span className="whitespace-nowrap">Save</span>
            </button>
            <button
              onClick={() => setLoadModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full"
            >
              <List className="w-4 h-4" />
              <span className="whitespace-nowrap">Load</span>
            </button>
          </div>

          {/* History Controls */}
          <div className="space-y-2">
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors w-full
                disabled:opacity-50 disabled:cursor-not-allowed
                bg-red-600 hover:bg-red-700 text-white"
            >
              <Undo2 className="w-4 h-4" />
              <span className="whitespace-nowrap">Undo</span>
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors w-full"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="whitespace-nowrap">Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Save Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Save State</h2>
              <button onClick={() => setSaveModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              value={stateName}
              onChange={(e) => setStateName(e.target.value)}
              placeholder="Enter state name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
            />
            <button
              onClick={handleSaveState}
              className="w-full bg-green-600 text-white rounded-lg py-2 hover:bg-green-700 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Load Modal */}
      {isLoadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Load State</h2>
              <button onClick={() => setLoadModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {savedStates.map((state, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <span className="font-medium">{state.name}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLoadState(state)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => handleDeleteState(index)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {savedStates.length === 0 && (
                <p className="text-gray-500 text-center py-4">No saved states</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div
        ref={boardRef}
        className="h-full aspect-[2/3] bg-gray-800 relative rounded-lg overflow-hidden cursor-move"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleBoardClick}
      >
        {/* Field markings */}
        <div className="absolute inset-0 p-4">
          <div className="w-full h-full border-2 border-orange-500 relative">
            {/* Center circle */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-orange-500 rounded-full" />
            <div className="absolute left-1/2 top-1/2 w-1 h-1 -translate-x-1/2 -translate-y-1/2 bg-orange-500 rounded-full" />

            {/* Center line */}
            <div className="absolute left-0 top-1/2 w-full h-0.5 -translate-y-1/2 bg-orange-500" />

            {/* Penalty areas */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 border-2 border-orange-500" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-24 border-2 border-orange-500" />

            {/* Goal areas */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-8 border-2 border-orange-500" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-8 border-2 border-orange-500" />
          </div>
        </div>

        {/* Zones */}
        {zones.map((zone) => (
          <div
            key={zone.id}
            className="absolute bg-yellow-500 bg-opacity-20 border-2 border-yellow-500 border-opacity-50"
            style={{
              left: `${Math.min(zone.start.x, zone.end.x)}%`,
              top: `${Math.min(zone.start.y, zone.end.y)}%`,
              width: `${Math.abs(zone.end.x - zone.start.x)}%`,
              height: `${Math.abs(zone.end.y - zone.start.y)}%`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteZone(zone.id);
            }}
          />
        ))}

        {/* Current Zone Preview */}
        {currentZone?.start && currentZone.end && (
          <div
            className="absolute bg-yellow-500 bg-opacity-20 border-2 border-yellow-500 border-opacity-50"
            style={{
              left: `${Math.min(currentZone.start.x, currentZone.end.x)}%`,
              top: `${Math.min(currentZone.start.y, currentZone.end.y)}%`,
              width: `${Math.abs(currentZone.end.x - currentZone.start.x)}%`,
              height: `${Math.abs(currentZone.end.y - currentZone.start.y)}%`,
            }}
          />
        )}

        {/* Players */}
        {tokens.map((token) => (
          <div
            key={token.id}
            className={`absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full cursor-move
              ${token.team === 'home' ? 'bg-orange-500' : 'bg-white'}
              ${token.isHighlighted ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-gray-800' : ''}`}
            style={{ left: `${token.position.x}%`, top: `${token.position.y}%` }}
            onMouseDown={() => handleMouseDown(token.id)}
            onClick={(e) => {
              e.stopPropagation();
              if (isHighlightMode) {
                setTokens(tokens.map(t =>
                  t.id === token.id
                    ? { ...t, isHighlighted: !t.isHighlighted }
                    : t
                ));
              }
            }}
          />
        ))}

        {/* Ball */}
        <div
          className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 cursor-move"
          style={{ left: `${ball.x}%`, top: `${ball.y}%` }}
          onMouseDown={handleBallMouseDown}
        >
          <CircleDot className="w-full h-full text-white" />
        </div>
      </div>
    </div>
  );
}

export default App;