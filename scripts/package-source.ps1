$ErrorActionPreference = 'Stop'
$sourceRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
Push-Location -LiteralPath $sourceRoot
try {
    & node (Join-Path $PSScriptRoot 'audit-release.cjs')
    if ($LASTEXITCODE -ne 0) { throw 'Release audit failed; no archive created.' }
    $version = (Get-Content -LiteralPath (Join-Path $sourceRoot 'package.json') -Raw -Encoding UTF8 | ConvertFrom-Json).version
    $archivePath = Join-Path (Split-Path $sourceRoot -Parent) ('3566-open-source-' + $version + '-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.zip')
    Add-Type -AssemblyName System.IO.Compression
    $stream = [IO.File]::Open($archivePath, [IO.FileMode]::CreateNew)
    $archive = [IO.Compression.ZipArchive]::new($stream, [IO.Compression.ZipArchiveMode]::Create, $false)
    try {
        $rootFiles = Get-ChildItem -LiteralPath $sourceRoot -File -Force
        $nested = @('assets', 'docs', 'llm', 'scripts', 'tests') | ForEach-Object { Get-ChildItem -LiteralPath (Join-Path $sourceRoot $_) -File -Recurse -Force }
        foreach ($file in @($rootFiles) + @($nested)) {
            $relative = $file.FullName.Substring($sourceRoot.Length + 1).Replace('\', '/')
            if ($relative.StartsWith('tests/artifacts/')) { continue }
            $entry = $archive.CreateEntry('3566-open-source/' + $relative, [IO.Compression.CompressionLevel]::Optimal)
            $entryStream = $entry.Open()
            $inputStream = [IO.File]::OpenRead($file.FullName)
            try { $inputStream.CopyTo($entryStream) } finally { $inputStream.Dispose(); $entryStream.Dispose() }
        }
    } finally { $archive.Dispose(); $stream.Dispose() }
    Write-Output $archivePath
    $hasher = [Security.Cryptography.SHA256]::Create()
    $hashStream = [IO.File]::OpenRead($archivePath)
    try { Write-Output ('SHA256 ' + [BitConverter]::ToString($hasher.ComputeHash($hashStream)).Replace('-', '')) }
    finally { $hashStream.Dispose(); $hasher.Dispose() }
} finally { Pop-Location }
