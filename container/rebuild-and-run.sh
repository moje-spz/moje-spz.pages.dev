#!/bin/bash
# SPDX-FileCopyrightText: 2025 Pavol Babinčák
# SPDX-License-Identifier: MIT

# Exit on error, treat unset variables as error
set -eu

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Usage help
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    echo "Usage: $0 [command]"
    echo
    echo "Build Ubuntu 24.04 toolbox container and enter it or run a command inside it."
    echo
    echo "Examples:"
    echo "  $0                  # Enter container (interactive shell)"
    echo "  $0 ~/Cursor.AppImage    # Starts Cursor IDE from your home directory"
    echo "  $0 firefox         # Starts Firefox"
    exit 0
fi

# Detect container runtime
if command -v podman >/dev/null 2>&1; then
    CONTAINER_RUNTIME="podman"
elif command -v docker >/dev/null 2>&1; then
    CONTAINER_RUNTIME="docker"
else
    echo "Error: Neither podman nor docker found. Please install one of them to continue." >&2
    exit 1
fi

CONTAINER_NAME="ubuntu-toolbox-2404"

# Build and create the toolbox if needed
${CONTAINER_RUNTIME} build -t ${CONTAINER_NAME} "${SCRIPT_DIR}" && \
${CONTAINER_RUNTIME} stop ${CONTAINER_NAME} && \
toolbox rm ${CONTAINER_NAME} && \
toolbox create --image ${CONTAINER_NAME} ${CONTAINER_NAME}

# Enter if no args, otherwise run the specified command
if [ $# -eq 0 ]; then
    toolbox enter ${CONTAINER_NAME}
else
    toolbox run --container ${CONTAINER_NAME} "$@"
fi
