import React, { useState } from 'react';

const KeywordForm: React.FC = () => {
    const [keyword, setKeyword] = useState<string>('');
    const [responseMessage, setResponseMessage] = useState<string>('');

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        try {
            const response = await fetch(
                'http://localhost:4000/insert_keyword',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ keyword }),
                }
            );
            console.log(response)
            if (response.ok) {
                setResponseMessage('Keyword inserted.');
            } else {
                setResponseMessage('Error.');
            }
        } catch (error) {
            console.error('An error occurred:', error);
            setResponseMessage('An error occurred.');
        }
    };

    return (
        <div>
            <h1><b>Submit a Keyword</b></h1>
            <br></br>
            <form onSubmit={handleSubmit}>
                <div>
                    <textarea
                        id="keyword"
                        name="keyword"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <button type="submit">Submit</button>
                </div>
            </form>
            {responseMessage && <p>{responseMessage}</p>}
        </div>
    );
};

export default KeywordForm;
