import { MongoClient, Db } from 'mongodb'
import { getEnv } from 'universe/backend/env'

let db: Db | null = null;

/**
 * Used to lazily create the database once on-demand instead of immediately when
 * the app runs.
 */
export async function getDb() {
    db = db || (await MongoClient.connect(getEnv().MONGODB_URI, { useUnifiedTopology: true })).db();
    return db;
}

/**
 * Used for testing purposes. Sets the global db instance to something else.
 */
export function setDb(newDB: Db) { db = newDB; }

/**
 * Destroys all collections in the database. Can be called multiple times
 * safely.
 */
export async function destroyDb(db: Db) {
    await Promise.allSettled([
        db.dropCollection('keys'),
        db.dropCollection('request-log'),
        db.dropCollection('limited-log-mview'),
        db.dropCollection('flights'),
        db.dropCollection('airports'),
        db.dropCollection('airlines'),
        db.dropCollection('no-fly-list'),
        db.dropCollection('info'),
    ]);
}

/**
 * This function is idempotent and can be called without worry of data loss.
 */
export async function initializeDb(db: Db) {
    // TODO: Add validation rules during createCollection phase
    // TODO: Make an index over key in keys (if not exists)

    await Promise.all([
        db.createCollection('keys'),
        db.createCollection('request-log', { capped: true, size: 1000000, max: 10000 }),
        db.createCollection('limited-log-mview'),
        db.createCollection('flights'),
        db.createCollection('airports'),
        db.createCollection('airlines'),
        db.createCollection('no-fly-list'),
        db.createCollection('info'),
    ]);
}

export const pipelines = {
    resolveFlightState: (key: string) => [
        {
            $addFields: {
                state: {
                    $arrayElemAt: [
                        {
                            $filter: {
                                input: { $objectToArray: '$stochasticStates' },
                                as: 'st',
                                cond: { $lte: [{ $toLong: '$$st.k'}, { $toLong: '$$NOW' }] }
                            }
                        },
                    -1],
                },
                flight_id: '$_id',
                bookable: {
                    $cond: {
                        if: {
                            $eq: ['$booker_key', key]
                        },
                        then: true,
                        else: false
                    }
                },
            }
        },
        {
            $replaceRoot: {
                newRoot: {
                    $mergeObjects: [ '$$ROOT', '$state.v' ]
                }
            }
        },
        {
            $project: {
                state: false,
                _id: false,
                booker_key: false,
                stochasticStates: false
            }
        }
    ]
};
