$ErrorActionPreference = "Stop"
$teams = Get-Content "$PSScriptRoot\hltv_teams.json" | ConvertFrom-Json
$outDir = "$PSScriptRoot\hltv_logos"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

Write-Host "Downloading $($teams.Count) team logos..." -ForegroundColor Cyan

$i = 0
foreach ($team in $teams) {
    $i++
    $ext = if ($team.logoUrl -match '\.svg') { '.svg' } else { '.png' }
    $safeName = $team.name -replace '[\\/:*?"<>|]', '_'
    $fileName = "$($team.rank.ToString().PadLeft(3,'0'))_${safeName}${ext}"
    $filePath = Join-Path $outDir $fileName

    if (Test-Path $filePath) {
        Write-Host "[$i/222] SKIP $fileName (exists)" -ForegroundColor DarkGray
        continue
    }

    try {
        & curl.exe -s -o $filePath `
            -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36" `
            -H "Referer: https://www.hltv.org/" `
            -H "Accept: image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8" `
            -H "Accept-Language: en-US,en;q=0.9" `
            -H "Origin: https://www.hltv.org" `
            -H "Sec-Fetch-Dest: image" `
            -H "Sec-Fetch-Mode: no-cors" `
            -H "Sec-Fetch-Site: cross-site" `
            $team.logoUrl
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[$i/222] OK   $fileName" -ForegroundColor Green
        } else {
            Write-Host "[$i/222] FAIL $fileName (exit code: $LASTEXITCODE)" -ForegroundColor Red
        }
    } catch {
        Write-Host "[$i/222] FAIL $fileName -- $($_.Exception.Message)" -ForegroundColor Red
    }
}

$count = (Get-ChildItem $outDir).Count
Write-Host "`nDone! $count files in $outDir" -ForegroundColor Cyan
