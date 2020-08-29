/* eslint-disable no-console */
import { generateFlights } from 'universe/backend'
import { getDb } from 'universe/backend/db'

console.log('[ initializing ]');

export default (async function() {
    try {
        console.log(`[ connecting to external database ]`);

        // ? We grab this ref to ensure the external database is selected
        // ? elsewhere in the app source
        const db = await getDb({ external: true });

        console.log(`[ bootstrapping flight generation ]`);

        await generateFlights();

        console.log('[ closing connection ]');

        await db.client?.close();

        console.log('[ execution complete ]');
    }

    catch(e) {
        console.error('EXCEPTION:', e);
        process.exit(1);
    }
})();
