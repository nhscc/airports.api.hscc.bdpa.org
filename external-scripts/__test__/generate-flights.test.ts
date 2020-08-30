import { setClientAndDb } from 'universe/backend/db'
import { setupJest } from 'universe/__test__/db'
import generateFlights from '../generate-flights'

import type { InternalFlight } from 'types/global'
import { WithId } from 'mongodb'

const { getDb, getNewClientAndDb } = setupJest();

const getFlightsDb = async () => (await getDb()).collection<WithId<InternalFlight>>('flights');
const getCount = async () => (await getFlightsDb()).countDocuments();

describe('external-scripts/generate-flights', () => {
    it('generates some flights', async () => {
        expect.hasAssertions();

        await (await getFlightsDb()).deleteMany({});

        expect(await getCount()).toBe(0);

        await generateFlights();

        setClientAndDb(await getNewClientAndDb());
        expect(await getCount()).not.toBe(0);
    });
});
