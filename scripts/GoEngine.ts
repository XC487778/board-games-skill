import { GameEngine, Player, Position, GameConfig, GameType } from './GameEngine';
import { GoConfig } from './types';

/**
 * 围棋游戏引擎
 */
export class GoEngine extends GameEngine {
  private board: Player[][];
  private capturedStones: Record<Player, number>;
  private koPosition: Position | null = null;
  private boardHistory: Player[][][] = [];

  constructor(config: GoConfig) {
    super(config);
    this.board = this.initializeBoard(config);
    this.capturedStones = { [Player.BLACK]: 0, [Player.WHITE]: 0 };
  }

  // 初始化棋盘
  protected initializeBoard(config: GoConfig): Player[][] {
    const { boardSize } = config;
    return Array(boardSize).fill(null).map(() => Array(boardSize).fill(null));
  }

  // 验证移动是否合法
  protected isValidMove(position: Position, player: Player): boolean {
    const { boardSize } = this.gameInfo.config as GoConfig;
    
    // 检查位置是否在棋盘范围内
    if (position.x < 0 || position.x >= boardSize || position.y < 0 || position.y >= boardSize) {
      return false;
    }
    
    // 检查位置是否已有棋子
    if (this.board[position.y][position.x] !== null) {
      return false;
    }
    
    // 检查是否为劫（Ko）
    if (this.koPosition && 
        this.koPosition.x === position.x && 
        this.koPosition.y === position.y) {
      return false;
    }
    
    // 临时放置棋子
    this.board[position.y][position.x] = player;
    
    try {
      // 检查是否会吃掉对方的棋子
      const opponent = player === Player.BLACK ? Player.WHITE : Player.BLACK;
      const capturedGroups = this.getCapturedGroups(opponent);
      
      // 检查自己的棋子是否有气
      const ownGroup = this.getGroup(position);
      const ownLiberties = this.getGroupLiberties(ownGroup);
      
      // 如果会吃掉对方棋子，或者自己的棋子有气，则移动合法
      if (capturedGroups.length > 0 || ownLiberties > 0) {
        return true;
      }
      
      return false;
    } finally {
      // 移除临时棋子
      this.board[position.y][position.x] = null;
    }
  }

  // 执行移动
  protected makeMoveInternal(position: Position, player: Player): boolean {
    if (!this.isValidMove(position, player)) {
      return false;
    }
    
    // 保存当前棋盘状态（用于劫的判断）
    this.boardHistory.push(this.board.map(row => [...row]));
    
    // 放置棋子
    this.board[position.y][position.x] = player;
    
    // 吃掉对方无气的棋子
    const opponent = player === Player.BLACK ? Player.WHITE : Player.BLACK;
    const capturedGroups = this.getCapturedGroups(opponent);
    
    for (const group of capturedGroups) {
      for (const stone of group) {
        this.board[stone.y][stone.x] = null;
        this.capturedStones[opponent]++;
      }
    }
    
    // 检查是否形成劫
    if (capturedGroups.length === 1 && capturedGroups[0].length === 1) {
      const lastMove = position;
      const lastBoard = this.boardHistory[this.boardHistory.length - 1];
      
      // 检查是否回到上一个状态
      let isKo = true;
      for (let y = 0; y < this.board.length; y++) {
        for (let x = 0; x < this.board[y].length; x++) {
          if (this.board[y][x] !== lastBoard[y][x]) {
            isKo = false;
            break;
          }
        }
        if (!isKo) break;
      }
      
      if (isKo) {
        this.koPosition = capturedGroups[0][0];
      } else {
        this.koPosition = null;
      }
    } else {
      this.koPosition = null;
    }
    
    return true;
  }

  // 获取被吃掉的棋子组
  private getCapturedGroups(player: Player): Position[][] {
    const capturedGroups: Position[][] = [];
    const visited = new Set<string>();
    
    for (let y = 0; y < this.board.length; y++) {
      for (let x = 0; x < this.board[y].length; x++) {
        if (this.board[y][x] === player && !visited.has(`${x},${y}`)) {
          const group = this.getGroup({ x, y });
          const liberties = this.getGroupLiberties(group);
          
          if (liberties === 0) {
            capturedGroups.push(group);
            for (const stone of group) {
              visited.add(`${stone.x},${stone.y}`);
            }
          }
        }
      }
    }
    
    return capturedGroups;
  }

  // 获取棋子所在的组
  private getGroup(position: Position): Position[] {
    const player = this.board[position.y][position.x];
    if (!player) return [];
    
    const group: Position[] = [];
    const visited = new Set<string>();
    const stack = [position];
    
    while (stack.length > 0) {
      const current = stack.pop()!;
      const key = `${current.x},${current.y}`;
      
      if (visited.has(key)) continue;
      visited.add(key);
      
      if (this.board[current.y][current.x] === player) {
        group.push(current);
        
        // 检查四个方向
        const directions = [
          { x: 1, y: 0 },
          { x: -1, y: 0 },
          { x: 0, y: 1 },
          { x: 0, y: -1 }
        ];
        
        for (const dir of directions) {
          const newX = current.x + dir.x;
          const newY = current.y + dir.y;
          
          if (newX >= 0 && newX < this.board[0].length && 
              newY >= 0 && newY < this.board.length && 
              !visited.has(`${newX},${newY}`)) {
            stack.push({ x: newX, y: newY });
          }
        }
      }
    }
    
    return group;
  }

  // 获取棋子组的气
  private getGroupLiberties(group: Position[]): number {
    const liberties = new Set<string>();
    
    for (const stone of group) {
      const directions = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 }
      ];
      
      for (const dir of directions) {
        const newX = stone.x + dir.x;
        const newY = stone.y + dir.y;
        
        if (newX >= 0 && newX < this.board[0].length && 
            newY >= 0 && newY < this.board.length) {
          if (this.board[newY][newX] === null) {
            liberties.add(`${newX},${newY}`);
          }
        }
      }
    }
    
    return liberties.size;
  }

  // 检查获胜条件（围棋通常不计分，这里简化处理）
  protected checkWin(position: Position, player: Player): boolean {
    // 围棋通常没有简单的获胜条件，这里简化处理
    // 可以根据吃子数量或领地来判断
    const config = this.gameInfo.config as GoConfig;
    if (config.scoringMethod === 'territory') {
      // 简化的领地计算
      return this.calculateTerritory(player) > this.calculateTerritory(player === Player.BLACK ? Player.WHITE : Player.BLACK);
    }
    return false;
  }

  // 计算领地（简化版）
  private calculateTerritory(player: Player): number {
    let territory = 0;
    for (let y = 0; y < this.board.length; y++) {
      for (let x = 0; x < this.board[y].length; x++) {
        if (this.board[y][x] === player) {
          territory++;
        }
      }
    }
    return territory + this.capturedStones[player];
  }

  // 获取当前棋盘的可视化表示
  public getBoardDisplay(): string {
    const { boardSize } = this.gameInfo.config as GoConfig;
    let display = '   ';
    
    // 列号
    for (let x = 0; x < boardSize; x++) {
      display += x.toString().padStart(2, ' ') + ' ';
    }
    display += '\n';
    
    // 棋盘内容
    for (let y = 0; y < boardSize; y++) {
      display += y.toString().padStart(2, ' ') + ' ';
      for (let x = 0; x < boardSize; x++) {
        const cell = this.board[y][x];
        if (cell === Player.BLACK) {
          display += '● ';
        } else if (cell === Player.WHITE) {
          display += '○ ';
        } else {
          // 显示星位
          if (this.isStarPoint(x, y, boardSize)) {
            display += '☆ ';
          } else {
            display += '· ';
          }
        }
      }
      display += '\n';
    }
    
    // 显示吃子信息
    display += `\n黑方吃子: ${this.capturedStones[Player.BLACK]} 白方吃子: ${this.capturedStones[Player.WHITE]}`;
    
    return display;
  }

  // 检查是否为星位
  private isStarPoint(x: number, y: number, boardSize: number): boolean {
    if (boardSize === 9) {
      return (x === 2 && y === 2) || (x === 6 && y === 2) || 
             (x === 4 && y === 4) || (x === 2 && y === 6) || 
             (x === 6 && y === 6);
    } else if (boardSize === 13) {
      return (x === 3 && y === 3) || (x === 9 && y === 3) || 
             (x === 6 && y === 6) || (x === 3 && y === 9) || 
             (x === 9 && y === 9);
    } else if (boardSize === 19) {
      return (x === 3 && y === 3) || (x === 9 && y === 3) || 
             (x === 15 && y === 3) || (x === 3 && y === 9) || 
             (x === 9 && y === 9) || (x === 15 && y === 9) || 
             (x === 3 && y === 15) || (x === 9 && y === 15) || 
             (x === 15 && y === 15);
    }
    return false;
  }

  // 获取游戏建议
  public getSuggestions(player: Player): Position[] {
    const suggestions: Position[] = [];
    const { boardSize } = this.gameInfo.config as GoConfig;
    
    // 优先考虑能吃掉对方棋子的位置
    for (let y = 0; y < boardSize; y++) {
      for (let x = 0; x < boardSize; x++) {
        const position = { x, y };
        if (this.isValidMove(position, player)) {
          // 临时放置棋子
          this.board[position.y][position.x] = player;
          
          try {
            // 检查是否能吃掉对方棋子
            const opponent = player === Player.BLACK ? Player.WHITE : Player.BLACK;
            const capturedGroups = this.getCapturedGroups(opponent);
            
            if (capturedGroups.length > 0) {
              suggestions.push(position);
              if (suggestions.length >= 3) return suggestions;
            }
          } finally {
            // 移除临时棋子
            this.board[position.y][position.x] = null;
          }
        }
      }
    }
    
    // 如果没有吃子机会，选择一些合理的位置
    if (suggestions.length === 0) {
      for (let y = 0; y < boardSize; y++) {
        for (let x = 0; x < boardSize; x++) {
          const position = { x, y };
          if (this.isValidMove(position, player)) {
            suggestions.push(position);
            if (suggestions.length >= 3) return suggestions;
          }
        }
      }
    }
    
    return suggestions;
  }

  // 获取吃子统计
  public getCapturedStones(): Record<Player, number> {
    return { ...this.capturedStones };
  }

  // 获取劫的位置
  public getKoPosition(): Position | null {
    return this.koPosition;
  }

  // 悔棋
  public undoMove(): boolean {
    if (this.boardHistory.length === 0) {
      return false;
    }
    
    this.board = this.boardHistory.pop()!;
    this.koPosition = null;
    return true;
  }
}