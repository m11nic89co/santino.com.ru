<#
Convert source carousel images (orig/) into WebP and JPEG variants in processed/
Usage: Run from repository root in PowerShell:
  .\assets\img\source\carousel\convert-to-webp.ps1 [-Force]
Requirements: ImageMagick (`magick`) in PATH. If not present, install from https://imagemagick.org
#>
param(
  [switch]$Force
)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = Resolve-Path (Join-Path $root '..\..\..\..')
$orig = Join-Path $repo 'assets\img\source\carousel\orig'
$processed = Join-Path $repo 'assets\img\source\carousel\processed'

if (-not (Test-Path $orig)) { Write-Error "Source folder not found: $orig"; exit 1 }
if (-not (Test-Path $processed)) { New-Item -ItemType Directory -Path $processed | Out-Null }

# Check for ImageMagick
$magick = Get-Command magick -ErrorAction SilentlyContinue
if (-not $magick) { Write-Error "ImageMagick 'magick' not found in PATH. Install ImageMagick or add to PATH."; exit 2 }

$files = Get-ChildItem -Path $orig -Include *.png,*.jpg,*.jpeg -File | Sort-Object Name
if ($files.Count -eq 0) { Write-Output "No source images found in $orig"; exit 0 }

foreach ($f in $files) {
  $base = [IO.Path]::GetFileNameWithoutExtension($f.Name)
  foreach ($size in @(640,960)) {
    $webp = Join-Path $processed ("$base-$size.webp")
    $jpg  = Join-Path $processed ("$base-$size.jpg")
    if (-not $Force) {
      if (Test-Path $webp -and Test-Path $jpg) { Write-Output "Skipping $base for $size (exists)"; continue }
    }
    $in = $f.FullName
    Write-Output "Processing $($f.Name) -> $size px"
    # Resize and convert to WebP (quality 80)
    & magick convert `"$in`" -resize ${size}x${size}^ -gravity center -extent ${size}x${size} -quality 80 `"$webp`"
    # Convert to JPEG (quality 85)
    & magick convert `"$in`" -resize ${size}x${size}^ -gravity center -extent ${size}x${size} -quality 85 `"$jpg`"
  }
}

Write-Output "Done. Processed images are in: $processed"