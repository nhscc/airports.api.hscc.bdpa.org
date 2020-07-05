export class AppError extends Error {}
export class GuruMeditationError extends AppError {}
export class NotAuthorizedError extends AppError {}

export class UpsertFailedError extends AppError {
    constructor(message?: string) {
        super(message || 'data upsert failed');
    }
}

export class NotFoundError<T=string> extends AppError {
    constructor(reference?: T) {
        super(reference ? `item "${reference}" does not exist or was not found` : 'item or resource was not found');
    }
}

export class TimeTypeError extends UpsertFailedError {
    constructor(message?: string) {
        super(message || 'invalid `opens` and/or `closes` properties (bad time data?)');
    }
}

export class IdTypeError<T=string|number> extends AppError {
    constructor(id?: T) {
        super(id ? `expected valid ObjectId instance, got "${id}" instead` : 'invalid ObjectId encountered');
    }
}

export class ApiKeyTypeError extends AppError {
    constructor() {
        super('invalid API key encountered');
    }
}

export class ValidationError extends AppError {
    constructor(message?: string) {
        super(message ? `validation error: ${message}` : 'validation failed');
    }
}
