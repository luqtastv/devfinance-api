import { pool } from '../src/database.js';
import { describe, it, expect } from 'vitest';

describe('Database Connection', () => {
    it('should connect to the database successfully', async () => {
        const client = await pool.connect();
        expect(client).toBeDefined();
        client.release();
    });
});