variable "aws_region" {
  description = "AWS region for infrastructure showcase"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment name"
  type        = string
  default     = "demo"
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
  default     = "railpulse-eks-demo"
}

variable "db_password" {
  description = "PostgreSQL RDS master password"
  type        = string
  sensitive   = true
  default     = "RailPulseSecret2026!"
}
