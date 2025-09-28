import express from 'express';
import { CacheNode } from '../application/CacheNode';
import logger from '../infrastructure/logger';

export function createServer(node: CacheNode) {
    const app = express();
    app.use(express.json());

    app.get('/:key', async (req, res) => {
        logger.info(`[GET] /${req.params.key}`);
        const entry = await node.get(req.params.key);
        if (entry) {
            logger.debug(`[GET] /${req.params.key} - Key found`);
            res.send(entry.value);
        } else {
            logger.debug(`[GET] /${req.params.key} - Key not found`);
            res.status(404).send('Key not found or read quorum failed');
        }
    });

    app.put('/:key', async (req, res) => {
        logger.info(`[PUT] /${req.params.key}`);
        const success = await node.set(req.params.key, req.body.value);
        if (success) {
            logger.debug(`[PUT] /${req.params.key} - Key set`);
            res.status(204).send();
        } else {
            logger.debug(`[PUT] /${req.params.key} - Write quorum failed`);
            res.status(500).send('Write quorum failed');
        }
    });

    app.delete('/:key', async (req, res) => {
        logger.info(`[DELETE] /${req.params.key}`);
        await node.delete(req.params.key);
        res.status(204).send();
    });

    // Internal endpoints for node-to-node communication
    app.get('/internal/:key', (req, res) => {
        logger.info(`[GET] /internal/${req.params.key}`);
        const entry = node.getLocal(req.params.key);
        if (entry) {
            logger.debug(`[GET] /internal/${req.params.key} - Key found`);
            res.json(entry);
        } else {
            logger.debug(`[GET] /internal/${req.params.key} - Key not found`);
            res.status(404).send('Key not found');
        }
    });

    app.put('/internal/:key', (req, res) => {
        logger.info(`[PUT] /internal/${req.params.key}`);
        const { value, timestamp } = req.body;
        node.setLocal(req.params.key, value, timestamp);
        res.status(204).send();
    });

    app.delete('/internal/:key', (req, res) => {
        logger.info(`[DELETE] /internal/${req.params.key}`);
        node.deleteLocal(req.params.key);
        res.status(204).send();
    });

    app.get('/internal/merkle-root', (req, res) => {
        logger.info(`[GET] /internal/merkle-root`);
        res.send(node.getMerkleRoot());
    });

    return app;
}
