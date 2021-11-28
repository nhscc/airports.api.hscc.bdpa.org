import { MongoClient, Db } from 'mongodb';
import { getEnv } from 'universe/backend/env';

type InternalMemory = { client: MongoClient; db: Db } | null;
let memory: InternalMemory = null;

// TODO: make all this consistent with the latest db from latest apis

/**
 * Lazily connects to the database once on-demand instead of immediately when
 * the app runs.
 */
export async function getDb(params?: { external: true }) {
  if (!memory) {
    memory = {} as NonNullable<InternalMemory>;

    let uri = getEnv().MONGODB_URI;
    if (params?.external) uri = getEnv().EXTERNAL_SCRIPTS_MONGODB_URI;

    memory.client = await MongoClient.connect(uri);
    memory.db = memory.client.db();
  }

  return memory.db;
}

/**
 * Returns the MongoClient instance used to connect to the database.
 *
 * @param params if `{external: true}`, external Mongo connect URI will be used
 */
export async function getDbClient(params?: { external: true }) {
  await getDb(params);
  if (!memory) throw new Error('memory is missing');
  return memory.client;
}

/**
 * Kills the MongoClient and closes any lingering database connections.
 */
export async function closeDb() {
  await memory?.client.close(true);
  memory = null;
}

/**
 * Sets the global db instance to something else. Used primarily for testing
 * purposes.
 */
export function setClientAndDb({
  client,
  db
}: {
  client: MongoClient;
  db: Db;
}) {
  memory = memory ?? ({} as NonNullable<InternalMemory>);
  memory.client = client;
  memory.db = db;
}

/**
 * Destroys all collections in the database. Can be called multiple times
 * safely.
 */
export async function destroyDb(db: Db) {
  await Promise.allSettled([
    db.dropCollection('keys'),
    db.dropCollection('tool-keys'),
    db.dropCollection('request-log'),
    db.dropCollection('limited-log-mview'),
    db.dropCollection('flights'),
    db.dropCollection('airports'),
    db.dropCollection('airlines'),
    db.dropCollection('no-fly-list'),
    db.dropCollection('info'),
    db.dropCollection('tool-overrides')
  ]);
}

/**
 * This function is idempotent and can be called without worry of data loss.
 */
export async function initializeDb(db: Db) {
  // TODO: Add validation rules during createCollection phase
  // TODO: Pop stochastic states out of flight documents and make indices over
  // TODO:    all time-related data. This will dramatically speed up searches!

  await Promise.all([
    db.createCollection('keys'),
    db.createCollection('tool-keys'),
    db.createCollection('request-log'),
    db.createCollection('limited-log-mview'),
    db.createCollection('flights'),
    db.createCollection('airports'),
    db.createCollection('airlines'),
    db.createCollection('no-fly-list'),
    db.createCollection('info'),
    db.createCollection('tool-overrides')
  ]);

  const flights = db.collection('flights');

  await Promise.all([
    flights.createIndex({ type: 1 }),
    flights.createIndex({ airline: 1 }),
    flights.createIndex({ departingTo: 1 }),
    flights.createIndex({ landingAt: 1 }),
    flights.createIndex({ ffms: 1 })
  ]);
}

export const pipelines = {
  resolveFlightState: (key: string, removeId: boolean) => [
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
              $and: [
                { $eq: ['$bookerKey', key] },
                { $eq: ['$type', 'departure'] }
              ]
            },
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
        ...(removeId ? { _id: false } : {}),
        bookerKey: false,
        stochasticStates: false
      }
    }
  ]
};
