import { GameEngine, Player, Position, GameConfig, GameType } from './GameEngine';
import { ChineseChessConfig } from './types';

// 棋子类型
enum ChessPieceType {
  GENERAL = 'general',    // 将/帅
  ADVISOR = 'advisor',    // 士/仕
  ELEPHANT = 'elephant',  // 象/相
  HORSE = 'horse',        // 马
  CHARIOT = 'chariot',   // 车
  CANNON = 'cannon',      // 炮
  SOLDIER = 'soldier'     // 兵/卒
}

// 棋子类
interface ChessPiece {
  type: ChessPieceType;
  player: Player;
}

/**
 * 中国象棋游戏引擎
 */
export class ChineseChessEngine extends GameEngine {
  private board: (ChessPiece | null)[][];
  private boardWidth: number = 9;
  private boardHeight: number = 10;

  constructor(config: ChineseChessConfig) {
    super(config);
    this.board = this.initializeBoard(config);
  }

  // 初始化棋盘
  protected initializeBoard(config: ChineseChessConfig): (ChessPiece | null)[][] {
    const board: (ChessPiece | null)[][] = Array(this.boardHeight).fill(null).map(() => Array(this.boardWidth).fill(null));
    
    // 放置红方棋子
    board[9][0] = { type: ChessPieceType.CHARIOT, player: Player.BLACK };
    board[9][1] = { type: ChessPieceType.HORSE, player: Player.BLACK };
    board[9][2] = { type: ChessPieceType.ELEPHANT, player: Player.BLACK };
    board[9][3] = { type: ChessPieceType.ADVISOR, player: Player.BLACK };
    board[9][4] = { type: ChessPieceType.GENERAL, player: Player.BLACK };
    board[9][5] = { type: ChessPieceType.ADVISOR, player: Player.BLACK };
    board[9][6] = { type: ChessPieceType.ELEPHANT, player: Player.BLACK };
    board[9][7] = { type: ChessPieceType.HORSE, player: Player.BLACK };
    board[9][8] = { type: ChessPieceType.CHARIOT, player: Player.BLACK };
    
    board[7][1] = { type: ChessPieceType.CANNON, player: Player.BLACK };
    board[7][7] = { type: ChessPieceType.CANNON, player: Player.BLACK };
    
    for (let i = 0; i < 9; i += 2) {
      board[6][i] = { type: ChessPieceType.SOLDIER, player: Player.BLACK };
    }
    
    // 放置黑方棋子
    board[0][0] = { type: ChessPieceType.CHARIOT, player: Player.WHITE };
    board[0][1] = { type: ChessPieceType.HORSE, player: Player.WHITE };
    board[0][2] = { type: ChessPieceType.ELEPHANT, player: Player.WHITE };
    board[0][3] = { type: ChessPieceType.ADVISOR, player: Player.WHITE };
    board[0][4] = { type: ChessPieceType.GENERAL, player: Player.WHITE };
    board[0][5] = { type: ChessPieceType.ADVISOR, player: Player.WHITE };
    board[0][6] = { type: ChessPieceType.ELEPHANT, player: Player.WHITE };
    board[0][7] = { type: ChessPieceType.HORSE, player: Player.WHITE };
    board[0][8] = { type: ChessPieceType.CHARIOT, player: Player.WHITE };
    
    board[2][1] = { type: ChessPieceType.CANNON, player: Player.WHITE };
    board[2][7] = { type: ChessPieceType.CANNON, player: Player.WHITE };
    
    for (let i = 0; i < 9; i += 2) {
      board[3][i] = { type: ChessPieceType.SOLDIER, player: Player.WHITE };
    }
    
    return board;
  }

  // 验证移动是否合法
  protected isValidMove(from: Position, to: Position, player: Player): boolean {
    // 检查起始位置是否有己方棋子
    const piece = this.board[from.y][from.x];
    if (!piece || piece.player !== player) {
      return false;
    }
    
    // 检查目标位置是否为己方棋子
    const targetPiece = this.board[to.y][to.x];
    if (targetPiece && targetPiece.player === player) {
      return false;
    }
    
    // 根据棋子类型验证移动规则
    return this.isValidPieceMove(from, to, piece);
  }

  // 验证棋子移动规则
  private isValidPieceMove(from: Position, to: Position, piece: ChessPiece): boolean {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    
    switch (piece.type) {
      case ChessPieceType.GENERAL:
        return this.isValidGeneralMove(from, to, piece);
      case ChessPieceType.ADVISOR:
        return this.isValidAdvisorMove(from, to, piece);
      case ChessPieceType.ELEPHANT:
        return this.isValidElephantMove(from, to, piece);
      case ChessPieceType.HORSE:
        return this.isValidHorseMove(from, to, piece);
      case ChessPieceType.CHARIOT:
        return this.isValidChariotMove(from, to, piece);
      case ChessPieceType.CANNON:
        return this.isValidCannonMove(from, to, piece);
      case ChessPieceType.SOLDIER:
        return this.isValidSoldierMove(from, to, piece);
      default:
        return false;
    }
  }

  // 将帅移动规则
  private isValidGeneralMove(from: Position, to: Position, piece: ChessPiece): boolean {
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);
    
    // 只能走一步
    if (dx + dy !== 1) {
      return false;
    }
    
    // 将帅只能在九宫格内移动
    if (piece.player === Player.BLACK) {
      return to.x >= 3 && to.x <= 5 && to.y >= 7 && to.y <= 9;
    } else {
      return to.x >= 3 && to.x <= 5 && to.y >= 0 && to.y <= 2;
    }
  }

  // 士仕移动规则
  private isValidAdvisorMove(from: Position, to: Position, piece: ChessPiece): boolean {
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);
    
    // 只能斜走一步
    if (dx !== 1 || dy !== 1) {
      return false;
    }
    
    // 士仕只能在九宫格内移动
    if (piece.player === Player.BLACK) {
      return to.x >= 3 && to.x <= 5 && to.y >= 7 && to.y <= 9;
    } else {
      return to.x >= 3 && to.x <= 5 && to.y >= 0 && to.y <= 2;
    }
  }

  // 象相移动规则
  private isValidElephantMove(from: Position, to: Position, piece: ChessPiece): boolean {
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);
    
    // 只能走田字
    if (dx !== 2 || dy !== 2) {
      return false;
    }
    
    // 检查象眼是否被堵
    const eyeX = from.x + dx / 2;
    const eyeY = from.y + dy / 2;
    if (this.board[eyeY][eyeX] !== null) {
      return false;
    }
    
    // 象不能过河
    if (piece.player === Player.BLACK) {
      return to.y >= 5;
    } else {
      return to.y <= 4;
    }
  }

  // 马移动规则
  private isValidHorseMove(from: Position, to: Position, piece: ChessPiece): boolean {
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);
    
    // 走日字
    if (!((dx === 1 && dy === 2) || (dx === 2 && dy === 1))) {
      return false;
    }
    
    // 检查马腿是否被堵
    if (dx === 2) {
      const legX = from.x + dx / 2;
      if (this.board[from.y][legX] !== null) {
        return false;
      }
    } else {
      const legY = from.y + dy / 2;
      if (this.board[legY][from.x] !== null) {
        return false;
      }
    }
    
    return true;
  }

  // 车移动规则
  private isValidChariotMove(from: Position, to: Position, piece: ChessPiece): boolean {
    // 只能直线移动
    if (from.x !== to.x && from.y !== to.y) {
      return false;
    }
    
    // 检查路径上是否有棋子
    if (from.x === to.x) {
      const minY = Math.min(from.y, to.y);
      const maxY = Math.max(from.y, to.y);
      for (let y = minY + 1; y < maxY; y++) {
        if (this.board[y][from.x] !== null) {
          return false;
        }
      }
    } else {
      const minX = Math.min(from.x, to.x);
      const maxX = Math.max(from.x, to.x);
      for (let x = minX + 1; x < maxX; x++) {
        if (this.board[from.y][x] !== null) {
          return false;
        }
      }
    }
    
    return true;
  }

  // 炮移动规则
  private isValidCannonMove(from: Position, to: Position, piece: ChessPiece): boolean {
    // 只能直线移动
    if (from.x !== to.x && from.y !== to.y) {
      return false;
    }
    
    let pieceCount = 0;
    
    // 计算路径上的棋子数量
    if (from.x === to.x) {
      const minY = Math.min(from.y, to.y);
      const maxY = Math.max(from.y, to.y);
      for (let y = minY + 1; y < maxY; y++) {
        if (this.board[y][from.x] !== null) {
          pieceCount++;
        }
      }
    } else {
      const minX = Math.min(from.x, to.x);
      const maxX = Math.max(from.x, to.x);
      for (let x = minX + 1; x < maxX; x++) {
        if (this.board[from.y][x] !== null) {
          pieceCount++;
        }
      }
    }
    
    // 炮移动时路径必须为空，吃子时必须隔一个棋子
    const targetPiece = this.board[to.y][to.x];
    if (targetPiece) {
      return pieceCount === 1;
    } else {
      return pieceCount === 0;
    }
  }

  // 兵卒移动规则
  private isValidSoldierMove(from: Position, to: Position, piece: ChessPiece): boolean {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    
    if (piece.player === Player.BLACK) {
      // 红兵只能向前或横向移动
      if (from.y > 4) {
        // 未过河，只能向前
        return dx === 0 && dy === -1;
      } else {
        // 过河后可以向前或横向
        return (dx === 0 && dy === -1) || (Math.abs(dx) === 1 && dy === 0);
      }
    } else {
      // 黑卒只能向前或横向移动
      if (from.y < 5) {
        // 未过河，只能向前
        return dx === 0 && dy === 1;
      } else {
        // 过河后可以向前或横向
        return (dx === 0 && dy === 1) || (Math.abs(dx) === 1 && dy === 0);
      }
    }
  }

  // 执行移动
  protected makeMoveInternal(from: Position, to: Position, player: Player): boolean {
    if (!this.isValidMove(from, to, player)) {
      return false;
    }
    
    this.board[to.y][to.x] = this.board[from.y][from.x];
    this.board[from.y][from.x] = null;
    return true;
  }

  // 检查获胜条件
  protected checkWin(position: Position, player: Player): boolean {
    // 检查是否吃掉了对方的将/帅
    const piece = this.board[position.y][position.x];
    if (piece && piece.type === ChessPieceType.GENERAL && piece.player !== player) {
      return true;
    }
    return false;
  }

  // 获取当前棋盘的可视化表示
  public getBoardDisplay(): string {
    const pieceSymbols: Record<ChessPieceType, string> = {
      [ChessPieceType.GENERAL]: player => player === Player.BLACK ? '帅' : '将',
      [ChessPieceType.ADVISOR]: player => player === Player.BLACK ? '仕' : '士',
      [ChessPieceType.ELEPHANT]: player => player === Player.BLACK ? '相' : '象',
      [ChessPieceType.HORSE]: player => player === Player.BLACK ? '马' : '馬',
      [ChessPieceType.CHARIOT]: player => player === Player.BLACK ? '车' : '車',
      [ChessPieceType.CANNON]: player => player === Player.BLACK ? '炮' : '砲',
      [ChessPieceType.SOLDIER]: player => player === Player.BLACK ? '兵' : '卒'
    };
    
    let display = '    ';
    for (let x = 0; x < this.boardWidth; x++) {
      display += x.toString().padStart(2, ' ') + ' ';
    }
    display += '\n';
    
    for (let y = 0; y < this.boardHeight; y++) {
      display += y.toString().padStart(2, ' ') + ' ';
      for (let x = 0; x < this.boardWidth; x++) {
        const piece = this.board[y][x];
        if (piece) {
          const symbol = pieceSymbols[piece.type](piece.player);
          display += symbol + ' ';
        } else {
          display += '· ';
        }
      }
      display += '\n';
    }
    
    return display;
  }

  // 获取游戏建议（简化版）
  public getSuggestions(player: Player): Position[] {
    const suggestions: Position[] = [];
    
    // 简化的建议逻辑：随机选择一些合法移动
    for (let y = 0; y < this.boardHeight; y++) {
      for (let x = 0; x < this.boardWidth; x++) {
        const piece = this.board[y][x];
        if (piece && piece.player === player) {
          // 为每个棋子生成可能的移动
          for (let ty = 0; ty < this.boardHeight; ty++) {
            for (let tx = 0; tx < this.boardWidth; tx++) {
              if (this.isValidMove({ x, y }, { x: tx, y: ty }, player)) {
                suggestions.push({ x, y }, { x: tx, y: ty });
                if (suggestions.length >= 6) {
                  return suggestions;
                }
              }
            }
          }
        }
      }
    }
    
    return suggestions;
  }
}