# AccuBooks Production Configuration
# AWS Account: 971551576768

aws_account_id     = "971551576768"
environment        = "production"
cluster_name       = "accubooks-production"
aws_region         = "ca-central-1"
vpc_cidr           = "10.1.0.0/16"
db_instance_class  = "db.t3.micro"
redis_node_type    = "cache.t3.micro"

# Domain Configuration
domain_name        = "chronaworkflow.com"

# Tags
tags = {
  Project     = "AccuBooks"
  Environment = "production"
  ManagedBy   = "Terraform"
  Owner       = "AccuBooks"
}
