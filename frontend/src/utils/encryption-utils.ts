// encryption-utils.ts - Utilities for handling encryption in journal entries

/**
 * Detects if content is actually encrypted based on its format.
 * Encrypted content should be base64 encoded and not contain readable text.
 */
export function isContentActuallyEncrypted(content: string): boolean {
  if (!content || content.trim() === '') {
    return false;
  }

  // Check if the content looks like plain text (contains common readable patterns)
  const plainTextIndicators = [
    /^#{1,6}\s/m,  // Markdown headers
    /\*\*.*\*\*/,   // Bold text
    /\n---\n/,      // Horizontal rules
    /\w{3,}/,       // Words with 3+ characters
    /[.!?]\s+[A-Z]/, // Sentences
    /\s{2,}/,       // Multiple spaces
    /\n{2,}/        // Multiple newlines
  ];

  // If any plain text indicator is found, it's not encrypted
  if (plainTextIndicators.some(pattern => pattern.test(content))) {
    return false;
  }

  // Check if content is valid base64
  try {
    // Base64 regex pattern
    const base64Regex = /^[A-Za-z0-9+/]+=*$/;
    const cleanContent = content.replace(/\s/g, ''); // Remove whitespace
    
    if (!base64Regex.test(cleanContent)) {
      return false;
    }

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
export function shouldTreatAsEncrypted(entry: { isEncrypted: boolean; content: string }): boolean {
  // If the flag says it's not encrypted, trust it
  if (!entry.isEncrypted) {
    return false;
  }

  // If the flag says it's encrypted, verify the content actually is
  return isContentActuallyEncrypted(entry.content);
}

/**
 * Gets a safe excerpt from content, handling both encrypted and unencrypted content
 */
export function getSafeExcerpt(
  content: string, 
  isEncryptedFlag: boolean, 
  maxLength: number = 150
): string {
  // Check if content is actually encrypted
  const actuallyEncrypted = isEncryptedFlag && isContentActuallyEncrypted(content);
  
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
