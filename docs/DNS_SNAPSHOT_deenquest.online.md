# DNS — deenquest.online

Captured from the authoritative Namecheap nameservers (`dig @dns1.registrar-servers.com`),
not from a resolver cache, before moving to Cloudflare.

**Cloudflare's importer got this wrong.** It picked up Namecheap *Email
Forwarding* records (`eforward1-5.registrar-servers.com`) when the domain
actually uses Namecheap *Private Email* (`mx1/mx2.privateemail.com`), and it
missed the mail autodiscovery records entirely. Switching nameservers on the
imported set would have delivered mail to the wrong service and broken every
mail client's auto-setup — quietly, and without the website showing any sign of
trouble. Always diff the import against the authoritative zone before cutting
over.

## The correct zone

| Type | Name | Content | Priority | Cloudflare proxy |
|---|---|---|---|---|
| A | `deenquest.online` | `216.198.79.1` | — | **DNS only** |
| CNAME | `www` | `f5788b14c379af9c.vercel-dns-017.com` | — | **DNS only** |
| MX | `deenquest.online` | `mx1.privateemail.com` | 10 | — |
| MX | `deenquest.online` | `mx2.privateemail.com` | 10 | — |
| TXT | `deenquest.online` | `v=spf1 include:spf.privateemail.com ~all` | — | — |
| TXT | `deenquest.online` | `google-site-verification=r464EEc3ay65aFlDXmw7fh1tOvJj8OCrhIZVDMV9t0U` | — | — |
| CNAME | `autodiscover` | `privateemail.com` | — | **DNS only** |
| CNAME | `autoconfig` | `privateemail.com` | — | **DNS only** |
| CNAME | `mail` | `privateemail.com` | — | **DNS only** |
| SRV | `_autodiscover._tcp` | port 443, target `privateemail.com` | 0 0 | — |

The Vercel records stay **DNS only**. Cloudflare and Vercel both terminate TLS,
and proxying one through the other produces a certificate loop that takes the
site down.

## Must be removed from Cloudflare's import

| Type | Content | Why |
|---|---|---|
| MX ×5 | `eforward1..5.registrar-servers.com` | Wrong service — email forwarding, not Private Email |
| TXT | `v=spf1 include:spf.efwd.registrar-servers.com ~all` | Wrong SPF include; mail would fail alignment and land in spam |

## To add after the cutover

| Type | Name | Content | Proxy |
|---|---|---|---|
| CNAME | `api` | created by the Cloudflare Tunnel | **Proxied** |
| CNAME | `admin` | Cloudflare Pages target | **Proxied** |

## Verify after switching

```bash
dig +short NS  deenquest.online          # cloudflare nameservers
dig +short MX  deenquest.online          # mx1 + mx2 privateemail, priority 10
dig +short TXT deenquest.online          # spf.privateemail.com include
dig +short CNAME mail.deenquest.online   # privateemail.com
curl -sI https://deenquest.online | head -1
curl -sI https://www.deenquest.online | head -1
```

Then **send yourself mail at this domain and confirm it arrives**. DNS resolving
correctly is not the same as mail being delivered.
