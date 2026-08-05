# RailPulse Infrastructure-as-Code (Terraform AWS EKS / Kubernetes Provisioning)

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  default     = "us-east-1"
  description = "AWS Region for RailPulse Transit Infrastructure"
}

variable "environment" {
  default     = "production"
  description = "Deployment Environment"
}

# 1. VPC Network Module
resource "aws_vpc" "railpulse_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "railpulse-vpc"
    Environment = var.environment
  }
}

# Public Subnets
resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.railpulse_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name = "railpulse-public-1"
  }
}

resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.railpulse_vpc.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "${var.aws_region}b"
  map_public_ip_on_launch = true

  tags = {
    Name = "railpulse-public-2"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.railpulse_vpc.id

  tags = {
    Name = "railpulse-igw"
  }
}

# Security Group for EKS Cluster & Worker Nodes
resource "aws_security_group" "eks_nodes_sg" {
  name        = "railpulse-eks-nodes-sg"
  description = "Security group for RailPulse worker nodes and ingress traffic"
  vpc_id      = aws_vpc.railpulse_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

output "vpc_id" {
  value       = aws_vpc.railpulse_vpc.id
  description = "RailPulse Production VPC ID"
}

output "security_group_id" {
  value       = aws_security_group.eks_nodes_sg.id
  description = "EKS Security Group ID"
}
