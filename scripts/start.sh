#!/bin/bash

# Exit on error
set -e

# Create kind cluster
echo "Creating kind cluster..."
kind create cluster --name cache-cluster

# Build the docker image
echo "Building Docker image..."
docker build -t gian/cache:latest .

# Load the docker image into the kind cluster
echo "Loading Docker image into kind cluster..."
kind load docker-image gian/cache:latest --name cache-cluster

# Deploy the kubernetes manifests
echo "Deploying Kubernetes manifests..."
kubectl apply -f kubernetes/deployment.yaml

echo "Deployment finished!"
