$dir = 'C:\Users\jamaal\Local Sites\corev2\app\public\wp-content\plugins\fiveprayercore\php\classes\core\helpers\MetaField\Elementor\DynamicTags'

$encoding = New-Object System.Text.UTF8Encoding($false)

Get-ChildItem -Path $dir -Filter '*.php' | ForEach-Object {
    $content = Get-Content -LiteralPath $_.FullName -Raw

    if ($content.Length -gt 0 -and $content[0] -eq [char]0xFEFF) {
        $content = $content.Substring(1)
    }

    $content = $content.TrimStart()

    if (-not $content.StartsWith('<?php')) {
        $content = "<?php`r`n" + $content
    }

    $content = [System.Text.RegularExpressions.Regex]::Replace(
        $content,
        '^<\?php\s*(?:\r?\n)+\s*namespace',
        "<?php`r`nnamespace"
    )

    if (-not $content.EndsWith("`n")) {
        $content += "`r`n"
    }

    [System.IO.File]::WriteAllText($_.FullName, $content, $encoding)
}
