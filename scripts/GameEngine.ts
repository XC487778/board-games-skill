import { GameType, Player, GameState, GameConfig, GameInfo, GameAction, GameResult, Position } from './types';

/**
 * 基础游戏引擎类
 */
export abstract class GameEngine {
  protected gameInfo: GameInfo;
  protected board: any[][];
  protected isAIThinking: boolean = false;

  constructor(config: GameConfig) {
    this.gameInfo = {
      id: this.generateGameId(),
      type: config.gameType,
      state: GameState.WAITING,
      currentPlayer: Player.BLACK,
      players: this.initializePlayers(config.playerCount),
      config: config,
      startTime: new Date(),
      moveHistory: []
    };
    
    this.board = this.initializeBoard(config);
  }

  // 生成游戏ID
  private generateGameId(): string {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 初始化玩家
  private initializePlayers(count: number): Player[] {
    const players: Player[] = [];
    for (let i = 0; i < count; i++) {
      players.push(Player.BLACK); // 简化处理，实际应根据游戏类型分配
    }
    return players;
  }

  // 初始化棋盘
  protected abstract initializeBoard(config: GameConfig): any[][];

  // 检查位置是否有效
  protected isValidPosition(position: Position): boolean {
    const { width, height } = this.gameInfo.config.boardSize || { width: 15, height: 15 };
    return position.x >= 0 && position.x < width && position.y >= 0 && position.y < height;
  }

  // 检查位置是否为空
  protected isEmptyPosition(position: Position): boolean {
    if (!this.isValidPosition(position)) return false;
    return this.board[position.y][position.x] === null;
  }

  // 执行移动
  public makeMove(position: Position, player: Player): boolean {
    if (!this.isValidPosition(position)) {
      throw new Error('Invalid position');
    }

    if (this.gameInfo.state !== GameState.PLAYING) {
      throw new Error('Game is not in playing state');
    }

    if (player !== this.gameInfo.currentPlayer) {
      throw new Error('Not your turn');
    }

    if (!this.isEmptyPosition(position)) {
      throw new Error('Position already occupied');
    }

    // 验证移动是否合法（子类实现）
    if (!this.isValidMove(position, player)) {
      throw new Error('Invalid move');
    }

    // 执行移动
    this.board[position.y][position.x] = player;
    this.gameInfo.lastMove = position;

    // 记录移动历史
    const action: GameAction = {
      type: 'move',
      player,
      position,
      message: `Player ${player} moved to (${position.x}, ${position.y})`
    };
    this.gameInfo.moveHistory.push(action);

    // 检查游戏是否结束
    if (this.checkWin(position, player)) {
      this.endGame(player, 'win');
      return true;
    }

    // 切换玩家
    this.switchPlayer();
    return true;
  }

  // 投降
  public resign(player: Player): void {
    if (this.gameInfo.state !== GameState.PLAYING) {
      throw new Error('Game is not in playing state');
    }

    if (player !== this.gameInfo.currentPlayer) {
      throw new Error('Not your turn');
    }

    this.endGame(null, 'resign');
  }

  // 暂停游戏
  public pause(): void {
    if (this.gameInfo.state === GameState.PLAYING) {
      this.gameInfo.state = GameState.PAUSED;
    }
  }

  // 恢复游戏
  public resume(): void {
    if (this.gameInfo.state === GameState.PAUSED) {
      this.gameInfo.state = GameState.PLAYING;
    }
  }

  // 重新开始游戏
  public restart(): void {
    this.board = this.initializeBoard(this.gameInfo.config);
    this.gameInfo.state = GameState.WAITING;
    this.gameInfo.currentPlayer = Player.BLACK;
    this.gameInfo.moveHistory = [];
    this.gameInfo.startTime = new Date();
    this.gameInfo.result = undefined;
  }

  // 结束游戏
  protected endGame(winner: Player | null, reason: GameResult['reason']): void {
    this.gameInfo.state = GameState.FINISHED;
    
    const result: GameResult = {
      winner,
      reason,
      finalBoard: this.board,
      moveCount: this.gameInfo.moveHistory.length,
      duration: Date.now() - this.gameInfo.startTime.getTime()
    };
    
    this.gameInfo.result = result;
  }

  // 切换玩家
  protected switchPlayer(): void {
    const currentIndex = this.gameInfo.players.indexOf(this.gameInfo.currentPlayer);
    const nextIndex = (currentIndex + 1) % this.gameInfo.players.length;
    this.gameInfo.currentPlayer = this.gameInfo.players[nextIndex];
  }

  // 抽象方法，子类必须实现
  protected abstract isValidMove(position: Position, player: Player): boolean;
  protected abstract checkWin(position: Position, player: Player): boolean;

  // 获取游戏信息
  public getGameInfo(): GameInfo {
    return { ...this.gameInfo };
  }

  // 获取棋盘状态
  public getBoard(): any[][] {
    return this.board.map(row => [...row]);
  }

  // 获取当前玩家
  public getCurrentPlayer(): Player {
    return this.gameInfo.currentPlayer;
  }

  // 开始游戏
  public startGame(): void {
    this.gameInfo.state = GameState.PLAYING;
  }

  // 获取移动历史
  public getMoveHistory(): GameAction[] {
    return [...this.gameInfo.moveHistory];
  }

  // AI思考（简化实现）
  public async makeAIMove(): Promise<Position | null> {
    if (this.isAIThinking) return null;
    
    this.isAIThinking = true;
    
    // 模拟AI思考延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 简单的AI策略：随机选择有效位置
    const emptyPositions = this.getEmptyPositions();
    if (emptyPositions.length === 0) {
      this.isAIThinking = false;
      return null;
    }

    const randomPosition = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
    this.isAIThinking = false;
    return randomPosition;
  }

  // 获取所有空位置
  protected getEmptyPositions(): Position[] {
    const positions: Position[] = [];
    for (let y = 0; y < this.board.length; y++) {
      for (let x = 0; x < this.board[y].length; x++) {
        if (this.board[y][x] === null) {
          positions.push({ x, y });
        }
      }
    }
    return positions;
  }
}