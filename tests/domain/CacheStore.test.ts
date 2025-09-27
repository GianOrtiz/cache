import { CacheStore } from '../../src/domain/CacheStore';

describe('CacheStore', () => {
    let cacheStore: CacheStore;

    beforeEach(() => {
        cacheStore = new CacheStore();
    });

    it('should set and get a value', () => {
        const timestamp = Date.now();
        cacheStore.set('key', 'value', timestamp);
        const entry = cacheStore.get('key');
        expect(entry).toEqual({ value: 'value', timestamp });
    });

    it('should delete a value', () => {
        cacheStore.set('key', 'value', Date.now());
        cacheStore.delete('key');
        expect(cacheStore.get('key')).toBeUndefined();
    });

    it('should return a merkle root', () => {
        cacheStore.set('key', 'value', Date.now());
        expect(cacheStore.getMerkleRoot()).not.toBeNull();
    });

    it('should have different merkle roots for different data', () => {
        cacheStore.set('key', 'value', Date.now());
        const root1 = cacheStore.getMerkleRoot();
        const cacheStore2 = new CacheStore();
        cacheStore2.set('key', 'value2', Date.now());
        const root2 = cacheStore2.getMerkleRoot();
        expect(root1).not.toEqual(root2);
    });
});