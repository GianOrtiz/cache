import { CacheStore } from '../domain/CacheStore';
import { ConsistentHash } from '../domain/ConsistentHash';

export class CacheNode {
    private readonly store = new CacheStore();

    constructor(
        public readonly id: string,
        private readonly consistentHash: ConsistentHash,
        private readonly nodeEndpoints: Map<string, string>,
    ) {}

    public async get(key: string): Promise<string | undefined> {
        const node = this.consistentHash.getNode(key);
        if (node === this.id) {
            return this.getLocal(key);
        } else {
            const endpoint = this.nodeEndpoints.get(node!)!;
            const response = await fetch(`${endpoint}/${key}`);
            if (response.ok) {
                return response.text();
            }
        }
    }

    public getLocal(key: string): string | undefined {
        return this.store.get(key);
    }

    public async set(key: string, value: string): Promise<void> {
        const nodes = this.consistentHash.getNodes(key, 3);
        for (const node of nodes) {
            const endpoint = this.nodeEndpoints.get(node);
            if (endpoint) {
                if (node === this.id) {
                    this.setLocal(key, value);
                } else {
                    await fetch(`${endpoint}/internal/${key}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ value }),
                    });
                }
            }
        }
    }

    public setLocal(key: string, value: string): void {
        this.store.set(key, value);
    }

    public async delete(key: string): Promise<void> {
        const nodes = this.consistentHash.getNodes(key, 3);
        for (const node of nodes) {
            const endpoint = this.nodeEndpoints.get(node);
            if (endpoint) {
                if (node === this.id) {
                    this.deleteLocal(key);
                } else {
                    await fetch(`${endpoint}/internal/${key}`, {
                        method: 'DELETE',
                    });
                }
            }
        }
    }

    public deleteLocal(key: string): void {
        this.store.delete(key);
    }

    public getMerkleRoot(): string {
        return this.store.getMerkleRoot();
    }

    public async antiEntropy(): Promise<void> {
        for (const [nodeId, endpoint] of this.nodeEndpoints.entries()) {
            if (nodeId === this.id) continue;

            const response = await fetch(`${endpoint}/internal/merkle-root`);
            const remoteMerkleRoot = await response.text();

            if (remoteMerkleRoot !== this.getMerkleRoot()) {
                console.log(
                    `[${this.id}] Merkle root mismatch with [${nodeId}]. Triggering synchronization.`,
                );
            }
        }
    }
}
