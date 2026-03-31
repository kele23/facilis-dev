import { H3Event } from 'nitro/h3';

export const logger = {
  info: (message: string, event?: H3Event) => console.log(`[INFO] ${message}`),
  error: (message: string, event?: H3Event) => console.error(`[ERROR] ${message}`),
};
