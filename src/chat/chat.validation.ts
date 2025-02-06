import { z } from 'zod';

export class GameChatValidation {
  static CREATECHAT = z.object({
    room_id: z.number({ message: 'room_id is required' }),
    player_id: z.number({ message: 'player_id is required' }),
    message: z
      .string()
      .max(300, { message: 'Message must be at most 300 characters long' })
      .regex(/^(?!\s*$).+/, { message: 'Name cant be only space' })
      .trim(),
  });
}
