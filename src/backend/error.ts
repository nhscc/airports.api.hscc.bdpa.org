import { AppError, makeNamedError } from 'named-app-errors'

export * from 'named-app-errors'

export class FlightGenerationError extends AppError {
    constructor(message?: string) {
        super(message || 'data upsert failed');
    }
}

makeNamedError(FlightGenerationError, 'FlightGenerationError');

export class IdTypeError<T=string|number> extends AppError {
    constructor(id?: T) {
        super(id ? `expected valid ObjectId instance, got "${id}" instead` : 'invalid ObjectId encountered');
    }
}

makeNamedError(IdTypeError, 'IdTypeError');
