import { GameEngine, Player, Position, GameConfig, GameType } from './GameEngine';
import { GomokuConfig } from './types';

/**
 * 五子棋游戏引擎
 */
export class GomokuEngine extends GameEngine {
  private readonly winLength: number = 5;
  private readonly directions: Position[] = [
    { x: 1, y: 0 },   // 水平
    { x: 0, y: 1 },   // 垂直
    { x: 1, y: 1 },   // 对角线1
    { x: 1, y: -1 }   // 对角线2
  ];

  constructor(config: GomokuConfig) {
    super(config);
  }

  // 初始化棋盘
  protected initializeBoard(config: GomokuConfig): any[][] {
    const { width, height } = config.boardSize;
    return Array(height).fill(null).map(() => Array(width).fill(null));
  }

  // 验证移动是否合法
  protected isValidMove(position: Position, player: Player): boolean {
    // 基本验证由父类完成
    return true;
  }

  // 检查获胜条件
  protected checkWin(position: Position, player: Player): boolean {
    for (const direction of this.directions) {
      if (this.checkDirection(position, direction, player)) {
        return true;
      }
    }
    return false;
  }

  // 检查某个方向是否有连续5个相同棋子
  private checkDirection(position: Position, direction: Position, player: Player): boolean {
    let count = 1;
    
    // 正方向检查
    let currentPos = { x: position.x + direction.x, y: position.y + direction.y };
    while (this.isValidPosition(currentPos) && this.board[currentPos.y][currentPos.x] === player) {
      count++;
      currentPos = { x: currentPos.x + direction.x, y: currentPos.y + direction.y };
    }
    
    // 反方向检查
    currentPos = { x: position.x - direction.x, y: position.y - direction.y };
    while (this.isValidPosition(currentPos) && this.board[currentPos.y][currentPos.x] === player) {
      count++;
      currentPos = { x: currentPos.x - direction.x, y: currentPos.y - direction.y };
    }
    
    return count >= this.winLength;
  }

  // 检查是否为禁手（三三禁手、四四禁手、长连禁手）
  private checkForbiddenMove(position: Position, player: Player): boolean {
    const config = this.gameInfo.config as GomokuConfig;
    if (!config.enableForbiddenMoves) {
      return false;
    }

    // 临时放置棋子
    this.board[position.y][position.x] = player;

    try {
      // 检查长连禁手（超过5个连续）
      if (this.hasOverline(position, player)) {
        return true;
      }

      // 检查双三禁手
      if (this.hasDoubleThree(position, player)) {
        return true;
      }

      // 检查双四禁手
      if (this.hasDoubleFour(position, player)) {
        return true;
      }

      return false;
    } finally {
      // 移除临时棋子
      this.board[position.y][position.x] = null;
    }
  }

  // 检查长连
  private hasOverline(position: Position, player: Player): boolean {
    for (const direction of this.directions) {
      let count = 1;
      
      // 正方向
      let currentPos = { x: position.x + direction.x, y: position.y + direction.y };
      while (this.isValidPosition(currentPos) && this.board[currentPos.y][currentPos.x] === player) {
        count++;
        currentPos = { x: currentPos.x + direction.x, y: currentPos.y + direction.y };
      }
      
      // 反方向
      currentPos = { x: position.x - direction.x, y: position.y - direction.y };
      while (this.isValidPosition(currentPos) && this.board[currentPos.y][currentPos.x] === player) {
        count++;
        currentPos = { x: currentPos.x - direction.x, y: currentPos.y - direction.y };
      }
      
      if (count > 5) {
        return true;
      }
    }
    return false;
  }

  // 检查双三
  private hasDoubleThree(position: Position, player: Player): boolean {
    let threeCount = 0;
    
    for (const direction of this.directions) {
      if (this.isOpenThree(position, direction, player)) {
        threeCount++;
      }
    }
    
    return threeCount >= 2;
  }

  // 检查是否为开放的三连
  private isOpenThree(position: Position, direction: Position, player: Player): boolean {
    // 简化的三连检查逻辑
    let count = 1;
    let openEnds = 0;
    
    // 正方向
    let currentPos = { x: position.x + direction.x, y: position.y + direction.y };
    while (this.isValidPosition(currentPos) && this.board[currentPos.y][currentPos.x] === player) {
      count++;
      currentPos = { x: currentPos.x + direction.x, y: currentPos.y + direction.y };
    }
    
    if (this.isValidPosition(currentPos) && this.board[currentPos.y][currentPos.x] === null) {
      openEnds++;
    }
    
    // 反方向
    currentPos = { x: position.x - direction.x, y: position.y - direction.y };
    while (this.isValidPosition(currentPos) && this.board[currentPos.y][currentPos.x] === player) {
      count++;
      currentPos = { x: currentPos.x - direction.x, y: currentPos.y - direction.y };
    }
    
    if (this.isValidPosition(currentPos) && this.board[currentPos.y][currentPos.x] === null) {
      openEnds++;
    }
    
    return count === 3 && openEnds >= 1;
  }

  // 检查双四
  private hasDoubleFour(position: Position, player: Player): boolean {
    let fourCount = 0;
    
    for (const direction of this.directions) {
      if (this.hasFour(position, direction, player)) {
        fourCount++;
      }
    }
    
    return fourCount >= 2;
  }

  // 检查是否有四连
  private hasFour(position: Position, direction: Position, player: Player): boolean {
    let count = 1;
    
    // 正方向
    let currentPos = { x: position.x + direction.x, y: position.y + direction.y };
    while (this.isValidPosition(currentPos) && this.board[currentPos.y][currentPos.x] === player) {
      count++;
      currentPos = { x: currentPos.x + direction.x, y: currentPos.y + direction.y };
    }
    
    // 反方向
    currentPos = { x: position.x - direction.x, y: position.y - direction.y };
    while (this.isValidPosition(currentPos) && this.board[currentPos.y][currentPos.x] === player) {
      count++;
      currentPos = { x: currentPos.x - direction.x, y: currentPos.y - direction.y };
    }
    
    return count === 4;
  }

  // 重写makeMove以支持禁手检查
  public makeMove(position: Position, player: Player): boolean {
    const config = this.gameInfo.config as GomokuConfig;
    
    // 检查禁手（仅对黑棋）
    if (player === Player.BLACK && config.enableForbiddenMoves) {
      if (this.checkForbiddenMove(position, player)) {
        this.endGame(null, 'forbidden');
        throw new Error('Forbidden move detected');
      }
    }

    return super.makeMove(position, player);
  }

  // 获取当前棋盘的可视化表示
  public getBoardDisplay(): string {
    const { width, height } = this.gameInfo.config.boardSize;
    let display = '   ';
    
    // 列号
    for (let x = 0; x < width; x++) {
      display += x.toString().padStart(2, ' ') + ' ';
    }
    display += '\n';
    
    // 棋盘内容
    for (let y = 0; y < height; y++) {
      display += y.toString().padStart(2, ' ') + ' ';
      for (let x = 0; x < width; x++) {
        const cell = this.board[y][x];
        if (cell === Player.BLACK) {
          display += '● ';
        } else if (cell === Player.WHITE) {
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
  public getSuggestions(player: Player): Position[] {
    const suggestions: Position[] = [];
    const emptyPositions = this.getEmptyPositions();
    
    for (const position of emptyPositions) {
      // 检查是否能形成威胁
      if (this.wouldCreateThreat(position, player)) {
        suggestions.push(position);
      }
    }
    
    // 如果没有威胁，返回一些合理的位置
    if (suggestions.length === 0 && emptyPositions.length > 0) {
      return emptyPositions.slice(0, Math.min(3, emptyPositions.length));
    }
    
    return suggestions;
  }

  // 检查某个位置是否能形成威胁
  private wouldCreateThreat(position: Position, player: Player): boolean {
    // 临时放置棋子
    this.board[position.y][position.x] = player;
    
    try {
      // 检查是否能获胜
      if (this.checkWin(position, player)) {
        return true;
      }
      
      // 检查是否能阻止对手获胜
      const opponent = player === Player.BLACK ? Player.WHITE : Player.BLACK;
      this.board[position.y][position.x] = opponent;
      if (this.checkWin(position, opponent)) {
        return true;
      }
      
      return false;
    } finally {
      // 移除临时棋子
      this.board[position.y][position.x] = null;
    }
  }
}