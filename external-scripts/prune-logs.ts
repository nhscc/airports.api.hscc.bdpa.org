/* eslint-disable no-console */
import { getEnv } from 'universe/backend/env'
import { AppError } from 'universe/backend/error'
import { getDb, closeDb } from 'universe/backend/db'
import { WithId } from 'mongodb';
import { RequestLogEntry } from 'types/global';

export default async function main(isCLI = false) {
    try {
        isCLI && console.log('[ initializing ]');

        const {
            PRUNE_LOGS_MAX_LOGS,
        } = getEnv();

        if(!PRUNE_LOGS_MAX_LOGS || !(Number(PRUNE_LOGS_MAX_LOGS) > 0))
            throw new AppError('illegal environment detected, check environment variables');

        isCLI && console.log(`[ connecting to external database ]`);

        const db = await getDb({ external: true });

        const requestLog = db.collection<WithId<RequestLogEntry>>('request-log');
        const cursor = requestLog.find().sort({ _id: -1 }).skip(PRUNE_LOGS_MAX_LOGS).limit(1);
        const thresholdEntry = await cursor.next();

        if(thresholdEntry) {
            const result = await requestLog.deleteMany({ _id: { $lte: thresholdEntry._id }})
            isCLI && console.log(`[ pruned ${result.deletedCount} request-log entries ]`);
        }

        else isCLI && console.log('[ found no entries to prune ]');

        isCLI && console.log('[ closing connection ]');

        await cursor.close();
        await closeDb();

        isCLI && console.log('[ execution complete ]');
    }

    catch(e) {
        if(isCLI) {
            console.error('EXCEPTION:', e);
            process.exit(1);
        }

        else throw e;
    }
}

!module.parent && main(true);
