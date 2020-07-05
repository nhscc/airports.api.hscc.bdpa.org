/* @flow */

import url from 'url'

export default (req: any, res: any ) => {
    const { query: { page }} = req;
    res.status(200).json({ page });
}
