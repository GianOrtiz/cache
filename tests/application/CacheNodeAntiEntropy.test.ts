import { CacheNode } from '../../src/application/CacheNode';
import { ConsistentHash } from '../../src/domain/ConsistentHash';

describe('CacheNode Anti-Entropy', () => {
    it('should detect data inconsistency between nodes', async () => {
        const consistentHash = new ConsistentHash(10);
        const nodeEndpoints = new Map<string, string>();

        // Setup nodes and endpoints
        nodeEndpoints.set('node1', 'http://localhost:3001');
        nodeEndpoints.set('node2', 'http://localhost:3002');
        consistentHash.addNode('node1');
        consistentHash.addNode('node2');

        const node1 = new CacheNode('node1', consistentHash, nodeEndpoints);

        // Set data on node1
        node1.setLocal('key1', 'value1');

        // Mock fetch to return a different merkle root for node2
        const differentMerkleRoot = 'different-root';
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                text: () => Promise.resolve(differentMerkleRoot),
            } as Response),
        );

        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        await node1.antiEntropy();

        expect(global.fetch).toHaveBeenCalledWith('http://localhost:3002/internal/merkle-root');
        expect(consoleSpy).toHaveBeenCalledWith(
            '[node1] Merkle root mismatch with [node2]. Triggering synchronization.',
        );

        consoleSpy.mockRestore();
    });
});