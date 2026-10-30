jQuery(document).ready(function($) {
    'use strict';

    // Translator function from WordPress core. The script is enqueued with
    // wp-i18n as a dependency, so window.wp.i18n is always present here.
    const { __ } = wp.i18n;

    // ===== Shared Modal Functions =====

    let modalResolve = null;

    function showConfirmModal(title, message) {
        return new Promise(function(resolve) {
            modalResolve = resolve;
            $('#fiveprayer-modal-title').text(title);
            $('#fiveprayer-modal-message').text(message);
            $('#fiveprayer-confirm-modal').css('display', 'block');
        });
    }

    function hideConfirmModal() {
        $('#fiveprayer-confirm-modal').css('display', 'none');
        modalResolve = null;
    }

    // Confirm modal close buttons
    $('#fiveprayer-modal-close, #fiveprayer-modal-cancel').on('click', function() {
        if (modalResolve) modalResolve(false);
        hideConfirmModal();
    });
    $('#fiveprayer-modal-confirm').on('click', function() {
        if (modalResolve) modalResolve(true);
        hideConfirmModal();
    });
    $(window).on('click', function(e) {
        if ($(e.target).hasClass('fiveprayer-modal')) {
            if (modalResolve) modalResolve(false);
            hideConfirmModal();
        }
    });

    // ===== Detail / Edit Modal =====

    let currentEditKeyId = null;
    let isEditMode = false;

    function openDetailModal(keyId, editMode) {
        currentEditKeyId = keyId;
        isEditMode = false;

        $('#fiveprayer-detail-title').text(editMode ? __('Loading...', 'fiveprayer') : __('API Key Details', 'fiveprayer'));
        $('#fiveprayer-detail-body').html('<div class="fiveprayer-detail-loading"><span class="fiveprayer-loading"></span> ' + __('Loading...', 'fiveprayer') + '</div>');
        $('#fiveprayer-detail-edit').hide();
        $('#fiveprayer-detail-save').hide();
        $('#fiveprayer-detail-cancel').text(__('Close', 'fiveprayer'));
        $('#fiveprayer-key-detail-modal').css('display', 'block');

        $.ajax({
            url: fpApiAdmin.ajaxUrl,
            type: 'POST',
            data: {
                action: 'fp_api_get_key',
                nonce: fpApiAdmin.nonce,
                key_id: keyId
            },
            success: function(response) {
                if (response.success) {
                    if (editMode) {
                        renderEditForm(response.data);
                    } else {
                        renderDetailView(response.data);
                    }
                } else {
                    $('#fiveprayer-detail-body').html('<div class="fiveprayer-detail-error">' + (response.data.message || __('Failed to load key details.', 'fiveprayer')) + '</div>');
                }
            },
            error: function() {
                $('#fiveprayer-detail-body').html('<div class="fiveprayer-detail-error">' + __('An error occurred while loading key details.', 'fiveprayer') + '</div>');
            }
        });
    }

    function renderDetailView(data) {
        const isExpired = data.is_expired;
        let statusBadge = '';
        if (isExpired) {
            statusBadge = '<span class="fiveprayer-status fiveprayer-status-expired">' + __('Expired', 'fiveprayer') + '</span>';
        } else if (data.status === 'active') {
            statusBadge = '<span class="fiveprayer-status fiveprayer-status-active">' + __('Active', 'fiveprayer') + '</span>';
        } else {
            statusBadge = '<span class="fiveprayer-status fiveprayer-status-inactive">' + data.status.charAt(0).toUpperCase() + data.status.slice(1) + '</span>';
        }

        const html = [
            '<div class="fiveprayer-detail-sections">',
            '  <div class="fiveprayer-detail-section">',
            '    <div class="fiveprayer-detail-row">',
            '      <span class="fiveprayer-detail-label">' + __('Name', 'fiveprayer') + '</span>',
            '      <span class="fiveprayer-detail-value fiveprayer-detail-name-value">' + escHtml(data.name) + '</span>',
            '    </div>',
            '    <div class="fiveprayer-detail-row">',
            '      <span class="fiveprayer-detail-label">' + __('Description', 'fiveprayer') + '</span>',
            '      <span class="fiveprayer-detail-value fiveprayer-detail-desc-value">' + (escHtml(data.description) || '<em>' + __('No description', 'fiveprayer') + '</em>') + '</span>',
            '    </div>',
            '    <div class="fiveprayer-detail-row">',
            '      <span class="fiveprayer-detail-label">' + __('Status', 'fiveprayer') + '</span>',
            '      <span class="fiveprayer-detail-value">' + statusBadge + '</span>',
            '    </div>',
            '    <div class="fiveprayer-detail-row">',
            '      <span class="fiveprayer-detail-label">' + __('Created', 'fiveprayer') + '</span>',
            '      <span class="fiveprayer-detail-value">' + escHtml(data.created_at) + '</span>',
            '    </div>',
            '    <div class="fiveprayer-detail-row">',
            '      <span class="fiveprayer-detail-label">' + __('Expires', 'fiveprayer') + '</span>',
            '      <span class="fiveprayer-detail-value">' + escHtml(data.expires_at) + '</span>',
            '    </div>',
            '    <div class="fiveprayer-detail-row">',
            '      <span class="fiveprayer-detail-label">' + __('Last Used', 'fiveprayer') + '</span>',
            '      <span class="fiveprayer-detail-value">' + escHtml(data.last_used) + '</span>',
            '    </div>',
            '    <div class="fiveprayer-detail-row">',
            '      <span class="fiveprayer-detail-label">' + __('Usage', 'fiveprayer') + '</span>',
            '      <span class="fiveprayer-detail-value">' + escHtml(data.usage_count) + ' ' + __('calls', 'fiveprayer') + '</span>',
            '    </div>',
            '  </div>',
            '  <div class="fiveprayer-detail-section">',
            '    <h4>' + __('Permissions & Restrictions', 'fiveprayer') + '</h4>',
            '    <div class="fiveprayer-detail-row">',
            '      <span class="fiveprayer-detail-label">' + __('Allowed Domains', 'fiveprayer') + '</span>',
            '      <span class="fiveprayer-detail-value fiveprayer-detail-domains-value">' + (escHtml(data.allowed_domains) || '<em>' + __('None (all domains)', 'fiveprayer') + '</em>') + '</span>',
            '    </div>',
            '    <div class="fiveprayer-detail-row">',
            '      <span class="fiveprayer-detail-label">' + __('Allowed IPs', 'fiveprayer') + '</span>',
            '      <span class="fiveprayer-detail-value fiveprayer-detail-ips-value">' + (escHtml(data.allowed_ips) || '<em>' + __('None (all IPs)', 'fiveprayer') + '</em>') + '</span>',
            '    </div>',
            '    <div class="fiveprayer-detail-row">',
            '      <span class="fiveprayer-detail-label">' + __('Allowed Endpoints', 'fiveprayer') + '</span>',
            '      <span class="fiveprayer-detail-value fiveprayer-detail-endpoints-value">' + (escHtml(data.allowed_endpoints) || '<em>' + __('None (all endpoints)', 'fiveprayer') + '</em>') + '</span>',
            '    </div>',
            '    <div class="fiveprayer-detail-row">',
            '      <span class="fiveprayer-detail-label">' + __('Rate Limit', 'fiveprayer') + '</span>',
            '      <span class="fiveprayer-detail-value fiveprayer-detail-rate-value">' + escHtml(data.rate_limit) + ' ' + __('per hour', 'fiveprayer') + '</span>',
            '    </div>',
            '  </div>',
            '</div>'
        ].join('\n');

        $('#fiveprayer-detail-body').html(html);
        $('#fiveprayer-detail-title').text(__('API Key:', 'fiveprayer') + ' ' + data.name);
        $('#fiveprayer-detail-edit').show().data('data', data);
        $('#fiveprayer-detail-save').hide();
        $('#fiveprayer-detail-cancel').text(__('Close', 'fiveprayer'));
    }

    function renderEditForm(data) {
        var today = new Date();
        var tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        var minDateStr = tomorrow.toISOString().split('T')[0];

        var expiresRaw = data.expires_raw || '';

        var html = [
            '<div class="fiveprayer-detail-sections">',
            '  <div class="fiveprayer-detail-section">',
            '    <h4>' + __('Basic Information', 'fiveprayer') + '</h4>',
            '    <div class="fiveprayer-form-group">',
            '      <label for="edit-key-name" class="fiveprayer-form-label">',
            '        <span>' + __('Key Name', 'fiveprayer') + '</span>',
            '        <span class="fiveprayer-form-required" aria-label="' + escAttr(__('required', 'fiveprayer')) + '">*</span>',
            '      </label>',
            '      <input type="text" id="edit-key-name" class="fiveprayer-edit-input" value="' + escAttr(data.name) + '" required>',
            '    </div>',
            '    <div class="fiveprayer-form-group">',
            '      <label for="edit-key-desc" class="fiveprayer-form-label">',
            '        <span>' + __('Description', 'fiveprayer') + '</span>',
            '      </label>',
            '      <textarea id="edit-key-desc" class="fiveprayer-edit-input" rows="2">' + escAttr(data.description) + '</textarea>',
            '    </div>',
            '    <div class="fiveprayer-form-group">',
            '      <label for="edit-key-expires" class="fiveprayer-form-label">',
            '        <span>' + __('Expires On', 'fiveprayer') + '</span>',
            '        <span class="fiveprayer-toggle-hint" title="' + escAttr(__('Optional expiration date. After this date, the key is automatically rejected. Leave empty for no expiration.', 'fiveprayer')) + '">i</span>',
            '      </label>',
            '      <input type="date" id="edit-key-expires" class="fiveprayer-edit-input" value="' + escAttr(expiresRaw) + '" min="' + minDateStr + '">',
            '    </div>',
            '  </div>',
            '  <div class="fiveprayer-detail-section">',
            '    <h4>' + __('Permissions & Restrictions', 'fiveprayer') + '</h4>',
            '    <div class="fiveprayer-form-group">',
            '      <label for="edit-allowed-domains" class="fiveprayer-form-label">',
            '        <span>' + __('Allowed Domains', 'fiveprayer') + '</span>',
            '        <span class="fiveprayer-toggle-hint" title="' + escAttr(__('Comma-separated domains. Use * for wildcard. Leave empty to allow all domains.', 'fiveprayer')) + '">i</span>',
            '      </label>',
            '      <input type="text" id="edit-allowed-domains" class="fiveprayer-edit-input" value="' + escAttr(data.allowed_domains) + '" placeholder="example.com, *.example.org">',
            '    </div>',
            '    <div class="fiveprayer-form-group">',
            '      <label for="edit-allowed-ips" class="fiveprayer-form-label">',
            '        <span>' + __('Allowed IPs', 'fiveprayer') + '</span>',
            '        <span class="fiveprayer-toggle-hint" title="' + escAttr(__('Comma-separated IPs or CIDR ranges. Leave empty to allow all IPs.', 'fiveprayer')) + '">i</span>',
            '      </label>',
            '      <input type="text" id="edit-allowed-ips" class="fiveprayer-edit-input" value="' + escAttr(data.allowed_ips) + '" placeholder="192.168.1.1, 10.0.0.0/24">',
            '    </div>',
            '    <div class="fiveprayer-form-group">',
            '      <label for="edit-allowed-endpoints" class="fiveprayer-form-label">',
            '        <span>' + __('Allowed Endpoints', 'fiveprayer') + '</span>',
            '        <span class="fiveprayer-toggle-hint" title="' + escAttr(__('Comma-separated endpoint slugs to allow. Leave empty to allow all endpoints.', 'fiveprayer')) + '">i</span>',
            '      </label>',
            '      <input type="text" id="edit-allowed-endpoints" class="fiveprayer-edit-input" value="' + escAttr(data.allowed_endpoints) + '" placeholder="prayer-times, next-prayer">',
            '    </div>',
            '    <div class="fiveprayer-form-group">',
            '      <label for="edit-rate-limit" class="fiveprayer-form-label">',
            '        <span>' + __('Rate Limit Per Hour', 'fiveprayer') + '</span>',
            '        <span class="fiveprayer-toggle-hint" title="' + escAttr(__('Maximum number of API requests per hour for this key. Default: 1000.', 'fiveprayer')) + '">i</span>',
            '      </label>',
            '      <input type="number" id="edit-rate-limit" class="fiveprayer-edit-input" value="' + escAttr(data.rate_limit) + '" min="1" max="100000">',
            '    </div>',
            '  </div>',
            '</div>'
        ].join('\n');

        $('#fiveprayer-detail-body').html(html);
        $('#fiveprayer-detail-title').text(__('Edit API Key:', 'fiveprayer') + ' ' + data.name);
        $('#fiveprayer-detail-edit').hide();
        $('#fiveprayer-detail-save').show();
        $('#fiveprayer-detail-cancel').text(__('Cancel', 'fiveprayer'));
        isEditMode = true;

        // Validate expiration date
        $('#edit-key-expires').on('change', function() {
            var val = $(this).val();
            var checkDate = new Date(tomorrow);
            checkDate.setDate(checkDate.getDate());
            if (val && new Date(val) < checkDate) {
                $(this).val('');
                showToast(__('Expiration date must be at least one day in the future.', 'fiveprayer'), 'error');
            }
        });

    }

    function saveEdit() {
        var keyId = currentEditKeyId;
        if (!keyId) return;

        var name = $('#edit-key-name').val().trim();
        if (!name) {
            showToast(__('Key name is required.', 'fiveprayer'), 'error');
            $('#edit-key-name').focus();
            return;
        }

        var $btn = $('#fiveprayer-detail-save');
        $btn.prop('disabled', true).html('<span class="fiveprayer-loading"></span> ' + __('Saving...', 'fiveprayer'));

        $.ajax({
            url: fpApiAdmin.ajaxUrl,
            type: 'POST',
            data: {
                action: 'fp_api_update_key',
                nonce: fpApiAdmin.nonce,
                key_id: keyId,
                name: name,
                description: $('#edit-key-desc').val(),
                expires_at: $('#edit-key-expires').val(),
                allowed_domains: $('#edit-allowed-domains').val(),
                allowed_ips: $('#edit-allowed-ips').val(),
                allowed_endpoints: $('#edit-allowed-endpoints').val(),
                rate_limit: $('#edit-rate-limit').val(),
            },
            success: function(response) {
                $btn.prop('disabled', false).text(__('Save Changes', 'fiveprayer'));
                if (response.success) {
                    showToast(response.data.message, 'success');
                    location.reload();
                } else {
                    showToast(response.data.message, 'error');
                }
            },
            error: function() {
                $btn.prop('disabled', false).text(__('Save Changes', 'fiveprayer'));
                showToast(__('An error occurred while saving.', 'fiveprayer'), 'error');
            }
        });
    }

    function closeDetailModal() {
        $('#fiveprayer-key-detail-modal').css('display', 'none');
        currentEditKeyId = null;
        isEditMode = false;
    }

    // Detail modal event handlers
    $('#fiveprayer-detail-close, #fiveprayer-detail-cancel').on('click', function() {
        if (isEditMode) {
            if (currentEditKeyId) {
                openDetailModal(currentEditKeyId);
            }
            return;
        }
        closeDetailModal();
    });

    $('#fiveprayer-detail-edit').on('click', function() {
        var data = $(this).data('data');
        if (data) {
            renderEditForm(data);
        }
    });

    $('#fiveprayer-detail-save').on('click', saveEdit);

    $(window).on('click', function(e) {
        if ($(e.target).hasClass('fiveprayer-modal') && $(e.target).attr('id') === 'fiveprayer-key-detail-modal') {
            if (!isEditMode) {
                closeDetailModal();
            }
        }
    });

    // ===== Open detail modal from list =====
    $(document).on('click', '.fiveprayer-key-name-link, .fiveprayer-view-key', function(e) {
        e.preventDefault();
        var keyId = $(this).data('id');
        if (keyId) {
            openDetailModal(keyId);
        }
    });

    // ===== Open edit mode directly =====
    $(document).on('click', '.fiveprayer-edit-key', function(e) {
        e.preventDefault();
        var keyId = $(this).data('id');
        if (keyId) {
            openDetailModal(keyId, true);
        }
    });

    // ===== Create new API key =====
    $('#fiveprayer-create-key-form').on('submit', function(e) {
        e.preventDefault();

        var $form = $(this);
        var $result = $('#fiveprayer-create-result');
        var $submitBtn = $form.find('button[type="submit"]');

        $submitBtn.prop('disabled', true).html('<span class="fiveprayer-loading"></span> ' + __('Creating...', 'fiveprayer'));
        $result.hide();

        $.ajax({
            url: fpApiAdmin.ajaxUrl,
            type: 'POST',
            data: {
                action: 'fp_api_create_key',
                nonce: fpApiAdmin.nonce,
                name: $('#key-name').val(),
                description: $('#key-description').val(),
                expires_at: $('#key-expires').val(),
                key_prefix: $('#key-prefix').val() || 'fp_',
                allowed_domains: $('#allowed-domains').val(),
                allowed_ips: $('#allowed-ips').val(),
                allowed_endpoints: $('#allowed-endpoints').val(),
                rate_limit: $('#rate-limit').val(),
            },
            success: function(response) {
                if (response.success) {
                    var apiKey = response.data.api_key;
                    var copyBtn = '<button type="button" class="fiveprayer-btn fiveprayer-btn-primary fiveprayer-copy-new-key" style="margin-left: 10px; padding: 5px 10px; font-weight: bold;">' + __('Copy Key', 'fiveprayer') + '</button>';
                    var keyInput = '<input type="text" id="fiveprayer-new-api-key" value="' + apiKey + '" style="position: absolute; left: -9999px;" readonly>';

                    $result.removeClass('error').addClass('success').html(
                        '<strong>' + response.data.message + '</strong><br>' +
                        '<strong>' + __('API Key:', 'fiveprayer') + '</strong> <code id="fiveprayer-display-key">' + apiKey + '</code>' + copyBtn + keyInput + '<br>' +
                        '<small>' + response.data.name + '</small>'
                    ).show();

                    $form[0].reset();
                    showToast(response.data.message, 'success');

                    setTimeout(function() {
                        location.reload();
                    }, 10000);
                } else {
                    $result.removeClass('success').addClass('error')
                        .text(response.data.message)
                        .show();
                    showToast(response.data.message, 'error');
                }
            },
            error: function() {
                $result.removeClass('success').addClass('error')
                    .text(__('An error occurred while creating the API key.', 'fiveprayer'))
                    .show();
                showToast(__('An error occurred while creating the API key.', 'fiveprayer'), 'error');
            },
            complete: function() {
                $submitBtn.prop('disabled', false).text(__('Generate API Key', 'fiveprayer'));
            }
        });
    });

    // ===== Copy API Key (fetches from server via AJAX, copies to clipboard) =====
    $(document).on('click', '.fiveprayer-copy-key, .fiveprayer-btn-copy-masked, .fiveprayer-copy-new-key', function() {
        var $btn = $(this);
        var keyId = $btn.data('id');
        var $newKeyInput = $('#fiveprayer-new-api-key');

        // If .fiveprayer-copy-new-key and the hidden input exists, copy directly from the page
        if ($btn.hasClass('fiveprayer-copy-new-key') && $newKeyInput.length) {
            copyToClipboard($newKeyInput.val(), __('API key copied to clipboard!', 'fiveprayer'), __('Failed to copy API key', 'fiveprayer'));
            return;
        }

        // Otherwise fetch from server (for masked keys in the list)
        if (!keyId) {
            showToast(__('Unable to identify the key to copy.', 'fiveprayer'), 'error');
            return;
        }

        var originalHtml = $btn.html();
        $btn.prop('disabled', true).html('<span class="fiveprayer-loading"></span>');

        $.ajax({
            url: fpApiAdmin.ajaxUrl,
            type: 'POST',
            data: {
                action: 'fp_api_copy_key',
                nonce: fpApiAdmin.nonce,
                key_id: keyId
            },
            success: function(response) {
                $btn.prop('disabled', false).html(originalHtml);
                if (response.success && response.data.api_key) {
                    copyToClipboard(response.data.api_key, __('API key copied to clipboard!', 'fiveprayer'), __('Failed to copy API key', 'fiveprayer'));
                } else {
                    showToast(response.data.message || __('Failed to retrieve API key', 'fiveprayer'), 'error');
                }
            },
            error: function() {
                $btn.prop('disabled', false).html(originalHtml);
                showToast(__('An error occurred while fetching the API key.', 'fiveprayer'), 'error');
            }
        });
    });

    // ===== Revoke API key =====
    $(document).on('click', '.fiveprayer-revoke-key', async function() {
        var $btn = $(this);
        var keyId = $btn.data('id');
        var keyName = $btn.closest('.fiveprayer-key-card').find('.fiveprayer-key-name-link strong').text();

        var confirmed = await showConfirmModal(__('Revoke API Key', 'fiveprayer'), fpApiAdmin.confirmRevoke + '\n\n' + keyName);
        if (!confirmed) return;

        $.ajax({
            url: fpApiAdmin.ajaxUrl,
            type: 'POST',
            data: {
                action: 'fp_api_revoke_key',
                nonce: fpApiAdmin.nonce,
                key_id: keyId
            },
            success: function(response) {
                if (response.success) {
                    showToast(response.data.message, 'success');
                    location.reload();
                } else {
                    showToast(response.data.message, 'error');
                }
            },
            error: function() {
                showToast(__('An error occurred while revoking the API key.', 'fiveprayer'), 'error');
            }
        });
    });

    // Unrevoke
    $(document).on('click', '.fiveprayer-unrevoke-key', async function() {
        var $btn = $(this);
        var keyId = $btn.data('id');
        var keyName = $btn.closest('.fiveprayer-key-card').find('.fiveprayer-key-name-link strong').text();

        var confirmed = await showConfirmModal(__('Restore API Key', 'fiveprayer'), __('Are you sure you want to restore this API key?', 'fiveprayer') + '\n\n' + keyName);
        if (!confirmed) return;

        $.ajax({
            url: fpApiAdmin.ajaxUrl,
            type: 'POST',
            data: {
                action: 'fp_api_unrevoke_key',
                nonce: fpApiAdmin.nonce,
                key_id: keyId
            },
            success: function(response) {
                if (response.success) {
                    showToast(response.data.message, 'success');
                    location.reload();
                } else {
                    showToast(response.data.message, 'error');
                }
            },
            error: function() {
                showToast(__('An error occurred while restoring the API key.', 'fiveprayer'), 'error');
            }
        });
    });

    // Regenerate
    $(document).on('click', '.fiveprayer-regenerate-key', async function() {
        var $btn = $(this);
        var keyId = $btn.data('id');
        var keyName = $btn.closest('.fiveprayer-key-card').find('.fiveprayer-key-name-link strong').text();

        var confirmed = await showConfirmModal(__('Regenerate API Key', 'fiveprayer'), __('This will create a new API key. The old key will no longer work.', 'fiveprayer') + '\n\n' + keyName);
        if (!confirmed) return;

        $.ajax({
            url: fpApiAdmin.ajaxUrl,
            type: 'POST',
            data: {
                action: 'fp_api_regenerate_key',
                nonce: fpApiAdmin.nonce,
                key_id: keyId
            },
            success: function(response) {
                if (response.success) {
                    var apiKey = response.data.api_key;
                    var copyBtn = '<button type="button" class="fiveprayer-btn fiveprayer-btn-primary fiveprayer-copy-new-key" style="margin-left: 10px; padding: 5px 10px; font-weight: bold;">' + __('Copy Key', 'fiveprayer') + '</button>';
                    var keyInput = '<input type="text" id="fiveprayer-new-api-key" value="' + apiKey + '" style="position: absolute; left: -9999px;" readonly>';

                    $('#fiveprayer-create-result').removeClass('error').addClass('success').html(
                        '<strong>' + response.data.message + '</strong><br>' +
                        '<strong>' + __('New API Key:', 'fiveprayer') + '</strong> <code id="fiveprayer-display-key">' + apiKey + '</code>' + copyBtn + keyInput + '<br>'
                    ).show();

                    showToast(response.data.message, 'success');

                    setTimeout(function() {
                        location.reload();
                    }, 10000);
                } else {
                    showToast(response.data.message, 'error');
                }
            },
            error: function() {
                showToast(__('An error occurred while regenerating the API key.', 'fiveprayer'), 'error');
            }
        });
    });

    // Delete
    $(document).on('click', '.fiveprayer-delete-key', async function() {
        var $btn = $(this);
        var keyId = $btn.data('id');
        var keyName = $btn.closest('.fiveprayer-key-card').find('.fiveprayer-key-name-link strong').text();

        var confirmed = await showConfirmModal(__('Delete API Key', 'fiveprayer'), fpApiAdmin.confirmDelete + '\n\n' + keyName);
        if (!confirmed) return;

        $.ajax({
            url: fpApiAdmin.ajaxUrl,
            type: 'POST',
            data: {
                action: 'fp_api_delete_key',
                nonce: fpApiAdmin.nonce,
                key_id: keyId
            },
            success: function(response) {
                if (response.success) {
                    showToast(response.data.message, 'success');
                    location.reload();
                } else {
                    showToast(response.data.message, 'error');
                }
            },
            error: function() {
                showToast(__('An error occurred while deleting the API key.', 'fiveprayer'), 'error');
            }
        });
    });

    // ===== Legacy Key Migration =====
    $(document).on('click', '#fiveprayer-migrate-legacy-keys', function() {
        var $btn = $(this);
        var $status = $('#fiveprayer-migrate-status');

        $btn.prop('disabled', true).text(__('Regenerating...', 'fiveprayer'));
        $status.text(__('Processing...', 'fiveprayer')).css('display', 'inline');

        $.ajax({
            url: fpApiAdmin.ajaxUrl,
            type: 'POST',
            data: {
                action: 'fp_api_migrate_legacy_keys',
                nonce: fpApiAdmin.nonce
            },
            success: function(response) {
                $btn.prop('disabled', false).text(__('Regenerate Legacy Keys Now', 'fiveprayer'));

                if (response.success) {
                    var migrated = response.data.migrated || [];
                    var html = '<div class="fiveprayer-result success">' +
                        '<strong>' + response.data.message + '</strong>';

                    if (migrated.length > 0) {
                        html += '<ul style="margin-top: 8px;">';
                        migrated.forEach(function(item) {
                            html += '<li style="margin-bottom: 4px;">' +
                                '<strong>' + escHtml(item.name) + ':</strong> ' +
                                '<code style="background: #f5f5f5; padding: 1px 5px;">' + escHtml(item.new_key) + '</code>' +
                                ' <button type="button" class="fiveprayer-btn fiveprayer-btn-xs fiveprayer-btn-copy-key-migrated" ' +
                                'data-key="' + escAttr(item.new_key) + '" style="font-weight: bold;">' + __('Copy', 'fiveprayer') + '</button>' +
                                '</li>';
                        });
                        html += '</ul>';

                    }

                    html += '</div>';
                    $('#fiveprayer-legacy-migration-result').html(html).show();
                    $status.text(__('Complete!', 'fiveprayer')).css('color', '#28a745');
                    showToast(response.data.message, 'success');

                    // Reload after a delay to refresh the list
                    setTimeout(function() {
                        location.reload();
                    }, 10000);
                } else {
                    $status.text(__('Failed', 'fiveprayer')).css('color', '#dc3545');
                    showToast(response.data.message || __('Migration failed.', 'fiveprayer'), 'error');
                    $('#fiveprayer-legacy-migration-result').html(
                        '<div class="fiveprayer-result error">' + (response.data.message || __('An error occurred during migration.', 'fiveprayer')) + '</div>'
                    ).show();
                }
            },
            error: function() {
                $btn.prop('disabled', false).text(__('Regenerate Legacy Keys Now', 'fiveprayer'));
                $status.text(__('Error', 'fiveprayer')).css('color', '#dc3545');
                showToast(__('An error occurred during migration.', 'fiveprayer'), 'error');
            }
        });
    });

    // Copy migrated key
    $(document).on('click', '.fiveprayer-btn-copy-key-migrated', function() {
        var apiKey = $(this).data('key');
        copyToClipboard(apiKey, __('API key copied to clipboard!', 'fiveprayer'), __('Failed to copy API key', 'fiveprayer'));
    });

    // ===== Toast notification =====
    function showToast(message, type) {
        var $toast = $('<div class="fiveprayer-toast ' + type + '">' + message + '</div>');
        $('body').append($toast);
        setTimeout(function() {
            $toast.addClass('show');
        }, 100);
        setTimeout(function() {
            $toast.removeClass('show');
            setTimeout(function() {
                $toast.remove();
            }, 300);
        }, 3000);
    }

    // ===== Utility: escape HTML =====
    function escHtml(str) {
        if (!str) return '';
        return $('<span>').text(str).html();
    }

function escAttr(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

    function copyToClipboard(text, successMsg, errorMsg) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function() {
                showToast(successMsg, 'success');
            }).catch(function() {
                showToast(errorMsg, 'error');
            });
        } else {
            var textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                showToast(successMsg, 'success');
            } catch (err) {
                showToast(errorMsg, 'error');
            }
            document.body.removeChild(textArea);
        }
    }

    // ===== Subject live preview =====
    function updateSubjectPreview() {
        var $input = $('#brute-force-subject');
        var $preview = $('#fiveprayer-subject-preview');
        var $realPreview = $('#fiveprayer-subject-preview-real');
        var $testPreview = $('#fiveprayer-subject-preview-test');
        var val = $input.val().trim();
        var siteName = fpApiAdmin.siteName || '';

        if (!val) {
            $preview.addClass('is-empty');
            $realPreview.text(fpApiAdmin.defaultSubject || '');
            $testPreview.text(fpApiAdmin.defaultTestSubject || '');
        } else {
            $preview.removeClass('is-empty');
            var processed = val.replace(/{sitename}/gi, function() { return siteName; });
            $realPreview.text(processed);
            $testPreview.text(__('[TEST]', 'fiveprayer') + ' ' + processed);
        }
    }

    $('#brute-force-subject').on('input', updateSubjectPreview);
    updateSubjectPreview();

    // Auto-hide success messages
    $('.fiveprayer-result.success').each(function() {
        var $result = $(this);
        setTimeout(function() {
            $result.fadeOut();
        }, 5000);
    });

    // Expiration date validation
    $('#key-expires').on('change', function() {
        var selectedDate = $(this).val();
        var today = new Date();
        var minDate = new Date(today.setDate(today.getDate() + 1));
        if (selectedDate && new Date(selectedDate) < minDate) {
            $(this).val('');
            showToast(__('Expiration date must be at least one day in the future.', 'fiveprayer'), 'error');
        }
    });

    // ===== Brute Force Settings =====
    $('#fiveprayer-brute-force-form').on('submit', function(e) {
        e.preventDefault();

        var $form = $(this);
        var $result = $('#fiveprayer-brute-force-result');
        var $submitBtn = $form.find('button[type="submit"]');

        $submitBtn.prop('disabled', true).html('<span class="fiveprayer-loading"></span> ' + __('Saving...', 'fiveprayer'));
        $result.hide();

        $.ajax({
            url: fpApiAdmin.ajaxUrl,
            type: 'POST',
            data: {
                action: 'fp_api_save_brute_force_settings',
                nonce: fpApiAdmin.nonce,
                enabled: $('#brute-force-enabled').is(':checked'),
                max_attempts: $('#brute-force-max-attempts').val(),
                lockout_minutes: $('#brute-force-lockout-minutes').val(),
                notify_enabled: $('#brute-force-notify-enabled').is(':checked'),
                notify_email: $('#brute-force-notify-email').val(),
                notify_cooldown: $('#brute-force-notify-cooldown').val(),
                from_name: $('#brute-force-from-name').val(),
                from_email: $('#brute-force-from-email').val(),
                subject: $('#brute-force-subject').val(),
                escalate_cooldown: $('#brute-force-escalate-cooldown').is(':checked'),
            },
            success: function(response) {
                $submitBtn.prop('disabled', false).text(__('Save Settings', 'fiveprayer'));
                if (response.success) {
                    $result.removeClass('error').addClass('success').text(response.data.message).show();
                    showToast(response.data.message, 'success');
                } else {
                    $result.removeClass('success').addClass('error').text(response.data.message || __('Failed to save settings.', 'fiveprayer')).show();
                    showToast(response.data.message || __('Failed to save settings.', 'fiveprayer'), 'error');
                }
            },
            error: function() {
                $submitBtn.prop('disabled', false).text(__('Save Settings', 'fiveprayer'));
                $result.removeClass('success').addClass('error').text(__('An error occurred while saving settings.', 'fiveprayer')).show();
                showToast(__('An error occurred while saving settings.', 'fiveprayer'), 'error');
            }
        });
    });

    // ===== Send Test Email =====
    $('#fiveprayer-send-test-email').on('click', function() {
        var $btn = $(this);
        var $result = $('#fiveprayer-test-email-result');
        $btn.prop('disabled', true).html('<span class="fiveprayer-loading"></span> ' + __('Sending...', 'fiveprayer'));
        $result.hide();

        $.ajax({
            url: fpApiAdmin.ajaxUrl,
            type: 'POST',
            data: {
                action: 'fp_api_send_test_email',
                nonce: fpApiAdmin.nonce,
            },
            success: function(response) {
                $btn.prop('disabled', false).text(__('Send Test Email', 'fiveprayer'));
                if (response.success) {
                    $result.removeClass('error').addClass('success').text(response.data.message).show();
                    showToast(response.data.message, 'success');
                } else {
                    $result.removeClass('success').addClass('error').text(response.data.message || __('Failed to send test email.', 'fiveprayer')).show();
                    showToast(response.data.message || __('Failed to send test email.', 'fiveprayer'), 'error');
                }
            },
            error: function() {
                $btn.prop('disabled', false).text(__('Send Test Email', 'fiveprayer'));
                $result.removeClass('success').addClass('error').text(__('An error occurred while sending the test email.', 'fiveprayer')).show();
                showToast(__('An error occurred while sending the test email.', 'fiveprayer'), 'error');
            }
        });
    });

    // ===== Expire Email Cooldown (from table row, keeps level) =====
    $(document).on('click', '.fiveprayer-expire-cooldown-ip', function() {
        var $btn = $(this);
        var $row = $btn.closest('tr');

        $btn.prop('disabled', true).html('<span class="fiveprayer-loading"></span>');

        $.ajax({
            url: fpApiAdmin.ajaxUrl,
            type: 'POST',
            data: {
                action: 'fp_api_expire_email_cooldown',
                nonce: fpApiAdmin.nonce,
            },
            success: function(response) {
                if (response.success) {
                    showToast(response.data.message, 'success');
                    $row.fadeOut(300, function() {
                        $row.remove();
                        if ($('.fiveprayer-blocked-ips-table tbody tr').length === 0) {
                            $('.fiveprayer-blocked-ips-table-wrapper').html('<div class="fiveprayer-no-keys">' + escHtml(fpApiAdmin.strings.noTrackedIps) + '</div>');
                        }
                    });
                } else {
                    $btn.prop('disabled', false).text(__('Expire', 'fiveprayer'));
                    showToast(response.data.message, 'error');
                }
            },
            error: function() {
                $btn.prop('disabled', false).text(__('Expire', 'fiveprayer'));
                showToast(__('An error occurred while expiring the cooldown.', 'fiveprayer'), 'error');
            }
        });
    });

    // ===== Reset Email Cooldown (from table row) =====
    $(document).on('click', '.fiveprayer-reset-cooldown-ip', function() {
        var $btn = $(this);
        var $row = $btn.closest('tr');

        $btn.prop('disabled', true).html('<span class="fiveprayer-loading"></span>');

        $.ajax({
            url: fpApiAdmin.ajaxUrl,
            type: 'POST',
            data: {
                action: 'fp_api_reset_email_cooldown',
                nonce: fpApiAdmin.nonce,
            },
            success: function(response) {
                if (response.success) {
                    showToast(response.data.message, 'success');
                    $row.fadeOut(300, function() {
                        $row.remove();
                        if ($('.fiveprayer-blocked-ips-table tbody tr').length === 0) {
                            $('.fiveprayer-blocked-ips-table-wrapper').html('<div class="fiveprayer-no-keys">' + escHtml(fpApiAdmin.strings.noTrackedIps) + '</div>');
                        }
                    });
                } else {
                    $btn.prop('disabled', false).text(__('Reset', 'fiveprayer'));
                    showToast(response.data.message, 'error');
                }
            },
            error: function() {
                $btn.prop('disabled', false).text(__('Reset', 'fiveprayer'));
                showToast(__('An error occurred while resetting the cooldown.', 'fiveprayer'), 'error');
            }
        });
    });

    // ===== Reset Email Cooldown (global button in card header) =====
    $(document).on('click', '.fiveprayer-reset-cooldown-global', function() {
        var $btn = $(this);

        $btn.prop('disabled', true).html('<span class="fiveprayer-loading"></span>');

        $.ajax({
            url: fpApiAdmin.ajaxUrl,
            type: 'POST',
            data: {
                action: 'fp_api_reset_email_cooldown',
                nonce: fpApiAdmin.nonce,
            },
            success: function(response) {
                if (response.success) {
                    showToast(response.data.message, 'success');
                    location.reload();
                } else {
                    $btn.prop('disabled', false).text(__('Reset Cooldown', 'fiveprayer'));
                    showToast(response.data.message, 'error');
                }
            },
            error: function() {
                $btn.prop('disabled', false).text(__('Reset Cooldown', 'fiveprayer'));
                showToast(__('An error occurred while resetting the cooldown.', 'fiveprayer'), 'error');
            }
        });
    });

    // ===== Unblock IP =====
    $(document).on('click', '.fiveprayer-unblock-ip', function() {
        var $btn = $(this);
        var ip = $btn.data('ip');
        var $row = $btn.closest('tr');

        if (!ip) {
            showToast(__('Unable to identify the IP to unblock.', 'fiveprayer'), 'error');
            return;
        }

        $btn.prop('disabled', true).html('<span class="fiveprayer-loading"></span>');

        $.ajax({
            url: fpApiAdmin.ajaxUrl,
            type: 'POST',
            data: {
                action: 'fp_api_unblock_ip',
                nonce: fpApiAdmin.nonce,
                ip: ip,
            },
            success: function(response) {
                if (response.success) {
                    showToast(response.data.message, 'success');
                    $row.fadeOut(300, function() {                            $row.remove();
                                if ($('.fiveprayer-blocked-ips-table tbody tr').length === 0) {
                                    $('.fiveprayer-blocked-ips-table-wrapper').html('<div class="fiveprayer-no-keys">' + escHtml(fpApiAdmin.strings.noTrackedIps) + '</div>');
                                }
                    });
                } else {
                    $btn.prop('disabled', false).text(__('Unblock', 'fiveprayer'));
                    showToast(response.data.message || __('Failed to unblock IP.', 'fiveprayer'), 'error');
                }
            },
            error: function() {
                $btn.prop('disabled', false).text(__('Unblock', 'fiveprayer'));
                showToast(__('An error occurred while unblocking the IP.', 'fiveprayer'), 'error');
            }
        });
    });

    // ===== Prefix live preview =====
    function updatePrefixPreview() {
        var raw = $('#key-prefix').val();
        var sanitized = raw.replace(/[^a-zA-Z0-9_-]/g, '');
        if (sanitized === '') sanitized = 'fp';
        var originalLen = sanitized.length;
        // Show truncation at 30 chars (matches PHP limit)
        if (sanitized.length > 30) {
            sanitized = sanitized.substring(0, 30);
        }
        if (sanitized.slice(-1) !== '_') sanitized += '_';
        var preview = sanitized + 'a1b2c3d4e5f6...';
        var $preview = $('#fiveprayer-prefix-preview');
        $preview.text(preview);
        $preview.removeClass('fiveprayer-prefix-warning fiveprayer-prefix-ok');
        if (originalLen > 30) {
            $preview.addClass('fiveprayer-prefix-warning');
        } else {
            $preview.addClass('fiveprayer-prefix-ok');
        }
    }

    $('#key-prefix').on('input', function() {
        updatePrefixPreview();
    });
    updatePrefixPreview();
});
