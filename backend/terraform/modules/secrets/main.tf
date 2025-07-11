resource "aws_secretsmanager_secret" "openai_api_key" {
  name        = "${var.secret_name}-${var.environment}"
  description = var.description
}

resource "aws_secretsmanager_secret_version" "openai_api_key_v1" {
  secret_id     = aws_secretsmanager_secret.openai_api_key.id
  secret_string = jsonencode({ key = "REPLACE_AFTER_DEPLOY" })

  lifecycle {
    ignore_changes = [secret_string]
  }
}
