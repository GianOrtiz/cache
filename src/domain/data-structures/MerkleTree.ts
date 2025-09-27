import { hash } from '../utils/hash';

export class MerkleTree {
    private readonly leaves: string[];
    private readonly root: string;

    constructor(data: string[]) {
        this.leaves = data.sort().map(hash);
        this.root = this.buildTree(this.leaves);
    }

    public getRoot(): string {
        return this.root;
    }

    private buildTree(leaves: string[]): string {
        if (leaves.length === 0) {
            return hash('');
        }
        if (leaves.length === 1) {
            return leaves[0];
        }

        const newLeaves: string[] = [];
        for (let i = 0; i < leaves.length; i += 2) {
            const left = leaves[i];
            const right = i + 1 < leaves.length ? leaves[i + 1] : left;
            newLeaves.push(hash(left + right));
        }
        return this.buildTree(newLeaves);
    }
}
