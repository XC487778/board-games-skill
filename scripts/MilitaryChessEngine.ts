import { GameEngine, Player, Position, GameConfig, GameType } from './GameEngine';
import { MilitaryChessConfig } from './types';

// 棋子类型和等级
enum PieceType {
  COMMANDER = 'commander',  // 司令
  GENERAL = 'general',      // 军长
  MAJOR_GENERAL = 'major_general',  // 师长
  BRIGADIER = 'brigadier',  // 旅长
  COLONEL = 'colonel',      // 团长
  MAJOR = 'major',          // 营长
  CAPTAIN = 'captain',      // 连长
  PLATOON_LEADER = 'platoon_leader', // 排长
  ENGINEER = 'engineer',    // 工兵
  MINE = 'mine',            // 地雷
  BOMB = 'bomb',            // 炸弹
  FLAG = 'flag'             // 军旗
}

// 棋子等级（用于比较大小）
const PIECE_RANKS: Record<PieceType, number> = {
  [PieceType.COMMANDER]: 9,
  [PieceType.GENERAL]: 8,
  [PieceType.MAJOR_GENERAL]: 7,
  [PieceType.BRIGADIER]: 6,
  [PieceType.COLONEL]: 5,
  [PieceType.MAJOR]: 4,
  [PieceType.CAPTAIN]: 3,
  [PieceType.PLATOON_LEADER]: 2,
  [PieceType.ENGINEER]: 1,
  [PieceType.MINE]: 0,
  [PieceType.BOMB]: -1,
  [PieceType.FLAG]: -2
};

interface ChessPiece {
  type: PieceType;
  player: Player;
  revealed: boolean;
}

/**
 * 军棋游戏引擎
 */
export class MilitaryChessEngine extends GameEngine {
  private board: (ChessPiece | null)[][];
  private boardWidth: number = 5;
  private boardHeight: number = 12;
  private gamePhase: 'setup' | 'playing' | 'ended' = 'setup';
  private currentPlayer: Player = Player.BLACK;

  constructor(config: MilitaryChessConfig) {
    super(config);
    this.board = this.initializeBoard(config);
  }

  // 初始化棋盘
  protected initializeBoard(config: MilitaryChessConfig): (ChessPiece | null)[][] {
    const board: (ChessPiece | null)[][] = Array(this.boardHeight).fill(null).map(() => Array(this.boardWidth).fill(null));
    
    // 这里简化处理，实际军棋需要随机布置棋子
    // 玩家1（黑方）的棋子
    board[11][0] = { type: PieceType.FLAG, player: Player.BLACK, revealed: false };
    board[11][1] = { type: PieceType.BOMB, player: Player.BLACK, revealed: false };
    board[11][2] = { type: PieceType.MINE, player: Player.BLACK, revealed: false };
    board[11][3] = { type: PieceType.COMMANDER, player: Player.BLACK, revealed: false };
    board[11][4] = { type: PieceType.GENERAL, player: Player.BLACK, revealed: false };
    
    // 玩家2（白方）的棋子
    board[0][0] = { type: PieceType.FLAG, player: Player.WHITE, revealed: false };
    board[0][1] = { type: PieceType.BOMB, player: Player.WHITE, revealed: false };
    board[0][2] = { type: PieceType.MINE, player: Player.WHITE, revealed: false };
    board[0][3] = { type: PieceType.COMMANDER, player: Player.WHITE, revealed: false };
    board[0][4] = { type: PieceType.GENERAL, player: Player.WHITE, revealed: false };
    
    this.gamePhase = 'playing';
    return board;
  }

  // 验证移动是否合法
  protected isValidMove(from: Position, to: Position, player: Player): boolean {
    // 检查游戏状态
    if (this.gamePhase !== 'playing') {
      return false;
    }
    
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
    return this.isValidPieceMove(from, to, piece);
  }

  // 验证棋子移动规则
  private isValidPieceMove(from: Position, to: Position, piece: ChessPiece): boolean {
    // 军旗和地雷不能移动
    if (piece.type === PieceType.FLAG || piece.type === PieceType.MINE) {
      return false;
    }
    
    // 只能移动到相邻位置（简化规则，实际军棋有铁路和公路）
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);
    
    // 只能上下左右移动一格
    if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
      return true;
    }
    
    return false;
  }

  // 执行移动
  protected makeMoveInternal(from: Position, to: Position, player: Player): boolean {
    if (!this.isValidMove(from, to, player)) {
      return false;
    }
    
    const piece = this.board[from.y][from.x];
    const targetPiece = this.board[to.y][to.x];
    
    if (targetPiece) {
      // 战斗逻辑
      const result = this.battle(piece!, targetPiece);
      
      if (result === 'attacker_wins') {
        this.board[to.y][to.x] = piece!;
        this.board[from.y][from.x] = null;
        
        // 检查是否吃掉了军旗
        if (targetPiece.type === PieceType.FLAG) {
          this.endGame(player, 'flag_captured');
        }
      } else if (result === 'defender_wins') {
        this.board[from.y][from.x] = null;
      } else {
        // 同归于尽
        this.board[from.y][from.x] = null;
        this.board[to.y][to.x] = null;
      }
    } else {
      // 移动到空位置
      this.board[to.y][to.x] = piece!;
      this.board[from.y][from.x] = null;
    }
    
    // 切换玩家
    this.currentPlayer = this.currentPlayer === Player.BLACK ? Player.WHITE : Player.BLACK;
    
    return true;
  }

  // 战斗逻辑
  private battle(attacker: ChessPiece, defender: ChessPiece): 'attacker_wins' | 'defender_wins' | 'draw' {
    // 揭示双方棋子
    attacker.revealed = true;
    defender.revealed = true;
    
    // 炸弹与任何棋子同归于尽
    if (attacker.type === PieceType.BOMB || defender.type === PieceType.BOMB) {
      return 'draw';
    }
    
    // 工兵可以挖地雷
    if (attacker.type === PieceType.ENGINEER && defender.type === PieceType.MINE) {
      return 'attacker_wins';
    }
    
    // 地雷炸死除工兵外的所有棋子
    if (defender.type === PieceType.MINE) {
      return 'defender_wins';
    }
    
    // 比较等级
    const attackerRank = PIECE_RANKS[attacker.type];
    const defenderRank = PIECE_RANKS[defender.type];
    
    if (attackerRank > defenderRank) {
      return 'attacker_wins';
    } else if (attackerRank < defenderRank) {
      return 'defender_wins';
    } else {
      return 'draw';
    }
  }

  // 检查获胜条件
  protected checkWin(position: Position, player: Player): boolean {
    // 检查是否吃掉了对方的军旗
    const piece = this.board[position.y][position.x];
    if (piece && piece.type === PieceType.FLAG && piece.player !== player) {
      return true;
    }
    return false;
  }

  // 获取当前棋盘的可视化表示
  public getBoardDisplay(): string {
    const pieceSymbols: Record<PieceType, string> = {
      [PieceType.COMMANDER]: '司',
      [PieceType.GENERAL]: '军',
      [PieceType.MAJOR_GENERAL]: '师',
      [PieceType.BRIGADIER]: '旅',
      [PieceType.COLONEL]: '团',
      [PieceType.MAJOR]: '营',
      [PieceType.CAPTAIN]: '连',
      [PieceType.PLATOON_LEADER]: '排',
      [PieceType.ENGINEER]: '工',
      [PieceType.MINE]: '雷',
      [PieceType.BOMB]: '炸',
      [PieceType.FLAG]: '旗'
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
          const symbol = pieceSymbols[piece.type];
          if (piece.revealed || piece.player === Player.BLACK) {
            display += symbol + ' ';
          } else {
            display += '? ';
          }
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

  // 揭示棋子
  public revealPiece(position: Position): boolean {
    const piece = this.board[position.y][position.x];
    if (piece && !piece.revealed) {
      piece.revealed = true;
      return true;
    }
    return false;
  }

  // 获取当前玩家
  public getCurrentPlayer(): Player {
    return this.currentPlayer;
  }

  // 设置游戏阶段
  public setGamePhase(phase: 'setup' | 'playing' | 'ended'): void {
    this.gamePhase = phase;
  }
}