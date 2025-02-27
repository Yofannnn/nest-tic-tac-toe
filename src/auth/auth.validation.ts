import { z } from 'zod';

export class AuthValidation {
  static REGISTER = z.object({
    name: z
      .string()
      .max(100)
      .min(2, { message: 'Name must be at least 2 characters long' })
      .regex(/^(?!\s*$).+/, { message: 'Name cant be only space' })
      .trim(),
    email: z.string().email({ message: 'Please enter a valid email' }).trim(),
    password: z
      .string()
      .min(8, { message: 'Be at least 8 characters long' })
      .regex(/[a-zA-Z]/, { message: 'Contain at least one letter' })
      .regex(/[0-9]/, { message: 'Contain at least one number' })
      .regex(/[^a-zA-Z0-9]/, {
        message: 'Contain at least one special character',
      })
      .regex(/^\S*$/, { message: 'Cannot contain spaces' })
      .trim(),
  });

  static LOGIN = z.object({
    email: z.string().email({ message: 'Please enter a valid email' }).trim(),
    password: z
      .string()
      .min(8, { message: 'Be at least 8 characters long' })
      .regex(/[a-zA-Z]/, { message: 'Contain at least one letter' })
      .regex(/[0-9]/, { message: 'Contain at least one number' })
      .regex(/[^a-zA-Z0-9]/, {
        message: 'Contain at least one special character',
      })
      .regex(/^\S*$/, { message: 'Cannot contain spaces' })
      .trim(),
  });
}
