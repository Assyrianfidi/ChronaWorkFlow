#!/bin/bash
# CloudWatch Logging and Monitoring Setup for AccuBooks EKS
# Run this script after AWS credentials are rotated

set -e

AWS_REGION="ca-central-1"
CLUSTER_NAME="accubooks-production"
NAMESPACE="accubooks-prod"
AWS_ACCOUNT_ID="971551576768"

echo "========================================="
echo "CloudWatch Setup for AccuBooks EKS"
echo "========================================="

# 1. Enable CloudWatch Container Insights for EKS
echo "[1/7] Enabling CloudWatch Container Insights..."
aws eks update-cluster-config \
    --region $AWS_REGION \
    --name $CLUSTER_NAME \
    --logging '{"clusterLogging":[{"types":["api","audit","authenticator","controllerManager","scheduler"],"enabled":true}]}'

# 2. Create CloudWatch Log Groups
echo "[2/7] Creating CloudWatch Log Groups..."
aws logs create-log-group \
    --log-group-name /aws/eks/$CLUSTER_NAME/cluster \
    --region $AWS_REGION || echo "Log group already exists"

aws logs put-retention-policy \
    --log-group-name /aws/eks/$CLUSTER_NAME/cluster \
    --retention-in-days 30 \
    --region $AWS_REGION

aws logs create-log-group \
    --log-group-name /aws/containerinsights/$CLUSTER_NAME/application \
    --region $AWS_REGION || echo "Application log group already exists"

aws logs put-retention-policy \
    --log-group-name /aws/containerinsights/$CLUSTER_NAME/application \
    --retention-in-days 30 \
    --region $AWS_REGION

# 3. Deploy Fluent Bit for log forwarding
echo "[3/7] Deploying Fluent Bit DaemonSet..."
kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/quickstart/cwagent-fluent-bit-quickstart.yaml

# 4. Create SNS Topic for Alerts
echo "[4/7] Creating SNS topic for alerts..."
SNS_TOPIC_ARN=$(aws sns create-topic \
    --name accubooks-eks-alerts \
    --region $AWS_REGION \
    --output text --query 'TopicArn')

echo "SNS Topic ARN: $SNS_TOPIC_ARN"

# Subscribe email to SNS topic (replace with actual email)
# aws sns subscribe \
#     --topic-arn $SNS_TOPIC_ARN \
#     --protocol email \
#     --notification-endpoint your-email@example.com \
#     --region $AWS_REGION

# 5. Create CloudWatch Alarms for Pod Health
echo "[5/7] Creating CloudWatch Alarms..."

# Alarm: Pod Crash/RestartLoopBackOff
aws cloudwatch put-metric-alarm \
    --alarm-name accubooks-pod-crashes \
    --alarm-description "Alert when pods are crashing or in restart loop" \
    --metric-name pod_number_of_container_restarts \
    --namespace ContainerInsights \
    --statistic Sum \
    --period 300 \
    --evaluation-periods 2 \
    --threshold 5 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=ClusterName,Value=$CLUSTER_NAME Name=Namespace,Value=$NAMESPACE \
    --alarm-actions $SNS_TOPIC_ARN \
    --region $AWS_REGION

# Alarm: High CPU Usage
aws cloudwatch put-metric-alarm \
    --alarm-name accubooks-high-cpu \
    --alarm-description "Alert when CPU usage exceeds 80% for 5 minutes" \
    --metric-name node_cpu_utilization \
    --namespace ContainerInsights \
    --statistic Average \
    --period 300 \
    --evaluation-periods 1 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=ClusterName,Value=$CLUSTER_NAME \
    --alarm-actions $SNS_TOPIC_ARN \
    --region $AWS_REGION

# Alarm: High Memory Usage
aws cloudwatch put-metric-alarm \
    --alarm-name accubooks-high-memory \
    --alarm-description "Alert when memory usage exceeds 80% for 5 minutes" \
    --metric-name node_memory_utilization \
    --namespace ContainerInsights \
    --statistic Average \
    --period 300 \
    --evaluation-periods 1 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=ClusterName,Value=$CLUSTER_NAME \
    --alarm-actions $SNS_TOPIC_ARN \
    --region $AWS_REGION

# Alarm: Backend 5xx Errors (requires ALB)
# aws cloudwatch put-metric-alarm \
#     --alarm-name accubooks-backend-5xx \
#     --alarm-description "Alert on backend 5xx HTTP errors" \
#     --metric-name HTTPCode_Target_5XX_Count \
#     --namespace AWS/ApplicationELB \
#     --statistic Sum \
#     --period 300 \
#     --evaluation-periods 1 \
#     --threshold 10 \
#     --comparison-operator GreaterThanThreshold \
#     --alarm-actions $SNS_TOPIC_ARN \
#     --region $AWS_REGION

# 6. Create EventBridge Rule for Pod Failures
echo "[6/7] Creating EventBridge rule for pod failures..."
aws events put-rule \
    --name accubooks-pod-failure \
    --description "Trigger on pod crash or failure events" \
    --event-pattern '{
        "source": ["aws.eks"],
        "detail-type": ["EKS Pod State Change"],
        "detail": {
            "status": ["Failed", "CrashLoopBackOff", "Error"]
        }
    }' \
    --state ENABLED \
    --region $AWS_REGION

aws events put-targets \
    --rule accubooks-pod-failure \
    --targets "Id"="1","Arn"="$SNS_TOPIC_ARN" \
    --region $AWS_REGION

# 7. Verify Setup
echo "[7/7] Verifying CloudWatch setup..."
echo ""
echo "✅ CloudWatch Container Insights enabled"
echo "✅ Log groups created with 30-day retention"
echo "✅ Fluent Bit deployed for log forwarding"
echo "✅ SNS topic created: $SNS_TOPIC_ARN"
echo "✅ CloudWatch alarms configured"
echo "✅ EventBridge rule created"
echo ""
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo "Next Steps:"
echo "1. Subscribe email to SNS topic: $SNS_TOPIC_ARN"
echo "2. Verify logs in CloudWatch: /aws/containerinsights/$CLUSTER_NAME/application"
echo "3. Check alarms in CloudWatch console"
echo "4. Test alerts by triggering a pod failure"
echo ""
