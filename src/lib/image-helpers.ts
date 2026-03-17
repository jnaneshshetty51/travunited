/**
 * Helper functions for handling images, especially external URLs
 * that might not work with Next.js Image optimization
 */

// List of domains that are known to fail with Next.js Image optimization
// These will use unoptimized mode to prevent 400/404/429 errors
const PROBLEMATIC_DOMAINS = [
  'statemag.state.gov',
  'planetware.com',
  'www.planetware.com',
  // Add more domains here if they don't work with Next.js Image optimization
];

/**
 * Checks if an image URL should use unoptimized mode
 * This is useful for domains that block or don't support Next.js Image optimization
 * 
 * By default, ALL external URLs use unoptimized to prevent 400/429 errors
 */
export function shouldUseUnoptimizedImage(url?: string | null): boolean {
  if (!url) return false;
  
  try {
    const parsed = new URL(url);
    
    // Always use unoptimized for external URLs to prevent 400/429 errors
    // Only optimize images from our own domain (media proxy)
    if (url.includes("/api/media") || url.startsWith("/")) {
      return false; // Our own images can be optimized
    }
    
    // Check if domain is in the problematic list (always use unoptimized)
    const isProblematic = PROBLEMATIC_DOMAINS.some(domain => 
      parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
    );
    
    if (isProblematic) {
      return true;
    }
    
    // For all other external URLs, use unoptimized to prevent rate limiting
    return true;
  } catch {
    // If URL parsing fails, assume it's a relative URL (can be optimized)
    if (!url.startsWith("http")) {
      return false;
    }
    // Invalid or external URL - use unoptimized
    return true;
  }
}

/**
 * Get image props for Next.js Image component
 * Returns configuration based on whether image should be optimized
 */
export function getImageProps(url?: string | null) {
  const useUnoptimized = shouldUseUnoptimizedImage(url);
  
  return {
    unoptimized: useUnoptimized,
  };
}

