#!/bin/bash
# Run the tree visualization application

echo "Starting Tree Visualization Tool..."
echo "=================================="

# Check if uv is available
if command -v uv &> /dev/null; then
    echo "Using uv to run the application..."
    uv run python -m main "$@"
else
    echo "uv not found, trying python directly..."
    python -m main "$@"
fi
