import { GameEngine, Player, Position, GameConfig, GameType } from './GameEngine';
import { AirplaneChessConfig } from './types';

// 飞行棋棋子状态
enum PieceStatus {
  BASE = 'base',        // 在基地
  READY = 'ready',      // 准备起飞
  FLYING = 'flying',    // 在飞行中
  FINISHED = 'finished' // 已到达终点
}

interface AirplanePiece {
  id: number;
  player: Player;
  position: number; // 在路径上的位置（0-51为路径，52-55为终点区域）
  status: PieceStatus;
  hasFinished: boolean;
}

/**
 * 飞行棋游戏引擎
 */
export class AirplaneChessEngine extends GameEngine {
  private board: AirplanePiece[][];
  private path: number[]; // 路径坐标映射
  private currentPlayer: Player = Player.BLACK;
  private diceValue: number = 0;
  private consecutiveRolls: number = 0;

  constructor(config: AirplaneChessConfig) {
    super(config);
    this.board = this.initializeBoard(config);
    this.path = this.generatePath();
  }

  // 初始化棋盘
  protected initializeBoard(config: AirplaneChessConfig): AirplanePiece[][] {
    const board: AirplanePiece[][] = [];
    
    // 每个玩家4架飞机
    for (let player = 0; player < 2; player++) {
      board[player] = [];
      for (let i = 0; i < 4; i++) {
        board[player].push({
          id: i,
          player: player === 0 ? Player.BLACK : Player.WHITE,
          position: -1, // -1表示在基地
          status: PieceStatus.BASE,
          hasFinished: false
        });
      }
    }
    
    return board;
  }

  // 生成飞行棋路径
  private generatePath(): number[] {
    const path: number[] = [];
    // 简化的飞行棋路径（52个位置）
    for (let i = 0; i < 52; i++) {
      path.push(i);
    }
    return path;
  }

  // 验证移动是否合法
  protected isValidMove(pieceId: number, player: Player): boolean {
    // 检查是否为当前玩家回合
    if (player !== this.currentPlayer) {
      return false;
    }
    
    // 检查是否有骰子点数
    if (this.diceValue === 0) {
      return false;
    }
    
    const piece = this.board[player === Player.BLACK ? 0 : 1][pieceId];
    
    // 根据骰子点数和棋子状态判断是否可以移动
    if (piece.status === PieceStatus.BASE) {
      // 在基地，需要掷出6才能起飞
      return this.diceValue === 6;
    } else if (piece.status === PieceStatus.READY || piece.status === PieceStatus.FLYING) {
      // 在路径上，可以移动
      return true;
    }
    
    return false;
  }

  // 执行移动
  protected makeMoveInternal(pieceId: number, player: Player): boolean {
    if (!this.isValidMove(pieceId, player)) {
      return false;
    }
    
    const piece = this.board[player === Player.BLACK ? 0 : 1][pieceId];
    const playerIndex = player === Player.BLACK ? 0 : 1;
    
    if (piece.status === PieceStatus.BASE && this.diceValue === 6) {
      // 起飞
      piece.position = playerIndex * 13; // 每个玩家的起始位置
      piece.status = PieceStatus.READY;
      this.consecutiveRolls = 1; // 记录连续掷骰
    } else if (piece.status === PieceStatus.READY || piece.status === PieceStatus.FLYING) {
      // 在路径上移动
      const newPosition = piece.position + this.diceValue;
      
      // 检查是否到达终点
      if (newPosition >= 52) {
        piece.status = PieceStatus.FINISHED;
        piece.hasFinished = true;
        piece.position = 52 + (piece.id % 4); // 终点区域位置
      } else {
        piece.position = newPosition;
        piece.status = PieceStatus.FLYING;
      }
      
      this.consecutiveRolls++;
    }
    
    // 检查是否可以继续掷骰（掷出6可以继续）
    if (this.diceValue !== 6) {
      this.endTurn();
    } else {
      this.diceValue = 0; // 重置骰子，等待再次掷骰
    }
    
    return true;
  }

  // 掷骰子
  public rollDice(): number {
    if (this.diceValue !== 0) {
      return this.diceValue; // 已经掷过骰子
    }
    
    // 模拟掷骰子（1-6）
    this.diceValue = Math.floor(Math.random() * 6) + 1;
    return this.diceValue;
  }

  // 结束回合
  private endTurn(): void {
    // 检查是否有玩家获胜
    const winner = this.checkWinner();
    if (winner) {
      this.endGame(winner, 'all_pieces_finished');
      return;
    }
    
    // 切换玩家
    this.currentPlayer = this.currentPlayer === Player.BLACK ? Player.WHITE : Player.BLACK;
    this.diceValue = 0;
    this.consecutiveRolls = 0;
  }

  // 检查是否获胜
  private checkWinner(): Player | null {
    for (let player = 0; player < 2; player++) {
      const allFinished = this.board[player].every(piece => piece.hasFinished);
      if (allFinished) {
        return player === 0 ? Player.BLACK : Player.WHITE;
      }
    }
    return null;
  }

  // 检查获胜条件
  protected checkWin(position: number, player: Player): boolean {
    // 检查是否所有棋子都到达终点
    const playerIndex = player === Player.BLACK ? 0 : 1;
    return this.board[playerIndex].every(piece => piece.hasFinished);
  }

  // 获取当前棋盘的可视化表示
  public getBoardDisplay(): string {
    let display = '飞行棋棋盘\n';
    display += '========================================\n';
    
    // 显示玩家信息
    display += `当前玩家: ${this.currentPlayer === Player.BLACK ? '黑方' : '白方'}\n`;
    display += `骰子点数: ${this.diceValue}\n`;
    display += `连续掷骰: ${this.consecutiveRolls}\n\n`;
    
    // 显示黑方棋子
    display += '黑方棋子:\n';
    this.board[0].forEach((piece, index) => {
      display += `飞机${index + 1}: `;
      if (piece.hasFinished) {
        display += '已到达终点 ';
      } else if (piece.status === PieceStatus.BASE) {
        display += '在基地 ';
      } else {
        display += `位置${piece.position} `;
      }
      display += '\n';
    });
    
    display += '\n';
    
    // 显示白方棋子
    display += '白方棋子:\n';
    this.board[1].forEach((piece, index) => {
      display += `飞机${index + 1}: `;
      if (piece.hasFinished) {
        display += '已到达终点 ';
      } else if (piece.status === PieceStatus.BASE) {
        display += '在基地 ';
      } else {
        display += `位置${piece.position} `;
      }
      display += '\n';
    });
    
    // 显示简化路径
    display += '\n路径概览:\n';
    for (let i = 0; i < 52; i += 13) {
      display += `区域${i/13 + 1}: `;
      for (let j = 0; j < 13; j++) {
        const pos = i + j;
        const blackPiece = this.board[0].find(p => p.position === pos);
        const whitePiece = this.board[1].find(p => p.position === pos);
        
        if (blackPiece) {
          display += '● ';
        } else if (whitePiece) {
          display += '○ ';
        } else {
          display += '· ';
        }
      }
      display += '\n';
    }
    
    return display;
  }

  // 获取游戏建议
  public getSuggestions(player: Player): number[] {
    const suggestions: number[] = [];
    const playerIndex = player === Player.BLACK ? 0 : 1;
    
    // 如果还没有掷骰子，建议掷骰子
    if (this.diceValue === 0) {
      return [-1]; // -1表示掷骰子
    }
    
    // 检查哪些棋子可以移动
    this.board[playerIndex].forEach((piece, index) => {
      if (this.isValidMove(index, player)) {
        suggestions.push(index);
      }
    });
    
    return suggestions;
  }

  // 获取当前玩家
  public getCurrentPlayer(): Player {
    return this.currentPlayer;
  }

  // 获取骰子点数
  public getDiceValue(): number {
    return this.diceValue;
  }

  // 获取连续掷骰次数
  public getConsecutiveRolls(): number {
    return this.consecutiveRolls;
  }

  // 获取棋子状态
  public getPieceStatus(pieceId: number, player: Player): PieceStatus {
    const playerIndex = player === Player.BLACK ? 0 : 1;
    return this.board[playerIndex][pieceId].status;
  }
}