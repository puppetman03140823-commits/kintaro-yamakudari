param([int]$Port = 8125)
$root = Join-Path $PSScriptRoot ''
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $root on http://localhost:$Port/"
$mime = @{ '.html'='text/html; charset=utf-8'; '.js'='application/javascript'; '.css'='text/css'; '.json'='application/json'; '.webmanifest'='application/manifest+json'; '.png'='image/png'; '.jpg'='image/jpeg'; '.svg'='image/svg+xml' }
try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    try {
      $path = $ctx.Request.Url.LocalPath.TrimStart('/')
      if ([string]::IsNullOrEmpty($path)) { $path = 'index.html' }
      $file = Join-Path $root $path
      $isHead = ($ctx.Request.HttpMethod -eq 'HEAD')
      if (Test-Path $file -PathType Leaf) {
        $bytes = [System.IO.File]::ReadAllBytes($file)
        $ext = [System.IO.Path]::GetExtension($file).ToLower()
        if ($mime.ContainsKey($ext)) { $ctx.Response.ContentType = $mime[$ext] }
        $ctx.Response.ContentLength64 = $bytes.Length
        if (-not $isHead) { $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length) }
      } else {
        $ctx.Response.StatusCode = 404
      }
    } catch {
      try { $ctx.Response.StatusCode = 500 } catch {}
    } finally {
      try { $ctx.Response.Close() } catch {}
    }
  }
} finally { $listener.Stop() }
