/* @flow */

import url from 'url'

export default (req: any, res: any ) => {
    const { query: { options }} = req;
    res.status(200).json({ options });
}
