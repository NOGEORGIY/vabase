# Полный сброс демо-контура: удаляет контейнеры и тома с данными.
$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)

$answer = Read-Host "Удалить базу и все данные демо-контура? (y/N)"
if ($answer -notmatch "^(y|Y|д|Д)$") {
    Write-Host "Отменено."
    exit 0
}

docker compose down -v
Write-Host "Контур остановлен, тома удалены. Запуск заново: .\scripts\up.ps1" -ForegroundColor Green
