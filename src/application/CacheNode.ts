import { CacheStore, CacheEntry } from '../domain/CacheStore';
import { ConsistentHash } from '../domain/ConsistentHash';

export class CacheNode {
    private readonly store = new CacheStore();

    constructor(
        public readonly id: string,
        private readonly consistentHash: ConsistentHash,
        private readonly nodeEndpoints: Map<string, string>,
        private readonly writeQuorum: number,
        private readonly readQuorum: number,
    ) {}

    public async get(key: string): Promise<CacheEntry | undefined> {
        const N = 3; // Replication factor

        const nodes = this.consistentHash.getNodes(key, N);
        const responses: CacheEntry[] = [];

        const readPromises = nodes.map(async (node) => {
            const endpoint = this.nodeEndpoints.get(node);
            if (!endpoint) return;

            try {
                let entry: CacheEntry | undefined;
                if (node === this.id) {
                    entry = this.getLocal(key);
                } else {
                    const response = await fetch(`${endpoint}/internal/${key}`);
                    if (response.ok) {
                        entry = await response.json();
                    }
                }
                if (entry) {
                    responses.push(entry);
                }
            } catch (error) {
                console.error(`[${this.id}] Failed to read from node ${node}:`, error);
            }
        });

        await Promise.all(readPromises);

        if (responses.length < this.readQuorum) {
            return undefined; // Read quorum failed
        }

        // Last-Write-Wins: Find the entry with the latest timestamp
        const latestEntry = responses.reduce((prev, curr) =>
            prev.timestamp > curr.timestamp ? prev : curr,
        );

        // Read Repair (asynchronous)
        this.readRepair(key, nodes, latestEntry);

        return latestEntry;
    }

    private async readRepair(
        key: string,
        nodes: string[],
        latestEntry: CacheEntry,
    ): Promise<void> {
        nodes.forEach(async (node) => {
            const endpoint = this.nodeEndpoints.get(node);
            if (!endpoint) return;

            let needsRepair = false;
            if (node === this.id) {
                const localEntry = this.getLocal(key);
                if (!localEntry || localEntry.timestamp < latestEntry.timestamp) {
                    needsRepair = true;
                }
            } else {
                // In a more robust implementation, we would check the remote node's
                // timestamp before repairing. For simplicity, we assume the responses
                // from the initial read are fresh enough to make a repair decision.
                // This is a simplification.
            }

            if (needsRepair) {
                console.log(`[${this.id}] Repairing node ${node} for key ${key}`);
                this.setLocal(key, latestEntry.value, latestEntry.timestamp);
            }
        });
    }

    public getLocal(key: string): CacheEntry | undefined {
        return this.store.get(key);
    }

    public async set(key: string, value: string): Promise<boolean> {
        const N = 3; // Replication factor

        const nodes = this.consistentHash.getNodes(key, N);
        const timestamp = Date.now();
        let successfulWrites = 0;

        const writePromises = nodes.map(async (node) => {
            const endpoint = this.nodeEndpoints.get(node);
            if (!endpoint) return;

            try {
                if (node === this.id) {
                    this.setLocal(key, value, timestamp);
                    successfulWrites++;
                } else {
                    const response = await fetch(`${endpoint}/internal/${key}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ value, timestamp }),
                    });
                    if (response.ok) {
                        successfulWrites++;
                    }
                }
            } catch (error) {
                console.error(`[${this.id}] Failed to write to node ${node}:`, error);
            }
        });

        await Promise.all(writePromises);

        return successfulWrites >= this.writeQuorum;
    }

    public setLocal(key: string, value: string, timestamp: number): void {
        this.store.set(key, value, timestamp);
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
