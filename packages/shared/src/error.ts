import { ErrorMessage as UpstreamErrorMessage } from '@-xun/api-strategy/error';

import { getEnv } from 'universe+backend:env.ts';

/**
 * A collection of possible error and warning messages.
 */
/* istanbul ignore next */
export const ErrorMessage = {
  GuruMeditation: UpstreamErrorMessage.GuruMeditation,
  TooManyFlightIds() {
    return `too many flight_ids specified (max: ${getEnv().RESULTS_PER_PAGE})`;
  },
  InvalidJSON(property?: string) {
    return 'encountered invalid JSON' + (property ? ` in property \`${property}\`` : '');
  },
  InvalidObjectId: (id: unknown) => `invalid ObjectId "${String(id)}"`,
  InvalidSort: () => 'invalid sort',
  MissingRegexAndOrMatch: () => 'missing match and/or regexMatch',
  InvalidMatchObject(hint?: string) {
    return 'invalid match object' + (hint ? `: ${hint}` : '');
  },
  InvalidRegexMatchObject(hint?: string) {
    return 'invalid regexMatch object' + (hint ? `: ${hint}` : '');
  },
  InvalidFlightId() {
    return 'bad flight_id encountered';
  },
  StrangeMatcherError(prop: string) {
    return `matcher "${prop}" is somehow neither primary nor secondary`;
  }
};

export {
  ApiError,
  AuthError,
  ClientValidationError,
  ForbiddenError,
  NotFoundError,
  NotImplementedError,
  SanityError,
  ServerValidationError
} from '@-xun/api-strategy/error';
