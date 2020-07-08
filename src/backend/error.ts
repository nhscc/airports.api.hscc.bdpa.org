export class AppError extends Error {}

export class NamedAppError extends AppError {
    constructor(name: string, message?: string) {
        message = message ? `: ${message}` : '';
        super(`${name}${message}`);
    }
}

export class GuruMeditationError extends NamedAppError {
    constructor(message?: string) {
        super(GuruMeditationError.name, message);
    }
}

export class NotAuthorizedError extends NamedAppError {
    constructor(message?: string) {
        super(NotAuthorizedError.name, message);
    }
}

export class FlightGenerationError extends NamedAppError {
    constructor(message?: string) {
        super(FlightGenerationError.name, message || 'data upsert failed');
    }
}

export class NotFoundError<T=string> extends NamedAppError {
    constructor(reference?: T) {
        super(
            NotFoundError.name,
            reference ? `item "${reference}" does not exist or was not found` : 'item or resource was not found'
        );
    }
}

export class IdTypeError<T=string|number> extends NamedAppError {
    constructor(id?: T) {
        super(
            IdTypeError.name,
            id ? `expected valid ObjectId instance, got "${id}" instead` : 'invalid ObjectId encountered'
        );
    }
}

export class ApiKeyTypeError extends NamedAppError {
    constructor() {
        super(ApiKeyTypeError.name, 'invalid API key encountered');
    }
}

export class ValidationError extends NamedAppError {
    constructor(message?: string) {
        super(ValidationError.name, message ?? 'validation failed');
    }
}
