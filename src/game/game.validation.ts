import { z } from 'zod';

export class GameValidation {
  static CREATEROOM = z.object({
    name: z
      .string()
      .min(3, { message: 'Name must be at least 3 characters long' })
      .regex(/^(?!\s*$).+/, { message: 'Name cant be only space' })
      .trim(),
    player1_id: z.number(),
  });

  static JOINROOM = z.object({
    room_id: z.number({ message: 'room_id is required' }),
    player2_id: z.number(),
  });

  static MOVE = z.object({
    room_id: z.number({ message: 'room_id is required' }),
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
