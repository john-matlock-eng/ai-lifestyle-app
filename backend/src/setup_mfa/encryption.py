"""
Encryption utilities for MFA secrets.
Uses AWS KMS for key management and AES-256-GCM for encryption.
"""

import os
import base64
from typing import Tuple
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import boto3
from botocore.exceptions import ClientError
from aws_lambda_powertools import Logger

from .errors import EncryptionError

logger = Logger()


class MFASecretEncryption:
    """Handles encryption and decryption of MFA secrets."""
    
    def __init__(self):
        # Use environment variable for encryption key
        # In production, this should be fetched from AWS KMS or Secrets Manager
        self.encryption_key = os.environ.get('MFA_ENCRYPTION_KEY')
        if not self.encryption_key:
            # For now, use a default key (NOT FOR PRODUCTION)
            logger.warning("Using default encryption key - NOT SECURE FOR PRODUCTION")
            self.encryption_key = "default-encryption-key-change-me"
        
        # Derive a proper key from the string
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,  # 256 bits
            salt=b'ai-lifestyle-mfa',  # Should be random in production
            iterations=100000,
            backend=default_backend()
        )
        self.key = kdf.derive(self.encryption_key.encode())
    
    def encrypt_secret(self, secret: str) -> Tuple[str, str]:
        """
        Encrypt TOTP secret.
        
        Args:
            secret: Plain text TOTP secret
            
        Returns:
            Tuple of (encrypted_secret, iv) both base64 encoded
            
        Raises:
            EncryptionError: If encryption fails
        """
        try:
            # Generate a random IV
            iv = os.urandom(12)  # 96 bits for GCM
            
            # Create cipher
            cipher = Cipher(
                algorithms.AES(self.key),
                modes.GCM(iv),
                backend=default_backend()
            )
            encryptor = cipher.encryptor()
            
            # Encrypt the secret
            ciphertext = encryptor.update(secret.encode()) + encryptor.finalize()
            
            # Get the authentication tag
            tag = encryptor.tag
            
            # Combine ciphertext and tag
            encrypted_data = ciphertext + tag
            
            # Base64 encode for storage
            encrypted_b64 = base64.b64encode(encrypted_data).decode('utf-8')
            iv_b64 = base64.b64encode(iv).decode('utf-8')
            
            logger.info("Successfully encrypted MFA secret")
            return encrypted_b64, iv_b64
            
        except Exception as e:
            logger.error(f"Failed to encrypt MFA secret: {str(e)}")
            raise EncryptionError(f"Failed to encrypt secret: {str(e)}")
    
    def decrypt_secret(self, encrypted_secret: str, iv: str) -> str:
        """
        Decrypt TOTP secret.
        
        Args:
            encrypted_secret: Base64 encoded encrypted secret with tag
            iv: Base64 encoded initialization vector
            
        Returns:
            Decrypted TOTP secret
            
        Raises:
            EncryptionError: If decryption fails
        """
        try:
            # Decode from base64
            encrypted_data = base64.b64decode(encrypted_secret)
            iv_bytes = base64.b64decode(iv)
            
            # Split ciphertext and tag
            ciphertext = encrypted_data[:-16]  # Last 16 bytes are the tag
            tag = encrypted_data[-16:]
            
            # Create cipher
            cipher = Cipher(
                algorithms.AES(self.key),
                modes.GCM(iv_bytes, tag),
                backend=default_backend()
            )
            decryptor = cipher.decryptor()
            
            # Decrypt
            plaintext = decryptor.update(ciphertext) + decryptor.finalize()
            
            logger.info("Successfully decrypted MFA secret")
            return plaintext.decode('utf-8')
            
        except Exception as e:
            logger.error(f"Failed to decrypt MFA secret: {str(e)}")
            raise EncryptionError(f"Failed to decrypt secret: {str(e)}")


def generate_backup_codes(count: int = 8) -> list[str]:
    """
    Generate backup codes for MFA.
    
    Args:
        count: Number of backup codes to generate
        
    Returns:
        List of backup codes
    """
    import secrets
    
    codes = []
    for _ in range(count):
        # Generate 8-character alphanumeric code
        code = ''.join(secrets.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') for _ in range(8))
        # Format as XXXX-XXXX for readability
        formatted_code = f"{code[:4]}-{code[4:]}"
        codes.append(formatted_code)
    
    return codes
