import { CacheNode } from './application/CacheNode';
import { ConsistentHash } from './domain/ConsistentHash';
import { createServer } from './infrastructure/server';
import logger from './infrastructure/logger';

const nodeId = process.env.NODE_ID || 'node0';
const port = parseInt(process.env.PORT || '3000');
const allNodes = (process.env.NODES || 'node0:3000').split(',');
const writeQuorum = parseInt(process.env.WRITE_QUORUM || '2');
const readQuorum = parseInt(process.env.READ_QUORUM || '2');
const replication = parseInt(process.env.REPLICATION || '3');

const consistentHash = new ConsistentHash(100);
const nodeEndpoints = new Map<string, string>();

// Setup consistent hash and endpoints
for (const nodeInfo of allNodes) {
    const [id, nodePort] = nodeInfo.split(':');
    consistentHash.addNode(id);
    nodeEndpoints.set(id, `http://localhost:${nodePort}`);
}

// Create the cache node
const node = new CacheNode(nodeId, consistentHash, nodeEndpoints, writeQuorum, readQuorum, replication);

// Start the server
const app = createServer(node);
const server = app.listen(port, () => {
    logger.info(`Node ${nodeId} listening on port ${port}`);
});

process.on('SIGINT', () => {
    logger.info('Closing server...');
    server.close(() => {
        logger.info('Server closed.');
        process.exit(0);
    });
});
