## Development

1. Clone the repo

```
git clone [github https url]
```

2. Install packages

```
npm install
```

3. Set up your `.env` file

- Copy `.env.example` into `.env`
  Your `.env` file should look like this:

```
OPENAI_API_KEY=

PINECONE_API_KEY=
PINECONE_ENVIRONMENT=

PINECONE_INDEX_NAME=


## Run the app

Once you've verified that the embeddings and content have been successfully added to your Pinecone, you can run the app `pnpm run dev` to launch the local dev environment, and then type a question in the chat interface.


**General errors**

- Make sure you're running the latest Node version. Run `node -v`
- Make sure you're using the same versions of LangChain and Pinecone as this repo.
- Check that you've created an `.env` file that contains your valid (and working) API keys, environment and index name.

 plan are deleted after 7 days of inactivity. To prevent this, send an API request to Pinecone to reset the counter.
- Retry from scratch with a new Pinecone index and cloned repo.

