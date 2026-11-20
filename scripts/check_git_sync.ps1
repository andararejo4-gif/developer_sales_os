# ==============================================================================
# Script Pemeriksaan Sinkronisasi Git & Proteksi File Remote
# ==============================================================================

Write-Host ">>> Memeriksa status repositori dan sinkronisasi remote..." -ForegroundColor Cyan

# 1. Fetch remote changes
git fetch origin main 2>$null

# 2. Check current branch
$branch = (git branch --show-current).Trim()
if (-not $branch) { $branch = "main" }

# 3. Bandingkan commit local vs remote
$ahead = (git rev-list --count "origin/$branch..HEAD" 2>$null).Trim()
$behind = (git rev-list --count "HEAD..origin/$branch" 2>$null).Trim()

Write-Host "Branch aktif: $branch" -ForegroundColor Yellow
Write-Host "Status commit: $ahead commit ahead (lokal lebih maju), $behind commit behind (remote lebih maju)" -ForegroundColor White

if ([int]$behind -gt 0) {
    Write-Host "`n[PERINGATAN] Ada $behind commit baru di remote!" -ForegroundColor Red
    Write-Host "Daftar commit remote:" -ForegroundColor White
    git log "HEAD..origin/$branch" --oneline
    
    Write-Host "`nFile yang diubah/dibuat di remote:" -ForegroundColor Yellow
    $diffFiles = git diff --name-status "HEAD...origin/$branch"
    $diffFiles | ForEach-Object { Write-Host "  $_" }
    
    # Periksa apakah ada file remote yang tidak ada di lokal
    $remoteAdded = git diff --name-only --diff-filter=A "HEAD...origin/$branch"
    $missingLocally = @()
    foreach ($f in $remoteAdded) {
        if (-not (Test-Path $f)) {
            $missingLocally += $f
        }
    }
    
    if ($missingLocally.Count -gt 0) {
        Write-Host "`n[PENTING] Ditemukan file di remote yang BELUM ADA di laptop:" -ForegroundColor Magenta
        foreach ($mf in $missingLocally) {
            Write-Host "  * $mf (JANGAN DIHAPUS / JANGAN DITIMPA)" -ForegroundColor Magenta
        }
        Write-Host "Lakukan penggabungan aman (git merge origin/$branch) agar file tersebut ditarik ke laptop." -ForegroundColor Green
    }
} else {
    Write-Host "[OK] Repositori lokal sinkron dengan remote (tidak ada commit remote yang tertinggal)." -ForegroundColor Green
}

# 4. Status perubahan lokal yang belum di-commit
$uncommitted = git status --short
if ($uncommitted) {
    Write-Host "`nStatus perubahan belum di-commit di laptop:" -ForegroundColor Cyan
    $uncommitted | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Host "Working directory di laptop bersih." -ForegroundColor White
}

Write-Host "`n>>> Selesai." -ForegroundColor Cyan
