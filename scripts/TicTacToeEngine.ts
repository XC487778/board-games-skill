import { GameEngine, Player, Position, GameConfig, GameType } from './GameEngine';
import { TicTacToeConfig } from './types';

/**
 * 井字棋游戏引擎
 */
export class TicTacToeEngine extends GameEngine {
  private board: (Player | null)[][];
  private boardSize: number;

  constructor(config: TicTacToeConfig) {
    super(config);
    this.boardSize = config.boardSize;
    this.board = this.initializeBoard(config);
  }

  // 初始化棋盘
  protected initializeBoard(config: TicTacToeConfig): (Player | null)[][] {
    return Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(null));
  }

  // 验证移动是否合法
  protected isValidMove(position: Position, player: Player): boolean {
    // 检查位置是否在棋盘范围内
    if (position.x < 0 || position.x >= this.boardSize || position.y < 0 || position.y >= this.boardSize) {
      return false;
    }
    
    // 检查位置是否为空
    return this.board[position.y][position.x] === null;
  }

  // 执行移动
  protected makeMoveInternal(position: Position, player: Player): boolean {
    if (!this.isValidMove(position, player)) {
      return false;
    }
    
    this.board[position.y][position.x] = player;
    return true;
  }

  // 检查获胜条件
  protected checkWin(position: Position, player: Player): boolean {
    const size = this.boardSize;
    
    // 检查行
    for (let i = 0; i < size; i++) {
      let win = true;
      for (let j = 0; j < size; j++) {
        if (this.board[i][j] !== player) {
          win = false;
          break;
        }
      }
      if (win) return true;
    }
    
    // 检查列
    for (let i = 0; i < size; i++) {
      let win = true;
      for (let j = 0; j < size; j++) {
        if (this.board[j][i] !== player) {
          win = false;
          break;
        }
      }
      if (win) return true;
    }
    
    // 检查主对角线
    let win = true;
    for (let i = 0; i < size; i++) {
      if (this.board[i][i] !== player) {
        win = false;
        break;
      }
    }
    if (win) return true;
    
    // 检查副对角线
    win = true;
    for (let i = 0; i < size; i++) {
      if (this.board[i][size - 1 - i] !== player) {
        win = false;
        break;
      }
    }
    if (win) return true;
    
    return false;
  }

  // 检查平局
  protected checkDraw(): boolean {
    for (let y = 0; y < this.boardSize; y++) {
      for (let x = 0; x < this.boardSize; x++) {
        if (this.board[y][x] === null) {
          return false;
        }
      }
    }
    return true;
  }

  // 获取当前棋盘的可视化表示
  public getBoardDisplay(): string {
    let display = '   ';
    
    // 列号
    for (let x = 0; x < this.boardSize; x++) {
      display += x.toString().padStart(2, ' ') + ' ';
    }
    display += '\n';
    
    // 棋盘内容
    for (let y = 0; y < this.boardSize; y++) {
      display += y.toString().padStart(2, ' ') + ' ';
      for (let x = 0; x < this.boardSize; x++) {
        const cell = this.board[y][x];
        if (cell === Player.BLACK) {
          display += 'X ';
        } else if (cell === Player.WHITE) {
          display += 'O ';
        } else {
          display += '· ';
        }
      }
      display += '\n';
    }
    
    return display;
  }

  // 获取游戏建议
  public getSuggestions(player: Player): Position[] {
    const suggestions: Position[] = [];
    const emptyPositions = this.getEmptyPositions();
    
    // 优先选择能获胜的位置
    for (const position of emptyPositions) {
      this.board[position.y][position.x] = player;
      if (this.checkWin(position, player)) {
        this.board[position.y][position.x] = null;
        return [position];
      }
      this.board[position.y][position.x] = null;
    }
    
    // 然后选择能阻止对手获胜的位置
    const opponent = player === Player.BLACK ? Player.WHITE : Player.BLACK;
    for (const position of emptyPositions) {
      this.board[position.y][position.x] = opponent;
      if (this.checkWin(position, opponent)) {
        this.board[position.y][position.x] = null;
        suggestions.push(position);
        continue;
      }
      this.board[position.y][position.x] = null;
    }
    
    // 如果没有紧急位置，选择中心位置
    if (suggestions.length === 0) {
      const center = Math.floor(this.boardSize / 2);
      const centerPos = { x: center, y: center };
      if (this.board[center][center] === null) {
        suggestions.push(centerPos);
      }
    }
    
    // 最后返回一些合理的位置
    if (suggestions.length === 0 && emptyPositions.length > 0) {
      return emptyPositions.slice(0, Math.min(3, emptyPositions.length));
    }
    
    return suggestions;
  }

  // 获取所有空位置
  private getEmptyPositions(): Position[] {
    const positions: Position[] = [];
    for (let y = 0; y < this.boardSize; y++) {
      for (let x = 0; x < this.boardSize; x++) {
        if (this.board[y][x] === null) {
          positions.push({ x, y });
        }
      }
    }
    return positions;
  }
}