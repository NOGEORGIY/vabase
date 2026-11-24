# Запуск демо-контура Vabase: docker compose up -d --build + ожидание готовности.
$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Создан .env из .env.example" -ForegroundColor DarkGray
}

$webPort = "8090"
$apiPort = "8001"
if (Test-Path ".env") {
    $webMatch = Select-String -Path ".env" -Pattern "^WEB_PORT=(.*)$"
    if ($webMatch) { $webPort = $webMatch.Matches[0].Groups[1].Value.Trim() }
    $apiMatch = Select-String -Path ".env" -Pattern "^API_PORT=(.*)$"
    if ($apiMatch) { $apiPort = $apiMatch.Matches[0].Groups[1].Value.Trim() }
}

docker compose up -d --build
if ($LASTEXITCODE -ne 0) { throw "docker compose завершился с ошибкой" }

$url = "http://localhost:$webPort"
Write-Host "Ожидаем готовности сервисов..." -ForegroundColor DarkGray
$ready = $false
for ($i = 0; $i -lt 90; $i++) {
    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri "$url/healthz" -TimeoutSec 3
        if ($response.StatusCode -eq 200) { $ready = $true; break }
    } catch {
        # сервис ещё поднимается
    }
    Start-Sleep -Seconds 2
}

if (-not $ready) {
    Write-Host "Сервисы не ответили вовремя. Посмотрите логи: docker compose logs -f" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Vabase запущен: $url" -ForegroundColor Green
Write-Host "API и OpenAPI:  http://localhost:$apiPort/api/docs" -ForegroundColor DarkGray
Write-Host "Демо-аккаунты:  g.rasputin@vabase.ru / a.sokolova@vabase.ru / m.orlov@vabase.ru" -ForegroundColor DarkGray
Write-Host "Пароль:         vabase" -ForegroundColor DarkGray
