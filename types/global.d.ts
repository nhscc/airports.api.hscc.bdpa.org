import type { ObjectId } from 'mongodb'

// ? Expose all the types from `@ergodark/next-types`
export * from '@ergodark/next-types';

export type FlightId = ObjectId;
export type FlightNumber = string;

export type StochasticFlightState = {
    departFromSender: number;
    arriveAtReceiver: number;
    departFromReceiver: number | null;
    status: 'past' | 'scheduled' | 'cancelled' | 'delayed' | 'on time' | 'landed' | 'arrived' | 'boarding' | 'departed';
    gate: string | null;
};

export type InternalInfo = {
    seatClasses: string[];
    allExtras: string[];
};

/**
 * The shape of a flight entry.
 */
export type InternalFlight = {
    bookerKey: string | null;
    type: 'arrival' | 'departure';
    airline: string;
    comingFrom: string;
    landingAt: string;
    departingTo: string | null;
    flightNumber: FlightNumber;
    baggage: {
        checked: {
            max: number;
            prices: number[];
        };
        carry: {
            max: number;
            prices: number[];
        };
    };
    ffms: number;
    seats: {
        [seatClass: string]: {
            total: number;
            priceDollars: number;
            priceFfms: number;
        }
    },
    extras: {
        [name: string]: {
            priceDollars: number;
            priceFfms: number;
        }
    };
    stochasticStates: {
        [activeAfter: string]: StochasticFlightState;
    };
};

/**
 * The shape of a public airport API result.
 */
export type PublicFlight = Omit<InternalFlight, 'bookerKey' | 'stochasticStates'> & StochasticFlightState & {
    flight_id: string;
    bookable: boolean;
};

/**
 * The shape of an airport entry.
 */
export type InternalAirport = {
    name: string;
    shortName: string;
    city: string;
    state: string;
    country: string;
    chapterKey: string | null;
};

/**
 * The shape of a public airport API result.
 */
export type PublicAirport = Omit<InternalAirport, 'chapter_id'>;

/**
 * The shape of a no-fly-list entry.
 */
export type NoFlyListEntry = {
    name: {
        first: string;
        middle: string | null;
        last: string;
    },
    sex: 'male' | 'female';
    birthdate: {
        day: number;
        month: number;
        year: number;
    }
};

/**
 * The shape of an airline entry.
 */
export type InternalAirline = {
    name: string;
    codePrefix: string;
};


/**
 * The shape of an API key.
 */
export type ApiKey = {
    owner: string;
    key: string;
}

/**
 * The shape of a request log entry.
 */
export type RequestLogEntry = {
    ip: string | null;
    key: string | null;
    route: string | null;
    method: string | null;
    resStatusCode: number;
    time: number;
};

/**
 * The shape of a limited log entry.
 */
export type LimitedLogEntry = {
    until: number;
    ip: string | null;
    key?: never;
} | {
    until: number;
    ip?: never;
    key: string | null;
};
