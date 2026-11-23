export interface AceternityProStatus {
  enabled: boolean;
  hasApiKey: boolean;
  hasLicenseKey: boolean;
  registryUrl: string;
}

/**
 * Reads Aceternity UI Pro configuration from environment variables (.env / .env.local).
 * Safe to call on server; on client only exposes public NEXT_PUBLIC_ACETERNITY_PRO_ENABLED flag.
 */
export function getAceternityProStatus(): AceternityProStatus {
  const enabled = process.env.NEXT_PUBLIC_ACETERNITY_PRO_ENABLED !== 'false';
  const hasApiKey = Boolean(
    process.env.ACETERNITY_PRO_API_KEY &&
      process.env.ACETERNITY_PRO_API_KEY !== 'your_aceternity_pro_api_key_here',
  );
  const hasLicenseKey = Boolean(
    process.env.ACETERNITY_PRO_LICENSE_KEY &&
      process.env.ACETERNITY_PRO_LICENSE_KEY !== 'your_aceternity_pro_license_key_here',
  );

  return {
    enabled,
    hasApiKey,
    hasLicenseKey,
    registryUrl: 'https://pro.aceternity.com/registry',
  };
}
