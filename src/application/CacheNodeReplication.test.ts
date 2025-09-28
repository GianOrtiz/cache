import { CacheNode } from './CacheNode';
import { ConsistentHash } from '../domain/ConsistentHash';

global.fetch = jest.fn();

describe('CacheNode Replication', () => {
    let consistentHash: ConsistentHash;
    let nodeEndpoints: Map<string, string>;

    beforeEach(() => {
        (global.fetch as jest.Mock).mockClear();
        consistentHash = new ConsistentHash(10);
        nodeEndpoints = new Map<string, string>();
        for (let i = 0; i < 3; i++) {
            const nodeId = `node${i}`;
            const endpoint = `http://localhost:300${i}`;
            consistentHash.addNode(nodeId);
            nodeEndpoints.set(nodeId, endpoint);
        }
    });

    it('should succeed when write quorum is met', async () => {
        // W=2. Node0 (local) + Node1 (remote) = 2 successful writes.
        const node0 = new CacheNode('node0', consistentHash, nodeEndpoints, 2, 2, 3);

        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true } as Response);

        const success = await node0.set('my-key', 'my-value');

        expect(success).toBe(true);
        expect(node0.getLocal('my-key')).toBeDefined();
    });

    it('should fail when write quorum is not met', async () => {
        // W=2. Node0 (local) is 1. Remote calls fail.
        const node0 = new CacheNode('node0', consistentHash, nodeEndpoints, 2, 2, 3);

        (global.fetch as jest.Mock).mockResolvedValue({ ok: false } as Response);

        const success = await node0.set('my-key', 'my-value');

        expect(success).toBe(false);
    });
});
