import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma.service';
import { ValidationService } from 'src/common/validation.service';
import { GameValidation } from './game.validation';
import { IGameState } from 'src/types/game.type';
import { ROOM_STATUS } from 'src/types/room.type';

@Injectable()
export class GameService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private validationService: ValidationService,
    private prismaService: PrismaService,
  ) {}

  async getGamePlayers(room_id: number) {
    this.logger.info(`Get player information at Room ${room_id}`);
    if (!room_id) throw new BadRequestException('Missing Room Id.');
    const room = await this.prismaService.room.findUnique({ where: { id: room_id } });
    if (!room) throw new NotFoundException('Room not found.');

    const player1 = await this.prismaService.user.findUnique({ where: { id: room.player1_id } });
    const player2 = await this.prismaService.user.findUnique({ where: { id: room.player2_id as number } });
    if (!player1 || !player2) throw new NotFoundException('Player not found.');

    return {
      player_1: { id: player1.id, name: player1.name },
      player_2: { id: player2.id, name: player2.name },
    };
  }

  async initializeGame(room_id: number): Promise<IGameState> {
    this.logger.info(`Initialize Game at room ${room_id}`);
    if (!room_id) throw new BadRequestException('Missing Room Id.');

    const room = await this.prismaService.room.findUnique({ where: { id: room_id } });

    if (!room) throw new NotFoundException('Room not found.');
    if (!room.player2_id) throw new BadRequestException('Cannot start game without Player 2.');
    if ((room.status as ROOM_STATUS) === ROOM_STATUS.FINISHED) throw new BadRequestException('Game already finished.');

    let prevWinner: number | null = null;

    const gameState = await this.prismaService.gameState.findUnique({ where: { room_id } });

    if (!gameState) {
      // initialize match history in first game
      await this.prismaService.matchHistory.create({
        data: {
          room_id: room.id,
          player1_id: room.player1_id,
          player2_id: room.player2_id,
          duration: 0,
          player1_score: 0,
          player2_score: 0,
        },
      });
    }

    if (gameState && gameState.status === 'active') throw new BadRequestException('Game already started.');

    if (gameState?.winner) prevWinner = gameState.winner; // make first turn is the previous winner

    if (gameState) await this.prismaService.gameState.delete({ where: { room_id } });

    const newGameState = await this.prismaService.gameState.create({
      data: {
        room_id,
        board: JSON.stringify(['', '', '', '', '', '', '', '', '']),
        turn: prevWinner || room.player1_id,
      },
    });

    return { ...newGameState, board: JSON.parse(newGameState.board) as string[] };
  }

  async getGameState(room_id: number): Promise<IGameState> {
    const gameState = await this.prismaService.gameState.findUnique({ where: { room_id } });
    if (!gameState) throw new NotFoundException('Game not found.');

    return {
      ...gameState,
      board: JSON.parse(gameState.board) as string[],
    };
  }

  async getGameHistory(room_id: number) {
    this.logger.info(`Get Game History at room ${room_id}`);
    if (!room_id) throw new BadRequestException('Missing Room Id.');

    const matchHistory = await this.prismaService.matchHistory.findUnique({ where: { room_id } });

    return matchHistory;
  }

  async makeMove(request: { room_id: number; player_id: number; position: number }): Promise<IGameState> {
    const makeMoveRequest = this.validationService.validate(GameValidation.MOVE, request);
    this.logger.info(
      `Player ${makeMoveRequest.player_id} made a move in Room ${request.room_id} at position ${request.position}`,
    );

    const room = await this.prismaService.room.findUnique({ where: { id: makeMoveRequest.room_id } });
    const gameState = await this.getGameState(request.room_id);

    if (!room) throw new NotFoundException('Room not found.');
    if (!gameState) throw new NotFoundException('Game not found.');
    if (gameState.status === 'ended') throw new BadRequestException('Game already ended.');
    if (gameState.turn !== makeMoveRequest.player_id) throw new BadRequestException('Not your turn.');
    if (gameState.board[makeMoveRequest.position] !== '') throw new BadRequestException('Cell already occupied.');
    if (gameState.winner) throw new BadRequestException('Game already ended.');

    // Assign 'X' to player1 and 'O' to player2
    const symbol = gameState.turn === room.player1_id ? 'X' : 'O';
    gameState.board[makeMoveRequest.position] = symbol;

    const winner = this.checkWinner(gameState.board);
    if (winner) {
      gameState.status = winner === 'draw' ? 'draw' : 'ended';
      gameState.winner = winner === 'X' ? room.player1_id : room.player2_id;

      await this.prismaService.matchHistory.update({
        where: { room_id: makeMoveRequest.room_id },
        data: {
          player1_score: { increment: winner === 'X' ? 1 : 0 },
          player2_score: { increment: winner === 'O' ? 1 : 0 },
          draw_score: { increment: winner === 'draw' ? 1 : 0 },
        },
      });
    }

    // Switch turn
    gameState.turn = gameState.turn === room.player1_id && room.player2_id ? room.player2_id : room?.player1_id;

    // Update game state in DB
    await this.prismaService.gameState.update({
      where: { room_id: makeMoveRequest.room_id },
      data: {
        board: JSON.stringify(gameState.board),
        turn: gameState.turn,
        winner: gameState.winner,
        status: gameState.status,
      },
    });

    // store game moves in DB
    await this.prismaService.gameMoves.create({
      data: {
        room_id: makeMoveRequest.room_id,
        player_id: makeMoveRequest.player_id,
        position: makeMoveRequest.position,
      },
    });

    return gameState;
  }

  checkWinner(board: string[]): 'X' | 'O' | 'draw' | null {
    const winningCombinations = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (const [a, b, c] of winningCombinations) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a] as 'X' | 'O';
      }
    }

    return board.includes('') ? null : 'draw'; // If no empty cells, it's a draw
  }
}
