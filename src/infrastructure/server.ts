import express from 'express';
import { CacheNode } from '../application/CacheNode';

export function createServer(node: CacheNode) {
    const app = express();
    app.use(express.json());

    app.get('/:key', async (req, res) => {
        const entry = await node.get(req.params.key);
        if (entry) {
            res.send(entry.value);
        } else {
            res.status(404).send('Key not found or read quorum failed');
        }
    });

    app.put('/:key', async (req, res) => {
        const success = await node.set(req.params.key, req.body.value);
        if (success) {
            res.status(204).send();
        } else {
            res.status(500).send('Write quorum failed');
        }
    });

    app.delete('/:key', async (req, res) => {
        await node.delete(req.params.key);
        res.status(204).send();
    });

    // Internal endpoints for node-to-node communication
    app.get('/internal/:key', (req, res) => {
        const entry = node.getLocal(req.params.key);
        if (entry) {
            res.json(entry);
        } else {
            res.status(404).send('Key not found');
        }
    });

    app.put('/internal/:key', (req, res) => {
        const { value, timestamp } = req.body;
        node.setLocal(req.params.key, value, timestamp);
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
