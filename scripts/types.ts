// 游戏类型枚举
export enum GameType {
  GOMOKU = 'gomoku',           // 五子棋
  CHINESE_CHESS = 'chinese-chess', // 中国象棋
  GO = 'go',                   // 围棋
  MILITARY_CHESS = 'military-chess', // 军棋
  AEROPLANE_CHESS = 'aeroplane-chess', // 飞行棋
  ANIMAL_CHESS = 'animal-chess', // 斗兽棋
  TIC_TAC_TOE = 'tic-tac-toe'  // 井字棋
}

// 玩家枚举
export enum Player {
  BLACK = 'black',
  WHITE = 'black',
  RED = 'red',
  GREEN = 'green',
  BLUE = 'blue',
  YELLOW = 'yellow'
}

// 游戏状态枚举
export enum GameState {
  WAITING = 'waiting',
  PLAYING = 'playing',
  PAUSED = 'paused',
  FINISHED = 'finished',
  DRAW = 'draw'
}

// 游戏配置接口
export interface GameConfig {
  gameType: GameType;
  playerCount: number;
  timeLimit?: number; // 时间限制（秒）
  enableForbiddenMoves?: boolean; // 五子棋禁手开关
  difficulty?: 'easy' | 'medium' | 'hard'; // AI难度
  boardSize?: { width: number; height: number }; // 棋盘尺寸
}

// 游戏位置接口
export interface Position {
  x: number;
  y: number;
}

// 游戏动作接口
export interface GameAction {
  type: 'move' | 'pass' | 'resign' | 'restart' | 'pause' | 'resume';
  player: Player;
  position?: Position;
  message?: string;
}

// 游戏结果接口
export interface GameResult {
  winner: Player | null;
  reason: 'win' | 'draw' | 'resign' | 'timeout' | 'forbidden';
  finalBoard: any[][];
  moveCount: number;
  duration: number;
}

// 游戏信息接口
export interface GameInfo {
  id: string;
  type: GameType;
  state: GameState;
  currentPlayer: Player;
  players: Player[];
  config: GameConfig;
  startTime: Date;
  lastMove?: Position;
  moveHistory: GameAction[];
  result?: GameResult;
}

// 五子棋特定配置
export interface GomokuConfig extends GameConfig {
  enableForbiddenMoves: boolean;
  boardSize: { width: number; height: number };
}

// 中国象棋特定配置
export interface ChineseChessConfig extends GameConfig {
  boardSize: { width: number; height: number };
}

// 围棋特定配置
export interface GoConfig extends GameConfig {
  boardSize: { width: number; height: number };
  komi: number; // 贴目
  handicap?: number; // 让子数
}

// 军棋特定配置
export interface MilitaryChessConfig extends GameConfig {
  boardSize: { width: number; height: number };
  revealMode: 'hidden' | 'visible'; // 棋子显示模式
}

// 飞行棋特定配置
export interface AeroplaneChessConfig extends GameConfig {
  playerCount: number;
  diceCount: number;
}

// 斗兽棋特定配置
export interface AnimalChessConfig extends GameConfig {
  boardSize: { width: number; height: number };
}

// 井字棋特定配置
export interface TicTacToeConfig extends GameConfig {
  boardSize: { width: number; height: number };
}

// 游戏配置联合类型
export type GameConfigType = 
  | GomokuConfig 
  | ChineseChessConfig 
  | GoConfig 
  | MilitaryChessConfig 
  | AeroplaneChessConfig 
  | AnimalChessConfig 
  | TicTacToeConfig;