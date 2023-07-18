import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const results = await query('SELECT * FROM your_table');
    res.status(200).json(results);
  } catch (error) {
    console.error('Error handling API request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
