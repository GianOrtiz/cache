import { MerkleTree } from './data-structures/MerkleTree';

export class CacheStore {
    private readonly data: Map<string, string> = new Map();
    private merkleTree: MerkleTree = new MerkleTree([]);

    public set(key: string, value: string): void {
        this.data.set(key, value);
        this.updateMerkleTree();
    }

    public get(key: string): string | undefined {
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
        const data = Array.from(this.data.entries()).map(([k, v]) => `${k}:${v}`);
        this.merkleTree = new MerkleTree(data);
    }
}
