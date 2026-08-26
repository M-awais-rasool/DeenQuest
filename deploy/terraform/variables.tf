variable "region" {
  description = "Vultr region ID. bom = Mumbai, closest to a South Asia user base."
  type        = string
  default     = "bom"
}

variable "plan" {
  description = <<-DESC
    Vultr plan ID. 2 vCPU / 4 GB is the floor for this stack — the memory budget
    in VULTR_PRODUCTION_ARCHITECTURE.md §7 sums to ~3.5 GB at deploy peak.
    Confirm the current ID with: vultr-cli plans list --region bom
  DESC
  type        = string
  default     = "vhf-2c-4gb"
}

variable "os_id" {
  description = "Ubuntu 24.04 LTS. Confirm with: vultr-cli os list"
  type        = number
  default     = 2284
}

variable "tailscale_auth_key" {
  description = "Ephemeral, pre-authorized, tagged Tailscale key used once at first boot."
  type        = string
  sensitive   = true
}

variable "ops_ssh_key" {
  description = "Public key for the human operator account (full sudo, over Tailscale only)."
  type        = string
}

variable "deploy_ssh_key" {
  description = "Public key CI deploys with. Installed behind a forced command — no shell, no sudo."
  type        = string
}

variable "ghcr_owner" {
  description = "GitHub owner whose GHCR namespace holds the API image."
  type        = string
  default     = "m-awais-rasool"
}
