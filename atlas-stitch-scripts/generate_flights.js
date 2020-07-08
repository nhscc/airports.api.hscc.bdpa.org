/**
 * Copy-pasted directly from .env file. Unfortunately, we need to keep this
 * synced manually until a better solution presents itself.
 */
const FLIGHTS_GENERATE_DAYS = 30;
const AIRPORT_NUM_OF_GATE_LETTERS = 4;
const AIRPORT_GATE_NUMBERS_PER_LETTER = 20;
const AIRPORT_PAIR_USED_PERCENT = 75;
const FLIGHT_HOUR_HAS_FLIGHTS_PERCENT = 66;

async function generateFlights(db) {
    const airports = await db.collection('airports').find().toArray();
    const airlines = await db.collection('airlines').find().toArray();
    const info = await db.collection('info').find().next();

    const flightDb = db.collection('flights');

    if(airports.length < 2 || airlines.length < 2)
        throw new FlightGenerationError('cannot generate flights without at least two airports and airlines');

    // ? Let's setup some helpers...

    let objectIdCounter = randomInt(Math.pow(2, 10), Math.pow(2, 23));
    const objectIdRandom = pseudoRandomBytes(5).toString('hex');

    const targetDaysInMs = FLIGHTS_GENERATE_DAYS * 24 * 60 * 60 * 1000;
    const threeMinutesInMs = 3 * 60 * 1000;
    const fiveMinutesInMs = 5 * 60 * 1000;
    const tenMinutesInMs = 10 * 60 * 1000;
    const fifteenMinutesInMs = 15 * 60 * 1000;
    const sixteenMinutesInMs = 16 * 60 * 1000;
    const thirtyMinutesInMs = 30 * 60 * 1000;
    const thirtyOneMinutesInMs = 31 * 60 * 1000;
    const oneHourInMs = 60 * 60 * 1000;

    const chance = () => randomInt(1, 100);
    const hourLevelMsDilation = epoch => Math.floor(epoch / oneHourInMs) * oneHourInMs;

    // ? We make our own MongoDb Ids so that we can sort them and quickly delete
    // ? outdated flights. Very cool!
    // * See: https://docs.mongodb.com/manual/reference/method/ObjectId/#ObjectId
    const generateObjectIdFromMs = epoch => {
        const hex = (Math.floor(epoch / 1000).toString(16)
            + objectIdRandom
            + (++objectIdCounter).toString(16)
        ).padEnd(24, '0');

        return new ObjectId(hex);
    };

    // ? Delete any entries created more than FLIGHTS_GENERATE_DAYS days ago
    await flightDb.deleteMany({
        _id: { $lt: generateObjectIdFromMs(Date.now() - targetDaysInMs) }
    });

    // ? Determine how many hours (if any) need flights generated for them
    const lastFlight = await flightDb.find().sort({ _id: -1 }).limit(1).next();
    const lastFlightId = lastFlight._id || new ObjectId();
    const lastFlightHourMs = hourLevelMsDilation(lastFlightId.getTimestamp().getTime());
    const totalHoursToGenerate = (hourLevelMsDilation(Date.now() + targetDaysInMs) - lastFlightHourMs) / oneHourInMs;

    if(!totalHoursToGenerate)
        return 0;

    // ? Setup some shared structures for later cloning
    const flightNumPool = [...Array(9999)].map((_, j) => j + 1);
    const gatePool = ('abcdefghijklmnopqrstuvwxyz').split('').slice(0, AIRPORT_NUM_OF_GATE_LETTERS).map(x => {
        return [...Array(AIRPORT_GATE_NUMBERS_PER_LETTER)].map((_, n) => `${x}${n + 1}`);
    }).flat();

    // ? Carve out a place to stash all flights in existence...
    const flights = [];

    // ? And now, for every hour, generate a bunch of flights!
    [...Array(totalHoursToGenerate)].forEach((_, i) => {
        if(chance() > FLIGHT_HOUR_HAS_FLIGHTS_PERCENT)
            return;

        const currentHour = lastFlightHourMs + oneHourInMs + i * oneHourInMs;
        const activeAirlines = shuffle(airlines).slice(0, randomInt(2, airlines.length));
        const getFlightNum = activeAirlines.reduce((map, airline) => {
            return {
                ...map,
                [airline._id.toHexString()]: uniqueRandomArray(cloneDeep(flightNumPool))
            };
        }, {});

        // ? Arrivals land at firstAirport and came from secondAirport
        // ? Departures land at firstAirport and depart to secondAirport; which
        // ? airport they came from is randomly determined
        airports.forEach(firstAirport => {
            // ? Thanks to arrivals and departures both using firstAirport to
            // ? land, the following becomes possible:
            const localGatePool = shuffle(cloneDeep(gatePool));
            const releaseGate = gate => localGatePool.push(gate);
            const getGate = () => {
                const gate = localGatePool.shift();
                if(!gate) throw new GuruMeditationError('ran out of gates');
                return gate;
            };

            // ? Prepare a place to store unfinished business
            const statelessFlights = [];

            // ? First we generate stateless flight data
            airports.forEach(secondAirport => {
                // ? Sometimes we skip a source-dest pair in a given hour (and
                // ? planes can't come from and land at the same airport)
                if(firstAirport._id.equals(secondAirport._id) || chance() > AIRPORT_PAIR_USED_PERCENT)
                    return;

                let isArrival = false;

                activeAirlines.forEach(airline => {
                    isArrival = !isArrival;

                    // ? Next, we determine how many checked bags and carry-ons
                    // ? people can bring how much they'll be gouged
                    const maxChecked = randomInt(0, 10);
                    const maxCarry = randomInt(0, 4);

                    // ? Now we calculate seat prices and availability
                    const seats = {};

                    let prevSeat$ = randomInt(60, 150);
                    let prevSeatFfms = randomInt(5000, 8000);

                    // ? We do this out here so we can sort and sum them easily
                    const numSeats = [...Array(info.seatClasses.length)].map(_ => {
                        return randomInt(MIN_SEATS_PER_PLANE, SEATS_PER_PLANE / info.seatClasses.length);
                    }).sort((a, b) => b - a);

                    // ? Give any remaining seats to the cheapest option
                    numSeats[0] += SEATS_PER_PLANE - numSeats.reduce((p, c) => p + c, 0);

                    for(const [ndx, seatClass] of Object.entries(info.seatClasses)) {
                        // ? Prices can at most double... greedy capitalists!
                        prevSeat$ = randomInt(prevSeat$, prevSeat$ * 2) + Number(Math.random().toFixed(2));
                        prevSeatFfms = randomInt(prevSeatFfms, prevSeatFfms * 2);

                        seats[seatClass] = {
                            total: numSeats[Number(ndx)],
                            priceDollars: prevSeat$,
                            priceFfms: prevSeatFfms
                        };
                    }

                    // ? We also calculate prices and availability of extras
                    const extras = {};

                    let prevItem$ = 1;
                    let prevItemFfms = randomInt(10, 150);

                    for(const item of info.allExtras) {
                        // ? 25% chance one of the items is not included
                        if(chance() > 75) continue;

                        // ? Prices can multiply by 2.5x... greedy capitalists!
                        prevItem$ = randomInt(prevItem$, prevItem$ * 2.5) + Number(Math.random().toFixed(2));
                        prevItemFfms = randomInt(prevItemFfms, prevItemFfms * 2);

                        extras[item] = {
                            priceDollars: prevItem$,
                            priceFfms: prevItemFfms,
                        };
                    }

                    // ? Finally, let's put it all together...
                    statelessFlights.push({
                        _id: generateObjectIdFromMs(currentHour),
                        bookerKey: isArrival ? null : firstAirport.chapterKey,
                        type: isArrival ? 'arrival' : 'departure',
                        airline: airline.name,

                        comingFrom: isArrival
                            ? secondAirport.shortName
                            : (shuffle(airports).filter(a => {
                                return a.shortName != firstAirport.shortName
                            })[0]).shortName,

                        landingAt: firstAirport.shortName,
                        departingTo: isArrival ? null : secondAirport.shortName,
                        flightNumber: airline.codePrefix + getFlightNum[airline._id.toHexString()]().toString(),
                        baggage: {
                            checked: {
                                max: maxChecked,
                                prices: [...Array(maxChecked)].reduce($ => {
                                    const prev = $.slice(-1)[0];
                                    return [
                                        ...$,
                                        // ? Greedy little airlines
                                        randomInt(prev || 0, (prev || 35) * 2)
                                    ];
                                }, []),
                            },
                            carry: {
                                max: maxCarry,
                                prices: [...Array(maxCarry)].reduce($ => {
                                    const prev = $.slice(-1)[0];
                                    return [
                                        ...$,
                                        // ? Greedy little airlines
                                        randomInt(prev || 0, (prev || 15) * 2)
                                    ];
                                }, []),
                            },
                        },
                        ffms: randomInt(2000, 6000),
                        seats,
                        extras
                    });
                });
            });

            const getMostRecentState = flight => {
                if(!flight.stochasticStates)
                    throw new GuruMeditationError('expected stochastic state to exist');

                return Object.values(flight.stochasticStates).slice(-1)[0];
            };

            // ? And now we run all the flights we generated for this airport
            // ? through each stage of the markov model. For some stages, we
            // ? loop through the entire repository of flights. This results in
            // ? multiple passthroughs over the statelessFlights dataset. We do
            // ? it this way so that we can maintain memory of which flights are
            // ? using which gates and when

            // ? Stages 1 and 2: initialize things
            statelessFlights.forEach(flight => {
                let prevActiveAfter = 0;
                let done = false;

                const isArrival = flight.type == 'arrival';

                const arriveAtReceiver = randomInt(
                    currentHour,
                    // ? We do the subtraction of minutes to ensure our
                    // ? stochastic process remains within the hour. This
                    // ? assumption is crucial to the functionality of this
                    // ? API!
                    currentHour + oneHourInMs - (isArrival ? sixteenMinutesInMs : thirtyOneMinutesInMs)
                );

                // ? Initialize this flight's stochastic state
                flight.stochasticStates = {
                    '0': {
                        arriveAtReceiver,
                        departFromSender: arriveAtReceiver - randomInt(2 * oneHourInMs, 5 * oneHourInMs),
                        departFromReceiver: isArrival ? null : arriveAtReceiver + fifteenMinutesInMs,
                        // ? The flight hasn't taken off yet! (initial state)
                        status: 'scheduled',
                        gate: null
                    }
                };

                // ? Here we use a markov model to generate future flight
                // ? stochastic information states that we transition into
                // ? sequentially over time, giving API users the impression
                // ? that flight information is changing.
                // ?
                // ? There are 10 total stochastic decision making stages we run
                // ? through to generate flight state (init state + 9). These
                // ? are the first 3.

                for(let stage = 1; !done && stage < 3; ++stage) {
                    const state = { ...getMostRecentState(flight) };

                    switch(stage) {
                        case 1:
                            // ? This flight just took off!
                            prevActiveAfter = state.departFromSender;

                            // ? 80% chance this flight is not cancelled
                            if(chance() > 80) {
                                state.status = 'cancelled';
                                done = true;
                            }

                            else state.status = 'on time';

                            flight.stochasticStates[prevActiveAfter.toString()] = state;
                            break;

                        case 2:
                            // ? 75% chance this flight is not delayed
                            if(chance() > 75) {
                                prevActiveAfter = randomInt(
                                    state.arriveAtReceiver - 2 * oneHourInMs,
                                    state.departFromSender + fifteenMinutesInMs
                                );

                                state.status = 'delayed';
                                state.arriveAtReceiver += randomInt(fiveMinutesInMs, fifteenMinutesInMs);

                                if(state.departFromReceiver)
                                    state.departFromReceiver += randomInt(fiveMinutesInMs, fifteenMinutesInMs);

                                flight.stochasticStates[prevActiveAfter.toString()] = state;
                            }

                            break;

                        default:
                            throw new GuruMeditationError('unreachable stage encountered (1)');
                    }
                }
            });

            // ? Second, third, and fourth passthroughs are sequential to keep
            // ? track of gates

            // ? Stage 3: this flight's gate gets determined now
            statelessFlights.forEach(flight => {
                if(!flight.stochasticStates)
                    throw new GuruMeditationError('stage 3 encountered impossible condition');

                const recentState = getMostRecentState(flight);

                if(recentState.status == 'cancelled')
                    return;

                flight.stochasticStates[randomInt(
                    recentState.arriveAtReceiver - 2 * oneHourInMs,
                    recentState.arriveAtReceiver - fifteenMinutesInMs,
                ).toString()] = {
                    ...recentState,
                    gate: getGate()
                };
            });

            // ? Stage 4: this flight just landed!
            statelessFlights.forEach(flight => {
                if(!flight.stochasticStates)
                    throw new GuruMeditationError('stage 4 encountered impossible condition');

                const recentState = getMostRecentState(flight);

                if(recentState.status == 'cancelled')
                    return;

                let gate = recentState.gate;
                if(!gate) throw new GuruMeditationError('gate was not predetermined?!');

                // ? 50% chance this flight's gate changes
                if(chance() > 50) {
                    releaseGate(gate);
                    gate = getGate();
                }

                flight.stochasticStates[randomInt(
                    recentState.arriveAtReceiver - thirtyMinutesInMs,
                    recentState.arriveAtReceiver - fiveMinutesInMs,
                ).toString()] = {
                    ...recentState,
                    gate,
                    status: 'landed'
                };
            });

            // ? Stage 5: this flight has arrived at the gate!
            statelessFlights.forEach(flight => {
                if(!flight.stochasticStates)
                    throw new GuruMeditationError('stage 5 encountered impossible condition');

                const recentState = getMostRecentState(flight);

                if(recentState.status == 'cancelled')
                    return;

                let gate = recentState.gate;
                if(!gate) throw new GuruMeditationError('gate was not predetermined?!');

                // ? 15% chance this flight's gate changes again
                if(chance() > 85) {
                    releaseGate(gate);
                    gate = getGate();
                }

                flight.stochasticStates[recentState.arriveAtReceiver] = {
                    ...recentState,
                    gate,
                    status: 'arrived'
                };
            });

            // ? Stages 6-10: wraps things up
            statelessFlights.forEach(flight => {
                if(!flight.stochasticStates)
                    throw new GuruMeditationError('stage 6-9 encountered impossible condition');

                const recentState = getMostRecentState(flight);

                if(recentState.status == 'cancelled')
                    return;

                let prevActiveAfter = 0;
                let done = false;

                const isArrival = flight.type == 'arrival';

                for(let stage = 6; !done && stage < 10; ++stage) {
                    const state = { ...recentState };

                    switch(stage) {
                        case 6:
                            if(!isArrival) continue;

                            // ? This flight is done!
                            prevActiveAfter = currentHour + oneHourInMs;
                            state.status = 'past';
                            state.gate = null;
                            done = true;
                            break;

                        case 7:
                            if(isArrival)
                                throw new GuruMeditationError('arrival type encountered in departure-only model');

                            // ? This flight has started boarding
                            prevActiveAfter = state.arriveAtReceiver + randomInt(threeMinutesInMs, tenMinutesInMs);
                            state.status = 'boarding';
                            break;

                        case 8:
                            // ? This flight just departed!
                            if(!state.departFromReceiver)
                                throw new GuruMeditationError('illegal departure state encountered in model (1)');

                            prevActiveAfter = state.departFromReceiver;
                            state.status = 'departed';
                            break;

                        case 9:
                            // ? This flight is done!
                            if(!state.departFromReceiver)
                                throw new GuruMeditationError('illegal departure state encountered in model (2)');

                            prevActiveAfter = state.departFromReceiver + randomInt(2 * oneHourInMs, 5 * oneHourInMs);
                            state.status = 'past';
                            state.gate = null;
                            break;

                        default:
                            throw new GuruMeditationError('unreachable stage encountered (2)');
                    }

                    flight.stochasticStates[prevActiveAfter.toString()] = state;
                }
            });

            // ? Push this airport's flights into the main repository
            flights.push(...statelessFlights);
        });
    });

    try {
        if(!flights.length)
            return 0;

        // ? All the main repository of flight data to the database in one shot!
        const operation = await flightDb.insertMany(flights);

        if(!operation.result.ok)
            throw new FlightGenerationError('flight insertion failed');

        if(operation.insertedCount != flights.length)
            throw new GuruMeditationError('assert failed: operation.insertedCount != totalHoursToGenerate');

        return operation.insertedCount;
    }

    catch(e) { throw (e instanceof AppError ? e : new FlightGenerationError(e)) }
}

exports = async function() {
    try { await generateFlights(context.services.get('neptune-1').db('hscc-api-airports')) }
    catch(e) {
        console.error('Error: ', e);
        throw e;
    }
};
