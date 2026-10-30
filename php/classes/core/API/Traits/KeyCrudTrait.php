<?php

namespace FivePrayer\Core\API\Traits;

defined('ABSPATH') || exit;

/**
 * Trait KeyCrudTrait
 *
 * Contract for the API key CRUD surface.
 *
 * History: this trait used to carry a full second implementation of every CRUD
 * method. Class members take precedence over trait members in PHP, and
 * ApiKeyManager declares all of those methods itself, so the copies here were
 * unreachable and drifted out of sync with the real implementation. The
 * implementation now lives in ApiKeyManager only; this trait keeps the shape of
 * the interface so consumers (and the key management admin screens) can rely on
 * it without executing SQL.
 */
trait KeyCrudTrait
{
    abstract protected function table_exists(): bool;
    abstract protected function encrypt_key(string $plaintext): string;
    abstract protected function decrypt_key(string $stored): string;

    /*
     * The fp_api_keys table name constant lives on ApiKeyManager, not here:
     * constants inside traits are only allowed from PHP 8.2 onward, and this
     * plugin supports PHP 7.4.
     */
}
