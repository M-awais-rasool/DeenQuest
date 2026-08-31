terraform {
  required_version = ">= 1.6"

  required_providers {
    vultr = {
      source  = "vultr/vultr"
      version = "~> 2.21"
    }
  }
}

provider "vultr" {
  rate_limit  = 100
  retry_limit = 3
}

resource "vultr_vpc2" "prod" {
  region      = var.region
  description = "deenquest-prod"
}

resource "vultr_firewall_group" "prod" {
  description = "deenquest-prod — deny all inbound (ingress via Cloudflare Tunnel, admin via Tailscale)"
}

resource "vultr_instance" "prod" {
  label       = "deenquest-prod"
  hostname    = "deenquest-prod"
  region      = var.region
  plan        = var.plan
  os_id       = var.os_id
  enable_ipv6 = true

  vpc2_ids          = [vultr_vpc2.prod.id]
  firewall_group_id = vultr_firewall_group.prod.id

  user_data = templatefile("${path.module}/../cloud-init.yaml", {
    tailscale_auth_key = var.tailscale_auth_key
    ops_ssh_key        = var.ops_ssh_key
    deploy_ssh_key     = var.deploy_ssh_key
    ghcr_owner         = var.ghcr_owner
  })

  backups = "disabled" 

  tags = ["deenquest", "production"]

  lifecycle {
    prevent_destroy = true
    ignore_changes = [user_data]
  }
}
