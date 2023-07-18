import mysql from 'serverless-mysql';

const db = mysql({
  config: {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'galy',
  },
});

export async function query<T>(query: string, values?: any): Promise<T[]> {
  try {
    const results = await db.query<T>(query, values);
    return results as T[];
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    throw error;
  }
}

export async function closeConnection() {
  await db.end();
}
