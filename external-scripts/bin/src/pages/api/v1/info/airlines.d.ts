import type { NextApiResponse, NextApiRequest } from 'next';
export { config } from 'universe/backend/middleware';
export default function (req: NextApiRequest, res: NextApiResponse): Promise<void>;
