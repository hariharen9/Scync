import forge from 'node-forge';

export interface GeneratedSSHKeyPair {
  publicKey: string;
  privateKey: string;
  fingerprint: string;
  type: 'ssh-rsa' | 'ssh-ed25519';
}

/**
 * Packs a string or buffer into an OpenSSH binary string (length + content)
 */
function pack(data: string | Uint8Array): Uint8Array {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const len = bytes.length;
  const res = new Uint8Array(4 + len);
  res[0] = (len >>> 24) & 0xff;
  res[1] = (len >>> 16) & 0xff;
  res[2] = (len >>> 8) & 0xff;
  res[3] = len & 0xff;
  res.set(bytes, 4);
  return res;
}

/**
 * Packs multiple chunks into one Uint8Array
 */
function packAll(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((acc, c) => acc + c.length, 0);
  const res = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    res.set(c, offset);
    offset += c.length;
  }
  return res;
}

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Generates an SSH key pair (RSA-4096 or Ed25519) completely in the browser.
 */
export async function generateSSHKeyPair(
  comment: string = 'scync-generated',
  type: 'rsa' | 'ed25519' = 'rsa'
): Promise<GeneratedSSHKeyPair> {
  if (type === 'rsa') {
    return new Promise((resolve, reject) => {
      forge.pki.rsa.generateKeyPair({ bits: 4096, workers: -1 }, (err, keypair) => {
        if (err) return reject(err);
        const privateKey = forge.pki.privateKeyToPem(keypair.privateKey);
        const publicKey = forge.ssh.publicKeyToOpenSSH(keypair.publicKey, comment);
        const fingerprint = forge.ssh.getPublicKeyFingerprint(keypair.publicKey, {
          encoding: 'hex',
          delimiter: ':'
        });

        resolve({
          publicKey,
          privateKey,
          fingerprint: `MD5:${fingerprint}`,
          type: 'ssh-rsa'
        });
      });
    });
  } else {
    // Generate Ed25519 using Web Crypto
    const keyPair = await window.crypto.subtle.generateKey(
      { name: 'Ed25519' },
      true,
      ['sign', 'verify']
    );

    const pubExport = await window.crypto.subtle.exportKey('raw', keyPair.publicKey);
    const privExport = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
    
    const pubBytes = new Uint8Array(pubExport);
    
    // Format Public Key: ssh-ed25519 <base64> <comment>
    const pubBlob = packAll([
      pack('ssh-ed25519'),
      pack(pubBytes)
    ]);
    const publicKey = `ssh-ed25519 ${toBase64(pubBlob)} ${comment}`;

    // Calculate MD5 Fingerprint for the public key blob
    const md5 = forge.md.md5.create();
    md5.update(forge.util.binary.raw.encode(forge.util.createBuffer(pubBlob)));
    const fingerprint = md5.digest().toHex().match(/.{2}/g)?.join(':');

    // For simplicity, we export the private key in PKCS8 PEM format
    const privBase64 = toBase64(new Uint8Array(privExport));
    const privateKey = `-----BEGIN PRIVATE KEY-----\n${privBase64.match(/.{1,64}/g)?.join('\n')}\n-----END PRIVATE KEY-----`;

    return {
      publicKey,
      privateKey,
      fingerprint: `MD5:${fingerprint}`,
      type: 'ssh-ed25519'
    };
  }
}
