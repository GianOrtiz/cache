import { CacheNode } from '../../src/application/CacheNode';
import { ConsistentHash } from '../../src/domain/ConsistentHash';

global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
    } as Response),
);

describe('CacheNode Replication', () => {
    beforeEach(() => {
        (global.fetch as jest.Mock).mockClear();
    });

    it('should replicate data to the correct nodes', async () => {
        const consistentHash = new ConsistentHash(10);
        const nodeEndpoints = new Map<string, string>();
        const nodes: Map<string, CacheNode> = new Map();

        // Create nodes and endpoints
        for (let i = 0; i < 3; i++) {
            const nodeId = `node${i}`;
            const endpoint = `http://localhost:300${i}`;
            consistentHash.addNode(nodeId);
            nodeEndpoints.set(nodeId, endpoint);
            nodes.set(nodeId, new CacheNode(nodeId, consistentHash, nodeEndpoints));
        }

        const entryNode = nodes.get('node0')!;
        const key = 'my-key';
        const value = 'my-value';

        await entryNode.set(key, value);

        const responsibleNodes = consistentHash.getNodes(key, 3);

        // Verify that the data was set locally on the responsible nodes that are the entry node
        // and that fetch was called for the other responsible nodes.
        for (const nodeId of responsibleNodes) {
            const node = nodes.get(nodeId)!;
            if (node.id === entryNode.id) {
                expect(node.getLocal(key)).toBe(value);
            } else {
                const endpoint = nodeEndpoints.get(nodeId)!;
                expect(global.fetch).toHaveBeenCalledWith(`${endpoint}/internal/${key}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ value }),
                });
            }
        }
    });
});