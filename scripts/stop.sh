#!/bin/bash

# Exit on error
set -e

# Delete the kind cluster
kind delete cluster --name cache-cluster
