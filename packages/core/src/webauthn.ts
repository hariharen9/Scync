import { importPrfKey, encrypt, decrypt, bufferToBase64Url, base64UrlToBuffer } from './crypto';
import type { EncryptedField } from './types';

export interface BiometricSetupResult {
  credentialId: string;
  salt: string;
  encMasterPassword: EncryptedField;
}

export function isBiometricsSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.PublicKeyCredential);
}

export async function registerBiometrics(
  email: string,
  displayName: string,
  masterPasswordPlain: string
): Promise<BiometricSetupResult> {
  const saltBuffer = crypto.getRandomValues(new Uint8Array(32));
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = crypto.getRandomValues(new Uint8Array(16));

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: challenge.buffer,
      rp: {
        name: "Scync Vault",
        id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname
      },
      user: {
        id: userId.buffer,
        name: email,
        displayName: displayName
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" },  // ES256
        { alg: -257, type: "public-key" } // RS256
      ],
      authenticatorSelection: {
        userVerification: "required", // Force biometrics/PIN
        residentKey: "preferred"
      },
      extensions: {
        prf: {
          eval: {
            first: saltBuffer.buffer
          }
        }
      } as any
    }
  });

  if (!credential) {
    throw new Error("Biometric setup failed or cancelled.");
  }

  // Get PRF results
  const extResults = (credential as any).getClientExtensionResults();
  if (!extResults.prf || !extResults.prf.enabled || !extResults.prf.results || !extResults.prf.results.first) {
    throw new Error("Your browser or device does not support the required Passkey features (PRF extension) for vault encryption.");
  }

  const derivedKeyBuffer = extResults.prf.results.first as ArrayBuffer;
  const kek = await importPrfKey(derivedKeyBuffer);

  // Encrypt the master password with the KEK
  const encMasterPassword = await encrypt(kek, masterPasswordPlain);

  return {
    credentialId: bufferToBase64Url((credential as PublicKeyCredential).rawId),
    salt: bufferToBase64Url(saltBuffer),
    encMasterPassword
  };
}

export async function unlockWithBiometrics(
  credentialIdBase64Url: string,
  saltBase64Url: string,
  encMasterPassword: EncryptedField
): Promise<string> {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const credentialIdBuffer = base64UrlToBuffer(credentialIdBase64Url);
  const saltBuffer = base64UrlToBuffer(saltBase64Url);

  const credential = await navigator.credentials.get({
    publicKey: {
      challenge: challenge.buffer,
      rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
      allowCredentials: [{
        id: credentialIdBuffer,
        type: 'public-key'
      }],
      userVerification: "required",
      extensions: {
        prf: {
          eval: {
            first: saltBuffer
          }
        }
      } as any
    }
  });

  if (!credential) {
    throw new Error("Biometric unlock failed or cancelled.");
  }

  // Get PRF results
  const extResults = (credential as any).getClientExtensionResults();
  if (!extResults.prf || !extResults.prf.results || !extResults.prf.results.first) {
    throw new Error("Failed to derive biometric key. Device may not support PRF.");
  }

  const derivedKeyBuffer = extResults.prf.results.first as ArrayBuffer;
  const kek = await importPrfKey(derivedKeyBuffer);

  // Decrypt the master password
  const masterPasswordPlain = await decrypt(kek, encMasterPassword);
  return masterPasswordPlain;
}
