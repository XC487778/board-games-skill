import { GameEngine, Player, Position, GameConfig, GameType } from './GameEngine';
import { AnimalChessConfig } from './types';

// 动物棋子类型和等级
enum AnimalType {
  ELEPHANT = 'elephant',    // 象
  LION = 'lion',            // 狮
  TIGER = 'tiger',          // 虎
  LEOPARD = 'leopard',      // 豹
  DOG = 'dog',              // 狗
  WOLF = 'wolf',            // 狼
  CAT = 'cat',              // 猫
  RAT = 'rat'               // 鼠
}

// 棋子等级（用于比较大小）
const ANIMAL_RANKS: Record<AnimalType, number> = {
  [AnimalType.ELEPHANT]: 8,
  [AnimalType.LION]: 7,
  [AnimalType.TIGER]: 6,
  [AnimalType.LEOPARD]: 5,
  [AnimalType.DOG]: 4,
  [AnimalType.WOLF]: 3,
  [AnimalType.CAT]: 2,
  [AnimalType.RAT]: 1
};

interface AnimalPiece {
  type: AnimalType;
  player: Player;
}

/**
 * 斗兽棋游戏引擎
 */
export class AnimalChessEngine extends GameEngine {
  private board: (AnimalPiece | null)[][];
  private boardWidth: number = 7;
  private boardHeight: number = 9;
  private currentPlayer: Player = Player.BLACK;

  constructor(config: AnimalChessConfig) {
    super(config);
    this.board = this.initializeBoard(config);
  }

  // 初始化棋盘
  protected initializeBoard(config: AnimalChessConfig): (AnimalPiece | null)[][] {
    const board: (AnimalPiece | null)[][] = Array(this.boardHeight).fill(null).map(() => Array(this.boardWidth).fill(null));
    
    // 放置动物棋子
    // 玩家1（黑方）的动物
    board[8][0] = { type: AnimalType.LION, player: Player.BLACK };
    board[8][6] = { type: AnimalType.TIGER, player: Player.BLACK };
    board[6][1] = { type: AnimalType.DOG, player: Player.BLACK };
    board[6][5] = { type: AnimalType.CAT, player: Player.BLACK };
    board[7][0] = { type: AnimalType.RAT, player: Player.BLACK };
    board[7][2] = { type: AnimalType.LEOPARD, player: Player.BLACK };
    board[7][4] = { type: AnimalType.WOLF, player: Player.BLACK };
    board[7][6] = { type: AnimalType.ELEPHANT, player: Player.BLACK };
    
    // 玩家2（白方）的动物
    board[0][6] = { type: AnimalType.LION, player: Player.WHITE };
    board[0][0] = { type: AnimalType.TIGER, player: Player.WHITE };
    board[2][5] = { type: AnimalType.DOG, player: Player.WHITE };
    board[2][1] = { type: AnimalType.CAT, player: Player.WHITE };
    board[1][6] = { type: AnimalType.RAT, player: Player.WHITE };
    board[1][4] = { type: AnimalType.LEOPARD, player: Player.WHITE };
    board[1][2] = { type: AnimalType.WOLF, player: Player.WHITE };
    board[1][0] = { type: AnimalType.ELEPHANT, player: Player.WHITE };
    
    return board;
  }

  // 验证移动是否合法
  protected isValidMove(from: Position, to: Position, player: Player): boolean {
    // 检查是否为当前玩家回合
    if (player !== this.currentPlayer) {
      return false;
    }
    
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
    
    // 检查移动规则
    return this.isValidAnimalMove(from, to, piece);
  }

  // 验证动物移动规则
  private isValidAnimalMove(from: Position, to: Position, piece: AnimalPiece): boolean {
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);
    
    // 只能移动到相邻位置
    if (!((dx === 1 && dy === 0) || (dx === 0 && dy === 1))) {
      return false;
    }
    
    // 检查特殊地形规则
    if (this.isWater(to.x, to.y)) {
      // 只有鼠可以进入水中
      if (piece.type !== AnimalType.RAT) {
        return false;
      }
    }
    
    // 检查是否可以吃掉对方棋子
    const targetPiece = this.board[to.y][to.x];
    if (targetPiece) {
      return this.canCapture(piece, targetPiece, to);
    }
    
    return true;
  }

  // 检查是否为水域
  private isWater(x: number, y: number): boolean {
    // 斗兽棋的水域位置（简化版）
    return (x >= 1 && x <= 2 && y >= 3 && y <= 5) || 
           (x >= 4 && x <= 5 && y >= 3 && y <= 5);
  }

  // 检查是否可以吃掉对方棋子
  private canCapture(attacker: AnimalPiece, defender: AnimalPiece, position: Position): boolean {
    const attackerRank = ANIMAL_RANKS[attacker.type];
    const defenderRank = ANIMAL_RANKS[defender.type];
    
    // 鼠可以吃象
    if (attacker.type === AnimalType.RAT && defender.type === AnimalType.ELEPHANT) {
      return true;
    }
    
    // 象不能吃鼠
    if (attacker.type === AnimalType.ELEPHANT && defender.type === AnimalType.RAT) {
      return false;
    }
    
    // 在水中的鼠不能吃岸上的象
    if (attacker.type === AnimalType.RAT && defender.type === AnimalType.ELEPHANT) {
      return this.isWater(position.x, position.y);
    }
    
    // 一般情况：等级高的可以吃等级低的或相同的
    return attackerRank >= defenderRank;
  }

  // 执行移动
  protected makeMoveInternal(from: Position, to: Position, player: Player): boolean {
    if (!this.isValidMove(from, to, player)) {
      return false;
    }
    
    // 执行移动
    this.board[to.y][to.x] = this.board[from.y][from.x];
    this.board[from.y][from.x] = null;
    
    // 检查是否获胜（吃掉了对方的动物或到达对方兽穴）
    if (this.checkWin(to, player)) {
      this.endGame(player, 'all_captured');
    }
    
    // 切换玩家
    this.currentPlayer = this.currentPlayer === Player.BLACK ? Player.WHITE : Player.BLACK;
    
    return true;
  }

  // 检查获胜条件
  protected checkWin(position: Position, player: Player): boolean {
    // 检查是否吃掉了对方的动物（简化：吃掉对方所有动物获胜）
    let opponentAnimals = 0;
    for (let y = 0; y < this.boardHeight; y++) {
      for (let x = 0; x < this.boardWidth; x++) {
        const piece = this.board[y][x];
        if (piece && piece.player !== player) {
          opponentAnimals++;
        }
      }
    }
    
    return opponentAnimals === 0;
  }

  // 获取当前棋盘的可视化表示
  public getBoardDisplay(): string {
    const animalSymbols: Record<AnimalType, string> = {
      [AnimalType.ELEPHANT]: '象',
      [AnimalType.LION]: '狮',
      [AnimalType.TIGER]: '虎',
      [AnimalType.LEOPARD]: '豹',
      [AnimalType.DOG]: '狗',
      [AnimalType.WOLF]: '狼',
      [AnimalType.CAT]: '猫',
      [AnimalType.RAT]: '鼠'
    };
    
    let display = '   ';
    for (let x = 0; x < this.boardWidth; x++) {
      display += x.toString().padStart(2, ' ') + ' ';
    }
    display += '\n';
    
    // 显示水域标识
    const waterCells: Set<string> = new Set();
    for (let y = 3; y <= 5; y++) {
      for (let x = 1; x <= 5; x++) {
        if ((x >= 1 && x <= 2) || (x >= 4 && x <= 5)) {
          waterCells.add(`${x},${y}`);
        }
      }
    }
    
    for (let y = 0; y < this.boardHeight; y++) {
      display += y.toString().padStart(2, ' ') + ' ';
      for (let x = 0; x < this.boardWidth; x++) {
        const piece = this.board[y][x];
        if (piece) {
          const symbol = animalSymbols[piece.type];
          display += piece.player === Player.BLACK ? symbol : symbol.toLowerCase();
          display += ' ';
        } else if (waterCells.has(`${x},${y}`)) {
          display += '~ ';
        } else {
          display += '· ';
        }
      }
      display += '\n';
    }
    
    display += `\n当前回合: ${this.currentPlayer === Player.BLACK ? '黑方' : '白方'}`;
    
    return display;
  }

  // 获取游戏建议
  public getSuggestions(player: Player): Position[] {
    const suggestions: Position[] = [];
    
    for (let y = 0; y < this.boardHeight; y++) {
      for (let x = 0; x < this.boardWidth; x++) {
        const piece = this.board[y][x];
        if (piece && piece.player === player) {
          // 检查四个方向的移动
          const directions = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 }
          ];
          
          for (const dir of directions) {
            const newX = x + dir.x;
            const newY = y + dir.y;
            
            if (newX >= 0 && newX < this.boardWidth && 
                newY >= 0 && newY < this.boardHeight) {
              if (this.isValidMove({ x, y }, { x: newX, y: newY }, player)) {
                suggestions.push({ x, y }, { x: newX, y: newY });
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

  // 获取当前玩家
  public getCurrentPlayer(): Player {
    return this.currentPlayer;
  }

  // 获取动物等级
  public getAnimalRank(animalType: AnimalType): number {
    return ANIMAL_RANKS[animalType];
  }
}