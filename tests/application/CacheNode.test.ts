import { CacheNode } from '../../src/application/CacheNode';

describe('CacheNode', () => {
    let cacheNode: CacheNode;

    beforeEach(() => {
        cacheNode = new CacheNode();
    });

    it('should return undefined for a key that does not exist', () => {
        expect(cacheNode.get('non_existent_key')).toBeUndefined();
    });

    it('should set and get a value', () => {
        cacheNode.set('key1', 'value1');
        expect(cacheNode.get('key1')).toBe('value1');
    });

    it('should update an existing value', () => {
        cacheNode.set('key1', 'value1');
        cacheNode.set('key1', 'new_value');
        expect(cacheNode.get('key1')).toBe('new_value');
    });

    it('should delete a value', () => {
        cacheNode.set('key1', 'value1');
        expect(cacheNode.get('key1')).toBe('value1');
        cacheNode.delete('key1');
        expect(cacheNode.get('key1')).toBeUndefined();
    });

    it('should return an updated merkle root when data changes', () => {
        const initialRoot = cacheNode.getMerkleRoot();
        
        cacheNode.set('key1', 'value1');
        const rootAfterSet = cacheNode.getMerkleRoot();
        expect(rootAfterSet).not.toBe(initialRoot);

        cacheNode.delete('key1');
        const rootAfterDelete = cacheNode.getMerkleRoot();
        expect(rootAfterDelete).not.toBe(rootAfterSet);
        expect(rootAfterDelete).toBe(initialRoot);
    });
});
