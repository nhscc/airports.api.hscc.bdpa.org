import { MongoClient, Db, ObjectId, WithId } from 'mongodb'
import { NULL_KEY } from 'universe/backend'
import { getDb, setDb, destroyDb, initializeDb } from 'universe/backend/db'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { getEnv } from 'universe/backend/env'
import { populateEnv } from 'universe/dev-utils'
import * as Time from 'multiverse/relative-random-time'
import shuffle from 'fast-shuffle'
import randomInt from 'random-int'
import uniqueRandomArray from 'unique-random-array'

import type {
    ApiKey,
    RequestLogEntry,
    LimitedLogEntry,
} from 'types/global'

populateEnv();

export type DummyDbData = {
    keys: ApiKey[];
    elections: InternalElection[];
};

const injectData = (ob: InitialElectionFrag, fn: (obj: InDbElection) => void): InDbElection => {
    const election = ob as InDbElection;
    election.created = election.opens = election.closes = 0;
    fn(election);
    return election;
};

const expandToPageLength = (elections: InDbElection[]): InternalElection[] => {
    const maxLimit = getEnv().MAX_LIMIT;

    while(elections.length > 0 && elections.length < maxLimit)
        elections.push({... (elections.length % 2 ? elections[0] : (elections[1] || elections[0])) });

    const internalElections = (elections as unknown as InternalElection[]).slice(0, maxLimit);

    internalElections.forEach(election => {
        election.election_id = new ObjectId();
        election.title += ` x-gen#${randomInt(maxLimit)}`;
    });

    return internalElections;
};

export const unhydratedDummyDbData: DummyDbData = {
    keys: [
        {
            owner: 'chapter1',
            key: 'a0a49b61-83a7-4036-b060-213784b4997c'
        },
        {
            owner: 'chapter2',
            key: '5db4c4d3-294a-4086-9751-f3fce82d11e4'
        },
    ],
    elections: [
        expandToPageLength([
            injectData({
                title: 'My election #1',
                description: 'My demo election!',
                options: [ 'Vanilla', 'Chocolate', 'Strawberry' ],
                owner: NULL_KEY,
                deleted: false
            }, (o) => {
                o.created = Time.farPast();
                o.opens = Time.farPast({ after: o.created });
                o.closes = Time.farPast({ after: o.opens });
            }),
            injectData({
                title: 'My election #2',
                description: 'My demo election!',
                options: [ 'Vanilla', 'Chocolate', 'Strawberry' ],
                owner: NULL_KEY,
                deleted: true
            }, (o) => {
                o.created = Time.farFuture();
                o.opens = Time.farFuture({ after: o.created });
                o.closes = Time.farFuture({ after: o.opens });
            })
        ]),
        expandToPageLength([
            injectData({
                title: 'My election #3',
                description: 'My demo election!',
                options: [ 'Red', 'Green', 'Blue', 'Yellow' ],
                owner: 'a0a49b61-83a7-4036-b060-213784b4997c',
                deleted: false
            }, (o) => {
                o.created = Time.farPast();
                o.opens = Time.nearFuture();
                o.closes = Time.farFuture();
            }),
            injectData({
                title: 'My election #4',
                description: 'My demo election!',
                options: [ 'Chalk', 'Dye', 'Egg', 'Foam', 'Grease', 'Hand' ],
                owner: 'a0a49b61-83a7-4036-b060-213784b4997c',
                deleted: false
            }, (o) => {
                o.created = Time.nearFuture();
                o.opens = Time.nearFuture({ after: o.created });
                o.closes = Time.nearFuture({ after: o.opens });
            }),
            injectData({
                title: 'My election #5',
                description: 'My demo election!',
                options: [ 'Walking Dead', 'Red Dead', 'Dead Eye' ],
                owner: '5db4c4d3-294a-4086-9751-f3fce82d11e4',
                deleted: false
            }, (o) => {
                o.created = Time.nearPast();
                o.opens = Time.nearPast({ after: o.created });
                o.closes = Time.nearPast({ after: o.opens });
            })
        ]),
        expandToPageLength([
            injectData({
                title: 'My election #6',
                description: 'My demo election again!',
                options: [ 'Red', 'Green', 'Blue', 'Yellow', 'Orange', 'Purple' ],
                owner: '5db4c4d3-294a-4086-9751-f3fce82d11e4',
                deleted: false
            }, (o) => {
                o.created = Time.nearPast();
                o.opens = Time.nearPast({ after: o.created });
                o.closes = Time.nearFuture();
            }),
            injectData({
                title: 'My election #7',
                description: 'Best election bigly!',
                options: [ 'Bigly', 'Bigliest', 'Winning', 'Orange', 'Hair', 'Insane' ],
                owner: '5db4c4d3-294a-4086-9751-f3fce82d11e4',
                deleted: false
            }, (o) => {
                o.created = Time.nearPast();
                o.opens = Time.nearPast({ after: o.created });
                o.closes = Time.farFuture();
            })
        ]),
    ].flat()
};

export async function hydrateDb(db: Db, data: DummyDbData): Promise<DummyDbData> {
    const newData = { ...data };

    // Update keys
    if(newData.keys) {
        const keysDb = db.collection<WithId<ApiKey>>('keys').initializeUnorderedBulkOp();

        newData.keys.forEach(keyRecord => keysDb.find({ key: keyRecord.key }).upsert().updateOne(keyRecord));
        await keysDb.execute();
    }

    // Push new elections
    if(newData.elections) {
        const electionsDb = db.collection<InDbElection>('elections');
        const rankingsDb = db.collection<WithId<ElectionRankings>>('rankings');

        await electionsDb.insertMany(newData.elections.map(election => ({
            _id: election.election_id,
            ...election
        })));

        const getArrayLength = uniqueRandomArray([0, 1, 2, randomInt(3, 6), randomInt(10, 20), 100, 1000]);
        let first = true;

        await rankingsDb.insertMany(newData.elections.map(election => ({
            election_id: election.election_id,
            rankings: [...Array(first ? ((first = false), 10) : getArrayLength())].map((_, id) => ({
                voter_id: randomInt(id * 3, (id + 1) * 3 - 1).toString(),
                ranking: shuffle(election.options)
            }))
        })));
    }

    // Push new requests to the log and update limited-log-mview accordingly
    const requestLogDb = db.collection<WithId<RequestLogEntry>>('request-log');
    const mviewDb = db.collection<LimitedLogEntry>('limited-log-mview');

    await requestLogDb.insertMany([...Array(22)].map((_, ndx) => ({
        ip: '1.2.3.4',
        key: ndx % 2 ? null : NULL_KEY,
        method: ndx % 3 ? 'GET' : 'POST',
        route: 'fake/route',
        time: Date.now() + 10**6,
        resStatusCode: 200,
     })));

    await mviewDb.insertMany([
        { ip: '1.2.3.4', until: Date.now() + 1000 * 60 * 15 } as LimitedLogEntry,
        { ip: '5.6.7.8', until: Date.now() + 1000 * 60 * 15 } as LimitedLogEntry,
        { key: NULL_KEY, until: Date.now() + 1000 * 60 * 60 } as LimitedLogEntry
    ]);

    return newData;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function setupJest() {
    const server = new MongoMemoryServer();
    let connection: MongoClient;
    let hydratedData: DummyDbData;

    beforeAll(async () => {
        connection = await MongoClient.connect(await server.getUri(), { useUnifiedTopology: true });
        const db = connection?.db();

        if(!db)
            throw new Error('unable to connect to database');

        setDb(db);
    });

    beforeEach(async () => {
        const db = await getDb();
        await initializeDb(db);
        hydratedData = await hydrateDb(db, unhydratedDummyDbData);
    });

    afterEach(async () => {
        const db = await getDb();
        await destroyDb(db);
    })

    afterAll(async () => {
        connection.isConnected() && await connection.close();
        await server.stop();
    });

    return {
        getDb,
        getConnection: () => connection,
        getHydratedData: () => hydratedData
    };
}
