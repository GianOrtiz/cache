import { CacheNode } from '../../src/application/CacheNode';
import { ConsistentHash } from '../../src/domain/ConsistentHash';

describe('CacheNode Anti-Entropy', () => {
    it('should detect data inconsistency between nodes', async () => {
        const consistentHash = new ConsistentHash(10);
        const nodes = new Map<string, CacheNode>();

        // Create two nodes
        const node1 = new CacheNode('node1', consistentHash, nodes);
        const node2 = new CacheNode('node2', consistentHash, nodes);

        nodes.set('node1', node1);
        nodes.set('node2', node2);

        consistentHash.addNode('node1');
        consistentHash.addNode('node2');

        // Set different data on each node
        node1.setLocal('key1', 'value1');
        node2.setLocal('key2', 'value2');

        // Mock console.log to capture output
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        // Run anti-entropy on node1
        await node1.antiEntropy();

        // Verify that the inconsistency was detected
        expect(consoleSpy).toHaveBeenCalledWith(
            '[node1] Merkle root mismatch with [node2]. Triggering synchronization.',
        );

        // Clean up
        consoleSpy.mockRestore();
    });
});
