from __future__ import annotations

from backend.app.tools import TOOLS_MAP, TOOLS_SCHEMAS
from backend.app.services import LLMClient
import os
import json

from dotenv import load_dotenv
load_dotenv()

credentials = os.getenv('GIGACHAT_API_TOKEN')
if not credentials:
    raise ValueError("Переменная окружения GIGACHAT_API_TOKEN не найдена или пуста.")
model = "GigaChat-2"

SYSTEM_PROMPT = """

Ты помощник SRE-инженера. Твоя задача — находить причины ошибок в коде проекта.

Если пользователь прислал traceback:

1. Определи тип исключения.
2. Найди в traceback файл, номер строки и имя функции.
3. Не пытайся искать весь текст traceback в исходниках.
4. Используй grep, чтобы найди функцию или соответствующий участок кода.

Если пользователь НЕ прислал traceback, а указал только файл и тип ошибки:
1. Ищи в указанном файле потенциально опасные места под эту ошибку (например, для ZeroDivisionError ищи операции деления '/' или '%', для KeyError — обращения по ключу '[') либо список функций через 'def '.
2. Изучи найденные строки и объясни причину ошибки.
3. Предложи исправление.

Если информации недостаточно, выполни дополнительный поиск.
Не выдумывай результаты. Опирайся только на найденный код
"""

def run_agent(llm: LLMClient, task: str, max_steps: int = 8) -> str:
    messages = [
        {"role":"system", "content":SYSTEM_PROMPT},
        {"role":"user", "content":task},
    ]
    print(f"\n[USER] {task}")
    for step in range(1, max_steps + 1):
        print(f"\n{'=' * 20} ШАГ {step} {'=' * 20}")
        msg = llm.chat(messages, functions=TOOLS_SCHEMAS)
        messages.append(msg)

        # что вернула модель
        content = msg.get("content", "")
        if content:
            print(f"\n[LLM]\n{content}")

        function_call = msg.get("function_call")

        # Модель решила не вызывать инструменты
        if not function_call:
            print("\n[AGENT] Работа завершена")
            return content

        calls = function_call if isinstance(function_call, list) else [function_call]

        # Обрабатываем запросы на вызов инструментов
        for call in calls:
            name = call["name"]
            args = call.get("arguments", {})
            if isinstance(args, list):
                args = json.loads(args)

            print(f"\n[TOOL CALL] {name}")
            print(f"[ARGS] {args}")
            func = TOOLS_MAP[name]
            if func is None:
                result = f"Ошибка: инструмента {name} нет"
            else:
                try:
                    result = func(**args)
                except Exception as e:
                    result = f"Ошибка: {e}"
            print(f"\n[TOOL RESULT]\n{result}")
            messages.append({
                "role": "tool",
                "name": name,
                "content": json.dumps({"result": str(result)}, ensure_ascii=False),
            })
    print("\n[AGENT] Превышен лимит шагов")
    return "Остановился: превышен лимит шагов"

def read_task():
    print("Опиши проблему (для завершения нажми Enter на пустой строке):")
    lines = []
    while True:
        line = input()
        if not line:
            break
        lines.append(line)
    return "\n".join(lines)

if __name__ == "__main__":
    llm = LLMClient(credentials, model)
    llm.get_balance()
    task = read_task()
    answer = run_agent(llm, task)
    print("\nОтвет агента:")
    print(answer)
    llm.get_balance()
