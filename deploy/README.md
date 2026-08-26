# `deploy/` — quick reference

Full instructions are in **[`DEPLOYMENT_GUIDE.md`](../docs/DEPLOYMENT_GUIDE.md)** (setup,
what every file does, troubleshooting). The reasoning behind the design is in
[`VULTR_PRODUCTION_ARCHITECTURE.md`](../docs/VULTR_PRODUCTION_ARCHITECTURE.md).

This file is the cheat sheet for when you already know the system.

## Layout

```
deploy/
├── compose.prod.yml      the stack — no published ports, three networks
├── cloud-init.yaml       first boot: users, SSH, UFW, Docker, Tailscale, auditd
├── terraform/            server, VPC, empty-inbound firewall group
├── caddy/                internal reverse proxy + the blue/green switch file
├── mongo/                least-privilege users, TLS material
├── alloy/                metrics + logs to Grafana Cloud, with a cardinality gate
├── secrets/              prod.enc.env — encrypted, committed on purpose
└── scripts/              deploy, smoke, backup, restore, init-mongo, gen-mongo-tls
```

The Whisper image is built from `backend/whisper-service/Dockerfile`; its model
is mounted at runtime, never baked in.

## Commands

| Task | Command |
|---|---|
| Deploy | Tag with `git tag -s vX.Y.Z`, then run the **Release** workflow |
| Roll back (< 5 min) | `ssh ops@deenquest-prod deploy.sh --rollback` |
| Roll back (later) | Release workflow with the previous tag |
| Which colour is live | `cat /var/lib/deenquest/colour` |
| Logs | Grafana Cloud, or `docker compose -f compose.prod.yml logs -f api-blue` |
| Edit a secret | `sops secrets/prod.enc.env`, commit, deploy |
| Back up now | `sudo systemctl start deenquest-backup` |
| **Restore drill** | `AGE_KEY_FILE=~/age.key ./scripts/restore.sh r2:deenquest-backups/daily/<file>` |
| First-time Mongo setup | `sudo ./scripts/gen-mongo-tls.sh && sudo ./scripts/init-mongo.sh` |

## The invariant

**Nothing listens on the public interface.** Verify after any change:

```bash
nmap -Pn -p- <public-ip>
```

Every port must be filtered. If one answers, stop and find out why.

## What breaks this design

- Adding `ports:` to a container — Docker bypasses UFW with its own iptables rules
- Adding an inbound rule to the Vultr firewall group
- Mounting the Docker socket into anything with internet egress
- Editing files on the box instead of in the repo — the next deploy erases them
- A destructive seed or index change in a single release (blue and green share one database)
