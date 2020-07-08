export declare class AppError extends Error {
}
export declare class NamedAppError extends AppError {
    constructor(name: string, message?: string);
}
export declare class GuruMeditationError extends NamedAppError {
    constructor(message?: string);
}
export declare class NotAuthorizedError extends NamedAppError {
    constructor(message?: string);
}
export declare class FlightGenerationError extends NamedAppError {
    constructor(message?: string);
}
export declare class NotFoundError<T = string> extends NamedAppError {
    constructor(reference?: T);
}
export declare class IdTypeError<T = string | number> extends NamedAppError {
    constructor(id?: T);
}
export declare class ApiKeyTypeError extends NamedAppError {
    constructor();
}
export declare class ValidationError extends NamedAppError {
    constructor(message?: string);
}
