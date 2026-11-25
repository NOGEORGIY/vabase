from .grep import GREP_SCHEMA, grep

# Список всех схем для передачи в GigaChat
TOOLS_SCHEMAS = [
    GREP_SCHEMA,
]

# Словарь для вызова функции по имени, которое вернет модель
TOOLS_MAP = {
    "grep": grep,
}