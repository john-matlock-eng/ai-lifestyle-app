resource "aws_cognito_user_pool" "main" {
  name = "${var.project}-users-${var.environment}"

  # Password policy
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = true
  }

  # MFA configuration
  mfa_configuration = "OPTIONAL"
  
  software_token_mfa_configuration {
    enabled = true
  }

  # Account recovery
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # Email configuration
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  # Email verification
  auto_verified_attributes = ["email"]
  
  # Username configuration
  username_attributes = ["email"]
  
  # User attribute schema
  schema {
    name                     = "email"
    attribute_data_type     = "String"
    required                = true
    mutable                 = true
    developer_only_attribute = false
    
    string_attribute_constraints {
      min_length = 0
      max_length = 2048
    }
  }
  
  schema {
    name                     = "given_name"
    attribute_data_type     = "String"
    required                = false
    mutable                 = true
    developer_only_attribute = false
    
    string_attribute_constraints {
      min_length = 0
      max_length = 2048
    }
  }
  
  schema {
    name                     = "family_name"
    attribute_data_type     = "String"
    required                = false
    mutable                 = true
    developer_only_attribute = false
    
    string_attribute_constraints {
      min_length = 0
      max_length = 2048
    }
  }

  # Verification message template
  verification_message_template {
    default_email_option = "CONFIRM_WITH_LINK"
    email_subject       = "Verify your email for ${var.project_display_name}"
    email_message       = "Please click the link below to verify your email address. {##Verify Email##}"
  }

  # Device tracking
  device_configuration {
    challenge_required_on_new_device      = false
    device_only_remembered_on_user_prompt = false
  }

  # Lambda triggers (to be added later)
  
  tags = var.tags
}

resource "aws_cognito_user_pool_client" "main" {
  name         = "${var.project}-client-${var.environment}"
  user_pool_id = aws_cognito_user_pool.main.id

  # Token validity
  access_token_validity  = 60  # 1 hour
  id_token_validity      = 60  # 1 hour
  refresh_token_validity = 30  # 30 days
  
  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }

  # Auth flows
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]

  # Prevent user existence errors
  prevent_user_existence_errors = "ENABLED"

  # OAuth settings
  allowed_oauth_flows                  = []
  allowed_oauth_flows_user_pool_client = false
  allowed_oauth_scopes                 = []

  # Attribute read/write permissions
  read_attributes = [
    "email",
    "email_verified",
    "given_name",
    "family_name",
    "phone_number",
    "phone_number_verified",
    "preferred_username",
    "profile",
    "updated_at"
  ]

  write_attributes = [
    "email",
    "given_name",
    "family_name",
    "phone_number",
    "preferred_username",
    "profile",
    "updated_at"
  ]

  # Security
  generate_secret = false

  # Analytics
  enable_token_revocation = true
}

# IAM role for Cognito to send emails via SES (if using SES)
resource "aws_iam_role" "cognito_email" {
  count = var.use_ses_for_email ? 1 : 0
  name  = "${var.project}-cognito-email-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "cognito-idp.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "cognito_email" {
  count = var.use_ses_for_email ? 1 : 0
  name  = "${var.project}-cognito-email-${var.environment}"
  role  = aws_iam_role.cognito_email[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
      }
    ]
  })
}
