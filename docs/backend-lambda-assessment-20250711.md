backend
├── API_DOCUMENTATION.md
├── API_DOCUMENTATION_V2.md
├── API_GATEWAY_READY.md
├── API_GATEWAY_SETUP.md
├── COMPLETE_FIX_SUMMARY.md
├── DAY1_SUMMARY.md
├── DEPLOYMENT.md
├── DEPLOYMENT_STATUS.md
├── DEPLOYMENT_SUCCESS.md
├── Dockerfile.api-handler
├── Dockerfile.health-check
├── EMAIL_CONFIG_COMPLETE.md
├── EMAIL_FIX_SUMMARY.md
├── EMAIL_TROUBLESHOOTING_GUIDE.md
├── EMAIL_VERIFICATION_CONFIG.md
├── EMAIL_VERIFICATION_FINAL_STATUS.md
├── EMAIL_VERIFICATION_FINAL_SUMMARY.md
├── EMAIL_VERIFICATION_FIX.md
├── EMAIL_VERIFICATION_QUICK_REFERENCE.md
├── EMAIL_VERIFICATION_SUMMARY.md
├── FIRST_DEPLOYMENT.md
├── FRONTEND_INTEGRATION_GUIDE.md
├── GOALS_API_DEPLOYMENT_SUMMARY.md
├── MONITORING_GUIDE.md
├── Makefile
├── NEXT_STEPS_API_GATEWAY.md
├── OPERATIONS_RUNBOOK.md
├── PM_REVIEW_SUMMARY.md
├── READINESS_REPORT.md
├── README.md
├── TERRAFORM_FIX.md
├── TOKEN_REFRESH_FIX.md
├── URGENT_DEPLOY_TOKEN_FIX.md
├── pyproject.toml
├── requirements-dev.txt
├── requirements.txt
├── scripts
│   ├── LOGGING_SECURITY_FIXES.md
│   ├── LOGIN_FIX_SUMMARY.md
│   ├── README.md
│   ├── UPDATE_SUMMARY.md
│   ├── check-deployment-status.sh
│   ├── deploy-lambda.sh
│   ├── deploy-phased.sh
│   └── quick-docker-push.sh
├── setup.cfg
├── src
│   ├── archive_goal
│   │   ├── Dockerfile
backend/terraform/modules/lambda-ecr/outputs.tf:  value       = aws_lambda_function.this.arn
backend/terraform/modules/lambda-ecr/outputs.tf:  value       = aws_lambda_function.this.function_name
backend/terraform/modules/lambda-ecr/outputs.tf:  value       = aws_lambda_function.this.invoke_arn
backend/terraform/modules/lambda-ecr/main.tf:resource "aws_lambda_function" "this" {
backend/terraform/modules/lambda-ecr/main.tf:  function_name    = aws_lambda_function.this.function_name
backend/terraform/services/auth/outputs.tf:    for k, v in aws_apigatewayv2_integration.auth_lambdas : k => v.id
backend/terraform/services/auth/main.tf:resource "aws_apigatewayv2_integration" "auth_lambdas" {
backend/terraform/services/auth/main.tf:  principal     = "apigateway.amazonaws.com"
backend/terraform/modules/api-gateway/outputs.tf:  value       = aws_apigatewayv2_api.this.id
backend/terraform/modules/api-gateway/outputs.tf:  value       = aws_apigatewayv2_stage.default.invoke_url
backend/terraform/modules/api-gateway/outputs.tf:  value       = aws_apigatewayv2_api.this.arn
backend/terraform/modules/api-gateway/outputs.tf:  value       = aws_apigatewayv2_api.this.execution_arn
backend/terraform/modules/api-gateway/outputs.tf:  value       = aws_apigatewayv2_stage.default.id
backend/terraform/modules/api-gateway/outputs.tf:  value       = aws_apigatewayv2_stage.default.name
backend/terraform/modules/api-gateway/outputs.tf:  value       = var.enable_jwt_authorizer ? aws_apigatewayv2_authorizer.jwt[0].id : null
backend/terraform/modules/api-gateway/main.tf:resource "aws_apigatewayv2_api" "this" {
backend/terraform/modules/api-gateway/main.tf:resource "aws_apigatewayv2_stage" "default" {
backend/terraform/modules/api-gateway/main.tf:  api_id      = aws_apigatewayv2_api.this.id
backend/terraform/modules/api-gateway/main.tf:resource "aws_apigatewayv2_integration" "lambda" {
backend/terraform/modules/api-gateway/main.tf:  api_id = aws_apigatewayv2_api.this.id
backend/terraform/modules/api-gateway/main.tf:resource "aws_apigatewayv2_route" "routes" {
backend/terraform/modules/api-gateway/main.tf:  api_id    = aws_apigatewayv2_api.this.id
backend/terraform/modules/api-gateway/main.tf:  target    = "integrations/${aws_apigatewayv2_integration.lambda[0].id}"
backend/terraform/modules/api-gateway/main.tf:  authorizer_id      = lookup(each.value, "authorization_type", "NONE") != "NONE" && var.enable_jwt_authorizer ? aws_apigatewayv2_authorizer.jwt[0].id : null
backend/terraform/modules/api-gateway/main.tf:resource "aws_apigatewayv2_authorizer" "jwt" {
