# DNS snapshot — deenquest.online

Taken before moving nameservers to Cloudflare, so that anything the import
misses can be restored by hand. **Email lives on this domain**, so the MX and
SPF records matter as much as the website records.

Current nameservers (Namecheap): `dns1.registrar-servers.com`, `dns2.registrar-servers.com`

| Type | Name | Value | Proxy in Cloudflare | Why |
|---|---|---|---|---|
| A | `deenquest.online` | `216.198.79.1` | **DNS only (grey)** | Vercel. Proxying Vercel through Cloudflare causes certificate loops |
| CNAME | `www` | `f5788b14c379af9c.vercel-dns-017.com` | **DNS only (grey)** | Vercel |
| MX | `deenquest.online` | `10 mx1.privateemail.com` | n/a | **Email — losing this breaks mail** |
| MX | `deenquest.online` | `10 mx2.privateemail.com` | n/a | **Email — losing this breaks mail** |
| TXT | `deenquest.online` | `v=spf1 include:spf.privateemail.com ~all` | n/a | **SPF — losing this sends your mail to spam** |
| TXT | `deenquest.online` | `google-site-verification=r464EEc3ay65aFlDXmw7fh1tOvJj8OCrhIZVDMV9t0U` | n/a | Search Console ownership |

## To be added after the move

| Type | Name | Value | Proxy |
|---|---|---|---|
| CNAME | `api` | (created automatically by the Cloudflare Tunnel) | **Proxied (orange)** |
| CNAME | `admin` | Cloudflare Pages target | **Proxied (orange)** |

## Verify after switching

```bash
dig +short NS  deenquest.online          # cloudflare nameservers
dig +short MX  deenquest.online          # both privateemail hosts, still there
dig +short TXT deenquest.online          # SPF still there
curl -sI https://deenquest.online | head -1
curl -sI https://www.deenquest.online | head -1
```

Then send yourself an email at this domain and confirm it arrives. DNS lookups
succeeding is not the same as mail being delivered.
