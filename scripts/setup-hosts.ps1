# PowerShell Helper to bind 000.local and 000.localhost to 127.0.0.1
# Note: Modern browsers (Chrome, Edge) automatically resolve 000.localhost without modifying hosts.
# Run as Administrator if you want to add 000.local to C:\Windows\System32\drivers\etc\hosts

$hostsPath = "$env:windir\System32\drivers\etc\hosts"
$entry = "127.0.0.1 000.localhost 000.local 000.dev"

Write-Host "Checking Windows hosts configuration for 000.* subdomains..." -ForegroundColor Cyan

if (Test-Path $hostsPath) {
    $content = Get-Content $hostsPath
    if ($content -match "000\.localhost") {
        Write-Host "000.* subdomain mapping is already present in hosts file." -ForegroundColor Green
    } else {
        Write-Host "Appending 000 subdomain routing to $hostsPath..." -ForegroundColor Yellow
        Add-Content -Path $hostsPath -Value "`n# 000 Mission Control Local Subdomains`n$entry" -ErrorAction SilentlyContinue
        Write-Host "Subdomain binding added: $entry" -ForegroundColor Green
    }
}

Write-Host "`nYou can now access the dashboard at: http://000.localhost:3000" -ForegroundColor Cyan
