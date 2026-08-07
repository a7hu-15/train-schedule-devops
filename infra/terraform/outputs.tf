output "ecr_api_repository_url" {
  description = "ECR Repository URL for Backend API Image"
  value       = aws_ecr_repository.api.repository_url
}

output "ecr_web_repository_url" {
  description = "ECR Repository URL for Frontend Web Image"
  value       = aws_ecr_repository.web.repository_url
}

output "vpc_id" {
  description = "AWS VPC ID"
  value       = aws_vpc.main.id
}
