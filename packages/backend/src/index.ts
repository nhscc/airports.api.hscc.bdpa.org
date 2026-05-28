/* eslint-disable @typescript-eslint/no-base-to-string */
import { itemToObjectId } from '@-xun/mongo-item';
import { ObjectId } from 'mongodb';

import { ClientValidationError, ErrorMessage } from 'multiverse+shared:error.ts';

import {
  getAirlinesDb,
  getAirportsDb,
  getFlightsDb,
  getInfoDb,
  getNoFlyListDb,
  makeFlightStateResolverAggregation,
  publicAirlineProjection,
  publicAirportProjection,
  publicNoFlyListProjection
} from 'universe+backend:db.ts';

import { getEnv } from 'universe+backend:env.ts';
import { validateAndParseJson } from 'universe+backend:util.ts';

import type {
  PublicAirport,
  PublicFlight,
  PublicNoFlyListEntry
} from 'universe+backend:db.ts';

type SearchFlightsMatch = {
  [specifier: string]:
    | string
    | number
    | ObjectId
    | {
        [subspecifier in '$gt' | '$lt' | '$gte' | '$lte']?: string | number;
      };
};

type SearchFlightsRegexMatch = {
  [specifier: string]: string | ObjectId;
};

type SearchFlightsSort = 'asc' | 'desc';

const primaryMatchTargets = [
  'type',
  'airline',
  'comingFrom',
  'landingAt',
  'departingTo',
  'flightNumber',
  'ffms',
  'seats.economy.priceDollars',
  '_id'
] as const;

const secondaryMatchTargets = [
  'departFromSender',
  'arriveAtReceiver',
  'departFromReceiver',
  'status',
  'gate'
] as const;

const matchableStrings = [...primaryMatchTargets, ...secondaryMatchTargets];

const matchableSubStrings = ['$gt', '$lt', '$gte', '$lte'] as const;

export async function getNoFlyList() {
  const { noFlyListDb } = await getNoFlyListDb();

  return noFlyListDb
    .find()
    .sort({ id: 1 })
    .project<PublicNoFlyListEntry>(publicNoFlyListProjection)
    .toArray();
}

export async function getAirports() {
  const { airportsDb } = await getAirportsDb();

  return airportsDb
    .find()
    .sort({ id: 1 })
    .project<PublicAirport>(publicAirportProjection)
    .toArray();
}

export async function getAirlines() {
  const { airlinesDb } = await getAirlinesDb();

  return airlinesDb
    .find()
    .sort({ id: 1 })
    .project<PublicAirport>(publicAirlineProjection)
    .toArray();
}

export async function getExtras() {
  const { infoDb } = await getInfoDb();
  return (await infoDb.findOne())?.allExtras;
}

export async function getSeats() {
  const { infoDb } = await getInfoDb();
  return (await infoDb.findOne())?.seatClasses;
}

export async function getFlightsById({
  flight_ids,
  bookerKey
}: {
  flight_ids: string | undefined;
  bookerKey: string | undefined;
}) {
  if (!bookerKey) {
    throw new ClientValidationError(ErrorMessage.InvalidObjectId(bookerKey));
  }

  const rawFlightIds = validateAndParseJson<string[]>(flight_ids);

  if (rawFlightIds.length > getEnv().RESULTS_PER_PAGE) {
    throw new ClientValidationError(ErrorMessage.TooManyFlightIds());
  }

  if (rawFlightIds.length <= 0) {
    return [];
  }

  const flightIds = itemToObjectId(rawFlightIds);

  const { flightsDb } = await getFlightsDb();

  return flightsDb
    .aggregate<PublicFlight>([
      { $match: { _id: { $in: flightIds } } },
      ...makeFlightStateResolverAggregation({ bookerKey, removeIdsFromResult: true })
    ])
    .toArray();
}

export async function searchFlights({
  bookerKey,
  after_id,
  match: match_,
  regexMatch: regexMatch_,
  sort: sort_
}: {
  bookerKey: string | undefined;
  after_id: string | undefined;
  match: string | undefined;
  regexMatch: string | undefined;
  sort: string | undefined;
}) {
  if (!bookerKey) {
    throw new ClientValidationError(ErrorMessage.InvalidObjectId(bookerKey));
  }

  const afterId = after_id ? itemToObjectId(after_id) : undefined;

  const rawSort = sort_ || 'asc';
  const rawMatch = validateAndParseJson<Record<string, unknown>>(match_ || '{}');
  const rawRegexMatch = validateAndParseJson<Record<string, unknown>>(
    regexMatch_ || '{}'
  );

  let regexMatchObjectIds: ObjectId[] = [];

  if (!['asc', 'desc'].includes(rawSort)) {
    throw new ClientValidationError(ErrorMessage.InvalidSort());
  }

  const sort = rawSort as SearchFlightsSort;

  if (!isObject(rawMatch) || !isObject(rawRegexMatch)) {
    throw new ClientValidationError(ErrorMessage.MissingRegexAndOrMatch());
  }

  if (rawMatch._id) {
    throw new ClientValidationError(
      ErrorMessage.InvalidMatchObject('restricted property "_id"')
    );
  }

  if (rawRegexMatch._id) {
    throw new ClientValidationError(
      ErrorMessage.InvalidRegexMatchObject('restricted property "_id"')
    );
  }

  try {
    if (rawMatch.flight_id) {
      rawMatch._id = itemToObjectId(String(rawMatch.flight_id));
      delete rawMatch.flight_id;
    }

    if (rawRegexMatch.flight_id) {
      regexMatchObjectIds = itemToObjectId(String(rawRegexMatch.flight_id).split('|'));
      delete rawRegexMatch.flight_id;
    }
  } catch {
    throw new ClientValidationError(ErrorMessage.InvalidFlightId());
  }

  const match = rawMatch as SearchFlightsMatch;
  const regexMatch = rawRegexMatch as SearchFlightsRegexMatch;
  const matchKeys = Object.keys(match);
  const regexMatchKeys = Object.keys(regexMatch);

  if (matchKeys.length && !matchKeysAreValid()) {
    throw new ClientValidationError(ErrorMessage.InvalidMatchObject());
  }

  if (regexMatchKeys.length && !regexMatchKeysAreValid()) {
    throw new ClientValidationError(ErrorMessage.InvalidRegexMatchObject());
  }

  const primaryMatchers: Record<string, unknown> = {};
  const secondaryMatchers: Record<string, unknown> = {};

  // ? We need to split off the search params that need flight state resolved
  // ? for both normal matchers and regex matchers (the latter takes
  // ? precedence due to code order)

  for (const [prop, val] of Object.entries(match)) {
    if (primaryMatchTargets.includes(prop as (typeof primaryMatchTargets)[number])) {
      primaryMatchers[prop] = val;
    } else if (
      secondaryMatchTargets.includes(prop as (typeof secondaryMatchTargets)[number])
    ) {
      secondaryMatchers[prop] = val;
    } else {
      throw new ClientValidationError(ErrorMessage.StrangeMatcherError(prop));
    }
  }

  for (const [prop, val] of Object.entries(regexMatch)) {
    const regexVal = { $regex: val, $options: 'i' };

    if (primaryMatchTargets.includes(prop as (typeof primaryMatchTargets)[number])) {
      primaryMatchers[prop] = regexVal;
    } else if (
      secondaryMatchTargets.includes(prop as (typeof secondaryMatchTargets)[number])
    ) {
      secondaryMatchers[prop] = regexVal;
    } else {
      throw new ClientValidationError(ErrorMessage.StrangeMatcherError(prop));
    }
  }

  const primaryMatchStage = {
    $match: {
      ...(afterId ? { _id: { [sort === 'asc' ? '$gt' : '$lt']: afterId } } : {}),
      ...primaryMatchers
    }
  };

  const { flightsDb } = await getFlightsDb();

  // TODO: the database design can be optimized by popping the stochastic
  // TODO: states out of their flight documents and placing them in their own
  // TODO: collection, where we can put an index on them. But unless the slow
  // TODO: queries become a problem, this will do for now due to cost.
  return flightsDb
    .aggregate<PublicFlight>([
      ...(Object.keys(primaryMatchStage.$match).length ? [primaryMatchStage] : []),
      ...(regexMatchObjectIds.length
        ? [{ $match: { _id: { $in: regexMatchObjectIds } } }]
        : []),
      ...makeFlightStateResolverAggregation({ bookerKey, removeIdsFromResult: false }),
      ...(Object.keys(secondaryMatchers).length
        ? [{ $match: { ...secondaryMatchers } }]
        : []),
      { $sort: { _id: sort === 'asc' ? 1 : -1 } },
      { $limit: getEnv().RESULTS_PER_PAGE },
      { $project: { _id: false } }
    ])
    .toArray();

  function matchKeysAreValid() {
    return matchKeys.every((key_) => {
      const key = key_ as (typeof matchableStrings)[number];
      const val = match[key];
      let valNotEmpty = false;

      const test = () =>
        isObject(val) &&
        Object.keys(val).every((subKey_) => {
          const subKey = subKey_ as (typeof matchableSubStrings)[number];
          valNotEmpty = true;

          return matchableSubStrings.includes(subKey) && typeof val[subKey] === 'number';
        });

      return (
        !Array.isArray(val) &&
        matchableStrings.includes(key) &&
        (val instanceof ObjectId ||
          ['number', 'string'].includes(typeof val) ||
          (test() && valNotEmpty))
      );
    });
  }

  function regexMatchKeysAreValid() {
    return regexMatchKeys.every((key_) => {
      const key = key_ as (typeof matchableStrings)[number];
      return (
        matchableStrings.includes(key) &&
        (regexMatch[key] instanceof ObjectId || typeof rawRegexMatch[key] === 'string')
      );
    });
  }
}

function isObject(object: unknown): object is Record<string, unknown> {
  return !Array.isArray(object) && object !== null && typeof object === 'object';
}
