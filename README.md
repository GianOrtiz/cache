# Distributed Key-Value Cache

This project is an implementation of a distributed, in-memory key-value cache, inspired by systems like Redis and Memcached. It is built to demonstrate key concepts in distributed systems.

## Project Goal

The primary goal is to create a highly available, scalable, and eventually consistent cache. It provides a simple key-value store interface while handling the complexities of data distribution, replication, and consistency internally.

## Core Concepts & Architecture

The cache is designed to run as a cluster of nodes that work together to provide a single, unified data store. The implementation relies on the following core concepts:

### 1. Consistent Hashing

To distribute keys evenly across the cluster, the system uses a consistent hash ring. When a key-value pair is stored, the key is hashed to determine which node is responsible for it. This approach ensures that when nodes are added or removed, only a small fraction of keys need to be redistributed, allowing the cluster to scale horizontally with minimal disruption.

*Implementation: `src/domain/ConsistentHash.ts`*

### 2. Replication

For high availability and fault tolerance, each key-value pair is replicated across multiple nodes (currently configured to 3). If a node becomes unavailable, the data can still be served from its replicas. The `set` and `delete` operations are broadcast to all responsible nodes to keep replicas in sync.

*Implementation: `set` and `delete` methods in `src/application/CacheNode.ts`*

### 3. Data Consistency with Merkle Trees (Anti-Entropy)

To ensure data remains consistent across all replicas over time, the system uses an anti-entropy mechanism based on Merkle trees. Each node maintains a Merkle tree representing the data it holds. Periodically, nodes can exchange the root hash of their Merkle trees to quickly verify data integrity.

If the roots differ, it indicates an inconsistency, and the nodes can (in a future implementation) efficiently synchronize only the differing data by comparing sub-trees, rather than transferring the entire dataset.

*Implementation: `src/domain/data-structures/MerkleTree.ts` and the `antiEntropy` method in `src/application/CacheNode.ts`*

### 4. Request Proxying

A client can send a request to any node in the cluster. If a node receives a request for a key it does not own, it acts as a proxy and forwards the request to the correct node as determined by the consistent hash ring. This simplifies the client-side logic, as the client does not need to be aware of the data distribution.

## How to Run

### Prerequisites
- Node.js
- npm

### Installation

Install the project dependencies:
```bash
npm install
```

### Running Tests

To run the full test suite:
```bash
npm test
```

### Starting the Cluster

To start a 3-node cluster locally, run:
```bash
npm start
```
This command will launch three cache nodes on ports 3000, 3001, and 3002. Each node will run as a separate process.

## API Usage

You can interact with the cluster using any HTTP client, such as `curl`. You can send a request to any node (e.g., port 3000, 3001, or 3002), and the cluster will handle routing internally.

### Set a Value

```bash
curl -X PUT -H "Content-Type: application/json" -d '{"value":"my-awesome-value", "timestamp": client-timestamp}' http://localhost:3000/my-key
```

### Get a Value

```bash
curl http://localhost:3000/my-key
```

### Delete a Value

```bash
curl -X DELETE http://localhost:3000/my-key
```

## Project Structure

- `src/domain`: Contains the core business logic and data structures, such as the `ConsistentHash`, `CacheStore`, and `MerkleTree`.
- `src/application`: Contains the `CacheNode` class, which orchestrates the domain logic and handles the interactions between different components.
- `src/infrastructure`: Contains the Express.js server (`server.ts`) and the main entry point for the application (`main.ts`).
