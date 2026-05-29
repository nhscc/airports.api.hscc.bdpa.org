import { setupMemoryServerOverride } from '@-xun/mongo-test';
import { testApiHandler } from 'next-test-api-route-handler';

import { api } from 'testverse:fixtures/index.ts';
import { useMockDateNow } from 'testverse:util.ts';

import { getSchemaConfig } from '@nhscc/backend-airports/db';
import { dummyAppData, getDummyData } from '@nhscc/backend-airports/dummy';

useMockDateNow();
setupMemoryServerOverride({
  schema: getSchemaConfig(),
  data: getDummyData()
});

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

describe('api/v1/info', () => {
  describe('/airlines', () => {
    it('returns data as expected', async () => {
      expect.hasAssertions();

      const airlines = dummyAppData.airlines.map((a) => {
        const { name, codePrefix } = a;

        return {
          name,
          codePrefix
        };
      });

      await testApiHandler({
        pagesHandler: api.v1.infoAirlines,
        test: async ({ fetch }) => {
          const response = await fetch({
            headers: { 'content-type': 'application/json' }
          });

          expect(response.status).toBe(200);
          await expect(response.json()).resolves.toStrictEqual({
            airlines,
            success: true
          });
        }
      });
    });
  });

  describe('/airports', () => {
    it('returns data as expected', async () => {
      expect.hasAssertions();

      const airports = dummyAppData.airports.map((a) => {
        const { city, country, state, name, shortName } = a;

        return {
          city,
          state,
          country,
          name,
          shortName
        };
      });

      await testApiHandler({
        pagesHandler: api.v1.infoAirports,
        test: async ({ fetch }) => {
          const response = await fetch({
            headers: { 'content-type': 'application/json' }
          });

          expect(response.status).toBe(200);
          await expect(response.json()).resolves.toStrictEqual({
            airports,
            success: true
          });
        }
      });
    });
  });

  describe('/no-fly-list', () => {
    it('returns data as expected', async () => {
      expect.hasAssertions();

      const noFlyList = dummyAppData['no-fly-list'].map((item) => {
        const { _id, ...noFly } = item;
        return noFly;
      });

      await testApiHandler({
        pagesHandler: api.v1.infoNoFlyList,
        test: async ({ fetch }) => {
          const response = await fetch({
            headers: { 'content-type': 'application/json' }
          });

          expect(response.status).toBe(200);
          await expect(response.json()).resolves.toStrictEqual({
            noFlyList,
            success: true
          });
        }
      });
    });
  });
});

describe('api/v2/info', () => {
  describe('/airlines', () => {
    it('returns data as expected', async () => {
      expect.hasAssertions();

      const airlines = dummyAppData.airlines.map((a) => {
        const { name, codePrefix } = a;

        return {
          name,
          codePrefix
        };
      });

      await testApiHandler({
        pagesHandler: api.v2.infoAirlines,
        test: async ({ fetch }) => {
          const response = await fetch({
            headers: { 'content-type': 'application/json' }
          });

          expect(response.status).toBe(200);
          await expect(response.json()).resolves.toStrictEqual({
            airlines,
            success: true
          });
        }
      });
    });
  });

  describe('/airports', () => {
    it('returns data as expected', async () => {
      expect.hasAssertions();

      const airports = dummyAppData.airports.map((a) => {
        const { city, country, state, name, shortName } = a;

        return {
          city,
          state,
          country,
          name,
          shortName
        };
      });

      await testApiHandler({
        pagesHandler: api.v2.infoAirports,
        test: async ({ fetch }) => {
          const response = await fetch({
            headers: { 'content-type': 'application/json' }
          });

          expect(response.status).toBe(200);
          await expect(response.json()).resolves.toStrictEqual({
            airports,
            success: true
          });
        }
      });
    });
  });

  describe('/all-extras', () => {
    it('returns data as expected', async () => {
      expect.hasAssertions();

      await testApiHandler({
        pagesHandler: api.v2.infoAllExtras,
        test: async ({ fetch }) => {
          const response = await fetch({
            headers: { 'content-type': 'application/json' }
          });

          expect(response.status).toBe(200);
          await expect(response.json()).resolves.toStrictEqual({
            extras: dummyAppData.info[0]?.allExtras,
            success: true
          });
        }
      });
    });
  });

  describe('/no-fly-list', () => {
    it('returns data as expected', async () => {
      expect.hasAssertions();

      const noFlyList = dummyAppData['no-fly-list'].map((item) => {
        const { _id, ...noFly } = item;
        return noFly;
      });

      await testApiHandler({
        pagesHandler: api.v2.infoNoFlyList,
        test: async ({ fetch }) => {
          const response = await fetch({
            headers: { 'content-type': 'application/json' }
          });

          expect(response.status).toBe(200);
          await expect(response.json()).resolves.toStrictEqual({
            noFlyList,
            success: true
          });
        }
      });
    });
  });

  describe('/seat-classes', () => {
    it('returns data as expected', async () => {
      expect.hasAssertions();

      await testApiHandler({
        pagesHandler: api.v2.infoSeatClasses,
        test: async ({ fetch }) => {
          const response = await fetch({
            headers: { 'content-type': 'application/json' }
          });

          expect(response.status).toBe(200);
          await expect(response.json()).resolves.toStrictEqual({
            seats: dummyAppData.info[0]?.seatClasses,
            success: true
          });
        }
      });
    });
  });
});
