output "namespace" {
  value       = kubernetes_namespace.app_ns.metadata[0].name
  description = "The Kubernetes namespace created by Terraform"
}

output "deployment_name" {
  value       = kubernetes_deployment.app_deployment.metadata[0].name
  description = "The name of the deployed Kubernetes deployment"
}

output "service_name" {
  value       = kubernetes_service.app_service.metadata[0].name
  description = "The name of the exposed Kubernetes service"
}

output "node_port" {
  value       = kubernetes_service.app_service.spec[0].port[0].node_port
  description = "The external NodePort to access the Train Schedule application"
}
