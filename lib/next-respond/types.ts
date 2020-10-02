export type SuccessJsonResponse = Record<string, unknown> & { success: true };
export type ErrorJsonResponse = Record<string, unknown> & { error: string, success: false };
export type { HttpStatusCode } from '@ergodark/types';
