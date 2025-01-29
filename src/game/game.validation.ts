import { z } from 'zod';

export class GameValidation {
  static ROOM = z.object({
    name: z.string().min(3).trim(),
    player1_id: z.number(),
  });

  static MOVE = z.object({
    room_id: z.number(),
    player_id: z.number(),
    position: z.number(),
  });

  static HISTORY = z.object({
    room_id: z.number(),
    player1_id: z.number(),
    player2_id: z.number(),
    player1_: z.number(),
    player2_: z.number(),
  });
}
