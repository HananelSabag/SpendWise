/**
 * sealedBox.js — browser-side credential encryption for Bank Connect
 *
 * Mirror of spendwise-agent/src/crypto/sealed.js — keep wire formats in sync:
 *   base64( ephemeralPublicKey(32) || nonce(24) || nacl.box ciphertext )
 *
 * The credentials object is encrypted here, IN THE BROWSER, with the
 * scraper agent's public key. The SpendWise server stores the envelope
 * but mathematically cannot open it — only the agent machine can.
 */

import nacl from 'tweetnacl';
import util from 'tweetnacl-util';

const EPK_LEN = nacl.box.publicKeyLength;   // 32
const NONCE_LEN = nacl.box.nonceLength;     // 24

/**
 * Encrypt a credentials object for the agent.
 * @param {object} credentials - e.g. { username, password, nationalID }
 * @param {string} agentPublicKeyB64 - from GET /bank-connections/public-key
 * @returns {string} base64 envelope, safe to POST as encrypted_credentials
 */
export function sealCredentials(credentials, agentPublicKeyB64) {
  const recipientPk = util.decodeBase64(agentPublicKeyB64);
  const eph = nacl.box.keyPair();
  const nonce = nacl.randomBytes(NONCE_LEN);
  const message = util.decodeUTF8(JSON.stringify(credentials));
  const box = nacl.box(message, nonce, recipientPk, eph.secretKey);

  const envelope = new Uint8Array(EPK_LEN + NONCE_LEN + box.length);
  envelope.set(eph.publicKey, 0);
  envelope.set(nonce, EPK_LEN);
  envelope.set(box, EPK_LEN + NONCE_LEN);

  // Best-effort scrub of the ephemeral secret (JS can't guarantee it, but
  // don't leave an obvious reference alive).
  eph.secretKey.fill(0);

  return util.encodeBase64(envelope);
}
