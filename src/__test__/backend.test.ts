import { ObjectId, WithId } from 'mongodb';
import * as Backend from 'universe/backend'
import { setupJest, unhydratedDummyDbData } from 'universe/__test__/db'
import { getEnv } from 'universe/backend/env'
import { populateEnv } from 'universe/dev-utils'
import randomInt from 'random-int'

import {
    RequestLogEntry,
    LimitedLogEntry
} from 'types/global'

import type{ NextApiRequest, NextApiResponse } from 'next'

populateEnv();

//const { getHydratedData, getDb } = setupJest();

describe('universe/backend', () => {
    test.todo('unit test the backend');
});

