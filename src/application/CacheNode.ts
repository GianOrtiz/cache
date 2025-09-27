import { CacheStore } from '../domain/CacheStore';

export class CacheNode {
    private readonly store = new CacheStore();

    public get(key: string): string | undefined {
        return this.store.get(key);
    }

    public set(key: string, value: string): void {
        this.store.set(key, value);
    }

    public delete(key: string): void {
        this.store.delete(key);
    }

    public getMerkleRoot(): string {
        return this.store.getMerkleRoot();
    }
}
