<?php

namespace FivePrayer\Core\API\Traits;

defined('ABSPATH') || exit;

/**
 * Trait EncryptionTrait
 *
 * API keys are no longer stored in a reversible form. A key is stored as
 * `hash_hmac('sha256', $key, wp_salt('auth'))`, which is an indexed, unique
 * lookup value that cannot be turned back into the key — not even by someone
 * who can read the database and wp-config.php.
 *
 * The legacy AES-256-CBC helpers remain for exactly one job: the one-time
 * migration that reads rows written by an older version, hashes the decrypted
 * value and clears the ciphertext. They are never used to write a key again.
 */
trait EncryptionTrait
{
    /**
     * Whether the site has the salts a keyed hash needs.
     *
     * Without AUTH_KEY / SECURE_AUTH_KEY there is no secret to key the hash
     * with and no stable value to derive the legacy encryption key from. The
     * hard-coded fallbacks this trait used to carry made every install share
     * the same secret, so they were removed; creating or migrating keys is
     * refused instead and an admin notice explains what to add to wp-config.php.
     *
     * @return bool
     */
    public function has_encryption_salts(): bool
    {
        return defined('AUTH_KEY')
            && defined('SECURE_AUTH_KEY')
            && '' !== trim((string) constant('AUTH_KEY'))
            && '' !== trim((string) constant('SECURE_AUTH_KEY'));
    }

    /**
     * Hash a plaintext key for storage and lookup.
     *
     * @param string $plaintext Raw key presented by the caller.
     * @return string 64-character lowercase hex digest.
     */
    protected function hash_key(string $plaintext): string
    {
        return hash_hmac('sha256', $plaintext, wp_salt('auth'));
    }

    /**
     * Derive the legacy AES key, used only to read pre-hash rows.
     *
     * Returns an empty string when the salts are missing; decrypt_key() then
     * returns an empty string and the row is left for the admin to regenerate.
     *
     * @return string
     */
    private function derive_encryption_key(): string
    {
        if (!$this->has_encryption_salts()) {
            return '';
        }

        return hash('sha256', constant('AUTH_KEY') . constant('SECURE_AUTH_KEY') . 'fiveprayer-api-key-encryption', true);
    }

    /**
     * Decrypt a row written by an older version.
     *
     * Only the migration path calls this. It returns an empty string for rows
     * it cannot read (legacy SHA-256 hashes, rotated salts, damaged data).
     *
     * @param string $stored Stored ciphertext.
     * @return string Plaintext, or an empty string.
     */
    private function decrypt_key(string $stored): string
    {
        if ('' === $this->encryption_key) {
            return '';
        }

        $data = base64_decode($stored, true);
        if ($data === false) {
            return '';
        }

        $iv_length = openssl_cipher_iv_length(self::CIPHER);
        $iv = substr($data, 0, $iv_length);
        $ciphertext = substr($data, $iv_length);

        return openssl_decrypt($ciphertext, self::CIPHER, $this->encryption_key, OPENSSL_RAW_DATA, $iv) ?: '';
    }
}
