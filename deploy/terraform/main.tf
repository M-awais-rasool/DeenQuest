# DeenQuest production infrastructure on Vultr.
#
# One instance, one VPC, one firewall group whose inbound accept-list is empty.
# That is the whole estate — and it is in code so the disaster-recovery runbook
# ("rebuild the host") is a command rather than an afternoon of remembering.
#
#   terraform init && terraform plan && terraform apply
#
# Plan and region IDs change. Confirm yours before applying:
#   vultr-cli plans list --region bom
#   vultr-cli regions list

terraform {
  required_version = ">= 1.6"

  required_providers {
    vultr = {
      source  = "vultr/vultr"
      version = "~> 2.21"
    }
  }

  # State contains the instance's addresses and IDs — not secrets, but not
  # public either. Keep it in R2 (S3-compatible) rather than on one laptop:
  #
  # backend "s3" {
  #   bucket                      = "deenquest-tfstate"
  #   key                         = "prod/terraform.tfstate"
  #   endpoints                   = { s3 = "https://<accountid>.r2.cloudflarestorage.com" }
  #   region                      = "auto"
  #   skip_credentials_validation = true
  #   skip_region_validation      = true
  #   skip_requesting_account_id  = true
  #   skip_s3_checksum            = true
  #   use_path_style              = true
  # }
}

provider "vultr" {
  # export VULTR_API_KEY=... — never commit it.
  rate_limit  = 100
  retry_limit = 3
}

# ── network ───────────────────────────────────────────────────────────────────

# Provisioned even though there is one node. Attaching a VPC later means a
# reboot and a new private address; attaching it now costs nothing.
resource "vultr_vpc2" "prod" {
  region      = var.region
  description = "deenquest-prod"
}

# The security control of this design: an empty inbound accept-list.
#
# There is no SSH rule because SSH arrives over Tailscale, and no 80/443 rule
# because HTTPS arrives through a Cloudflare Tunnel that this host dials out to.
# Vultr firewall groups deny what is not listed, so listing nothing is correct.
#
# IPv6 is locked down by the same emptiness — an IPv6 rule set left permissive
# while IPv4 is tightened is the most common way this control gets defeated.
resource "vultr_firewall_group" "prod" {
  description = "deenquest-prod — deny all inbound (ingress via Cloudflare Tunnel, admin via Tailscale)"
}

# ── compute ───────────────────────────────────────────────────────────────────

resource "vultr_instance" "prod" {
  label       = "deenquest-prod"
  hostname    = "deenquest-prod"
  region      = var.region
  plan        = var.plan
  os_id       = var.os_id
  enable_ipv6 = true

  vpc2_ids          = [vultr_vpc2.prod.id]
  firewall_group_id = vultr_firewall_group.prod.id

  # Everything the host needs to reach a state where deploy.sh can run.
  user_data = templatefile("${path.module}/../cloud-init.yaml", {
    tailscale_auth_key = var.tailscale_auth_key
    ops_ssh_key        = var.ops_ssh_key
    deploy_ssh_key     = var.deploy_ssh_key
    ghcr_owner         = var.ghcr_owner
  })

  backups = "disabled" # logical dumps to R2/B2 instead — portable to any provider

  tags = ["deenquest", "production"]

  lifecycle {
    # An accidental `terraform destroy` should not be one keystroke away from
    # taking production with it.
    prevent_destroy = true

    # cloud-init runs once. Editing it later must not silently rebuild the box.
    ignore_changes = [user_data]
  }
}
