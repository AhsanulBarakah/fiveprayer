<?php

namespace FivePrayer\Core\API\Traits;

defined('ABSPATH') || exit;

/**
 * Trait EncryptionTrait
 *
 * Handles API key encryption/decryption using AES-256-CBC.
 * Extracted from ApiKeyManager for code organization.
 */
trait EncryptionTrait
{
    /**
     * Derive a site-specific encryption key from WordPress salts.
     */
    private function derive_encryption_key(): string
    {
        $salt = defined('AUTH_KEY') ? AUTH_KEY : 'fiveprayer-default-salt';
        $secure_salt = defined('SECURE_AUTH_KEY') ? SECURE_AUTH_KEY : 'fiveprayer-secure-salt';
        return hash('sha256', $salt . $secure_salt . 'fiveprayer-api-key-encryption', true);
    }

    /**
     * Encrypt a plaintext API key for storage.
     */
    private function encrypt_key(string $plaintext): string
    {
        $iv_length = openssl_cipher_iv_length(self::CIPHER);
        $iv = openssl_random_pseudo_bytes($iv_length);
        $ciphertext = openssl_encrypt($plaintext, self::CIPHER, $this->encryption_key, OPENSSL_RAW_DATA, $iv);
        return base64_encode($iv . $ciphertext);
    }

    /**
     * Decrypt a stored API key back to plaintext.
     */
    private function decrypt_key(string $stored): string
    {
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
