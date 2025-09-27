import { CacheNode } from './CacheNode';
import { ConsistentHash } from '../domain/ConsistentHash';

describe('CacheNode', () => {
    let cacheNode: CacheNode;

    beforeEach(() => {
        const consistentHash = new ConsistentHash();
        const nodeEndpoints = new Map<string, string>();
        cacheNode = new CacheNode('node0', consistentHash, nodeEndpoints, 2, 2);
    });

    it('should set and get a value locally', () => {
        const timestamp = Date.now();
        cacheNode.setLocal('key', 'value', timestamp);
        const entry = cacheNode.getLocal('key');
        expect(entry).toEqual({ value: 'value', timestamp });
    });

    it('should delete a value locally', () => {
        cacheNode.setLocal('key', 'value', Date.now());
        cacheNode.deleteLocal('key');
        expect(cacheNode.getLocal('key')).toBeUndefined();
    });
});
