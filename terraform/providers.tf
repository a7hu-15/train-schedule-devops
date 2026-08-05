# Terraform Provider Configuration for Kubernetes
terraform {
  required_version = ">= 1.0.0"
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.25.0"
    }
  }
}

# Configure the Kubernetes Provider using local kubeconfig (~/.kube/config)
provider "kubernetes" {
  config_path = "~/.kube/config"
}
