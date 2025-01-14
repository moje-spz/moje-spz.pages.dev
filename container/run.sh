#!/bin/bash
# SPDX-FileCopyrightText: 2025 Pavol Babinčák
# SPDX-License-Identifier: MIT

# Exit on error, treat unset variables as error
set -eu

# Usage help
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    echo "Usage: $0 [command]"
    echo
    echo "Enter Ubuntu 24.04 toolbox container or run a command inside it."
    echo "Note: Container must be already built using rebuild-and-run.sh"
    echo
    echo "Examples:"
    echo "  $0                  # Enter container (interactive shell)"
    echo "  $0 /opt/Cursor.AppImage    # Starts Cursor IDE"
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

# Check if container exists
if ! toolbox list | grep -q "${CONTAINER_NAME}"; then
    echo "Error: Container ${CONTAINER_NAME} not found. Please run rebuild-and-run.sh first." >&2
    exit 1
fi

# Enter if no args, otherwise run the specified command
if [ $# -eq 0 ]; then
    toolbox enter ${CONTAINER_NAME}
else
    toolbox run --container ${CONTAINER_NAME} "$@"
fi
