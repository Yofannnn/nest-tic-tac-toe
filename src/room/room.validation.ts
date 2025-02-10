import { z } from 'zod';

export class RoomValidation {
  static CREATEROOM = z.object({
    name: z
      .string()
      .min(3, { message: 'Name must be at least 3 characters long' })
      .regex(/^(?!\s*$).+/, { message: 'Name cant be only space' })
      .trim(),
    player1_id: z.number(),
    password: z.number().min(6, { message: 'Password should be 6 characters' }).optional(),
  });

  static JOINROOM = z.object({
    room_id: z.number({ message: 'room_id is required' }),
    player2_id: z.number(),
    password: z.number().min(6, { message: 'Password should be 6 characters' }).optional(),
  });
}
