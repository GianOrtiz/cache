import { CacheNode } from './application/CacheNode';
import { ConsistentHash } from './domain/ConsistentHash';
import { createServer } from './infrastructure/server';

const nodeId = process.env.NODE_ID || 'node0';
const port = parseInt(process.env.PORT || '3000');
const allNodes = (process.env.NODES || 'node0:3000').split(',');

const consistentHash = new ConsistentHash(100);
const nodeEndpoints = new Map<string, string>();

// Setup consistent hash and endpoints
for (const nodeInfo of allNodes) {
    const [id, nodePort] = nodeInfo.split(':');
    consistentHash.addNode(id);
    nodeEndpoints.set(id, `http://localhost:${nodePort}`);
}

// Create the cache node
const node = new CacheNode(nodeId, consistentHash, nodeEndpoints);

// Start the server
const app = createServer(node);
app.listen(port, () => {
    console.log(`Node ${nodeId} listening on port ${port}`);
});