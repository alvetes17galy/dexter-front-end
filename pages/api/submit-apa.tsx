// pages/api/submit-apa.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { run, clearDocsFolder } from '../../scripts/ingest-data';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    const { apaCitation } = req.body;
    console.log(apaCitation)

    try {
        // Call the run function with the provided APA citation
        await run(apaCitation);
        await clearDocsFolder();
        res.status(200).json({ message: 'APA citation submitted and processed.' });
    } catch (error) {
        console.error('Error submitting APA citation:', error);
        res.status(500).json({ message: 'Failed to process APA citation.' });
    }
};

export default handler;
