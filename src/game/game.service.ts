import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma.service';
import { ValidationService } from 'src/common/validation.service';
import { GameValidation } from './game.validation';
import { iResponseRoom, ROOM_STATUS } from 'src/types/game.type';

@Injectable()
export class GameService {
  constructor(
    private validationService: ValidationService,
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private prismaService: PrismaService,
  ) {}

  async getRoomList() {
    this.logger.info(`Get Room`);
    return await this.prismaService.room.findMany({ where: { status: ROOM_STATUS.WAITING } });
  }

  async createRoom(request: { name: string; player1_id: number }): Promise<iResponseRoom> {
    this.logger.info(`Create new Room ${JSON.stringify(request)}`);
    const createRoomRequest = this.validationService.validate(GameValidation.CREATEROOM, request);

    const newRoom = await this.prismaService.room.create({
      data: {
        name: createRoomRequest.name,
        player1_id: createRoomRequest.player1_id,
      },
    });

    return { message: 'Create room success', data: newRoom, user_id: createRoomRequest.player1_id };
  }

  async joinRoom(request: { room_id: number; player2_id: number }): Promise<iResponseRoom> {
    this.logger.info(`Join Room ${JSON.stringify(request)}`);
    const joinRoomRequest = this.validationService.validate(GameValidation.JOINROOM, request);

    const room = await this.prismaService.room.findUnique({ where: { id: joinRoomRequest.room_id } });
    if (!room) throw new NotFoundException('Room not found.');
    if ((room.status as ROOM_STATUS) !== ROOM_STATUS.WAITING) throw new BadRequestException('Room is not available.');
    if (room.player1_id === joinRoomRequest.player2_id) throw new BadRequestException('Player cannot join their own room.');

    const updatedRoom = await this.prismaService.room.update({
      where: { id: joinRoomRequest.room_id },
      data: { player2_id: joinRoomRequest.player2_id, status: ROOM_STATUS.PLAYING },
    });

    return { message: 'Join room success', data: updatedRoom, user_id: joinRoomRequest.player2_id };
  }

  async initializeGame(room_id: number) {
    this.logger.info(`Initialize Game at room ${room_id}`);
    if (!room_id) throw new BadRequestException('Missing Room Id');

    const room = await this.prismaService.room.findUnique({ where: { id: room_id } });

    if (!room) throw new NotFoundException('Room not found.');
    if (!room.player2_id) throw new BadRequestException('Cannot start game without Player 2.');
    if ((room.status as ROOM_STATUS) === ROOM_STATUS.FINISHED) throw new BadRequestException('Game already finished.');

    const gameState = await this.prismaService.gameState.findUnique({ where: { room_id } });

    if (gameState && gameState.status === 'active') throw new BadRequestException('Game already started.');

    if (gameState) await this.prismaService.gameState.delete({ where: { room_id } });

    return await this.prismaService.gameState.create({
      data: {
        room_id,
        board: JSON.stringify(['', '', '', '', '', '', '', '', '']),
        turn: room.player1_id,
      },
    });
  }

  async getGameState(room_id: number) {
    const gameState = await this.prismaService.gameState.findUnique({ where: { room_id } });
    if (!gameState) throw new NotFoundException('Game not found.');

    return {
      ...gameState,
      board: JSON.parse(gameState.board) as string[],
    };
  }

  async makeMove(request: { room_id: number; player_id: number; position: number }) {
    this.logger.info(`Make Move ${JSON.stringify(request)}`);
    const makeMoveRequest = this.validationService.validate(GameValidation.MOVE, request);

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

  async endGame(room_id: number): Promise<{ message: string }> {
    this.logger.info(`End Game ${room_id}`);

    const room = await this.prismaService.room.findUnique({ where: { id: room_id } });
    if (!room) throw new NotFoundException('Room not found.');

    await this.prismaService.gameState.update({
      where: { room_id },
      data: { status: 'ended' },
    });

    await this.prismaService.room.update({
      where: { id: room_id },
      data: { status: ROOM_STATUS.FINISHED },
    });

    return { message: `Room ${room_id} was finished.` };
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
