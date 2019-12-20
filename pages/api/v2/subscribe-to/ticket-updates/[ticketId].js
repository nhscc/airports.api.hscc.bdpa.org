/* @flow */

export default (req: any, res: any ) => {
    const { query: { ticketId }} = req;
    res.status(200).json({ ticketId });
}
