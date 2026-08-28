# Copy to prod.tfvars (gitignored) and fill in. Never commit the real file.
region             = "bom"
plan               = "vhf-2c-4gb"
ops_ssh_key        = "ssh-ed25519 AAAA... you@laptop"
deploy_ssh_key     = "ssh-ed25519 AAAA... github-actions-deploy"
tailscale_auth_key = "tskey-auth-..."
ghcr_owner         = "m-awais-rasool"
