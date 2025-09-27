import { CacheNode } from '../../src/application/CacheNode';
import { ConsistentHash } from '../../src/domain/ConsistentHash';

describe('CacheNode', () => {
    let cacheNode: CacheNode;

    beforeEach(() => {
        const consistentHash = new ConsistentHash();
        const nodeEndpoints = new Map<string, string>();
        cacheNode = new CacheNode('node0', consistentHash, nodeEndpoints);
    });

    it('should set and get a value', () => {
        cacheNode.setLocal('key', 'value');
        expect(cacheNode.getLocal('key')).toBe('value');
    });

    it('should delete a value', () => {
        cacheNode.setLocal('key', 'value');
        cacheNode.deleteLocal('key');
        expect(cacheNode.getLocal('key')).toBeUndefined();
    });

    it('should return a merkle root', () => {
        cacheNode.setLocal('key', 'value');
        expect(cacheNode.getMerkleRoot()).not.toBeNull();
    });
});