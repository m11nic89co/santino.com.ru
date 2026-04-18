<#
Convert source carousel images (orig/) into square JPEG variants (640/960) in processed/
Usage: Run from repository root in PowerShell:
  .\assets\img\source\carousel\convert-to-jpeg.ps1 [-Force]
No external dependencies; uses .NET System.Drawing
#>
param(
  [switch]$Force
)

Add-Type -AssemblyName System.Drawing

function New-SquareBitmap {
  param(
    [System.Drawing.Bitmap]$Bitmap,
    [int]$Size
  )
  $srcW = $Bitmap.Width
  $srcH = $Bitmap.Height
  $side = [Math]::Min($srcW, $srcH)
  $x = [Math]::Max(0, [Math]::Floor(($srcW - $side) / 2))
  $y = [Math]::Max(0, [Math]::Floor(($srcH - $side) / 2))
  $rect = New-Object System.Drawing.Rectangle -ArgumentList $x, $y, $side, $side

  $dest = New-Object System.Drawing.Bitmap($Size, $Size)
  $g = [System.Drawing.Graphics]::FromImage($dest)
  try {
    $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.Clear([System.Drawing.Color]::Black)
  $destRect = New-Object System.Drawing.Rectangle -ArgumentList 0, 0, $Size, $Size
  $g.DrawImage($Bitmap, $destRect, $rect, [System.Drawing.GraphicsUnit]::Pixel)
  }
  finally {
    $g.Dispose()
  }
  return $dest
}

function Save-Jpeg {
  param(
    [System.Drawing.Image]$Image,
    [string]$Path,
    [int]$Quality = 85
  )
  $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
  $encParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [int]$Quality)
  $Image.Save($Path, $codec, $encParams)
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = Resolve-Path (Join-Path $root '..\..\..\..')
$orig = Join-Path $repo 'assets\img\source\carousel\orig'
$processed = Join-Path $repo 'assets\img\source\carousel\processed'

if (-not (Test-Path $orig)) { Write-Error "Source folder not found: $orig"; exit 1 }
if (-not (Test-Path $processed)) { New-Item -ItemType Directory -Path $processed | Out-Null }

$files = Get-ChildItem -Path $orig -File | Where-Object { $_.Extension -match '^(?i)\.(png|jpe?g)$' } | Sort-Object Name
if ($files.Count -eq 0) { Write-Output "No source images found in $orig"; exit 0 }

foreach ($f in $files) {
  $base = [IO.Path]::GetFileNameWithoutExtension($f.Name)
  $bmp = $null
  try {
    $bmp = [System.Drawing.Bitmap]::FromFile($f.FullName)
    foreach ($size in @(640,960)) {
      $outPath = Join-Path $processed ("$base-$size.jpg")
      if ((-not $Force) -and (Test-Path $outPath)) { Write-Output "Skipping $base $size (exists)"; continue }
      Write-Output "Processing $($f.Name) -> $size.jpg"
      $sq = New-SquareBitmap -Bitmap $bmp -Size $size
      try { Save-Jpeg -Image $sq -Path $outPath -Quality 85 } finally { $sq.Dispose() }
    }
  }
  finally {
    if ($bmp) { $bmp.Dispose() }
  }
}

Write-Output "Done. JPEGs are in: $processed"