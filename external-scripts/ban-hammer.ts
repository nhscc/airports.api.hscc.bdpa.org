/* eslint-disable no-console */
import { getEnv } from 'universe/backend/env'
import { getDb } from 'universe/backend/db'
import { AppError } from 'universe/backend/error'

const oneSecondInMs = 1000;

console.log('[ initializing ]');

export default (async function() {
    try {
        const {
            BAN_HAMMER_WILL_BE_CALLED_EVERY_SECONDS: calledEverySeconds,
            BAN_HAMMER_MAX_REQUESTS_PER_WINDOW: maxRequestsPerWindow,
            BAN_HAMMER_RESOLUTION_WINDOW_SECONDS: resolutionWindowSeconds,
            BAN_HAMMER_DEFAULT_BAN_TIME_MINUTES: defaultBanTimeMinutes,
            BAN_HAMMER_RECIDIVISM_PUNISH_MULTIPLIER: punishMultiplier,
            EXTERNAL_SCRIPTS_BE_VERBOSE: beVerbose,
        } = getEnv();

        if(!calledEverySeconds || !(Number(calledEverySeconds) > 0) ||
           !maxRequestsPerWindow || !(Number(maxRequestsPerWindow) > 0) ||
           !resolutionWindowSeconds || !(Number(resolutionWindowSeconds) > 0) ||
           !defaultBanTimeMinutes || !(Number(defaultBanTimeMinutes) > 0) ||
           !punishMultiplier || !(Number(punishMultiplier) > 0)) {
            throw new AppError('illegal environment detected, check environment variables');
        }

        const calledEveryMs = oneSecondInMs * calledEverySeconds;
        const defaultBanTimeMs = oneSecondInMs * 60 * defaultBanTimeMinutes;
        const resolutionWindowMs = oneSecondInMs * resolutionWindowSeconds;

        console.log(`[ connecting to external database ]`);

        const db = await getDb({ external: true });

        console.log(`[ running aggregate pipeline on request-log ]`);

        const pipeline = [
            {
                $limit: 1
            },
            {
                $project: { _id: 1 }
            },
            {
                $project: { _id: 0 }
            },
            {
                $lookup: {
                    from: 'request-log',
                    as: 'keyBased',
                    pipeline: [
                        {
                            $match: {
                                key: { $ne: null },
                                $expr: { $gte: ['$time', { $subtract: [{ $toLong: '$$NOW' }, calledEveryMs] }]}
                            }
                        },
                        {
                            $group: {
                                _id: {
                                    key: '$key',
                                    interval: { $subtract: ['$time', { $mod: ['$time', resolutionWindowMs] }]}
                                },
                                count: { $sum: 1 }
                            }
                        },
                        {
                            $match: {
                                count: { $gt: resolutionWindowSeconds * maxRequestsPerWindow }
                            }
                        },
                        {
                            $project: {
                                key: '$_id.key',
                                until: { $add: [{ $toLong: '$$NOW' }, defaultBanTimeMs] }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                count: 0
                            }
                        }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'request-log',
                    as: 'ipBased',
                    pipeline: [
                        {
                            $match: {
                                $expr: { $gte: ['$time', { $subtract: [{ $toLong: '$$NOW' }, calledEveryMs] }]}
                            }
                        },
                        {
                            $group: {
                                _id: {
                                    ip: '$ip',
                                    interval: { $subtract: ['$time', { $mod: ['$time', resolutionWindowMs] }]}
                                },
                                count: { $sum: 1 }
                            }
                        },
                        {
                            $match: {
                                count: { $gt: resolutionWindowSeconds * maxRequestsPerWindow }
                            }
                        },
                        {
                            $project: {
                                ip: '$_id.ip',
                                until: { $add: [{ $toLong: '$$NOW' }, defaultBanTimeMs] }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                count: 0
                            }
                        }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'limited-log-mview',
                    as: 'previous',
                    pipeline: [
                        {
                            $match: {
                                $expr: { $gte: ['$until', { $subtract: [
                                    { $toLong: '$$NOW' }, defaultBanTimeMs * punishMultiplier
                                ]}]}
                            }
                        },
                        {
                            $project: {
                                _id: 0
                            }
                        }
                    ]
                }
            },
            {
                $project: {
                    union: { $concatArrays: ['$keyBased', '$ipBased', '$previous'] }
                }
            },
            {
                $unwind: {
                    path: '$union'
                }
            },
            {
                $replaceRoot: {
                    newRoot: '$union'
                }
            },
            {
                $group: {
                    _id: {
                        ip: '$ip',
                        key: '$key'
                    },
                    count: {
                        $sum: 1
                    },
                    until: {
                        $max: '$until'
                    }
                }
            },
            {
                $set: {
                    until: {
                        $cond: {
                            if: { $ne: ['$count', 1] },
                            then: {
                                $max: [
                                    { $add: [{ $toLong: '$$NOW' }, defaultBanTimeMs * punishMultiplier] },
                                    '$until'
                                ]
                            },
                            else: '$until'
                        }
                    },
                    ip: '$_id.ip',
                    key: '$_id.key'
                }
            },
            {
                $project: {
                    count: 0,
                    _id: 0
                }
            },
            {
                $out: 'limited-log-mview'
            }
        ];

        const cursor = db.collection('request-log').aggregate(pipeline);

        beVerbose && console.dir(pipeline, { depth: null });

        await cursor.next();

        console.log('[ closing connection ]');

        await cursor.close();
        await db.client?.close();

        console.log('[ execution complete ]');
    }

    catch(e) {
        console.error('EXCEPTION:', e);
        process.exit(1);
    }
})();
