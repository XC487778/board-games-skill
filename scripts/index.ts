import { GameEngine, Player, Position, GameConfig, GameType, GameState } from './GameEngine';
import { GomokuEngine, GomokuConfig } from './GomokuEngine';
import { TicTacToeEngine, TicTacToeConfig } from './TicTacToeEngine';
import { ChineseChessEngine, ChineseChessConfig } from './ChineseChessEngine';
import { GoEngine, GoConfig } from './GoEngine';
import { MilitaryChessEngine, MilitaryChessConfig } from './MilitaryChessEngine';
import { AirplaneChessEngine, AirplaneChessConfig } from './AirplaneChessEngine';
import { AnimalChessEngine, AnimalChessConfig } from './AnimalChessEngine';
import { 
  GameInfo, 
  GameAction, 
  GameResult, 
  BoardSize,
  GomokuConfig as GomokuConfigType,
  TicTacToeConfig as TicTacToeConfigType,
  ChineseChessConfig as ChineseChessConfigType,
  GoConfig as GoConfigType,
  MilitaryChessConfig as MilitaryChessConfigType,
  AirplaneChessConfig as AirplaneChessConfigType,
  AnimalChessConfig as AnimalChessConfigType
} from './types';

// 游戏管理器
export class GameManager {
  private currentGame: GameEngine | null = null;
  private gameHistory: GameEngine[] = [];
  private currentGameType: GameType | null = null;

  // 创建新游戏
  public createGame(gameType: GameType, config?: any): GameEngine {
    this.currentGameType = gameType;
    
    switch (gameType) {
      case GameType.GOMOKU:
        const gomokuConfig: GomokuConfig = {
          boardSize: config?.boardSize || { width: 15, height: 15 },
          enableForbiddenMoves: config?.enableForbiddenMoves || false
        };
        this.currentGame = new GomokuEngine(gomokuConfig);
        break;
        
      case GameType.TIC_TAC_TOE:
        const ticTacToeConfig: TicTacToeConfig = {
          boardSize: config?.boardSize || 3
        };
        this.currentGame = new TicTacToeEngine(ticTacToeConfig);
        break;
        
      case GameType.CHINESE_CHESS:
        const chineseChessConfig: ChineseChessConfig = {};
        this.currentGame = new ChineseChessEngine(chineseChessConfig);
        break;
        
      case GameType.GO:
        const goConfig: GoConfig = {
          boardSize: config?.boardSize || 19,
          scoringMethod: config?.scoringMethod || 'territory'
        };
        this.currentGame = new GoEngine(goConfig);
        break;
        
      case GameType.MILITARY_CHESS:
        const militaryChessConfig: MilitaryChessConfig = {};
        this.currentGame = new MilitaryChessEngine(militaryChessConfig);
        break;
        
      case GameType.AIRPLANE_CHESS:
        const airplaneChessConfig: AirplaneChessConfig = {};
        this.currentGame = new AirplaneChessEngine(airplaneChessConfig);
        break;
        
      case GameType.ANIMAL_CHESS:
        const animalChessConfig: AnimalChessConfig = {};
        this.currentGame = new AnimalChessEngine(animalChessConfig);
        break;
        
      default:
        throw new Error(`Unsupported game type: ${gameType}`);
    }
    
    return this.currentGame;
  }

  // 获取当前游戏
  public getCurrentGame(): GameEngine | null {
    return this.currentGame;
  }

  // 获取当前游戏类型
  public getCurrentGameType(): GameType | null {
    return this.currentGameType;
  }

  // 切换游戏
  public switchGame(gameType: GameType, config?: any): GameEngine {
    // 保存当前游戏到历史
    if (this.currentGame) {
      this.gameHistory.push(this.currentGame);
    }
    
    // 创建新游戏
    return this.createGame(gameType, config);
  }

  // 获取游戏历史
  public getGameHistory(): GameEngine[] {
    return [...this.gameHistory];
  }

  // 清空历史
  public clearHistory(): void {
    this.gameHistory = [];
  }

  // 获取所有支持的游戏类型
  public getSupportedGames(): GameType[] {
    return [
      GameType.GOMOKU,
      GameType.TIC_TAC_TOE,
      GameType.CHINESE_CHESS,
      GameType.GO,
      GameType.MILITARY_CHESS,
      GameType.AIRPLANE_CHESS,
      GameType.ANIMAL_CHESS
    ];
  }

  // 获取游戏描述
  public getGameDescription(gameType: GameType): string {
    const descriptions = {
      [GameType.GOMOKU]: '五子棋 - 在15×15的棋盘上，先连成五子者获胜',
      [GameType.TIC_TAC_TOE]: '井字棋 - 在3×3的棋盘上，先连成一线者获胜',
      [GameType.CHINESE_CHESS]: '中国象棋 - 传统象棋游戏，目标是将死对方的将帅',
      [GameType.GO]: '围棋 - 在19×19的棋盘上，通过围地来决定胜负',
      [GameType.MILITARY_CHESS]: '军棋 - 暗棋游戏，通过等级比较来吃掉对方军旗',
      [GameType.AIRPLANE_CHESS]: '飞行棋 - 掷骰子移动棋子，先到达终点者获胜',
      [GameType.ANIMAL_CHESS]: '斗兽棋 - 动物棋子按等级吃子，特殊规则：鼠可以吃象'
    };
    
    return descriptions[gameType] || '未知游戏';
  }
}

// 游戏会话管理器
export class GameSession {
  private gameManager: GameManager;
  private currentPlayer: Player = Player.BLACK; // 黑方为用户，白方为AI
  private gameStarted: boolean = false;

  constructor() {
    this.gameManager = new GameManager();
  }

  // 开始新游戏
  public startGame(gameType: GameType, config?: any): void {
    this.gameManager.createGame(gameType, config);
    this.currentPlayer = Player.BLACK;
    this.gameStarted = true;
  }

  // 获取当前游戏
  public getCurrentGame(): GameEngine | null {
    return this.gameManager.getCurrentGame();
  }

  // 获取当前游戏类型
  public getCurrentGameType(): GameType | null {
    return this.gameManager.getCurrentGameType();
  }

  // 获取游戏描述
  public getGameDescription(): string {
    const gameType = this.gameManager.getCurrentGameType();
    if (!gameType) return '没有正在进行的游戏';
    return this.gameManager.getGameDescription(gameType);
  }

  // 用户移动（黑方）
  public userMove(from: Position, to: Position): boolean {
    if (!this.gameStarted || !this.currentGame) {
      return false;
    }
    
    if (this.currentPlayer !== Player.BLACK) {
      return false; // 不是用户的回合
    }
    
    const success = this.currentGame.makeMove(from, to, Player.BLACK);
    
    if (success) {
      // 检查游戏是否结束
      if (this.currentGame.getGameState() === GameState.ENDED) {
        this.endGame();
      } else {
        // 切换到AI回合
        this.currentPlayer = Player.WHITE;
        this.aiMove();
      }
    }
    
    return success;
  }

  // AI移动（白方）
  public aiMove(): void {
    if (!this.gameStarted || !this.currentGame || this.currentPlayer !== Player.WHITE) {
      return;
    }
    
    const gameType = this.gameManager.getCurrentGameType();
    if (!gameType) return;
    
    // 获取AI建议
    const suggestions = this.currentGame.getSuggestions(Player.WHITE);
    
    if (suggestions.length > 0) {
      // 简单AI策略：随机选择一个建议
      const randomIndex = Math.floor(Math.random() * suggestions.length);
      const suggestion = suggestions[randomIndex];
      
      // 根据游戏类型执行不同的移动逻辑
      if (gameType === GameType.AIRPLANE_CHESS) {
        // 飞行棋需要特殊处理
        const airplaneGame = this.currentGame as AirplaneChessEngine;
        if (suggestion === -1) {
          // 掷骰子
          airplaneGame.rollDice();
          setTimeout(() => this.aiMove(), 1000); // 继续AI回合
        } else {
          // 移动棋子
          airplaneGame.makeMoveInternal(suggestion, Player.WHITE);
          if (airplaneGame.getGameState() === GameState.ENDED) {
            this.endGame();
          } else {
            this.currentPlayer = Player.BLACK;
          }
        }
      } else {
        // 其他游戏类型
        if (suggestion.length >= 2) {
          const from = suggestion[0];
          const to = suggestion[1];
          this.currentGame.makeMove(from, to, Player.WHITE);
          
          if (this.currentGame.getGameState() === GameState.ENDED) {
            this.endGame();
          } else {
            this.currentPlayer = Player.BLACK;
          }
        }
      }
    }
  }

  // 获取当前玩家
  public getCurrentPlayer(): Player {
    return this.currentPlayer;
  }

  // 获取游戏状态
  public getGameState(): GameState {
    if (!this.currentGame) return GameState.NOT_STARTED;
    return this.currentGame.getGameState();
  }

  // 结束游戏
  public endGame(): void {
    this.gameStarted = false;
    this.currentPlayer = Player.BLACK;
  }

  // 重新开始游戏
  public restartGame(): void {
    const gameType = this.gameManager.getCurrentGameType();
    if (gameType) {
      this.startGame(gameType);
    }
  }

  // 切换游戏
  public switchGame(gameType: GameType, config?: any): void {
    this.gameManager.switchGame(gameType, config);
    this.currentPlayer = Player.BLACK;
    this.gameStarted = true;
  }

  // 获取所有支持的游戏类型
  public getSupportedGames(): GameType[] {
    return this.gameManager.getSupportedGames();
  }

  // 获取游戏建议
  public getSuggestions(): Position[] | number[] {
    if (!this.currentGame || this.currentPlayer !== Player.BLACK) {
      return [];
    }
    
    return this.currentGame.getSuggestions(Player.BLACK);
  }

  // 获取当前棋盘显示
  public getBoardDisplay(): string {
    if (!this.currentGame) {
      return '没有正在进行的游戏';
    }
    
    return this.currentGame.getBoardDisplay();
  }

  // 获取游戏信息
  public getGameInfo(): GameInfo | null {
    if (!this.currentGame) {
      return null;
    }
    
    return this.currentGame.getGameInfo();
  }
}

// 导出主要类和类型
export {
  GameManager,
  GameSession,
  GomokuEngine,
  TicTacToeEngine,
  ChineseChessEngine,
  GoEngine,
  MilitaryChessEngine,
  AirplaneChessEngine,
  AnimalChessEngine
};

// 默认导出游戏会话管理器
export default GameSession;