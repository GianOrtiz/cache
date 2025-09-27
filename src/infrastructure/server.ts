import express from 'express';
import { CacheNode } from '../application/CacheNode';

export function createServer(node: CacheNode) {
    const app = express();
    app.use(express.json());

    app.get('/:key', async (req, res) => {
        const value = await node.get(req.params.key);
        if (value) {
            res.send(value);
        } else {
            res.status(404).send('Key not found');
        }
    });

    app.put('/:key', async (req, res) => {
        await node.set(req.params.key, req.body.value);
        res.status(204).send();
    });

    app.delete('/:key', async (req, res) => {
        await node.delete(req.params.key);
        res.status(204).send();
    });

    // Internal endpoints for node-to-node communication
    app.put('/internal/:key', (req, res) => {
        node.setLocal(req.params.key, req.body.value);
        res.status(204).send();
    });

    app.delete('/internal/:key', (req, res) => {
        node.deleteLocal(req.params.key);
        res.status(204).send();
    });

    app.get('/internal/merkle-root', (req, res) => {
        res.send(node.getMerkleRoot());
    });

    return app;
}
