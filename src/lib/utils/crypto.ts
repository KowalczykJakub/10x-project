/**
 * Cryptographic utility functions
 */

/**
 * Generate SHA-256 hash of a text string
 * Used for creating unique identifiers for source texts without storing the actual content
 *
 * @param text - The text to hash
 * @returns Hexadecimal string representation of the SHA-256 hash
 *
 * @example
 * const hash = await sha256Hash("Hello, World!");
 * // Returns: "dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f"
 */
export async function sha256Hash(text: string): Promise<string> {
  // Encode text as UTF-8
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  // Generate SHA-256 hash
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  // Convert buffer to byte array
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  // Convert bytes to hex string
  const hashHex = hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");

  return hashHex;
}
