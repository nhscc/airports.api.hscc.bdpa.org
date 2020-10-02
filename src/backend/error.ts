import { NamedAppError } from 'multiverse/named-errors'

export * from 'multiverse/named-errors'

export class FlightGenerationError extends NamedAppError {
    constructor(message?: string) {
        super(FlightGenerationError.name, message || 'data upsert failed');
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
