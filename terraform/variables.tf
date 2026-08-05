variable "app_name" {
  type        = string
  default     = "train-schedule"
  description = "Name of the application deployment"
}

variable "environment" {
  type        = string
  default     = "production"
  description = "Target deployment environment (production/canary/staging)"
}

variable "container_image" {
  type        = string
  default     = "willbla/train-schedule:latest"
  description = "Docker image repository and tag to deploy"
}

variable "replica_count" {
  type        = number
  default     = 2
  description = "Initial number of deployment pod replicas"
}

variable "container_port" {
  type        = number
  default     = 8080
  description = "Container exposed port"
}

variable "node_port" {
  type        = number
  default     = 30080
  description = "Kubernetes NodePort for external access"
}
