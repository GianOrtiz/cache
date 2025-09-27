import { MerkleTree } from './data-structures/MerkleTree';

export interface CacheEntry {
    value: string;
    timestamp: number;
}

export class CacheStore {
    private readonly data: Map<string, CacheEntry> = new Map();
    private merkleTree: MerkleTree = new MerkleTree([]);

    public set(key: string, value: string, timestamp: number): void {
        this.data.set(key, { value, timestamp });
        this.updateMerkleTree();
    }

    public get(key: string): CacheEntry | undefined {
        return this.data.get(key);
    }

    public delete(key: string): void {
        this.data.delete(key);
        this.updateMerkleTree();
    }

    public getMerkleRoot(): string {
        return this.merkleTree.getRoot();
    }

    private updateMerkleTree(): void {
        const data = Array.from(this.data.entries()).map(
            ([k, v]) => `${k}:${v.value}:${v.timestamp}`,
        );
        this.merkleTree = new MerkleTree(data);
    }
}
