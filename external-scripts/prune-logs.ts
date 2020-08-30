/* eslint-disable no-console */
import { getEnv } from 'universe/backend/env'
import { AppError } from 'universe/backend/error'
import { getDb } from 'universe/backend/db'
import { WithId } from 'mongodb';
import { RequestLogEntry } from 'types/global';

console.log('[ initializing ]');

export default (async function() {
    try {
        const {
            PRUNE_LOGS_MAX_LOGS,
        } = getEnv();

        if(!PRUNE_LOGS_MAX_LOGS || !(Number(PRUNE_LOGS_MAX_LOGS) > 0))
            throw new AppError('illegal environment detected, check environment variables');

        console.log(`[ connecting to external database ]`);

        const db = await getDb({ external: true });

        const requestLog = db.collection<WithId<RequestLogEntry>>('request-log');
        const thresholdEntry = await requestLog.find().sort({ _id: -1 }).skip(PRUNE_LOGS_MAX_LOGS).limit(1).next();

        if(thresholdEntry) {
            const result = await requestLog.deleteMany({ _id: { $lte: thresholdEntry._id }})
            console.log(`[ pruned ${result.deletedCount} request-log entries ]`);
        }

        else console.log('[ found no entries to prune ]');

        console.log('[ closing connection ]');

        await db.client?.close();

        console.log('[ execution complete ]');
    }

    catch(e) {
        console.error('EXCEPTION:', e);
        process.exit(1);
    }
})();
