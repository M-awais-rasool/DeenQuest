output "instance_id" {
  value = vultr_instance.prod.id
}

output "public_ipv4" {
  description = "Exists, but nothing listens on it. Verify with: nmap -Pn <ip>"
  value       = vultr_instance.prod.main_ip
}

output "vpc_id" {
  value = vultr_vpc.prod.id
}

output "firewall_group_id" {
  description = "Inbound accept-list must stay empty. Check it after any console change."
  value       = vultr_firewall_group.prod.id
}
