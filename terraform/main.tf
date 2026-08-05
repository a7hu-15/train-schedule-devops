# Infrastructure as Code (IaC) - Main Terraform Configuration

# 1. Kubernetes Namespace
resource "kubernetes_namespace" "app_ns" {
  metadata {
    name = "${var.app_name}-ns"
    labels = {
      environment = var.environment
      managed-by  = "terraform"
    }
  }
}

# 2. ConfigMap for Application Environment Variables
resource "kubernetes_config_map" "app_config" {
  metadata {
    name      = "${var.app_name}-config"
    namespace = kubernetes_namespace.app_ns.metadata[0].name
  }

  data = {
    PORT        = tostring(var.container_port)
    NODE_ENV    = var.environment
    APP_VERSION = "2.0.0"
  }
}

# 3. Kubernetes Deployment (App Replicas + Probes + Resource Bounds)
resource "kubernetes_deployment" "app_deployment" {
  metadata {
    name      = "${var.app_name}-deployment"
    namespace = kubernetes_namespace.app_ns.metadata[0].name
    labels = {
      app   = var.app_name
      track = "stable"
    }
  }

  spec {
    replicas = var.replica_count

    selector {
      match_labels = {
        app   = var.app_name
        track = "stable"
      }
    }

    template {
      metadata {
        labels = {
          app   = var.app_name
          track = "stable"
        }
      }

      spec {
        container {
          name  = var.app_name
          image = var.container_image

          port {
            container_port = var.container_port
          }

          env_from {
            config_map_ref {
              name = kubernetes_config_map.app_config.metadata[0].name
            }
          }

          # Liveness Probe (Auto-restarts pod if /health returns 500)
          liveness_probe {
            http_get {
              path = "/health"
              port = var.container_port
            }
            initial_delay_seconds = 10
            period_seconds        = 5
            timeout_seconds       = 2
            failure_threshold     = 3
          }

          # Readiness Probe (Routes traffic only when /ready returns 200)
          readiness_probe {
            http_get {
              path = "/ready"
              port = var.container_port
            }
            initial_delay_seconds = 5
            period_seconds        = 5
            timeout_seconds       = 2
          }

          # CPU and Memory Limits
          resources {
            requests = {
              cpu    = "200m"
              memory = "128Mi"
            }
            limits = {
              cpu    = "500m"
              memory = "256Mi"
            }
          }
        }
      }
    }
  }
}

# 4. Kubernetes Service (Exposes App externally via NodePort)
resource "kubernetes_service" "app_service" {
  metadata {
    name      = "${var.app_name}-service"
    namespace = kubernetes_namespace.app_ns.metadata[0].name
  }

  spec {
    type = "NodePort"

    selector = {
      app   = var.app_name
      track = "stable"
    }

    port {
      port        = var.container_port
      target_port = var.container_port
      node_port   = var.node_port
    }
  }
}
