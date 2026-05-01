import forge from 'node-forge';
import type { CertificateInfo } from './types';

/**
 * Parse a PEM-encoded X.509 certificate and extract metadata.
 * All parsing happens client-side — the PEM never leaves the browser.
 */
export function parseCertificatePem(pem: string): CertificateInfo {
  const cert = forge.pki.certificateFromPem(pem);

  const subject = formatDN(cert.subject);
  const issuer = formatDN(cert.issuer);
  const serialNumber = cert.serialNumber;
  const validFrom = cert.validity.notBefore;
  const validTo = cert.validity.notAfter;
  const isSelfSigned = subject === issuer;

  // SHA-256 fingerprint
  const derBytes = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
  const md = forge.md.sha256.create();
  md.update(derBytes);
  const fingerprint = md.digest().toHex().match(/.{2}/g)?.join(':').toUpperCase() || '';

  // Extract Subject Alternative Names
  const hosts = extractSANs(cert);

  return {
    subject,
    issuer,
    serialNumber,
    validFrom,
    validTo,
    isSelfSigned,
    fingerprint,
    hosts,
  };
}

/**
 * Extract Subject Alternative Names (DNS names) from a certificate.
 */
function extractSANs(cert: forge.pki.Certificate): string[] {
  const sans: string[] = [];
  const ext = cert.getExtension('subjectAltName');
  if (ext && (ext as any).altNames) {
    for (const alt of (ext as any).altNames) {
      // type 2 = DNS, type 7 = IP
      if (alt.type === 2 || alt.type === 7) {
        sans.push(alt.value || alt.ip);
      }
    }
  }
  // Fallback: extract CN from subject if no SANs
  if (sans.length === 0) {
    const cn = cert.subject.getField('CN');
    if (cn) sans.push(cn.value);
  }
  return sans;
}

/**
 * Format a Distinguished Name to a human-readable string.
 * Prioritizes CN, falls back to O, then full DN.
 */
function formatDN(dn: forge.pki.Certificate['subject']): string {
  const cn = dn.getField('CN');
  if (cn) return cn.value;
  const o = dn.getField('O');
  if (o) return o.value;
  return dn.attributes.map(a => `${a.shortName}=${a.value}`).join(', ');
}

/**
 * Validate that a private key PEM matches a certificate PEM.
 * Returns true if the public key in the cert matches the private key.
 */
export function validateCertKeyPair(certPem: string, keyPem: string): boolean {
  try {
    const cert = forge.pki.certificateFromPem(certPem);
    const privateKey = forge.pki.privateKeyFromPem(keyPem);

    // Extract modulus from both and compare
    const certPublicKey = cert.publicKey as forge.pki.rsa.PublicKey;
    const rsaPrivateKey = privateKey as forge.pki.rsa.PrivateKey;

    if (certPublicKey.n && rsaPrivateKey.n) {
      return certPublicKey.n.toString(16) === rsaPrivateKey.n.toString(16);
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Detect the type of PEM content: certificate, private key, or unknown.
 */
export function detectPemType(pem: string): 'certificate' | 'private-key' | 'unknown' {
  const trimmed = pem.trim();
  if (trimmed.includes('-----BEGIN CERTIFICATE-----')) return 'certificate';
  if (
    trimmed.includes('-----BEGIN PRIVATE KEY-----') ||
    trimmed.includes('-----BEGIN RSA PRIVATE KEY-----') ||
    trimmed.includes('-----BEGIN EC PRIVATE KEY-----')
  ) return 'private-key';
  return 'unknown';
}
