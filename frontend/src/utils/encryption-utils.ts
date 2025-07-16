// encryption-utils.ts - Utilities for handling encryption in journal entries

/**
 * Detects if content is actually encrypted based on its format.
 * Encrypted content should be base64 encoded and not contain readable text.
 */
export function isContentActuallyEncrypted(content: string): boolean {
  if (!content || content.trim() === '') {
    return false;
  }

  // First, check if it looks like base64
  const base64Regex = /^[A-Za-z0-9+/=]+$/;
  const cleanContent = content.replace(/\s/g, ''); // Remove whitespace
  
  if (!base64Regex.test(cleanContent)) {
    return false; // Not base64, so not encrypted
  }

  // Check if the content looks like plain text (contains common readable patterns)
  const plainTextIndicators = [
    /^#{1,6}\s/m,  // Markdown headers
    /\*\*.*\*\*/,   // Bold text
    /\n---\n/,      // Horizontal rules
    /\b(the|and|or|is|in|to|of|a|an)\b/i, // Common English words
    /[.!?]\s+[A-Z]/, // Sentences
    /\s{2,}/,       // Multiple spaces (not common in base64)
    /\n{2,}/        // Multiple newlines (not common in base64)
  ];

  // If any plain text indicator is found, it's not encrypted
  if (plainTextIndicators.some(pattern => pattern.test(content))) {
    return false;
  }

  // Additional checks for encrypted content
  try {

    // Try to decode - encrypted content should decode to binary data
    const decoded = atob(cleanContent);
    
    // Check if decoded content has high entropy (typical of encrypted data)
    // Plain text usually has printable ASCII characters
    let nonPrintableCount = 0;
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i);
      if (charCode < 32 || charCode > 126) {
        nonPrintableCount++;
      }
    }

    // If more than 30% of characters are non-printable, it's likely encrypted
    return (nonPrintableCount / decoded.length) > 0.3;
  } catch {
    // If decoding fails, it's not valid base64, so not encrypted
    return false;
  }
}

/**
 * Determines if we should treat an entry as encrypted based on both
 * the isEncrypted flag and actual content analysis.
 */
export function shouldTreatAsEncrypted(entry: { 
  isEncrypted: boolean; 
  content: string;
  encryptedKey?: string;
  encryptionIv?: string;
}): boolean {
  // If the flag says it's not encrypted, trust it
  if (!entry.isEncrypted) {
    return false;
  }

  // If we have encryption keys, it's definitely encrypted
  if (entry.encryptedKey && entry.encryptionIv) {
    return true;
  }

  // Otherwise, verify the content actually looks encrypted
  return isContentActuallyEncrypted(entry.content);
}

/**
 * Gets a safe excerpt from content, handling both encrypted and unencrypted content
 */
export function getSafeExcerpt(
  content: string, 
  isEncryptedFlag: boolean, 
  maxLength: number = 150,
  encryptedKey?: string,
  encryptionIv?: string
): string {
  // Check if entry should be treated as encrypted
  const actuallyEncrypted = isEncryptedFlag && (encryptedKey && encryptionIv || isContentActuallyEncrypted(content));
  
  if (actuallyEncrypted) {
    return '🔒 This entry is encrypted. Click to view.';
  }

  // Remove markdown formatting for preview
  const plainText = content
    .replace(/#{1,6}\s/g, '') // Remove headers
    .replace(/\*\*|__/g, '') // Remove bold
    .replace(/\*|_/g, '') // Remove italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
    .replace(/`/g, '') // Remove code
    .replace(/\n{2,}/g, ' ') // Replace multiple newlines
    .replace(/---/g, '') // Remove horizontal rules
    .trim();

  return plainText.length > maxLength 
    ? plainText.substring(0, maxLength) + '...'
    : plainText;
}
