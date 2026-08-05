# 🛠️ Terraform Infrastructure as Code (IaC) Guide

This folder contains the **Terraform** configuration files to declaratively provision the **RailPulse Real-Time Transit Application** on any Kubernetes cluster (Minikube, Kind, Docker Desktop Kubernetes, AWS EKS, GCP GKE, or Azure AKS).

---

## 📁 File Structure

* **`providers.tf`**: Configures the Terraform Kubernetes provider.
* **`variables.tf`**: Defines input variables (app name, image, replica count, ports).
* **`main.tf`**: Contains the core infrastructure resources (Namespace, ConfigMap, Deployment with probes & limits, NodePort Service).
* **`outputs.tf`**: Defines output values (namespace, deployment name, service NodePort).

---

## 🚀 How to Run Terraform Commands

### Step 1: Initialize Terraform
Downloads the required provider plugins (Kubernetes provider):
```bash
cd terraform
terraform init
```

### Step 2: Validate Syntax & Format
Ensures your code is formatted correctly:
```bash
terraform fmt
terraform validate
```

### Step 3: Plan Infrastructure (Dry Run)
Previews what resources Terraform will create without touching any cluster:
```bash
terraform plan
```

### Step 4: Apply Infrastructure (Provisioning)
Deploys the resources to your Kubernetes cluster:
```bash
terraform apply
```
*(Type `yes` when prompted)*

### Step 5: Destroy Infrastructure (Clean Up)
Tears down all resources cleanly when done:
```bash
terraform destroy
```

---

## 🔑 What This Shows in Interviews
1. **Declarative IaC**: Demonstrates you don't manually create K8s resources with `kubectl create`, but track infrastructure in Git using Terraform.
2. **State Management**: Shows knowledge of how Terraform tracks resource state.
3. **Parameterization**: Demonstrates clean use of variables and outputs.
