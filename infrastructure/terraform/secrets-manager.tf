# AWS Secrets Manager for AccuBooks Production Secrets

# Database Secrets
resource "aws_secretsmanager_secret" "database" {
  name        = "accubooks/prod/v2/database"
  description = "AccuBooks production database credentials"
  
  recovery_window_in_days = 30
  
  tags = {
    Environment = var.environment
    Project     = "AccuBooks"
    ManagedBy   = "Terraform"
  }
}

resource "aws_secretsmanager_secret_version" "database" {
  secret_id = aws_secretsmanager_secret.database.id
  secret_string = jsonencode({
    DATABASE_URL = "postgresql://${aws_db_instance.accubooks.username}:${random_password.db_password.result}@${aws_db_instance.accubooks.endpoint}/${aws_db_instance.accubooks.db_name}?sslmode=require"
  })
}

# Redis Credentials Secret
resource "aws_secretsmanager_secret" "redis" {
  name        = "accubooks/prod/v2/redis"
  description = "Redis credentials for AccuBooks production"
  
  recovery_window_in_days = 30
  
  tags = {
    Environment = var.environment
    Project     = "AccuBooks"
    ManagedBy   = "Terraform"
  }
}

resource "aws_secretsmanager_secret_version" "redis" {
  secret_id = aws_secretsmanager_secret.redis.id
  secret_string = jsonencode({
    REDIS_URL      = "rediss://${aws_elasticache_replication_group.accubooks.primary_endpoint_address}:6379"
    REDIS_PASSWORD = random_password.redis_auth_token.result
  })
}

# Authentication Secrets
resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

resource "random_password" "jwt_refresh_secret" {
  length  = 64
  special = true
}

resource "random_password" "session_secret" {
  length  = 64
  special = true
}

resource "random_password" "encryption_key" {
  length  = 64
  special = true
}

resource "aws_secretsmanager_secret" "auth" {
  name        = "accubooks/prod/v2/auth"
  description = "AccuBooks production authentication secrets"
  
  recovery_window_in_days = 30
  
  tags = {
    Environment = var.environment
    Project     = "AccuBooks"
    ManagedBy   = "Terraform"
  }
}

resource "aws_secretsmanager_secret_version" "auth" {
  secret_id = aws_secretsmanager_secret.auth.id
  secret_string = jsonencode({
    JWT_SECRET         = random_password.jwt_secret.result
    JWT_REFRESH_SECRET = random_password.jwt_refresh_secret.result
    SESSION_SECRET     = random_password.session_secret.result
    ENCRYPTION_KEY     = random_password.encryption_key.result
  })
}

# Third-Party Services Secret (to be populated manually)
resource "aws_secretsmanager_secret" "third_party" {
  name        = "accubooks/prod/v2/third-party"
  description = "Third-party service credentials for AccuBooks production"
  
  recovery_window_in_days = 30
  
  tags = {
    Environment = var.environment
    Project     = "AccuBooks"
    ManagedBy   = "Terraform"
  }
}

# Placeholder version - must be updated with real values
resource "aws_secretsmanager_secret_version" "third_party" {
  secret_id = aws_secretsmanager_secret.third_party.id
  secret_string = jsonencode({
    SENDGRID_API_KEY        = ""
    SMTP_HOST               = ""
    SMTP_PORT               = ""
    SMTP_USER               = ""
    SMTP_PASS               = ""
    STRIPE_SECRET_KEY       = ""
    STRIPE_PUBLISHABLE_KEY  = ""
    STRIPE_WEBHOOK_SECRET   = ""
    SENTRY_DSN              = ""
    GOOGLE_CLIENT_ID        = ""
    GOOGLE_CLIENT_SECRET    = ""
    GITHUB_CLIENT_ID        = ""
    GITHUB_CLIENT_SECRET    = ""
  })
  
  lifecycle {
    ignore_changes = [secret_string]
  }
}

# IAM Role for EKS Service Account
resource "aws_iam_role" "backend_service_account" {
  name = "${var.cluster_name}-backend-sa-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = module.eks.oidc_provider_arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "${replace(module.eks.cluster_oidc_issuer_url, "https://", "")}:sub" = "system:serviceaccount:accubooks-prod:accubooks-backend"
            "${replace(module.eks.cluster_oidc_issuer_url, "https://", "")}:aud" = "sts.amazonaws.com"
          }
        }
      }
    ]
  })

  tags = {
    Environment = var.environment
    Project     = "AccuBooks"
    ManagedBy   = "Terraform"
  }
}

# IAM Policy for EKS pods to read secrets
resource "aws_iam_policy" "secrets_read" {
  name        = "${var.cluster_name}-secrets-read"
  description = "Allow reading AccuBooks secrets from Secrets Manager"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          aws_secretsmanager_secret.database.arn,
          aws_secretsmanager_secret.redis.arn,
          aws_secretsmanager_secret.auth.arn,
          aws_secretsmanager_secret.third_party.arn
        ]
      }
    ]
  })

  tags = {
    Environment = var.environment
    Project     = "AccuBooks"
    ManagedBy   = "Terraform"
  }
}

# Attach policy to backend service account role
resource "aws_iam_role_policy_attachment" "backend_secrets" {
  role       = aws_iam_role.backend_service_account.name
  policy_arn = aws_iam_policy.secrets_read.arn
}

# S3 Bucket for file storage
resource "aws_s3_bucket" "accubooks_files" {
  bucket = "accubooks-files-${var.environment}-971551576768"

  tags = {
    Environment = var.environment
    Project     = "AccuBooks"
    ManagedBy   = "Terraform"
  }
}

resource "aws_s3_bucket_versioning" "accubooks_files" {
  bucket = aws_s3_bucket.accubooks_files.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "accubooks_files" {
  bucket = aws_s3_bucket.accubooks_files.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "accubooks_files" {
  bucket = aws_s3_bucket.accubooks_files.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# IAM Policy for S3 access
resource "aws_iam_policy" "s3_access" {
  name        = "${var.cluster_name}-s3-access"
  description = "Allow AccuBooks to access S3 bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.accubooks_files.arn,
          "${aws_s3_bucket.accubooks_files.arn}/*"
        ]
      }
    ]
  })

  tags = {
    Environment = var.environment
    Project     = "AccuBooks"
    ManagedBy   = "Terraform"
  }
}

resource "aws_iam_role_policy_attachment" "backend_s3" {
  role       = aws_iam_role.backend_service_account.name
  policy_arn = aws_iam_policy.s3_access.arn
}

# Outputs
output "secrets_manager_arns" {
  description = "ARNs of Secrets Manager secrets"
  value = {
    database    = aws_secretsmanager_secret.database.arn
    redis       = aws_secretsmanager_secret.redis.arn
    auth        = aws_secretsmanager_secret.auth.arn
    third_party = aws_secretsmanager_secret.third_party.arn
  }
}

output "secrets_manager_names" {
  description = "Names of Secrets Manager secrets"
  value = {
    database    = aws_secretsmanager_secret.database.name
    redis       = aws_secretsmanager_secret.redis.name
    auth        = aws_secretsmanager_secret.auth.name
    third_party = aws_secretsmanager_secret.third_party.name
  }
}

output "s3_bucket_name" {
  description = "S3 bucket for file storage"
  value       = aws_s3_bucket.accubooks_files.id
}

output "backend_service_account_role_arn" {
  description = "IAM role ARN for backend service account"
  value       = aws_iam_role.backend_service_account.arn
}
