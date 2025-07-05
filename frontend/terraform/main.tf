terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    # Backend configuration will be provided via backend config file
    # terraform init -backend-config=backend-dev.conf
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "ai-lifestyle-app"
      Environment = var.environment
      ManagedBy   = "terraform"
      Component   = "frontend"
    }
  }
}

# Provider for ACM certificates (must be in us-east-1 for CloudFront)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
  
  default_tags {
    tags = {
      Project     = "ai-lifestyle-app"
      Environment = var.environment
      ManagedBy   = "terraform"
      Component   = "frontend"
    }
  }
}
