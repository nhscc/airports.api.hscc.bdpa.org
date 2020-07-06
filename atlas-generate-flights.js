const oneSecond = 1000;

const scheduledToRepeatEvery    = oneSecond * 60;       // * seconds
const maxRequestsPerSecond      = 10;                   // * requests per second
const resolutionWindowSeconds   = 1;                    // * seconds
const defaultBanTime            = oneSecond * 60 * 15;  // * seconds

const resolutionWindowMs        = oneSecond * resolutionWindowSeconds;

const pipeline = [
    { $limit: 1 },
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
                        $expr: { $gte: ['$time', { $subtract: [{ $toLong: '$$NOW' }, scheduledToRepeatEvery] }]}
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
                        count: { $gt: resolutionWindowSeconds * maxRequestsPerSecond }
                    }
                },
                {
                    $project: {
                        key: '$_id.key',
                        until: { $add: [{ $toLong: '$$NOW' }, defaultBanTime] }
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
                        $expr: { $gte: ['$time', { $subtract: [{ $toLong: '$$NOW' }, scheduledToRepeatEvery] }]}
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
                        count: { $gt: resolutionWindowSeconds * maxRequestsPerSecond }
                    }
                },
                {
                    $project: {
                        ip: '$_id.ip',
                        until: { $add: [{ $toLong: '$$NOW' }, defaultBanTime] }
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
                        $expr: { $gte: ['$until', { $subtract: [{ $toLong: '$$NOW' }, defaultBanTime * 2] }]}
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
                $first: '$until'
            }
        }
    },
    {
        $set: {
            until: {
                $cond: {
                    if: { $ne: ['$count', 1] },
                    then: { $add: [{ $toLong: '$$NOW' }, defaultBanTime * 4] },
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

exports = function() {
    return context.services.get('mars-1')
        .db('hscc-api-airports')
        .collection('request-log')
        .aggregate(pipeline)
        .next()
        // eslint-disable-next-line no-console
        .catch(e => console.error('Error: ', e));
};
