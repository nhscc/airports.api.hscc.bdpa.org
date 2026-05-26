import { DUMMY_BEARER_TOKEN } from '@-xun/api-strategy/auth';
import { getCommonDummyData } from '@-xun/api-strategy/mongo/dummy';
import { mockDateNowMs } from '@-xun/jest';
import { safeDeepClone } from '@-xun/js';
import { ObjectId } from 'mongodb';

import { getEnv } from 'universe+backend:env.ts';

import type { DummyData } from '@-xun/mongo-test';
import type { WithoutId } from 'mongodb';

import type {
  InternalAirline,
  InternalAirport,
  InternalFlight,
  InternalInfo,
  InternalNoFlyListEntry
} from 'universe+backend:db.ts';

const ONE_HOUR_MS = 1000 * 60 * 60;
const ONE_DAY_MS = ONE_HOUR_MS * 24;

let previousNearFuture = mockDateNowMs + ONE_HOUR_MS;
let previousFarFuture = mockDateNowMs + ONE_DAY_MS;

/**
 * Returns data used to hydrate databases and their collections.
 */
export function getDummyData(): DummyData {
  return getCommonDummyData({ app: dummyAppData });
}

/**
 * The shape of the application database's test data.
 */
export type DummyAppData = {
  _generatedAt: number;
  flights: InternalFlight[];
  airports: InternalAirport[];
  'no-fly-list': InternalNoFlyListEntry[];
  airlines: InternalAirline[];
  info: InternalInfo[];
};

// ! Order matters in unit and integration tests, so APPEND ONLY

const airports: InternalAirport[] = [
  {
    _id: new ObjectId(),
    name: 'First Chapter Airport',
    shortName: 'F1A',
    city: 'Los Angeles',
    state: 'CA',
    country: 'USA',
    chapterKey: DUMMY_BEARER_TOKEN
  },
  {
    _id: new ObjectId(),
    name: 'Second Chapter Airport',
    shortName: 'SCA',
    city: 'Chicago',
    state: 'IL',
    country: 'USA',
    chapterKey: 'xyz4c4d3-294a-4086-9751-f3fce82da'
  },
  {
    _id: new ObjectId(),
    name: 'Third Chapter Airport',
    shortName: 'TC3',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    chapterKey: '35b6ny53-83a7-gf0r-b060-b4ywayrht'
  },
  {
    _id: new ObjectId(),
    name: 'Four Chapter Airport',
    shortName: 'CHF',
    city: 'Atlanta',
    state: 'GA',
    country: 'USA',
    chapterKey: 'h90wgbrd-294a-536h-9751-rydmjetgg'
  }
];

const airlines: InternalAirline[] = [
  {
    _id: new ObjectId(),
    name: 'Delta',
    codePrefix: 'D'
  },
  {
    _id: new ObjectId(),
    name: 'American',
    codePrefix: 'A'
  },
  {
    _id: new ObjectId(),
    name: 'United',
    codePrefix: 'U'
  },
  {
    _id: new ObjectId(),
    name: 'Southwest',
    codePrefix: 'S'
  },
  {
    _id: new ObjectId(),
    name: 'Frontier',
    codePrefix: 'F'
  },
  {
    _id: new ObjectId(),
    name: 'Spirit',
    codePrefix: 'P'
  }
];

const noFlyList: InternalNoFlyListEntry[] = [
  {
    _id: new ObjectId(),
    name: {
      first: 'Donald',
      middle: 'John',
      last: 'Trump'
    },
    sex: 'male',
    birthdate: {
      day: 14,
      month: 6,
      year: 1946
    }
  },
  {
    _id: new ObjectId(),
    name: {
      first: 'Restricted',
      middle: 'User',
      last: 'Flier'
    },
    sex: 'male',
    birthdate: {
      day: 25,
      month: 12,
      year: 1985
    }
  }
];

const info: InternalInfo[] = [
  {
    _id: new ObjectId(),
    // !! => order is important!! => From cheapest to most expensive => !!
    seatClasses: ['economy', 'exit row', 'economy plus', 'first class'],
    // !! => order is important!! => From cheapest to most expensive => !!
    allExtras: ['pillow', 'blanket', 'headphones', 'wifi', 'extra food']
  }
];

const unhydratedFlights: WithoutId<InternalFlight>[] = [
  {
    bookerKey: DUMMY_BEARER_TOKEN,
    type: 'arrival',
    airline: 'Delta',
    comingFrom: 'SCA',
    landingAt: 'F1A',
    departingTo: 'TC3',
    flightNumber: 'D8496',
    baggage: {
      checked: {
        max: 2,
        prices: [30, 50]
      },
      carry: {
        max: 2,
        prices: [0, 0]
      }
    },
    ffms: 1500,
    seats: {
      economy: {
        total: 100,
        priceDollars: 250,
        priceFfms: 3000
      },
      economyPlus: {
        total: 20,
        priceDollars: 350,
        priceFfms: 5000
      },
      exitRow: {
        total: 18,
        priceDollars: 325,
        priceFfms: 4000
      },
      firstClass: {
        total: 30,
        priceDollars: 1000,
        priceFfms: 10_000
      }
    },
    extras: {
      wifi: {
        priceDollars: 15.99,
        priceFfms: 500
      },
      'extra food': {
        priceDollars: 24.5,
        priceFfms: 800
      }
    },
    stochasticStates: {
      '0': {
        departFromSender: nearFuture(),
        arriveAtReceiver: nearFuture(),
        departFromReceiver: null,
        status: 'scheduled',
        gate: null
      },
      [nearFuture().toString()]: {
        departFromSender: nearFuture(),
        arriveAtReceiver: nearFuture(),
        departFromReceiver: null,
        status: 'landed',
        gate: 'A1'
      }
    }
  },
  {
    bookerKey: null,
    type: 'departure',
    airline: 'United',
    comingFrom: 'CHF',
    landingAt: 'TC3',
    departingTo: null,
    flightNumber: 'U1234',
    baggage: {
      checked: {
        max: 4,
        prices: [35, 50, 100, 100]
      },
      carry: {
        max: 3,
        prices: [0, 25, 100]
      }
    },
    ffms: 5000,
    seats: {
      economy: {
        total: 75,
        priceDollars: 370,
        priceFfms: 30_000
      },
      economyPlus: {
        total: 30,
        priceDollars: 400,
        priceFfms: 50_000
      },
      exitRow: {
        total: 10,
        priceDollars: 420,
        priceFfms: 40_000
      },
      firstClass: {
        total: 15,
        priceDollars: 1250.57,
        priceFfms: 100_000
      }
    },
    extras: {
      wifi: {
        priceDollars: 8.99,
        priceFfms: 600
      },
      blanket: {
        priceDollars: 2.99,
        priceFfms: 100
      },
      pillow: {
        priceDollars: 2.99,
        priceFfms: 100
      }
    },
    stochasticStates: {
      '0': {
        departFromSender: farFuture(),
        arriveAtReceiver: farFuture(),
        departFromReceiver: farFuture(),
        status: 'boarding',
        gate: 'B2'
      },
      [mockDateNowMs.toString()]: {
        departFromSender: farFuture(),
        arriveAtReceiver: farFuture(),
        departFromReceiver: farFuture(),
        status: 'departed',
        gate: 'C3'
      }
    }
  }
];

const EXPAND_DUMMY_DATA_BY_MULT = 2.5;
const SPECIAL_FLIGHT_INDEX_STATING_FROM_LAST = 2;

// ? Rapidly add a bunch of flights for testing purposes
const count = Math.floor(getEnv().RESULTS_PER_PAGE * EXPAND_DUMMY_DATA_BY_MULT);
const specialFlightIndex = Math.max(0, count - SPECIAL_FLIGHT_INDEX_STATING_FROM_LAST);

// ! Note that dummy times here don't make sense; they're only for testing!
const flights = Array.from({ length: count }).map((_, ndx) => {
  const flight = safeDeepClone(
    unhydratedFlights[ndx % unhydratedFlights.length]!
  ) as InternalFlight;

  flight._id = new ObjectId();

  if (ndx === specialFlightIndex) {
    flight.airline = 'Spirit';
    flight.ffms = 100_000_000;
    flight.stochasticStates = {
      '0': {
        departFromSender: farFuture(),
        arriveAtReceiver: farFuture(),
        departFromReceiver: farFuture(),
        status: 'boarding',
        gate: 'B2'
      },
      '1': {
        departFromSender: 500,
        arriveAtReceiver: 700,
        departFromReceiver: 1000,
        status: 'past',
        gate: null
      }
    };
  }

  return flight;
});

/**
 * Test data for the application database.
 */
export const dummyAppData: DummyAppData = {
  _generatedAt: mockDateNowMs,
  flights,
  airports,
  'no-fly-list': noFlyList,
  airlines,
  info
};

export function nearFuture() {
  return (previousNearFuture += Math.ceil(ONE_HOUR_MS * Math.random()));
}

export function farFuture() {
  return (previousFarFuture += Math.ceil(ONE_DAY_MS * Math.random()));
}
