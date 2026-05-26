import { ClientValidationError, ErrorMessage } from 'multiverse+shared:error.ts';

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function validateAndParseJson<T>(
  input: string | null | undefined,
  property?: string
): T {
  try {
    return JSON.parse(input || '');
  } catch {
    throw new ClientValidationError(ErrorMessage.InvalidJSON(property));
  }
}
