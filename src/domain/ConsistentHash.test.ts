import { ConsistentHash } from './ConsistentHash';

describe('ConsistentHash', () => {
    let consistentHash: ConsistentHash;

    beforeEach(() => {
        // Using a small number of replicas for predictable testing
        consistentHash = new ConsistentHash(10);
    });

    it('should return null when no nodes are in the ring', () => {
        expect(consistentHash.getNode('any_key')).toBeNull();
    });

    it('should handle a single node correctly', () => {
        consistentHash.addNode('node1');
        expect(consistentHash.getNode('key1')).toBe('node1');
        expect(consistentHash.getNode('key2')).toBe('node1');
    });

    it('should be consistent in node selection', () => {
        consistentHash.addNode('node1');
        consistentHash.addNode('node2');
        consistentHash.addNode('node3');

        const node1 = consistentHash.getNode('my_key');
        const node2 = consistentHash.getNode('my_key');

        expect(node1).toBe(node2);
    });

    it('should redistribute a minimal number of keys when a node is added', () => {
        const nodes = ['node1', 'node2', 'node3'];
        nodes.forEach(node => consistentHash.addNode(node));

        const assignmentsBefore: { [key: string]: string | null } = {};
        for (let i = 0; i < 100; i++) {
            const key = `key${i}`;
            assignmentsBefore[key] = consistentHash.getNode(key);
        }

        consistentHash.addNode('node4');

        let changed = 0;
        for (let i = 0; i < 100; i++) {
            const key = `key${i}`;
            const newAssignment = consistentHash.getNode(key);
            if (newAssignment !== assignmentsBefore[key]) {
                changed++;
            }
        }

        // Expect a reasonably small number of keys to be remapped
        expect(changed).toBeGreaterThan(0);
        expect(changed).toBeLessThan(50); // In practice, it should be around 1/4 (25)
    });

    it('should redistribute keys to other nodes when a node is removed', () => {
        const nodes = ['node1', 'node2', 'node3'];
        nodes.forEach(node => consistentHash.addNode(node));

        const keysToNode2: string[] = [];
        for (let i = 0; i < 100; i++) {
            const key = `key${i}`;
            if (consistentHash.getNode(key) === 'node2') {
                keysToNode2.push(key);
            }
        }
        // Ensure we have keys that map to node2 before we remove it
        expect(keysToNode2.length).toBeGreaterThan(0);

        consistentHash.removeNode('node2');

        for (const key of keysToNode2) {
            const newNode = consistentHash.getNode(key);
            expect(newNode).not.toBe('node2');
            expect(nodes.filter(n => n !== 'node2')).toContain(newNode);
        }
    });

    describe('getNodes for replication', () => {
        beforeEach(() => {
            consistentHash.addNode('node1');
            consistentHash.addNode('node2');
            consistentHash.addNode('node3');
            consistentHash.addNode('node4');
            consistentHash.addNode('node5');
        });

        it('should return N unique nodes', () => {
            const nodes = consistentHash.getNodes('some_key', 3);
            expect(nodes.length).toBe(3);
            expect(new Set(nodes).size).toBe(3); // Check for uniqueness
        });

        it('should return all nodes if N is greater than the number of nodes', () => {
            const nodes = consistentHash.getNodes('some_key', 7);
            expect(nodes.length).toBe(5);
            expect(nodes.sort()).toEqual(['node1', 'node2', 'node3', 'node4', 'node5'].sort());
        });

        it('should return an empty array if N is 0', () => {
            const nodes = consistentHash.getNodes('some_key', 0);
            expect(nodes.length).toBe(0);
        });

        it('should return just one node if N is 1', () => {
            const primaryNode = consistentHash.getNode('some_key');
            const nodes = consistentHash.getNodes('some_key', 1);
            expect(nodes.length).toBe(1);
            expect(nodes[0]).toBe(primaryNode);
        });
    });
});
