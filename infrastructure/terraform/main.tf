# AccuBooks Production Infrastructure
# Terraform configuration for AWS EKS clusters, RDS, and ElastiCache

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
  }

  backend "s3" {
    bucket = "accubooks-terraform-state"
    key    = "production/terraform.tfstate"
    region = "ca-central-1"
    encrypt = true
  }
}

provider "aws" {
  region = var.aws_region
}

# Variables
variable "aws_account_id" {
  description = "AWS Account ID"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (staging or production)"
  type        = string
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "redis_node_type" {
  description = "ElastiCache node type"
  type        = string
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "chronaworkflow.com"
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}

# VPC Configuration
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${var.cluster_name}-vpc"
  cidr = var.vpc_cidr

  azs             = ["${var.aws_region}a", "${var.aws_region}b", "${var.aws_region}d"]
  private_subnets = ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]
  public_subnets  = ["10.1.101.0/24", "10.1.102.0/24", "10.1.103.0/24"]
  database_subnets = ["10.1.201.0/24", "10.1.202.0/24", "10.1.203.0/24"]

  enable_nat_gateway   = true
  single_nat_gateway   = var.environment == "staging" ? true : false
  enable_dns_hostnames = true
  enable_dns_support   = true

  public_subnet_tags = {
    "kubernetes.io/role/elb" = "1"
  }

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = "1"
  }

  tags = {
    Environment = var.environment
    Project     = "AccuBooks"
    ManagedBy   = "Terraform"
  }
}

# EKS Cluster
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = var.cluster_name
  cluster_version = "1.29"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  cluster_endpoint_public_access = true
  cluster_endpoint_private_access = true

  cluster_addons = {
    coredns = {
      most_recent = true
    }
    kube-proxy = {
      most_recent = true
    }
    vpc-cni = {
      most_recent = true
    }
  }

  eks_managed_node_groups = {
    default = {
      min_size     = var.environment == "staging" ? 2 : 3
      max_size     = var.environment == "staging" ? 5 : 10
      desired_size = var.environment == "staging" ? 2 : 5

      instance_types = ["t3.micro"]
      capacity_type  = "ON_DEMAND"

      labels = {
        Environment = var.environment
        Workload    = "general"
      }

      tags = {
        Environment = var.environment
        Project     = "AccuBooks"
      }
    }
  }

  cluster_security_group_additional_rules = {
    ingress_nodes_ephemeral_ports_tcp = {
      description                = "Nodes on ephemeral ports"
      protocol                   = "tcp"
      from_port                  = 1025
      to_port                    = 65535
      type                       = "ingress"
      source_node_security_group = true
    }
  }

  node_security_group_additional_rules = {
    ingress_self_all = {
      description = "Node to node all ports/protocols"
      protocol    = "-1"
      from_port   = 0
      to_port     = 0
      type        = "ingress"
      self        = true
    }
  }

  tags = {
    Environment = var.environment
    Project     = "AccuBooks"
    ManagedBy   = "Terraform"
  }
}

# RDS PostgreSQL
resource "aws_db_subnet_group" "accubooks" {
  name       = "${var.cluster_name}-db-subnet"
  subnet_ids = module.vpc.database_subnets

  tags = {
    Name        = "${var.cluster_name}-db-subnet"
    Environment = var.environment
  }
}

resource "aws_security_group" "rds" {
  name        = "${var.cluster_name}-rds-sg"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description     = "PostgreSQL from EKS"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [module.eks.node_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.cluster_name}-rds-sg"
    Environment = var.environment
  }
}

resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "aws_db_instance" "accubooks" {
  identifier     = "${var.cluster_name}-db"
  engine         = "postgres"
  engine_version = "16"
  instance_class = var.db_instance_class

  allocated_storage     = var.environment == "staging" ? 100 : 500
  max_allocated_storage = var.environment == "staging" ? 200 : 1000
  storage_encrypted     = true
  storage_type          = "gp3"

  db_name  = "accubooks"
  username = "accubooks"
  password = random_password.db_password.result

  db_subnet_group_name   = aws_db_subnet_group.accubooks.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  backup_retention_period = 0
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"

  multi_az               = var.environment == "production"
  publicly_accessible    = false
  deletion_protection    = var.environment == "production"
  skip_final_snapshot    = var.environment == "staging"
  final_snapshot_identifier = var.environment == "production" ? "${var.cluster_name}-final-snapshot" : null

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  performance_insights_enabled    = true
  performance_insights_retention_period = 7

  tags = {
    Name        = "${var.cluster_name}-db"
    Environment = var.environment
    Project     = "AccuBooks"
  }
}

# Read Replica for Production
# Read replica disabled due to backup_retention_period = 0 (free tier)
# resource "aws_db_instance" "accubooks_replica" {
#   count = var.environment == "production" ? 1 : 0
#
#   identifier     = "${var.cluster_name}-db-replica"
#   replicate_source_db = aws_db_instance.accubooks.identifier
#   instance_class = var.db_instance_class
#
#   publicly_accessible = false
#   skip_final_snapshot = false
#
#   tags = {
#     Name        = "${var.cluster_name}-db-replica"
#     Environment = var.environment
#     Project     = "AccuBooks"
#   }
# }

# ElastiCache Redis
resource "aws_elasticache_subnet_group" "accubooks" {
  name       = "${var.cluster_name}-redis-subnet"
  subnet_ids = module.vpc.database_subnets

  tags = {
    Name        = "${var.cluster_name}-redis-subnet"
    Environment = var.environment
  }
}

resource "aws_security_group" "redis" {
  name        = "${var.cluster_name}-redis-sg"
  description = "Security group for ElastiCache Redis"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description     = "Redis from EKS"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [module.eks.node_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.cluster_name}-redis-sg"
    Environment = var.environment
  }
}

resource "aws_elasticache_replication_group" "accubooks" {
  replication_group_id  = "${var.cluster_name}-redis"
  description           = "AccuBooks Redis cluster"

  engine               = "redis"
  engine_version       = "7.0"
  node_type            = var.redis_node_type
  num_cache_clusters   = var.environment == "staging" ? 1 : 3
  port                 = 6379

  subnet_group_name    = aws_elasticache_subnet_group.accubooks.name
  security_group_ids   = [aws_security_group.redis.id]

  automatic_failover_enabled = var.environment == "production"
  multi_az_enabled          = var.environment == "production"
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  transit_encryption_mode    = "required"
  auth_token                 = random_password.redis_auth_token.result

  snapshot_retention_limit = var.environment == "staging" ? 1 : 7
  snapshot_window         = "03:00-05:00"
  maintenance_window      = "mon:05:00-mon:07:00"

  tags = {
    Name        = "${var.cluster_name}-redis"
    Environment = var.environment
    Project     = "AccuBooks"
  }
}

resource "random_password" "redis_auth_token" {
  length  = 32
  special = false
}

# Outputs
output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = module.eks.cluster_security_group_id
}

output "database_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.accubooks.endpoint
  sensitive   = true
}

output "database_name" {
  description = "Database name"
  value       = aws_db_instance.accubooks.db_name
}

output "database_username" {
  description = "Database username"
  value       = aws_db_instance.accubooks.username
  sensitive   = true
}

output "database_password" {
  description = "Database password"
  value       = random_password.db_password.result
  sensitive   = true
}

output "redis_endpoint" {
  description = "Redis primary endpoint"
  value       = aws_elasticache_replication_group.accubooks.primary_endpoint_address
  sensitive   = true
}

output "redis_reader_endpoint" {
  description = "Redis reader endpoint"
  value       = aws_elasticache_replication_group.accubooks.reader_endpoint_address
  sensitive   = true
}
