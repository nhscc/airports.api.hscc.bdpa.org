import CatchAllForNotFoundEndpoint, {
  config as CatchAllForNotFoundConfig,
  metadata as CatchAllForNotFoundMetadata
} from 'universe:pages/api/[[...catchAllForNotFound]].ts';

import V1EndpointFlightsAll, {
  config as V1ConfigFlightsAll,
  metadata as V1MetadataFlightsAll
} from 'universe:pages/api/v1/flights/all.ts';

import V1EndpointFlightsSearch, {
  config as V1ConfigFlightsSearch,
  metadata as V1MetadataFlightsSearch
} from 'universe:pages/api/v1/flights/search.ts';

import V1EndpointFlightsWithIds, {
  config as V1ConfigFlightsWithIds,
  metadata as V1MetadataFlightsWithIds
} from 'universe:pages/api/v1/flights/with-ids.ts';

import V1EndpointInfoAirlines, {
  config as V1ConfigInfoAirlines,
  metadata as V1MetadataInfoAirlines
} from 'universe:pages/api/v1/info/airlines.ts';

import V1EndpointInfoAirports, {
  config as V1ConfigInfoAirports,
  metadata as V1MetadataInfoAirports
} from 'universe:pages/api/v1/info/airports.ts';

import V1EndpointInfoNoFlyList, {
  config as V1ConfigInfoNoFlyList,
  metadata as V1MetadataInfoNoFlyList
} from 'universe:pages/api/v1/info/no-fly-list.ts';

import V2EndpointFlights, {
  config as V2ConfigFlights,
  metadata as V2MetadataFlights
} from 'universe:pages/api/v2/flights/index.ts';

import V2EndpointInfoAirlines, {
  config as V2ConfigInfoAirlines,
  metadata as V2MetadataInfoAirlines
} from 'universe:pages/api/v2/info/airlines.ts';

import V2EndpointInfoAirports, {
  config as V2ConfigInfoAirports,
  metadata as V2MetadataInfoAirports
} from 'universe:pages/api/v2/info/airports.ts';

import V2EndpointInfoAllExtras, {
  config as V2ConfigInfoAllExtras,
  metadata as V2MetadataInfoAllExtras
} from 'universe:pages/api/v2/info/all-extras.ts';

import V2EndpointInfoNoFlyList, {
  config as V2ConfigInfoNoFlyList,
  metadata as V2MetadataInfoNoFlyList
} from 'universe:pages/api/v2/info/no-fly-list.ts';

import V2EndpointInfoSeatClasses, {
  config as V2ConfigInfoSeatClasses,
  metadata as V2MetadataInfoSeatClasses
} from 'universe:pages/api/v2/info/seat-classes.ts';

import { asMocked } from 'testverse:util.ts';

import {
  getAirlines,
  getAirports,
  getExtras,
  getFlightsById,
  getNoFlyList,
  getSeats,
  searchFlights
} from '@nhscc/backend-airports';

import type { NextApiHandler, PageConfig } from 'next';

export type NextApiHandlerMixin = NextApiHandler & {
  config?: PageConfig;
  uri: string;
};

/**
 * The entire live API topology gathered together into one convenient object.
 */
export const api = {
  catchAllForNotFound: CatchAllForNotFoundEndpoint as NextApiHandlerMixin,
  v1: {
    flightsAll: V1EndpointFlightsAll as NextApiHandlerMixin,
    flightsSearch: V1EndpointFlightsSearch as NextApiHandlerMixin,
    flightsWithIds: V1EndpointFlightsWithIds as NextApiHandlerMixin,
    infoAirlines: V1EndpointInfoAirlines as NextApiHandlerMixin,
    infoAirports: V1EndpointInfoAirports as NextApiHandlerMixin,
    infoNoFlyList: V1EndpointInfoNoFlyList as NextApiHandlerMixin
  },
  v2: {
    flights: V2EndpointFlights as NextApiHandlerMixin,
    infoAirlines: V2EndpointInfoAirlines as NextApiHandlerMixin,
    infoAirports: V2EndpointInfoAirports as NextApiHandlerMixin,
    infoAllExtras: V2EndpointInfoAllExtras as NextApiHandlerMixin,
    infoNoFlyList: V2EndpointInfoNoFlyList as NextApiHandlerMixin,
    infoSeatClasses: V2EndpointInfoSeatClasses as NextApiHandlerMixin
  }
};

// **                           **
// ** Add configuration objects **
// **                           **

api.catchAllForNotFound.config = CatchAllForNotFoundConfig;

api.v1.flightsAll.config = V1ConfigFlightsAll;
api.v1.flightsSearch.config = V1ConfigFlightsSearch;
api.v1.flightsWithIds.config = V1ConfigFlightsWithIds;
api.v1.infoAirlines.config = V1ConfigInfoAirlines;
api.v1.infoAirports.config = V1ConfigInfoAirports;
api.v1.infoNoFlyList.config = V1ConfigInfoNoFlyList;

api.v2.flights.config = V2ConfigFlights;
api.v2.infoAirlines.config = V2ConfigInfoAirlines;
api.v2.infoAirports.config = V2ConfigInfoAirports;
api.v2.infoAllExtras.config = V2ConfigInfoAllExtras;
api.v2.infoNoFlyList.config = V2ConfigInfoNoFlyList;
api.v2.infoSeatClasses.config = V2ConfigInfoSeatClasses;

// **                           **
// ** Add metadata descriptors  **
// **                           **

api.catchAllForNotFound.uri = CatchAllForNotFoundMetadata.descriptor;

api.v1.flightsAll.uri = V1MetadataFlightsAll.descriptor;
api.v1.flightsSearch.uri = V1MetadataFlightsSearch.descriptor;
api.v1.flightsWithIds.uri = V1MetadataFlightsWithIds.descriptor;
api.v1.infoAirlines.uri = V1MetadataInfoAirlines.descriptor;
api.v1.infoAirports.uri = V1MetadataInfoAirports.descriptor;
api.v1.infoNoFlyList.uri = V1MetadataInfoNoFlyList.descriptor;

api.v2.flights.uri = V2MetadataFlights.descriptor;
api.v2.infoAirlines.uri = V2MetadataInfoAirlines.descriptor;
api.v2.infoAirports.uri = V2MetadataInfoAirports.descriptor;
api.v2.infoAllExtras.uri = V2MetadataInfoAllExtras.descriptor;
api.v2.infoNoFlyList.uri = V2MetadataInfoNoFlyList.descriptor;
api.v2.infoSeatClasses.uri = V2MetadataInfoSeatClasses.descriptor;

/**
 * A convenience function that mocks the entire backend and returns the mock
 * functions. Uses `beforeEach` under the hood.
 *
 * **WARNING: YOU MUST CALL `jest.mock('@nhscc/backend-airports')` before
 * calling this function!**
 */
export function setupMockBackend() {
  const mockedGetAirlines = asMocked(getAirlines);
  const mockedGetAirports = asMocked(getAirports);
  const mockedGetExtras = asMocked(getExtras);
  const mockedGetFlightsById = asMocked(getFlightsById);
  const mockedGetNoFlyList = asMocked(getNoFlyList);
  const mockedGetSeats = asMocked(getSeats);
  const mockedSearchFlights = asMocked(searchFlights);

  beforeEach(() => {
    mockedGetAirlines.mockReturnValue(Promise.resolve([]));
    mockedGetAirports.mockReturnValue(Promise.resolve([]));
    mockedGetExtras.mockReturnValue(Promise.resolve([]));
    mockedGetFlightsById.mockReturnValue(Promise.resolve([]));
    mockedGetNoFlyList.mockReturnValue(Promise.resolve([]));
    mockedGetSeats.mockReturnValue(Promise.resolve([]));
    mockedSearchFlights.mockReturnValue(Promise.resolve([]));
  });

  return {
    mockedGetAirlines,
    mockedGetAirports,
    mockedGetExtras,
    mockedGetFlightsById,
    mockedGetNoFlyList,
    mockedGetSeats,
    mockedSearchFlights
  };
}
