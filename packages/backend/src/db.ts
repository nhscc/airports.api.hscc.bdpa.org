import assert from 'node:assert';

import { DUMMY_BEARER_TOKEN } from '@-xun/api-strategy/auth';
import { getCommonSchemaConfig } from '@-xun/api-strategy/mongo';
import { getDb as getDb_ } from '@-xun/mongo-schema';

import { ErrorMessage } from 'multiverse+shared:error.ts';

import type { DbSchema } from '@-xun/mongo-schema';
import type { ObjectId, WithId, WithoutId } from 'mongodb';

/**
 * A JSON representation of the backend Mongo database structure. This is used
 * for consistent app-wide db access across projects and to generate transient
 * versions of the db during testing.
 */
export function getSchemaConfig(): DbSchema {
  return getCommonSchemaConfig({
    databases: {
      'hscc-api-airports': {
        collections: [
          // TODO: Pop stochastic states out of flight documents and make TODO:
          // indices over all time-related data. This will dramatically TODO:
          // speed up searches!
          {
            name: 'flights',
            // ? Collation allows for case-insensitive searching. See: ?
            // https://stackoverflow.com/a/40914924/1367414
            createOptions: { collation: { locale: 'en', strength: 2 } },
            indices: [
              { spec: 'bookerKey' },
              { spec: 'type' },
              { spec: 'airline' },
              { spec: 'departingTo' },
              { spec: 'landingAt' },
              { spec: 'flightNumber' },
              { spec: 'ffms' }
            ]
          },
          {
            name: 'airports'
          },
          {
            name: 'airlines'
          },
          {
            name: 'no-fly-list'
          },
          {
            name: 'info'
          }
        ]
      }
    },
    aliases: {
      app: 'hscc-api-airports'
    }
  });
}

export async function getDb() {
  const db = await getDb_({ name: 'app' });
  return { db };
}

export async function getFlightsDb() {
  const { db } = await getDb();
  const flightsDb = db.collection<InternalFlight>('flights');

  return { flightsDb };
}

export async function getAirportsDb() {
  const { db } = await getDb();
  const airportsDb = db.collection<InternalAirport>('airports');

  return { airportsDb };
}

export async function getAirlinesDb() {
  const { db } = await getDb();
  const airlinesDb = db.collection<InternalAirline>('airlines');

  return { airlinesDb };
}

export async function getNoFlyListDb() {
  const { db } = await getDb();
  const noFlyListDb = db.collection<InternalNoFlyListEntry>('no-fly-list');

  return { noFlyListDb };
}

export async function getInfoDb() {
  const { db } = await getDb();
  const infoDb = db.collection<InternalInfo>('info');

  return { infoDb };
}

export type FlightId = ObjectId;
export type FlightNumber = string;

export type StochasticFlightState = {
  departFromSender: number;
  arriveAtReceiver: number;
  departFromReceiver: number | null;
  status:
    | 'past'
    | 'scheduled'
    | 'cancelled'
    | 'delayed'
    | 'on time'
    | 'landed'
    | 'arrived'
    | 'boarding'
    | 'departed';
  gate: string | null;
};

/**
 * The shape of an internal info entry.
 */
export type InternalInfo = WithId<{
  seatClasses: string[];
  allExtras: string[];
}>;

/**
 * The shape of an internal flight.
 */
export type InternalFlight = WithId<{
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
  // ? Stands for "Frequent Flier Miles'
  ffms: number;
  seats: {
    [seatClass: string]: {
      total: number;
      priceDollars: number;
      priceFfms: number;
    };
  };
  extras: {
    [name: string]: {
      priceDollars: number;
      priceFfms: number;
    };
  };
  stochasticStates: {
    [activeAfter: string]: StochasticFlightState;
  };
}>;

/**
 * The shape of a public flight.
 */
export type PublicFlight = WithoutId<
  Omit<InternalFlight, 'bookerKey' | 'stochasticStates'>
> &
  StochasticFlightState & {
    flight_id: string;
    bookable: boolean;
  };

/**
 * The shape of an airport.
 */
export type InternalAirport = WithId<{
  name: string;
  shortName: string;
  city: string;
  state: string;
  country: string;
  chapterKey: string | null;
}>;

/**
 * The shape of a public airport.
 */
export type PublicAirport = WithoutId<Omit<InternalAirport, 'chapterKey'>>;

/**
 * The shape of an internal airline.
 */
export type InternalAirline = WithId<{
  name: string;
  codePrefix: string;
}>;

/**
 * The shape of a public airline.
 */
export type PublicAirline = WithoutId<InternalAirline>;

/**
 * The shape of an internal no-fly-list entry.
 */
export type InternalNoFlyListEntry = WithId<{
  name: {
    first: string;
    middle: string | null;
    last: string;
  };
  sex: 'male' | 'female';
  birthdate: {
    day: number;
    month: number;
    year: number;
  };
}>;

/**
 * The shape of a public no-fly-list entry.
 */
export type PublicNoFlyListEntry = WithoutId<InternalNoFlyListEntry>;

/**
 * Transforms an {@link InternalFlight} into a {@link PublicFlight} for the V2
 * API.
 */
export function toPublicFlight(flight: InternalFlight): PublicFlight {
  const { _id, bookerKey, stochasticStates, ...publicV2FlightData } = flight;
  const stochasticStatesEntries = Object.entries(stochasticStates);
  const firstStochasticState = stochasticStatesEntries[0]?.[1];

  assert(firstStochasticState, ErrorMessage.GuruMeditation());

  return {
    flight_id: _id.toHexString(),
    bookable: flight.type === 'arrival' ? false : bookerKey === DUMMY_BEARER_TOKEN,
    ...publicV2FlightData,
    // eslint-disable-next-line unicorn/no-array-reduce
    ...stochasticStatesEntries.reduce((previous, entry) => {
      return Number(entry[0]) <= Date.now() ? entry[1] : previous;
    }, firstStochasticState)
  };
}

/**
 * Transforms an {@link PublicFlight} for the V2 API into a {@link PublicFlight}
 * for the V1 API.
 */
export function toPublicFlightV1(flight: PublicFlight) {
  const { extras: _1, baggage: _2, ffms: _3, seats, ...publicV1FlightData } = flight;

  const seatPrice = Object.values(seats)[0]?.priceDollars;
  assert(seatPrice !== undefined, ErrorMessage.GuruMeditation());

  return { ...publicV1FlightData, seatPrice };
}

/**
 * Transforms an {@link InternalAirport} into a {@link PublicAirport}.
 */
export function toPublicAirport(internalAirport: InternalAirport): PublicAirport {
  return {
    city: internalAirport.city,
    country: internalAirport.country,
    name: internalAirport.name,
    shortName: internalAirport.shortName,
    state: internalAirport.state
  };
}

/**
 * Transforms an {@link InternalAirline} into a {@link PublicAirline}.
 */
export function toPublicAirline(internalAirline: InternalAirline): PublicAirline {
  return {
    codePrefix: internalAirline.codePrefix,
    name: internalAirline.name
  };
}

/**
 * Transforms an {@link InternalNoFlyListEntry} into a
 * {@link PublicNoFlyListEntry}.
 */
export function toPublicNoFlyListEntry(
  internalNoFlyListEntry: InternalNoFlyListEntry
): PublicNoFlyListEntry {
  return {
    birthdate: internalNoFlyListEntry.birthdate,
    name: internalNoFlyListEntry.name,
    sex: internalNoFlyListEntry.sex
  };
}

/**
 * A MongoDB cursor projection that transforms an {@link InternalAirport} into a
 * {@link PublicAirport}.
 */
export const publicAirportProjection = {
  _id: false,
  city: true,
  country: true,
  name: true,
  shortName: true,
  state: true
} as const;

/**
 * A MongoDB cursor projection that transforms an {@link InternalAirline} into a
 * {@link PublicAirline}.
 */
export const publicAirlineProjection = {
  _id: false,
  codePrefix: true,
  name: true
} as const;

/**
 * A MongoDB cursor projection that transforms an {@link InternalNoFlyListEntry}
 * into a {@link PublicNoFlyListEntry}
 */
export const publicNoFlyListProjection = {
  _id: false,
  birthdate: true,
  name: true,
  sex: true
} as const;

/**
 * Returns a MongoDB Aggregation that resolves {@link InternalFlight}s into
 * {@link PublicFlight}s, i.e. their current "stochastic" states.
 */
export function makeFlightStateResolverAggregation({
  bookerKey,
  removeIdsFromResult
}: {
  bookerKey: string;
  removeIdsFromResult: boolean;
}) {
  return [
    {
      $addFields: {
        state: {
          $arrayElemAt: [
            {
              $filter: {
                input: { $objectToArray: '$stochasticStates' },
                as: 'st',
                cond: { $lte: [{ $toLong: '$$st.k' }, { $toLong: '$$NOW' }] }
              }
            },
            -1
          ]
        },
        flight_id: { $toString: '$_id' },
        bookable: {
          $cond: {
            if: {
              $and: [{ $eq: ['$bookerKey', bookerKey] }, { $eq: ['$type', 'departure'] }]
            },
            // eslint-disable-next-line unicorn/no-thenable
            then: true,
            else: false
          }
        }
      }
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: ['$$ROOT', '$state.v']
        }
      }
    },
    {
      $project: {
        state: false,
        ...(removeIdsFromResult ? { _id: false } : {}),
        bookerKey: false,
        stochasticStates: false
      }
    }
  ];
}
