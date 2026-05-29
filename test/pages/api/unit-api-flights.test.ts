/* eslint-disable unicorn/no-array-callback-reference */
import { dummyRootData } from '@-xun/api-strategy/mongo/dummy';
import { setupMemoryServerOverride } from '@-xun/mongo-test';
import { ObjectId } from 'mongodb';
import { testApiHandler } from 'next-test-api-route-handler';

import { api } from 'testverse:fixtures/index.ts';
import { useMockDateNow } from 'testverse:util.ts';

import {
  getFlightsDb,
  getSchemaConfig,
  toPublicFlight,
  toPublicFlightV1
} from '@nhscc/backend-airports/db';

import { dummyAppData, getDummyData } from '@nhscc/backend-airports/dummy';
import { getEnv } from '@nhscc/backend-airports/env';

import type { WithId } from 'mongodb';
import type { InternalFlight, PublicFlight } from '@nhscc/backend-airports/db';

useMockDateNow();
setupMemoryServerOverride({
  schema: getSchemaConfig(),
  data: getDummyData()
});

jest.mock<typeof import('@-xun/api-strategy/auth')>(
  '@-xun/api-strategy/auth',
  (): typeof import('@-xun/api-strategy/auth') => {
    return {
      ...jest.requireActual('@-xun/api-strategy/auth'),
      getAuthedClientToken: () =>
        Promise.resolve({
          attributes: { owner: 'owner' },
          auth_id: jest
            .requireActual('@-xun/api-strategy/mongo/dummy')
            .dummyRootData.auth[1]!._id.toString()
        })
    };
  }
);

jest.mock<typeof import('universe:route-wrapper.ts')>(
  'universe:route-wrapper.ts',
  () => {
    const { middlewareFactory } = require('@-xun/api') as typeof import('@-xun/api');
    const { makeMiddleware: makeErrorHandlingMiddleware } =
      require('@-xun/api/middleware/handle-error') as typeof import('@-xun/api/middleware/handle-error');

    return {
      withMiddleware: jest.fn().mockImplementation(
        middlewareFactory({
          use: [],
          useOnError: [makeErrorHandlingMiddleware()],
          options: { legacyMode: true }
        })
      )
    } as unknown as typeof import('universe:route-wrapper.ts');
  }
);

const resultSize = getEnv().RESULTS_PER_PAGE;
const booker_id = dummyRootData.auth[1]!._id.toString();

const nonExistentObjectIdFromTheFuture = ObjectId.createFromTime(
  Date.now() * 2
).toString();

const v1Flights = dummyAppData.flights.map(internalFlightToPublicFlightV1);
const v2Flights = dummyAppData.flights.map((f) => toPublicFlight(f, booker_id));

function internalFlightToPublicFlightV1(flight: WithId<InternalFlight>) {
  return toPublicFlightV1(toPublicFlight(flight, booker_id));
}

describe('api/v1/flights', () => {
  it('returns expected number of public flights by default in FIFO order', async () => {
    expect.hasAssertions();

    const results = v1Flights.slice(0, getEnv().RESULTS_PER_PAGE);

    await testApiHandler({
      pagesHandler: api.v1.flightsAll,
      test: async ({ fetch }) => {
        const response = await fetch();
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.flights).toStrictEqual(results);
      }
    });
  });

  it('returns expected number of public flights in FIFO order respecting offset (after)', async () => {
    expect.hasAssertions();

    const genUrl = (function* () {
      yield `/?after=`;
      yield `/?after=${v1Flights[0]!.flight_id}`;
      yield `/?after=${v1Flights[1]!.flight_id}`;
      yield `/?after=${v1Flights[10]!.flight_id}`;
      yield `/?after=${v1Flights[50]!.flight_id}`;
      yield `/?after=${v1Flights[100]!.flight_id}`;
      yield `/?after=${v1Flights[200]!.flight_id}`;
      yield `/?after=${v1Flights[248]!.flight_id}`;
      yield `/?after=${v1Flights[249]!.flight_id}`;
      yield `/?after=${nonExistentObjectIdFromTheFuture}`;
    })();

    await testApiHandler({
      requestPatcher: (req) => {
        req.url = genUrl.next().value || undefined;
      },
      pagesHandler: api.v1.flightsAll,
      test: async ({ fetch }) => {
        const responses = await Promise.all(
          Array.from({ length: 10 }).map(() => {
            return fetch().then((r) => r.json());
          })
        );

        expect(responses.some((o) => !o?.success)).toBeFalse();

        expect(responses.map((r) => r.flights)).toIncludeSameMembers([
          v1Flights.slice(0, resultSize),
          v1Flights.slice(1, resultSize + 1),
          v1Flights.slice(2, resultSize + 2),
          v1Flights.slice(11, resultSize + 11),
          v1Flights.slice(51, resultSize + 51),
          v1Flights.slice(101, resultSize + 101),
          v1Flights.slice(201, resultSize + 150),
          v1Flights.slice(-1),
          [],
          []
        ]);
      }
    });
  });

  it('does the right thing when garbage offsets (after) are provided', async () => {
    expect.hasAssertions();

    const genUrl = (function* () {
      yield `/?after=-5`;
      yield `/?after=a`;
      yield `/?after=@($)`;
      yield `/?after=xyz`;
      yield `/?after=123`;
      yield `/?after=(*$)`;
      yield `/?dne=123`;
    })();

    await testApiHandler({
      requestPatcher: (req) => {
        req.url = genUrl.next().value || undefined;
      },
      pagesHandler: api.v1.flightsAll,
      test: async ({ fetch }) => {
        const responses = await Promise.all(
          Array.from({ length: 7 }).map(() => {
            return fetch().then((r) => r.status);
          })
        );

        expect(responses).toIncludeSameMembers([400, 400, 400, 400, 400, 400, 200]);
      }
    });
  });

  it('does not throw when there are no flights in the system', async () => {
    expect.hasAssertions();

    await (await getFlightsDb()).flightsDb.deleteMany();

    await testApiHandler({
      pagesHandler: api.v1.flightsAll,
      test: async ({ fetch }) => {
        const response = await fetch();

        expect(response.status).toBe(200);
        expect((await response.json()).success).toBe(true);
      }
    });
  });

  it('returns same flights as /all if no query params given', async () => {
    expect.hasAssertions();

    let v1AllFlight: PublicFlight[];

    await testApiHandler({
      pagesHandler: api.v1.flightsAll,
      test: async ({ fetch }) => {
        const response = await fetch();
        v1AllFlight = (await response.json()).flights;
      }
    });

    await testApiHandler({
      pagesHandler: api.v1.flightsSearch,
      test: async ({ fetch }) => {
        const response = await fetch();
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.flights).toStrictEqual(v1AllFlight);
      }
    });
  });

  it('returns expected public flights with respect to offset (after)', async () => {
    expect.hasAssertions();

    const genUrl = (function* () {
      yield `/?after=`;
      yield `/?after=${v1Flights[0]!.flight_id}`;
      yield `/?after=${nonExistentObjectIdFromTheFuture}`;
    })();

    await testApiHandler({
      requestPatcher: (req) => {
        req.url = genUrl.next().value || undefined;
      },

      pagesHandler: api.v1.flightsSearch,
      test: async ({ fetch }) => {
        const responses = await Promise.all(
          Array.from({ length: 3 }).map(() => {
            return fetch().then((r) => r.json());
          })
        );

        expect(responses.some((o) => !o?.success)).toBeFalse();

        expect(responses.map((r) => r.flights)).toIncludeSameMembers([
          v1Flights.slice(0, resultSize),
          v1Flights.slice(1, resultSize + 1),
          []
        ]);
      }
    });
  });

  it('returns expected public flights in the requested sort order', async () => {
    expect.hasAssertions();

    const genUrl = (function* () {
      yield `/?sort=`;
      yield `/?sort=desc`;
      yield `/?sort=asc`;
      yield `/?sort=bad`;
    })();

    await testApiHandler({
      requestPatcher: (req) => {
        req.url = genUrl.next().value || undefined;
      },

      pagesHandler: api.v1.flightsSearch,
      test: async ({ fetch }) => {
        const responses = await Promise.all(
          Array.from({ length: 4 }).map(() => {
            return fetch().then((r) => (r.ok ? r.json() : r.status));
          })
        );

        const properResponses = responses.slice(0, 3);

        expect(properResponses.some((o) => !o?.success)).toBeFalse();
        expect(properResponses.map((r) => r.flights)).toIncludeSameMembers([
          v1Flights.slice(0, resultSize),
          v1Flights.slice(150, resultSize + 150).toReversed(),
          v1Flights.slice(0, resultSize)
        ]);

        expect(responses[3]).toBe(400);
      }
    });
  });

  it('returns expected public flights with respect to match', async () => {
    expect.hasAssertions();

    const encode = (o: Record<string, unknown>) => encodeURIComponent(JSON.stringify(o));

    const genUrl = (function* () {
      yield `/?match=${encode({ airline: 'JetBlue' })}`;
      yield `/?match=${encode({ type: 'departure' })}`;
      yield `/?match=${encode({ landingAt: 'F1A' })}`;
      yield `/?match=${encode({ seatPrice: 500 })}`;
      yield `/?match=${encode({ seatPrice: { $gt: 500 } })}`;
      yield `/?match=${encode({ seatPrice: { $gte: 500 } })}`;
      yield `/?match=${encode({ seatPrice: { $lt: 500 } })}`;
      yield `/?match=${encode({ seatPrice: { $lte: 500 } })}`;
    })();

    await testApiHandler({
      requestPatcher: (req) => {
        req.url = genUrl.next().value || undefined;
      },

      pagesHandler: api.v1.flightsSearch,
      test: async ({ fetch }) => {
        const responses = await Promise.all(
          Array.from({ length: 8 }).map(() => {
            return fetch().then((r) => r.json());
          })
        );

        expect(responses.some((o) => !o?.success)).toBeFalse();
        expect(responses.map((r) => r.flights)).toIncludeSameMembers([
          v1Flights.filter((f) => f.airline === 'JetBlue').slice(0, resultSize),
          v1Flights.filter((f) => f.type === 'departure').slice(0, resultSize),
          v1Flights.filter((f) => f.landingAt === 'F1A').slice(0, resultSize),
          v1Flights.filter((f) => f.seatPrice === 500).slice(0, resultSize),
          v1Flights.filter((f) => f.seatPrice > 500).slice(0, resultSize),
          v1Flights.filter((f) => f.seatPrice >= 500).slice(0, resultSize),
          v1Flights.filter((f) => f.seatPrice < 500).slice(0, resultSize),
          v1Flights.filter((f) => f.seatPrice <= 500).slice(0, resultSize)
        ]);
      }
    });

    await testApiHandler({
      pagesHandler: api.v1.flightsSearch,
      requestPatcher: (req) => {
        req.url = `/?match=${encode({ ffms: { $eq: 500 } })}`;
      },
      test: async ({ fetch }) => expect((await fetch()).status).toBe(400)
    });

    await testApiHandler({
      pagesHandler: api.v1.flightsSearch,
      requestPatcher: (req) => {
        req.url = `/?match=${encode({ bad: 500 })}`;
      },
      test: async ({ fetch }) => expect((await fetch()).status).toBe(400)
    });
  });

  it('returns expected public flights with respect to regexMatch', async () => {
    expect.hasAssertions();

    const encode = (o: Record<string, unknown>) => encodeURIComponent(JSON.stringify(o));

    const genUrl = (function* () {
      yield `/?regexMatch=${encode({ airline: 'jetblue' })}`;
      yield `/?regexMatch=${encode({ type: '^dep' })}`;
      yield `/?regexMatch=${encode({ flightNumber: 'u.*' })}`;
      yield `/?regexMatch=${encode({ flightNumber: 'U.*' })}`;
    })();

    await testApiHandler({
      requestPatcher: (req) => {
        req.url = genUrl.next().value || undefined;
      },

      pagesHandler: api.v1.flightsSearch,
      test: async ({ fetch }) => {
        const responses = await Promise.all(
          Array.from({ length: 4 }).map(() => {
            return fetch().then((r) => r.json());
          })
        );

        expect(responses.some((o) => !o?.success)).toBeFalse();
        expect(responses.map((r) => r.flights)).toIncludeSameMembers([
          v1Flights.filter((f) => /jetblue/i.test(f.airline)).slice(0, resultSize),
          v1Flights.filter((f) => /^dep/i.test(f.type)).slice(0, resultSize),
          v1Flights.filter((f) => /u.*/i.test(f.flightNumber)).slice(0, resultSize),
          v1Flights.filter((f) => /U.*/i.test(f.flightNumber)).slice(0, resultSize)
        ]);
      }
    });
  });

  it('regexMatch errors properly with bad inputs', async () => {
    expect.hasAssertions();

    const encode = (o: Record<string, unknown>) => encodeURIComponent(JSON.stringify(o));

    const genUrl = (function* () {
      yield `/?regexMatch=${encode({ ffms: { $gt: 500 } })}`;
      yield `/?regexMatch=${encode({ bad: 'super-bad' })}`;
      yield `/?regexMatch=${encode({ seatPrice: 500 })}`;
    })();

    await testApiHandler({
      requestPatcher: (req) => {
        req.url = genUrl.next().value || undefined;
      },

      pagesHandler: api.v1.flightsSearch,
      test: async ({ fetch }) => {
        await Promise.all(
          Array.from({ length: 3 }).map(() => {
            return fetch()
              .then((r) => r.status)
              .then((s) => expect(s).toBe(400));
          })
        );
      }
    });
  });

  it('ensure seats, baggage, extras, bookable, and _id cannot be matched against', async () => {
    expect.hasAssertions();

    const encode = (o: Record<string, unknown>) => encodeURIComponent(JSON.stringify(o));

    const genUrl = (function* () {
      yield `/?match=${encode({ seats: 'super-bad' })}`;
      yield `/?match=${encode({ baggage: 'super-bad' })}`;
      yield `/?match=${encode({ extras: 'super-bad' })}`;
      yield `/?match=${encode({ bookable: 'super-bad' })}`;
      yield `/?match=${encode({ _id: 'super-bad' })}`;
      yield `/?regexMatch=${encode({ seats: 'super-bad' })}`;
      yield `/?regexMatch=${encode({ baggage: 'super-bad' })}`;
      yield `/?regexMatch=${encode({ bookable: 'super-bad' })}`;
      yield `/?regexMatch=${encode({ extras: 'super-bad' })}`;
      yield `/?regexMatch=${encode({ _id: 'super-bad' })}`;
    })();

    await testApiHandler({
      requestPatcher: (req) => {
        req.url = genUrl.next().value || undefined;
      },

      pagesHandler: api.v1.flightsSearch,
      test: async ({ fetch }) => {
        await Promise.all(
          Array.from({ length: 10 }).map(() => {
            return fetch()
              .then((r) => r.status)
              .then((s) => expect(s).toBe(400));
          })
        );
      }
    });
  });

  it('returns expected public flights with respect to all parameters simultaneously', async () => {
    expect.hasAssertions();

    const encode = (o: Record<string, unknown>) => encodeURIComponent(JSON.stringify(o));

    const genUrl = (function* () {
      yield `/?sort=desc&after=${v1Flights[249]!.flight_id}&match=${encode({ ffms: { $gt: 1_000_000 } })}&regexMatch=${encode({ airline: 'jetblue' })}`;
      yield `/?sort=desc&after=${v1Flights[0]!.flight_id}&match=${encode({ ffms: { $gt: 1_000_000 } })}&regexMatch=${encode({ airline: 'jetblue' })}`;
    })();

    await testApiHandler({
      requestPatcher: (req) => {
        req.url = genUrl.next().value || undefined;
      },

      pagesHandler: api.v1.flightsSearch,
      test: async ({ fetch }) => {
        const responses = await Promise.all(
          Array.from({ length: 2 }).map(() => {
            return fetch().then((r) => r.json());
          })
        );

        expect(responses.some((o) => !o?.success)).toBeFalse();
        expect(responses.map((r) => r.flights)).toIncludeSameMembers([
          [v1Flights[248]],
          []
        ]);
      }
    });
  });

  describe('/with-ids', () => {
    it('returns expected flights by default in FIFO order', async () => {
      expect.hasAssertions();

      const flightIds = dummyAppData.flights.map((flight) => flight._id.toHexString());
      const encode = (ids: string[]) => encodeURIComponent(JSON.stringify(ids));

      const genUrl = (function* () {
        yield `/?ids=${encode([flightIds[0]!])}`;
        yield `/?ids=${encode([flightIds[50]!])}`;
        yield `/?ids=${encode([flightIds[249]!])}`;
        yield `/?ids=${encode(flightIds.slice(0, 50))}`;
        yield `/?ids=${encode(flightIds.slice(90, 150))}`;
        yield `/?ids=${encode([...flightIds.slice(90, 150), new ObjectId().toHexString()])}`;
        yield `/?ids=${encode([new ObjectId().toHexString()])}`;
        yield `/?ids=${encode([new ObjectId().toHexString(), new ObjectId().toHexString()])}`;
        yield `/?ids=`;
      })();

      await testApiHandler({
        requestPatcher: (req) => {
          req.url = genUrl.next().value || undefined;
        },
        pagesHandler: api.v1.flightsWithIds,
        test: async ({ fetch }) => {
          const responses = await Promise.all(
            Array.from({ length: 9 }).map(() => {
              return fetch().then((r) => r.json());
            })
          );

          expect(responses.some((o) => !o?.success)).toBeFalse();

          expect(
            responses.map((r) => r.flights.map((f: PublicFlight) => f.flight_id))
          ).toIncludeSameMembers([
            [flightIds[0]],
            [flightIds[50]],
            [flightIds[249]],
            flightIds.slice(0, 50),
            flightIds.slice(90, 150),
            flightIds.slice(90, 150),
            [],
            [],
            []
          ]);
        }
      });
    });

    it('does the right thing when garbage ids are provided', async () => {
      expect.hasAssertions();

      const genUrl = (function* () {
        yield '/?ids=${}';
        yield '/?ids=(.*)';
        yield '/?ids=flightIds';
        yield '/?ids=0,50';
        yield `/?ids=${encodeURIComponent(JSON.stringify(['lol', false]))}`;
      })();

      await testApiHandler({
        requestPatcher: (req) => {
          req.url = genUrl.next().value || undefined;
        },
        pagesHandler: api.v1.flightsWithIds,
        test: async ({ fetch }) => {
          const responses = await Promise.all(
            Array.from({ length: 5 }).map(() => {
              return fetch().then((r) => r.json());
            })
          );

          expect(responses.some((o) => !o?.success)).toBeFalse();

          expect(responses.map((r) => r.flights)).toIncludeSameMembers([
            [],
            [],
            [],
            [],
            []
          ]);
        }
      });
    });
  });
});

describe('api/v2/flights', () => {
  it('returns expected number of public flights by default in FIFO order', async () => {
    expect.hasAssertions();

    const results = v2Flights.slice(0, getEnv().RESULTS_PER_PAGE);

    await testApiHandler({
      pagesHandler: api.v2.flights,
      test: async ({ fetch }) => {
        const response = await fetch();
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.flights).toStrictEqual(results);
      }
    });
  });

  it('returns expected number of public flights in FIFO order respecting offset (after)', async () => {
    expect.hasAssertions();

    const genUrl = (function* () {
      yield `/?after=`;
      yield `/?after=${v2Flights[0]!.flight_id}`;
      yield `/?after=${v2Flights[1]!.flight_id}`;
      yield `/?after=${v2Flights[10]!.flight_id}`;
      yield `/?after=${v2Flights[50]!.flight_id}`;
      yield `/?after=${v2Flights[100]!.flight_id}`;
      yield `/?after=${v2Flights[200]!.flight_id}`;
      yield `/?after=${v2Flights[248]!.flight_id}`;
      yield `/?after=${v2Flights[249]!.flight_id}`;
      yield `/?after=${nonExistentObjectIdFromTheFuture}`;
    })();

    await testApiHandler({
      requestPatcher: (req) => {
        req.url = genUrl.next().value || undefined;
      },
      pagesHandler: api.v2.flights,
      test: async ({ fetch }) => {
        const responses = await Promise.all(
          Array.from({ length: 10 }).map(() => {
            return fetch().then((r) => r.json());
          })
        );

        expect(responses.some((o) => !o?.success)).toBeFalse();

        expect(responses.map((r) => r.flights)).toIncludeSameMembers([
          v2Flights.slice(0, resultSize),
          v2Flights.slice(1, resultSize + 1),
          v2Flights.slice(2, resultSize + 2),
          v2Flights.slice(11, resultSize + 11),
          v2Flights.slice(51, resultSize + 51),
          v2Flights.slice(101, resultSize + 101),
          v2Flights.slice(201, resultSize + 150),
          v2Flights.slice(-1),
          [],
          []
        ]);
      }
    });
  });

  it('does the right thing when garbage offsets (after) are provided', async () => {
    expect.hasAssertions();

    const genUrl = (function* () {
      yield `/?after=-5`;
      yield `/?after=a`;
      yield `/?after=@($)`;
      yield `/?after=xyz`;
      yield `/?after=123`;
      yield `/?after=(*$)`;
      yield `/?dne=123`;
    })();

    await testApiHandler({
      requestPatcher: (req) => {
        req.url = genUrl.next().value || undefined;
      },
      pagesHandler: api.v2.flights,
      test: async ({ fetch }) => {
        const responses = await Promise.all(
          Array.from({ length: 7 }).map(() => {
            return fetch().then((r) => r.status);
          })
        );

        expect(responses).toIncludeSameMembers([400, 400, 400, 400, 400, 400, 200]);
      }
    });
  });

  it('does not throw when there are no flights in the system', async () => {
    expect.hasAssertions();

    await (await getFlightsDb()).flightsDb.deleteMany();

    await testApiHandler({
      pagesHandler: api.v2.flights,
      test: async ({ fetch }) => {
        const response = await fetch();

        expect(response.status).toBe(200);
        expect((await response.json()).success).toBe(true);
      }
    });
  });

  it('returns same flights as /all if no query params given', async () => {
    expect.hasAssertions();

    let v2Flights: PublicFlight[];

    await testApiHandler({
      pagesHandler: api.v2.flights,
      test: async ({ fetch }) => {
        const response = await fetch();
        v2Flights = (await response.json()).flights;
      }
    });

    await testApiHandler({
      pagesHandler: api.v2.flights,
      test: async ({ fetch }) => {
        const response = await fetch();
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.flights).toStrictEqual(v2Flights);
      }
    });
  });

  it('returns expected public flights with respect to offset (after)', async () => {
    expect.hasAssertions();

    const genUrl = (function* () {
      yield `/?after=`;
      yield `/?after=${v2Flights[0]!.flight_id}`;
      yield `/?after=${nonExistentObjectIdFromTheFuture}`;
    })();

    await testApiHandler({
      requestPatcher: (req) => {
        req.url = genUrl.next().value || undefined;
      },

      pagesHandler: api.v2.flights,
      test: async ({ fetch }) => {
        const responses = await Promise.all(
          Array.from({ length: 3 }).map(() => {
            return fetch().then((r) => r.json());
          })
        );

        expect(responses.some((o) => !o?.success)).toBeFalse();

        expect(responses.map((r) => r.flights)).toIncludeSameMembers([
          v2Flights.slice(0, resultSize),
          v2Flights.slice(1, resultSize + 1),
          []
        ]);
      }
    });
  });

  it('returns expected public flights in the requested sort order', async () => {
    expect.hasAssertions();

    const genUrl = (function* () {
      yield `/?sort=`;
      yield `/?sort=desc`;
      yield `/?sort=asc`;
      yield `/?sort=bad`;
    })();

    await testApiHandler({
      requestPatcher: (req) => {
        req.url = genUrl.next().value || undefined;
      },

      pagesHandler: api.v2.flights,
      test: async ({ fetch }) => {
        const responses = await Promise.all(
          Array.from({ length: 4 }).map(() => {
            return fetch().then((r) => (r.ok ? r.json() : r.status));
          })
        );

        const properResponses = responses.slice(0, 3);

        expect(properResponses.some((o) => !o?.success)).toBeFalse();
        expect(properResponses.map((r) => r.flights)).toIncludeSameMembers([
          v2Flights.slice(0, resultSize),
          v2Flights.slice(150, resultSize + 150).toReversed(),
          v2Flights.slice(0, resultSize)
        ]);

        expect(responses[3]).toBe(400);
      }
    });
  });

  it('returns expected public flights with respect to match', async () => {
    expect.hasAssertions();

    const encode = (o: Record<string, unknown>) => encodeURIComponent(JSON.stringify(o));

    const genUrl = (function* () {
      yield `/?match=${encode({ airline: 'JetBlue' })}`;
      yield `/?match=${encode({ type: 'departure' })}`;
      yield `/?match=${encode({ landingAt: 'F1A' })}`;
    })();

    await testApiHandler({
      requestPatcher: (req) => {
        req.url = genUrl.next().value || undefined;
      },

      pagesHandler: api.v2.flights,
      test: async ({ fetch }) => {
        const responses = await Promise.all(
          Array.from({ length: 3 }).map(() => {
            return fetch().then((r) => r.json());
          })
        );

        expect(responses.some((o) => !o?.success)).toBeFalse();
        expect(responses.map((r) => r.flights)).toIncludeSameMembers([
          v2Flights.filter((f) => f.airline === 'JetBlue').slice(0, resultSize),
          v2Flights.filter((f) => f.type === 'departure').slice(0, resultSize),
          v2Flights.filter((f) => f.landingAt === 'F1A').slice(0, resultSize)
        ]);
      }
    });

    await testApiHandler({
      pagesHandler: api.v2.flights,
      requestPatcher: (req) => {
        req.url = `/?match=${encode({ ffms: { $eq: 500 } })}`;
      },
      test: async ({ fetch }) => expect((await fetch()).status).toBe(400)
    });

    await testApiHandler({
      pagesHandler: api.v2.flights,
      requestPatcher: (req) => {
        req.url = `/?match=${encode({ bad: 500 })}`;
      },
      test: async ({ fetch }) => expect((await fetch()).status).toBe(400)
    });
  });

  it('returns expected public flights with respect to regexMatch', async () => {
    expect.hasAssertions();

    const encode = (o: Record<string, unknown>) => encodeURIComponent(JSON.stringify(o));

    const genUrl = (function* () {
      yield `/?regexMatch=${encode({ airline: 'jetblue' })}`;
      yield `/?regexMatch=${encode({ type: '^dep' })}`;
      yield `/?regexMatch=${encode({ flightNumber: 'u.*' })}`;
      yield `/?regexMatch=${encode({ flightNumber: 'U.*' })}`;
    })();

    await testApiHandler({
      requestPatcher: (req) => {
        req.url = genUrl.next().value || undefined;
      },

      pagesHandler: api.v2.flights,
      test: async ({ fetch }) => {
        const responses = await Promise.all(
          Array.from({ length: 4 }).map(() => {
            return fetch().then((r) => r.json());
          })
        );

        expect(responses.some((o) => !o?.success)).toBeFalse();
        expect(responses.map((r) => r.flights)).toIncludeSameMembers([
          v2Flights.filter((f) => /jetblue/i.test(f.airline)).slice(0, resultSize),
          v2Flights.filter((f) => /^dep/i.test(f.type)).slice(0, resultSize),
          v2Flights.filter((f) => /u.*/i.test(f.flightNumber)).slice(0, resultSize),
          v2Flights.filter((f) => /U.*/i.test(f.flightNumber)).slice(0, resultSize)
        ]);
      }
    });
  });

  it('regexMatch errors properly with bad inputs', async () => {
    expect.hasAssertions();

    const encode = (o: Record<string, unknown>) => encodeURIComponent(JSON.stringify(o));

    const genUrl = (function* () {
      yield `/?regexMatch=${encode({ ffms: { $gt: 500 } })}`;
      yield `/?regexMatch=${encode({ bad: 'super-bad' })}`;
      yield `/?regexMatch=${encode({ seatPrice: 500 })}`;
    })();

    await testApiHandler({
      requestPatcher: (req) => {
        req.url = genUrl.next().value || undefined;
      },

      pagesHandler: api.v2.flights,
      test: async ({ fetch }) => {
        await Promise.all(
          Array.from({ length: 3 }).map(() => {
            return fetch()
              .then((r) => r.status)
              .then((s) => expect(s).toBe(400));
          })
        );
      }
    });
  });

  it('ensure seats, baggage, extras, bookable, and _id cannot be matched against', async () => {
    expect.hasAssertions();

    const encode = (o: Record<string, unknown>) => encodeURIComponent(JSON.stringify(o));

    const genUrl = (function* () {
      yield `/?match=${encode({ seats: 'super-bad' })}`;
      yield `/?match=${encode({ baggage: 'super-bad' })}`;
      yield `/?match=${encode({ extras: 'super-bad' })}`;
      yield `/?match=${encode({ bookable: 'super-bad' })}`;
      yield `/?match=${encode({ _id: 'super-bad' })}`;
      yield `/?regexMatch=${encode({ seats: 'super-bad' })}`;
      yield `/?regexMatch=${encode({ baggage: 'super-bad' })}`;
      yield `/?regexMatch=${encode({ bookable: 'super-bad' })}`;
      yield `/?regexMatch=${encode({ extras: 'super-bad' })}`;
      yield `/?regexMatch=${encode({ _id: 'super-bad' })}`;
    })();

    await testApiHandler({
      requestPatcher: (req) => {
        req.url = genUrl.next().value || undefined;
      },

      pagesHandler: api.v2.flights,
      test: async ({ fetch }) => {
        await Promise.all(
          Array.from({ length: 10 }).map(() => {
            return fetch()
              .then((r) => r.status)
              .then((s) => expect(s).toBe(400));
          })
        );
      }
    });
  });

  it('returns expected public flights with respect to all parameters simultaneously', async () => {
    expect.hasAssertions();

    const encode = (o: Record<string, unknown>) => encodeURIComponent(JSON.stringify(o));

    const genUrl = (function* () {
      yield `/?sort=desc&after=${v2Flights[249]!.flight_id}&match=${encode({ ffms: { $gt: 1_000_000 } })}&regexMatch=${encode({ airline: 'jetblue' })}`;
      yield `/?sort=desc&after=${v2Flights[0]!.flight_id}&match=${encode({ ffms: { $gt: 1_000_000 } })}&regexMatch=${encode({ airline: 'jetblue' })}`;
    })();

    await testApiHandler({
      requestPatcher: (req) => {
        req.url = genUrl.next().value || undefined;
      },

      pagesHandler: api.v2.flights,
      test: async ({ fetch }) => {
        const responses = await Promise.all(
          Array.from({ length: 2 }).map(() => {
            return fetch().then((r) => r.json());
          })
        );

        expect(responses.some((o) => !o?.success)).toBeFalse();
        expect(responses.map((r) => r.flights)).toIncludeSameMembers([
          [v2Flights[248]],
          []
        ]);
      }
    });
  });

  it('returns expected flights when searching by flight_id', async () => {
    expect.hasAssertions();

    const flightIds = dummyAppData.flights.map((flight) => flight._id.toHexString());
    const encode = (ids: string[]) =>
      encodeURIComponent(JSON.stringify({ flight_id: ids.join('|') }));

    const genUrl = (function* () {
      yield `/?regexMatch=${encode([flightIds[0]!])}`;
      yield `/?regexMatch=${encode([flightIds[50]!])}`;
      yield `/?regexMatch=${encode([flightIds[249]!])}`;
      yield `/?regexMatch=${encode(flightIds.slice(0, 50))}`;
      yield `/?regexMatch=${encode(flightIds.slice(90, 150))}`;
      yield `/?regexMatch=${encode([...flightIds.slice(90, 150), new ObjectId().toHexString()])}`;
      yield `/?regexMatch=${encode([new ObjectId().toHexString()])}`;
      yield `/?regexMatch=${encode([new ObjectId().toHexString(), new ObjectId().toHexString()])}`;
    })();

    await testApiHandler({
      requestPatcher: (req) => {
        req.url = genUrl.next().value || undefined;
      },
      pagesHandler: api.v2.flights,
      test: async ({ fetch }) => {
        const responses = await Promise.all(
          Array.from({ length: 8 }).map(() => {
            return fetch().then((r) => r.json());
          })
        );

        expect(responses.some((o) => !o?.success)).toBeFalse();

        expect(
          responses.map((r) => r.flights.map((f: PublicFlight) => f.flight_id))
        ).toIncludeSameMembers([
          [flightIds[0]],
          [flightIds[50]],
          [flightIds[249]],
          flightIds.slice(0, 50),
          flightIds.slice(90, 150),
          flightIds.slice(90, 150),
          [],
          []
        ]);
      }
    });
  });
});
