#!/bin/sh
set -e

# Ensure tailscale state and socket directories exist
mkdir -p /var/lib/tailscale /var/run/tailscale

# Detect and use whichever iptables backend the host kernel actually supports.
# The base tailscale image defaults to iptables-legacy, but some kernels
# (e.g. current Raspberry Pi kernels) don't ship the legacy nat modules,
# which breaks exit-node NAT/MASQUERADE rules. Prefer nft, fall back to legacy.
if iptables-nft -t nat -L >/dev/null 2>&1; then
    echo "Using iptables-nft backend"
    ln -sf /usr/sbin/iptables-nft /usr/sbin/iptables
    ln -sf /usr/sbin/ip6tables-nft /usr/sbin/ip6tables
elif iptables-legacy -t nat -L >/dev/null 2>&1; then
    echo "Using iptables-legacy backend"
    ln -sf /usr/sbin/iptables-legacy /usr/sbin/iptables
    ln -sf /usr/sbin/ip6tables-legacy /usr/sbin/ip6tables
else
    echo "WARNING: neither iptables-nft nor iptables-legacy nat table is usable" >&2
fi

# Start everything via supervisord
exec /usr/bin/supervisord -c /etc/supervisord.conf