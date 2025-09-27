import express from 'express';
import request from 'supertest';
import { createServer } from '../../src/infrastructure/server';
import { CacheNode } from '../../src/application/CacheNode';
import { ConsistentHash } from '../../src/domain/ConsistentHash';

describe('Server', () => {
    let app: express.Express;
    let node: CacheNode;

    beforeEach(() => {
        const consistentHash = new ConsistentHash();
        const nodeEndpoints = new Map<string, string>();
        const nodeId = 'node0';
        nodeEndpoints.set(nodeId, 'http://localhost:3000');
        node = new CacheNode(nodeId, consistentHash, nodeEndpoints);
        consistentHash.addNode(nodeId);
        app = createServer(node);
    });

    it('should return 404 for a non-existent key', async () => {
        await request(app).get('/non-existent-key').expect(404);
    });

    it('should store and retrieve a value', async () => {
        const key = 'my-key';
        const value = 'my-value';

        // Mock fetch for potential proxying
        global.fetch = jest.fn();

        await request(app)
            .put(`/${key}`)
            .send({ value })
            .expect(204);

        const response = await request(app).get(`/${key}`).expect(200);
        expect(response.text).toBe(value);
    });

    it('should delete a value', async () => {
        const key = 'my-key';
        const value = 'my-value';

        // Mock fetch for potential proxying
        global.fetch = jest.fn();

        await request(app)
            .put(`/${key}`)
            .send({ value })
            .expect(204);

        await request(app).delete(`/${key}`).expect(204);

        await request(app).get(`/${key}`).expect(404);
    });
});