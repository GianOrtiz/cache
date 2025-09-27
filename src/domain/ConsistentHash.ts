import { hash } from './utils/hash';

export class ConsistentHash {
    private readonly ring: Map<string, string> = new Map();
    private sortedHashes: string[] = [];

    constructor(private readonly replicas: number = 100) {}

    public addNode(node: string): void {
        for (let i = 0; i < this.replicas; i++) {
            const replicaHash = hash(`${node}:${i}`);
            this.ring.set(replicaHash, node);
            this.sortedHashes.push(replicaHash);
        }
        this.sortedHashes.sort();
    }

    public removeNode(node: string): void {
        const newSortedHashes: string[] = [];
        for (const h of this.sortedHashes) {
            if (this.ring.get(h) !== node) {
                newSortedHashes.push(h);
            } else {
                this.ring.delete(h);
            }
        }
        this.sortedHashes = newSortedHashes;
    }

    public getNode(key: string): string | null {
        if (this.sortedHashes.length === 0) {
            return null;
        }

        const keyHash = hash(key);
        const index = this.findFirstGreaterOrEqual(keyHash);
        const replicaHash = this.sortedHashes[index];
        return this.ring.get(replicaHash) || null;
    }

    public getNodes(key: string, count: number): string[] {
        if (this.sortedHashes.length === 0 || count === 0) {
            return [];
        }

        const availableNodes = new Set<string>();
        const keyHash = hash(key);
        let startIndex = this.findFirstGreaterOrEqual(keyHash);

        while (availableNodes.size < count && availableNodes.size < this.getNodeCount()) {
            const replicaHash = this.sortedHashes[startIndex];
            const node = this.ring.get(replicaHash);
            if (node) {
                availableNodes.add(node);
            }
            startIndex = (startIndex + 1) % this.sortedHashes.length;
        }

        return Array.from(availableNodes);
    }

    private findFirstGreaterOrEqual(value: string): number {
        // This can be optimized with binary search
        let i = 0;
        for (; i < this.sortedHashes.length; i++) {
            if (this.sortedHashes[i] >= value) {
                return i;
            }
        }
        // If not found, wrap around to the first node
        return 0;
    }

    private getNodeCount(): number {
        return new Set(this.ring.values()).size;
    }
}
