import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]  # директория проекта, доступная агенту

MAX_LINES = 50                       # максимальное количество результатов

EXCLUDE_DIRS = [".git", "venv", ".venv", "__pycache__", "node_modules"]

def grep(pattern: str, path: str = ".", sudo: bool = False) -> str:
    """Ищет pattern в файлах репозитория. Возвращает строки вида файл:строка:текст."""
    clean_path = path.lstrip("/\\") or "."
    target = (REPO_ROOT / clean_path).resolve()

    if not target.is_relative_to(REPO_ROOT):
        return f"Ошибка: путь {path} вне репозитория"

    if not target.exists():
        return f"Ошибка: путь {path} не найден"

    cmd = ["sudo", "-n"] if sudo else []
    cmd += ["grep", "-rnHIE"]
    cmd += [f"--exclude-dir={d}" for d in EXCLUDE_DIRS]
    cmd += ["--", pattern, str(target)]

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=10
        )
    except subprocess.TimeoutExpired:
        return "Ошибка: поиск занял слишком много времени, уточни pattern или path"

    if result.returncode == 1:
        return f"Ничего не найдено по '{pattern}'"

    if result.returncode != 0:
        return f"Ошибка grep: {result.stderr.strip()}"

    root = REPO_ROOT.as_posix()
    lines = [
        line.replace("\\", "/").replace(root + "/", "", 1)
        for line in result.stdout.splitlines()
    ]

    if len(lines) > MAX_LINES:
        return "\n".join(lines[:MAX_LINES]) + (
            f"\n... и еще {len(lines) - MAX_LINES} совпадений, уточни pattern"
        )

    return "\n".join(lines)

GREP_SCHEMA = {
        "name": "grep",
        "description": (
            "Ищет текст или регулярное выражение в файлах проекта. "
            "Используй для поиска функций, классов и переменных. "
            "Возвращает строки в формате файл:номер_строки:текст."),
        "parameters": {
            "type": "object",
            "properties": {
                "pattern": {
                    "type": "string",
                    "description": (
                    "Регулярное выражение для поиска. Например: "
                    "'def ' (список всех функций), '/' (операции деления), "
                    "или имя конкретной функции из traceback."
                    )
                },
                "path": {
                    "type": "string",
                    "description": "Папка или файл внутри проекта, по умолчанию весь проект"
                },
                 "sudo": {
                    "type": "boolean",
                    "description": "Запустить поиск с правами root и разрешить выход за пределы папки проекта (по умолчанию false)"
                }
            },
            "required": ["pattern"],
        },
    }
