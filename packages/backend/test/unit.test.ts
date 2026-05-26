/* eslint-disable unicorn/no-array-callback-reference */
import { DUMMY_BEARER_TOKEN } from '@-xun/api-strategy/auth';
import { setupMemoryServerOverride } from '@-xun/mongo-test';
import { ObjectId } from 'mongodb';

import { ErrorMessage } from 'multiverse+shared:error.ts';

import * as Backend from 'universe+backend';

import {
  getFlightsDb,
  getSchemaConfig,
  toPublicAirline,
  toPublicAirport,
  toPublicFlight,
  toPublicNoFlyListEntry
} from 'universe+backend:db.ts';

import { dummyAppData, getDummyData } from 'universe+backend:dummy.ts';
import { getEnv } from 'universe+backend:env.ts';

import { useMockDateNow } from 'testverse:util.ts';

useMockDateNow();
setupMemoryServerOverride({
  schema: getSchemaConfig(),
  data: getDummyData()
});

const bookerKey = DUMMY_BEARER_TOKEN;

const PublicFlightKeys = [
  'type',
  'airline',
  'comingFrom',
  'landingAt',
  'departingTo',
  'flightNumber',
  'baggage',
  'ffms',
  'seats',
  'extras',
  'flight_id',
  'bookable',
  'departFromSender',
  'arriveAtReceiver',
  'departFromReceiver',
  'status',
  'gate'
];

describe('::getNoFlyList', () => {
  it('returns the No Fly List data as expected', async () => {
    expect.hasAssertions();
    await expect(Backend.getNoFlyList()).resolves.toStrictEqual(
      dummyAppData['no-fly-list'].map(toPublicNoFlyListEntry)
    );
  });
});

describe('::getAirports', () => {
  it('returns the airport adhering to the PublicAirport type', async () => {
    expect.hasAssertions();
    await expect(Backend.getAirports()).resolves.toStrictEqual(
      dummyAppData.airports.map(toPublicAirport)
    );
  });
});

describe('::getAirlines', () => {
  it('returns the airline data as expected', async () => {
    expect.hasAssertions();
    await expect(Backend.getAirlines()).resolves.toStrictEqual(
      dummyAppData.airlines.map(toPublicAirline)
    );
  });
});

describe('::getExtras', () => {
  it('returns the extras data as expected', async () => {
    expect.hasAssertions();
    await expect(Backend.getExtras()).resolves.toStrictEqual(
      dummyAppData.info[0]!.allExtras
    );
  });
});

describe('::getSeats', () => {
  it('returns the seats data as expected', async () => {
    expect.hasAssertions();
    await expect(Backend.getSeats()).resolves.toStrictEqual(
      dummyAppData.info[0]!.seatClasses
    );
  });
});

describe('::getFlightsById', () => {
  it('throws if bad arguments', async () => {
    expect.hasAssertions();

    // @ts-expect-error: testing bad arguments
    await expect(Backend.getFlightsById()).toReject();
    // @ts-expect-error: testing bad arguments
    await expect(Backend.getFlightsById({})).toReject();
    // @ts-expect-error: testing bad arguments
    await expect(Backend.getFlightsById(dummyAppData.flights[0]!._id)).toReject();
    // @ts-expect-error: testing bad arguments
    await expect(Backend.getFlightsById(null)).toReject();
    // @ts-expect-error: testing bad arguments
    await expect(Backend.getFlightsById(undefined)).toReject();
    // @ts-expect-error: testing bad arguments
    await expect(Backend.getFlightsById(5)).toReject();
    await expect(Backend.getFlightsById({ flight_ids: '5', bookerKey })).toReject();
    await expect(Backend.getFlightsById({ flight_ids: '{}', bookerKey })).toReject();
    await expect(Backend.getFlightsById({ flight_ids: 'null', bookerKey })).toReject();
    await expect(Backend.getFlightsById({ flight_ids: '[null]', bookerKey })).toReject();

    await expect(
      Backend.getFlightsById({ flight_ids: '[undefined]', bookerKey })
    ).toReject();

    await expect(Backend.getFlightsById({ flight_ids: '[""]', bookerKey })).toReject();
  });

  it('throws if too many ids', async () => {
    expect.hasAssertions();
    await expect(
      Backend.getFlightsById({
        flight_ids: JSON.stringify(
          Array.from({ length: getEnv().RESULTS_PER_PAGE + 1 }).map(() =>
            new ObjectId().toString()
          )
        ),
        bookerKey
      })
    ).toReject();
  });

  it('returns nothing when no ids are passed', async () => {
    expect.hasAssertions();
    await expect(
      Backend.getFlightsById({ flight_ids: '[]', bookerKey })
    ).resolves.toStrictEqual([]);
  });

  it('returns nothing when incorrect or bad ids are passed', async () => {
    expect.hasAssertions();
    await expect(
      Backend.getFlightsById({ flight_ids: JSON.stringify([new ObjectId()]), bookerKey })
    ).resolves.toStrictEqual([]);

    await expect(
      Backend.getFlightsById({
        flight_ids: JSON.stringify([new ObjectId(), new ObjectId()]),
        bookerKey
      })
    ).resolves.toStrictEqual([]);
  });

  it('returns only public flight data when correct ids are passed', async () => {
    expect.hasAssertions();
    const flight1 = dummyAppData.flights[0]!;
    const flight2 = dummyAppData.flights[1]!;

    const result = await Backend.getFlightsById({
      flight_ids: JSON.stringify([flight1._id, flight2._id]),
      bookerKey
    });

    expect([result[0]?.bookable, result[1]?.bookable]).toStrictEqual([
      flight1.type === 'departure' && flight1.bookerKey === bookerKey,
      flight2.type === 'departure' && flight2.bookerKey === bookerKey
    ]);

    expect(
      result.every((flight) => {
        const keys = Object.keys(flight);
        return (
          keys.every((key) => PublicFlightKeys.includes(key)) &&
          keys.length === PublicFlightKeys.length
        );
      })
    ).toBeTrue();

    expect(
      (
        await Backend.getFlightsById({
          flight_ids: JSON.stringify([flight2._id]),
          bookerKey
        })
      )[0]!.flight_id
    ).toBe(flight2._id.toHexString());
  });

  it('throws when invalid JSON is passed', async () => {
    expect.hasAssertions();
    await expect(
      Backend.getFlightsById({ flight_ids: 'hello world!', bookerKey })
    ).rejects.toThrow(ErrorMessage.InvalidJSON());
  });
});

describe('::searchFlights', () => {
  it('throws if bad parameters', async () => {
    expect.hasAssertions();
    // @ts-expect-error: testing bad arguments
    await expect(Backend.searchFlights()).toReject();
    // @ts-expect-error: testing bad arguments
    await expect(Backend.searchFlights({})).toReject();
    // @ts-expect-error: testing bad arguments
    await expect(Backend.searchFlights(dummyAppData.flights[0]._id)).toReject();
    // @ts-expect-error: testing bad arguments
    await expect(Backend.searchFlights(null)).toReject();
    // @ts-expect-error: testing bad arguments
    await expect(Backend.searchFlights(undefined)).toReject();
    // @ts-expect-error: testing bad arguments
    await expect(Backend.searchFlights(5)).toReject();
    await expect(
      // @ts-expect-error: testing bad arguments
      Backend.searchFlights({
        bookerKey,
        after_id: 'null',
        match: '{}',
        regexMatch: '{}'
      })
    ).toReject();
    await expect(
      // @ts-expect-error: testing bad arguments
      Backend.searchFlights({ bookerKey, after_id: 'null', sort: 'asc', match: '{}' })
    ).toReject();
    await expect(
      Backend.searchFlights({
        bookerKey,
        after_id: 'bad',
        sort: 'asc',
        match: '{}',
        regexMatch: '{}'
      })
    ).toReject();
    await expect(
      Backend.searchFlights({
        bookerKey,
        after_id: undefined,
        sort: 'bad',
        match: '{}',
        regexMatch: '{}'
      })
    ).toReject();

    await expect(
      Backend.searchFlights({
        bookerKey,
        after_id: undefined,
        sort: 'asc',
        match: "{ bad: 'bad' }",
        regexMatch: '{}'
      })
    ).toReject();

    await expect(
      Backend.searchFlights({
        bookerKey,
        after_id: undefined,
        sort: 'asc',
        match: '{}',
        regexMatch: '{ bad: undefined }'
      })
    ).toReject();

    await expect(
      // @ts-expect-error: testing bad arguments
      Backend.searchFlights({
        after_id: undefined,
        sort: 'asc',
        match: '{}',
        regexMatch: '{}'
      })
    ).toReject();

    await expect(
      Backend.searchFlights({
        bookerKey,
        after_id: undefined,
        sort: 'asc',
        match: "{ _id: 'bad' }",
        regexMatch: '{}'
      })
    ).toReject();

    await expect(
      Backend.searchFlights({
        bookerKey,
        after_id: undefined,
        sort: 'asc',
        match: '{}',
        regexMatch: "{ _id: 'bad' }"
      })
    ).toReject();

    await expect(
      Backend.searchFlights({
        bookerKey,
        after_id: undefined,
        sort: 'asc',
        match: "{ stochasticStates: 'bad' }",
        regexMatch: '{}'
      })
    ).toReject();

    await expect(
      Backend.searchFlights({
        bookerKey,
        after_id: undefined,
        sort: 'asc',
        match: '{}',
        regexMatch: "{ stochasticStates: 'bad' }"
      })
    ).toReject();

    await expect(
      Backend.searchFlights({
        bookerKey,
        after_id: undefined,
        sort: 'asc',
        match: '{}',
        regexMatch: '{ ffms: { $gt: 1_000_000 } }'
      })
    ).toReject();

    await expect(
      Backend.searchFlights({
        bookerKey,
        after_id: undefined,
        sort: 'asc',
        match: '{ $gt: 1_000_000 }',
        regexMatch: '{}'
      })
    ).toReject();

    await expect(
      Backend.searchFlights({
        bookerKey,
        after_id: undefined,
        sort: 'asc',
        match: '{ type: {} }',
        regexMatch: '{}'
      })
    ).toReject();

    await expect(
      Backend.searchFlights({
        bookerKey,
        after_id: undefined,
        sort: 'asc',
        match: '{ type: { $in: [] } }',
        regexMatch: '{}'
      })
    ).toReject();

    await expect(
      Backend.searchFlights({
        bookerKey,
        after_id: undefined,
        sort: 'asc',
        match: '{ type: { $lte: undefined } }',
        regexMatch: '{}'
      })
    ).toReject();

    await expect(
      Backend.searchFlights({
        bookerKey,
        after_id: undefined,
        sort: 'asc',
        match: "{ $_id: 'that' }",
        regexMatch: '{}'
      })
    ).toReject();
  });

  it('search returns expected paginated records with empty asc/desc queries', async () => {
    expect.hasAssertions();
    const count = getEnv().RESULTS_PER_PAGE;

    const result1 = await Backend.searchFlights({
      bookerKey,
      after_id: undefined,
      match: '{}',
      regexMatch: '{}',
      sort: 'asc'
    });

    const result2 = await Backend.searchFlights({
      bookerKey,
      after_id: undefined,
      match: '{}',
      regexMatch: '{}',
      sort: 'desc'
    });

    const result3 = await Backend.searchFlights({
      bookerKey,
      after_id: undefined,
      match: undefined,
      regexMatch: undefined,
      sort: undefined // ? Same as "asc"
    });

    const result4 = await Backend.searchFlights({
      bookerKey,
      after_id: undefined,
      match: undefined,
      regexMatch: undefined,
      sort: 'desc'
    });

    const expectedFlights = dummyAppData.flights;
    const expectedFlights1 = expectedFlights.slice(0, count).map(toPublicFlight);
    const expectedFlights2 = expectedFlights
      .slice(-count)
      .toReversed()
      .map(toPublicFlight);

    expect(result1).toStrictEqual(expectedFlights1);
    expect(result2).toStrictEqual(expectedFlights2);

    expect(result3).toStrictEqual(expectedFlights1);
    expect(result4).toStrictEqual(expectedFlights2);

    expect(
      result1.every((flight) =>
        Object.keys(flight).every((key) => PublicFlightKeys.includes(key))
      )
    ).toBeTrue();
  });

  it('search returns expected paginated records with various queries', async () => {
    expect.hasAssertions();

    const count = getEnv().RESULTS_PER_PAGE;
    const expectedFlights = dummyAppData.flights;
    const totalRecords = expectedFlights.length;

    const result1 = await Backend.searchFlights({
      bookerKey,
      after_id: undefined,
      match: JSON.stringify({ type: 'arrival' }),
      regexMatch: '{}',
      sort: 'desc'
    });

    expect(result1).toHaveLength(count);
    expect(result1.every((flight) => flight.type === 'arrival')).toBeTrue();
    expect(result1).toStrictEqual(
      expectedFlights
        .filter((flight) => flight.type === 'arrival')
        .toReversed()
        .slice(0, count)
        .map(toPublicFlight)
    );

    const result2 = await Backend.searchFlights({
      bookerKey,
      after_id: String(new ObjectId(result1.at(-2)!.flight_id)),
      match: JSON.stringify({ type: 'arrival' }),
      regexMatch: '{}',
      sort: 'desc'
    });

    expect(result2).toHaveLength(totalRecords / 2 - count + 1);
    expect(result2.every((flight) => flight.type === 'arrival')).toBeTrue();
    expect(result2[0]!.flight_id).toStrictEqual(result1.at(-1)!.flight_id);
    expect(result2.at(-1)!.flight_id).toStrictEqual(
      expectedFlights
        .filter((flight) => flight.type === 'arrival')
        .toReversed()
        .slice(-1)
        .map(toPublicFlight)[0]!.flight_id
    );

    const result3 = await Backend.searchFlights({
      bookerKey,
      after_id: String(expectedFlights.slice(-3)[0]!._id),
      match: JSON.stringify({ type: 'arrival' }),
      regexMatch: '{}',
      sort: 'asc'
    });

    expect(result3).toHaveLength(1);
    expect(result3.every((flight) => flight.type === 'arrival')).toBeTrue();
    expect(result3[0]!.flight_id).toStrictEqual(
      expectedFlights
        .filter((flight) => flight.type === 'arrival')
        .slice(-1)
        .map(toPublicFlight)[0]!.flight_id
    );

    const result3desc = await Backend.searchFlights({
      bookerKey,
      after_id: String(expectedFlights[2]!._id),
      match: JSON.stringify({ type: 'arrival' }),
      regexMatch: '{}',
      sort: 'desc'
    });

    expect(result3desc).toHaveLength(1);
    expect(result3desc[0]!.flight_id).toStrictEqual(
      expectedFlights
        .filter((flight) => flight.type === 'arrival')
        .toReversed()
        .slice(-1)
        .map(toPublicFlight)[0]!.flight_id
    );

    const result4 = await Backend.searchFlights({
      bookerKey,
      after_id: String(expectedFlights[2]!._id),
      match: '{}',
      regexMatch: '{}',
      sort: 'desc'
    });

    expect(result4).toHaveLength(2);

    const result5 = await Backend.searchFlights({
      bookerKey,
      after_id: String(expectedFlights.slice(-3)[0]!._id),
      match: '{}',
      regexMatch: '{}',
      sort: 'asc'
    });

    expect(result5).toHaveLength(2);

    const result6 = await Backend.searchFlights({
      bookerKey,
      after_id: String(expectedFlights[2]!._id),
      match: '{}',
      regexMatch: '{}',
      sort: 'desc'
    });

    expect(result6).toHaveLength(
      expectedFlights.filter((flight) => flight.type === 'arrival').slice(0, 2).length
    );

    const result6X = await Backend.searchFlights({
      bookerKey,
      after_id: String(expectedFlights.slice(-2)[0]!._id),
      match: '{}',
      regexMatch: '{}',
      sort: 'desc'
    });

    expect(result6X).toHaveLength(count);

    const result7 = await Backend.searchFlights({
      bookerKey,
      after_id: String(expectedFlights.at(-1)!._id),
      match: '{}',
      regexMatch: '{}',
      sort: 'asc'
    });

    expect(result7).toHaveLength(0);

    const result8 = await Backend.searchFlights({
      bookerKey,
      after_id: undefined,
      match: JSON.stringify({ type: 'DNE' }),
      regexMatch: '{}',
      sort: 'desc'
    });

    expect(result8).toHaveLength(0);

    const result9 = await Backend.searchFlights({
      bookerKey,
      after_id: undefined,
      match: JSON.stringify({ type: 'DNE' }),
      regexMatch: JSON.stringify({ type: '^arr' }),
      sort: 'desc'
    });

    // ? regexMatch keys override match keys!
    expect(result9).toHaveLength(count);

    const result9X = await Backend.searchFlights({
      bookerKey,
      after_id: undefined,
      match: JSON.stringify({ type: 'arrival' }),
      regexMatch: JSON.stringify({ type: 'DNE' }),
      sort: 'desc'
    });

    expect(result9X).toHaveLength(0);

    const result10 = await Backend.searchFlights({
      bookerKey,
      after_id: undefined,
      match: '{}',
      regexMatch: JSON.stringify({ type: '^arr' }),
      sort: 'desc'
    });

    expect(result10).toStrictEqual(result1);

    const result11 = await Backend.searchFlights({
      bookerKey,
      after_id: undefined,
      match: '{}',
      regexMatch: JSON.stringify({ type: '^ARR' }),
      sort: 'desc'
    });

    expect(result11).toStrictEqual(result1);

    const result12 = await Backend.searchFlights({
      bookerKey,
      after_id: undefined,
      match: '{}',
      regexMatch: JSON.stringify({ type: 'ArTuRe$' }),
      sort: 'desc'
    });

    expect(result12).toHaveLength(count);
    expect(result12.every((flight) => flight.type === 'departure')).toBeTrue();

    const result13 = await Backend.searchFlights({
      bookerKey,
      after_id: undefined,
      match: JSON.stringify({ ffms: { $gt: 1_000_000 } }),
      regexMatch: '{}',
      sort: 'desc'
    });

    expect(result13).toHaveLength(1);

    const result14 = await Backend.searchFlights({
      bookerKey,
      after_id: undefined,
      match: JSON.stringify({ ffms: { $lt: 1_000_000 } }),
      regexMatch: '{}',
      sort: 'desc'
    });

    expect(result14).toHaveLength(count);

    const result15 = await Backend.searchFlights({
      bookerKey,
      after_id: undefined,
      match: '{}',
      regexMatch: JSON.stringify({ airline: 's.*t' }),
      sort: 'desc'
    });

    expect(result15).toHaveLength(1);

    const result16 = await Backend.searchFlights({
      bookerKey,
      after_id: undefined,
      match: JSON.stringify({ arriveAtReceiver: { $lt: 10_000 } }),
      regexMatch: '{}',
      sort: 'desc'
    });

    expect(result16).toHaveLength(1);

    const result17 = await Backend.searchFlights({
      bookerKey,
      after_id: undefined,
      match: JSON.stringify({ ffms: { $gte: 1_000_000 }, departFromSender: 500 }),
      regexMatch: JSON.stringify({ airline: 's.*t' }),
      sort: 'desc'
    });

    expect(result17).toHaveLength(1);

    const result18 = await Backend.searchFlights({
      bookerKey,
      after_id: String(new ObjectId(result17[0]!.flight_id)),
      match: JSON.stringify({ ffms: { $gte: 1_000_000 }, departFromSender: 500 }),
      regexMatch: JSON.stringify({ airline: 's.*t' }),
      sort: 'desc'
    });

    expect(result18).toHaveLength(0);

    const result19 = await Backend.searchFlights({
      bookerKey,
      after_id: undefined,
      match: JSON.stringify({ status: 'past' }),
      regexMatch: '{}',
      sort: 'desc'
    });

    expect(result19.every((flight) => flight.gate === null)).toBeTrue();
  });

  it('search returns expected paginated records with secondary matchers', async () => {
    expect.hasAssertions();

    const count = getEnv().RESULTS_PER_PAGE;

    const result1 = await Backend.searchFlights({
      bookerKey,
      after_id: undefined,
      match: JSON.stringify({ arriveAtReceiver: { $gte: Date.now() } }),
      regexMatch: '{}',
      sort: 'asc'
    });

    const result2 = await Backend.searchFlights({
      bookerKey,
      after_id: undefined,
      match: JSON.stringify({ arriveAtReceiver: { $gte: Date.now() } }),
      regexMatch: '{}',
      sort: 'desc'
    });

    const result3 = await Backend.searchFlights({
      bookerKey,
      after_id: undefined,
      match: '{}',
      regexMatch: JSON.stringify({ status: 'landed|departed' }),
      sort: 'asc'
    });

    const result4 = await Backend.searchFlights({
      bookerKey,
      after_id: undefined,
      match: '{}',
      regexMatch: JSON.stringify({ status: 'landed|departed' }),
      sort: 'desc'
    });

    const expectedFlights = dummyAppData.flights.map(toPublicFlight);
    const expectedFlights1 = expectedFlights
      .filter((f) => f.arriveAtReceiver >= Date.now())
      .slice(0, count);

    const expectedFlights2 = expectedFlights
      .filter((f) => f.arriveAtReceiver >= Date.now())
      .slice(-count)
      .toReversed();

    const expectedFlights3 = expectedFlights
      .filter((f) => /landed|departed/.test(f.status))
      .slice(0, count);

    const expectedFlights4 = expectedFlights
      .filter((f) => /landed|departed/.test(f.status))
      .slice(-count)
      .toReversed();

    expect(result1).toStrictEqual(expectedFlights1);
    expect(result2).toStrictEqual(expectedFlights2);
    expect(result3).toStrictEqual(expectedFlights3);
    expect(result4).toStrictEqual(expectedFlights4);
    expect(
      result1.every((flight) =>
        Object.keys(flight).every((key) => PublicFlightKeys.includes(key))
      )
    ).toBeTrue();
    expect(
      result3.every((flight) =>
        Object.keys(flight).every((key) => PublicFlightKeys.includes(key))
      )
    ).toBeTrue();
  });

  it('does not throw when there are no flights in the system', async () => {
    expect.hasAssertions();

    const { flightsDb } = await getFlightsDb();
    await flightsDb.deleteMany();

    await expect(
      Backend.searchFlights({
        bookerKey,
        after_id: undefined,
        match: undefined,
        regexMatch: undefined,
        sort: undefined
      })
    ).not.toReject();
  });

  it('searches by flight_id via match and regexMatch work as expected', async () => {
    expect.hasAssertions();
    const expectedPublicFlights = dummyAppData.flights.slice(2, 4).map(toPublicFlight);

    await expect(
      Backend.searchFlights({
        bookerKey,
        after_id: undefined,
        match: JSON.stringify({ flight_id: expectedPublicFlights[0]!.flight_id }),
        regexMatch: '{}',
        sort: 'asc'
      })
    ).resolves.toStrictEqual([expectedPublicFlights[0]!]);

    await expect(
      Backend.searchFlights({
        bookerKey,
        after_id: undefined,
        match: '{}',
        regexMatch: JSON.stringify({
          flight_id: expectedPublicFlights.map((f) => f.flight_id).join('|')
        }),
        sort: 'asc'
      })
    ).resolves.toStrictEqual(expectedPublicFlights);
  });
});
