/*import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const results = await query('SELECT * FROM users');
    console.log(results);
    res.status(200).json(results);
    
  } catch (error) {
    console.error('Error handling API request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}*/

import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { email, password } = req.body;
 console.log(req.body);

    // Perform the login validation query
    const results = await query('SELECT * FROM users WHERE username = ? AND password = ?', [email, password]);

    if (results.length > 0) {
      // Credentials are valid
      res.status(200).json({ message: 'Login successful' });
    } else {
      // Credentials are invalid
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Error handling API request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

