import { CacheStore } from '../../src/domain/CacheStore';

describe('CacheStore', () => {
    let cacheStore: CacheStore;

    beforeEach(() => {
        cacheStore = new CacheStore();
    });

    it('should be empty initially', () => {
        expect(cacheStore.get('any_key')).toBeUndefined();
        expect(cacheStore.getMerkleRoot()).toBeDefined();
    });

    it('should set and get a value', () => {
        cacheStore.set('key1', 'value1');
        expect(cacheStore.get('key1')).toBe('value1');
    });

    it('should update a value for an existing key', () => {
        cacheStore.set('key1', 'value1');
        const initialRoot = cacheStore.getMerkleRoot();
        cacheStore.set('key1', 'newValue');
        expect(cacheStore.get('key1')).toBe('newValue');
        expect(cacheStore.getMerkleRoot()).not.toBe(initialRoot);
    });

    it('should delete a value', () => {
        cacheStore.set('key1', 'value1');
        expect(cacheStore.get('key1')).toBe('value1');
        const initialRoot = cacheStore.getMerkleRoot();

        cacheStore.delete('key1');
        expect(cacheStore.get('key1')).toBeUndefined();
        expect(cacheStore.getMerkleRoot()).not.toBe(initialRoot);
    });

    it('should return undefined for a non-existent key', () => {
        expect(cacheStore.get('non_existent_key')).toBeUndefined();
    });

    it('should produce a different merkle root after adding a new item', () => {
        cacheStore.set('key1', 'value1');
        const root1 = cacheStore.getMerkleRoot();

        cacheStore.set('key2', 'value2');
        const root2 = cacheStore.getMerkleRoot();

        expect(root1).not.toBe(root2);
    });

    it('should produce the same merkle root for the same data set in different order', () => {
        const store1 = new CacheStore();
        store1.set('key1', 'value1');
        store1.set('key2', 'value2');

        const store2 = new CacheStore();
        store2.set('key2', 'value2');
        store2.set('key1', 'value1');

        expect(store1.getMerkleRoot()).toBe(store2.getMerkleRoot());
    });
});
