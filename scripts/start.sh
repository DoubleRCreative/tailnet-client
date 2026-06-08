#!/bin/sh
set -e

# Ensure tailscale state and socket directories exist
mkdir -p /var/lib/tailscale /var/run/tailscale

# Start everything via supervisord
exec /usr/bin/supervisord -c /etc/supervisord.conf
