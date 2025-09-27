import { CacheNode } from '../../src/application/CacheNode';
import { ConsistentHash } from '../../src/domain/ConsistentHash';

describe('CacheNode Replication', () => {
    it('should replicate data to the correct nodes', () => {
        const consistentHash = new ConsistentHash(10);
        const nodes = new Map<string, CacheNode>();

        // Create and add nodes to the hash ring and the nodes map
        for (let i = 0; i < 3; i++) {
            const nodeId = `node${i}`;
            consistentHash.addNode(nodeId);
            nodes.set(nodeId, new CacheNode(nodeId, consistentHash, nodes));
        }

        // Pick a node to interact with (e.g., node0)
        const entryNode = nodes.get('node0')!;

        // Set a value
        const key = 'my-key';
        const value = 'my-value';
        entryNode.set(key, value);

        // Determine which nodes should have the data
        const responsibleNodes = consistentHash.getNodes(key, 3);

        // Verify that the data is on the responsible nodes
        for (const nodeId of responsibleNodes) {
            const node = nodes.get(nodeId)!;
            expect(node.get(key)).toBe(value);
        }

        // Verify that the data is not on other nodes (if any)
        for (const [nodeId, node] of nodes.entries()) {
            if (!responsibleNodes.includes(nodeId)) {
                expect(node.get(key)).toBeUndefined();
            }
        }
    });
});
