import { CacheStore } from '../domain/CacheStore';
import { ConsistentHash } from '../domain/ConsistentHash';

export class CacheNode {
    private readonly store = new CacheStore();

    constructor(
        public readonly id: string,
        private readonly consistentHash: ConsistentHash,
        private readonly nodes: Map<string, CacheNode>,
    ) {}

    public get(key: string): string | undefined {
        return this.store.get(key);
    }

    public set(key: string, value: string): void {
        const nodes = this.consistentHash.getNodes(key, 3);
        for (const node of nodes) {
            this.nodes.get(node)?.setLocal(key, value);
        }
    }

    public setLocal(key: string, value: string): void {
        this.store.set(key, value);
    }

    public delete(key: string): void {
        this.store.delete(key);
    }

    public getMerkleRoot(): string {
        return this.store.getMerkleRoot();
    }

    public async antiEntropy(): Promise<void> {
        for (const otherNode of this.nodes.values()) {
            if (otherNode.id === this.id) continue;

            if (otherNode.getMerkleRoot() !== this.getMerkleRoot()) {
                // In a real-world scenario, you would request the full data
                // from the other node and compare it to your own.
                // For this simulation, we'll just log a message.
                console.log(
                    `[${this.id}] Merkle root mismatch with [${otherNode.id}]. Triggering synchronization.`,
                );
            }
        }
    }
}
