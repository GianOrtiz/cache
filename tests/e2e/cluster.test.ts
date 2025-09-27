import request from 'supertest';
import { ChildProcess, spawn } from 'child_process';

const PORTS = [3000, 3001, 3002];
const getUrl = (port: number) => `http://localhost:${port}`;

describe('Cluster E2E', () => {
    let clusterProcess: ChildProcess;

    beforeAll((done) => {
        clusterProcess = spawn('npm', ['start']);
        const expectedMessages = ['listening on port 3000', 'listening on port 3001', 'listening on port 3002'];
        let readyNodes = 0;

        clusterProcess.stdout?.on('data', (data) => {
            const output = data.toString();
            expectedMessages.forEach((msg, index) => {
                if (output.includes(msg)) {
                    readyNodes++;
                    expectedMessages.splice(index, 1);
                }
            });

            if (readyNodes === 3) {
                done();
            }
        });
    });

    afterAll(() => {
        clusterProcess.kill();
    });

    it('should be able to set and get a value across different nodes', async () => {
        const key = 'e2e-key';
        const value = 'e2e-value';

        // Set value on the first node
        await request(getUrl(PORTS[0]))
            .put(`/${key}`)
            .send({ value })
            .expect(204);

        // Get value from the second node
        const response = await request(getUrl(PORTS[1]))
            .get(`/${key}`)
            .expect(200);

        expect(response.text).toBe(value);
    });

    it('should propagate deletions across the cluster', async () => {
        const key = 'e2e-key-to-delete';
        const value = 'e2e-value';

        // Set value on the first node
        await request(getUrl(PORTS[0]))
            .put(`/${key}`)
            .send({ value })
            .expect(204);

        // Delete value from the second node
        await request(getUrl(PORTS[1]))
            .delete(`/${key}`)
            .expect(204);

        // Get value from the third node (should be deleted)
        await request(getUrl(PORTS[2]))
            .get(`/${key}`)
            .expect(404);
    });

    it('should maintain availability when a node goes down', async () => {
        const key = 'e2e-key-ha';
        const value = 'e2e-value-ha';

        // Set value on the first node
        await request(getUrl(PORTS[0]))
            .put(`/${key}`)
            .send({ value })
            .expect(204);

        // Kill one of the nodes (node1)
        const nodeToKill = 'node1';
        const killProcess = spawn('pkill', ['-f', `NODE_ID=${nodeToKill}`]);
        await new Promise(resolve => killProcess.on('close', resolve));

        // Get value from another node (should still be available)
        const response = await request(getUrl(PORTS[2]))
            .get(`/${key}`)
            .expect(200);

        expect(response.text).toBe(value);
    });
});