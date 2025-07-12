"""
Repository layer for user profile data access.
"""

from typing import Optional, Dict, Any
import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
from aws_lambda_powertools import Logger, Tracer

from user_profile_common import DynamoDBUser
from .errors import UserNotFoundError, DatabaseError

logger = Logger()
tracer = Tracer()


class UserRepository:
    """Repository for user data access."""
    
    def __init__(self, table_name: str):
        """
        Initialize user repository.
        
        Args:
            table_name: DynamoDB table name
        """
        self.table_name = table_name
        self.dynamodb = boto3.resource('dynamodb')
        self.table = self.dynamodb.Table(table_name)
        
        logger.info(
            "User repository initialized",
            extra={"table_name": table_name}
        )
    
    @tracer.capture_method
    def get_user_by_id(self, user_id: str) -> DynamoDBUser:
        """
        Get user by ID from DynamoDB.
        
        Args:
            user_id: User ID to lookup
            
        Returns:
            User data model
            
        Raises:
            UserNotFoundError: If user not found
            DatabaseError: If database operation fails
        """
        try:
            # Query using primary key
            response = self.table.get_item(
                Key={
                    'pk': f'USER#{user_id}',
                    'sk': f'USER#{user_id}'
                }
            )
            
            if 'Item' not in response:
                logger.warning(
                    "User not found in database",
                    extra={"user_id": user_id}
                )
                raise UserNotFoundError(
                    f"User with ID {user_id} not found",
                    details={"user_id": user_id}
                )
            
            item = response['Item']
            
            # Convert DynamoDB item to model
            user_data = DynamoDBUser(
                pk=item['pk'],
                sk=item['sk'],
                user_id=item.get('user_id', user_id),
                email=item['email'],
                first_name=item['first_name'],
                last_name=item['last_name'],
                email_verified=item.get('email_verified', False),
                mfa_enabled=item.get('mfa_enabled', False),
                phone_number=item.get('phone_number'),
                date_of_birth=item.get('date_of_birth'),
                timezone=item.get('timezone'),
                preferences=item.get('preferences'),
                created_at=item['created_at'],
                updated_at=item.get('updated_at', item['created_at'])
            )
            
            logger.info(
                "User retrieved successfully",
                extra={
                    "user_id": user_id,
                    "email": user_data.email
                }
            )
            
            return user_data
            
        except UserNotFoundError:
            # Re-raise user not found errors
            raise
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            
            logger.error(
                "DynamoDB client error",
                extra={
                    "error_code": error_code,
                    "error_message": error_message,
                    "user_id": user_id
                }
            )
            
            if error_code == 'ResourceNotFoundException':
                raise DatabaseError(
                    f"Table {self.table_name} not found",
                    details={"table_name": self.table_name}
                )
            else:
                raise DatabaseError(
                    f"Database error: {error_message}",
                    details={"error_code": error_code}
                )
                
        except Exception as e:
            logger.exception(
                "Unexpected error while getting user",
                extra={
                    "error": str(e),
                    "user_id": user_id
                }
            )
            raise DatabaseError(
                "An unexpected database error occurred",
                details={"error": str(e)}
            )
    
    @tracer.capture_method
    def get_user_by_email(self, email: str) -> Optional[DynamoDBUser]:
        """
        Get user by email using GSI.
        
        Args:
            email: Email address to lookup
            
        Returns:
            User data model or None if not found
            
        Raises:
            DatabaseError: If database operation fails
        """
        try:
            # Query using email GSI
            response = self.table.query(
                IndexName='EmailIndex',
                KeyConditionExpression=Key('gsi1_pk').eq(f'EMAIL#{email}')
            )
            
            items = response.get('Items', [])
            if not items:
                return None
            
            # Should only be one user per email
            item = items[0]
            
            # Extract user_id from pk
            user_id = item['pk'].replace('USER#', '')
            
            # Convert to model
            user_data = DynamoDBUser(
                pk=item['pk'],
                sk=item['sk'],
                user_id=user_id,
                email=item['email'],
                first_name=item['first_name'],
                last_name=item['last_name'],
                email_verified=item.get('email_verified', False),
                mfa_enabled=item.get('mfa_enabled', False),
                phone_number=item.get('phone_number'),
                date_of_birth=item.get('date_of_birth'),
                timezone=item.get('timezone'),
                preferences=item.get('preferences'),
                created_at=item['created_at'],
                updated_at=item.get('updated_at', item['created_at'])
            )
            
            return user_data
            
        except ClientError as e:
            logger.error(
                "DynamoDB client error while querying by email",
                extra={
                    "error": str(e),
                    "email": email
                }
            )
            raise DatabaseError(
                "Database query failed",
                details={"error": str(e)}
            )
        except Exception as e:
            logger.exception(
                "Unexpected error while querying by email",
                extra={
                    "error": str(e),
                    "email": email
                }
            )
            raise DatabaseError(
                "An unexpected database error occurred",
                details={"error": str(e)}
            )
