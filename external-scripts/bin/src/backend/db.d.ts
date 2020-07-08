import { Db } from 'mongodb';
/**
 * Used to lazily create the database once on-demand instead of immediately when
 * the app runs.
 */
export declare function getDb(): Promise<Db>;
/**
 * Used for testing purposes. Sets the global db instance to something else.
 */
export declare function setDb(newDB: Db): void;
/**
 * Destroys all collections in the database. Can be called multiple times
 * safely.
 */
export declare function destroyDb(db: Db): Promise<void>;
/**
 * This function is idempotent and can be called without worry of data loss.
 */
export declare function initializeDb(db: Db): Promise<void>;
export declare const pipelines: {
    resolveFlightState: (key: string) => ({
        $addFields: {
            state: {
                $arrayElemAt: (number | {
                    $filter: {
                        input: {
                            $objectToArray: string;
                        };
                        as: string;
                        cond: {
                            $lte: {
                                $toLong: string;
                            }[];
                        };
                    };
                })[];
            };
            flight_id: {
                $toString: string;
            };
            bookable: {
                $cond: {
                    if: {
                        $eq: string[];
                    };
                    then: boolean;
                    else: boolean;
                };
            };
        };
        $replaceRoot?: undefined;
        $project?: undefined;
    } | {
        $replaceRoot: {
            newRoot: {
                $mergeObjects: string[];
            };
        };
        $addFields?: undefined;
        $project?: undefined;
    } | {
        $project: {
            state: boolean;
            _id: boolean;
            bookerKey: boolean;
            stochasticStates: boolean;
        };
        $addFields?: undefined;
        $replaceRoot?: undefined;
    })[];
};
