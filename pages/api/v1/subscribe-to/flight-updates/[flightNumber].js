/* @flow */

export default (req: any, res: any ) => {
    const { query: { flightNumber }} = req;
    res.status(200).json({ flightNumber });
}
