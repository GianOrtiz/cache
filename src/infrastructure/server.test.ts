import express from 'express';
import request from 'supertest';
import { createServer } from './server';
import { CacheNode } from '../application/CacheNode';
import { ConsistentHash } from '../domain/ConsistentHash';

global.fetch = jest.fn();

describe('Server', () => {
    let app: express.Express;

    beforeEach(() => {
        (global.fetch as jest.Mock).mockClear();
        const consistentHash = new ConsistentHash();
        const nodeEndpoints = new Map<string, string>();
        const nodeId = 'node0';
        nodeEndpoints.set(nodeId, 'http://localhost:3000');
        const node = new CacheNode(nodeId, consistentHash, nodeEndpoints, 1, 1, 3);
        consistentHash.addNode(nodeId);
        app = createServer(node);
    });

    it('should return 404 for a non-existent key', async () => {
        await request(app).get('/non-existent-key').expect(404);
    });

    it('should store and retrieve a value', async () => {
        const key = 'my-key';
        const value = 'my-value';

        await request(app).put(`/${key}`).send({ value }).expect(204);

        const response = await request(app).get(`/${key}`).expect(200);
        expect(response.text).toBe(value);
    });

    it('should return 500 if write quorum fails', async () => {
        // Create a node with W=2, but only 1 node in the cluster
        const consistentHash = new ConsistentHash();
        const nodeEndpoints = new Map<string, string>();
        const nodeId = 'node0';
        nodeEndpoints.set(nodeId, 'http://localhost:3000');
        const node = new CacheNode(nodeId, consistentHash, nodeEndpoints, 2, 1, 3);
        consistentHash.addNode(nodeId);
        const failingApp = createServer(node);

        await request(failingApp)
            .put('/my-key')
            .send({ value: 'my-value' })
            .expect(500);
    });
});
