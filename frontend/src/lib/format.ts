const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateFormatter.format(date);
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateTimeFormatter.format(date);
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function plural(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

export const STATUS_LABELS: Record<string, string> = {
  active: "Активен",
  published: "Опубликован",
  validated: "Проверен",
  registered: "Зарегистрирован",
  draft: "Черновик",
  archived: "Архив",
  planned: "Запланировано",
  ready: "Готово",
  new: "Новый",
  in_progress: "В работе",
  closed: "Закрыт",
};

export const STATUS_TONES: Record<string, "green" | "blue" | "gray" | "amber" | "red" | "violet"> = {
  active: "green",
  published: "green",
  ready: "green",
  validated: "blue",
  registered: "blue",
  in_progress: "blue",
  new: "blue",
  draft: "gray",
  closed: "gray",
  archived: "red",
  planned: "violet",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function statusTone(status: string): "green" | "blue" | "gray" | "amber" | "red" | "violet" {
  return STATUS_TONES[status] ?? "gray";
}

export const TOOL_TYPE_LABELS: Record<string, string> = {
  http: "HTTP",
  mcp: "MCP",
  webhook: "Вебхук",
  builtin: "Встроенная функция",
};

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  api: "API",
  webhook: "Вебхук",
  mcp: "MCP",
  builtin: "Встроенный",
};

export const COMPONENT_TYPE_LABELS: Record<string, string> = {
  form: "Форма",
  table: "Таблица",
  card: "Карточка",
  calendar: "Календарь",
  connector: "Коннектор",
  widget: "Виджет",
};

export const DICT_TYPE_LABELS: Record<string, string> = {
  api: "API",
  file: "Файл",
};

export const DATA_TYPE_LABELS: Record<string, string> = {
  string: "Строка",
  number: "Число",
  date: "Дата",
  boolean: "Логический",
  reference: "Ссылка",
};

export const ELEMENT_TYPE_LABELS: Record<string, string> = {
  system: "Системный",
  context: "Контекст",
  instruction: "Инструкция",
  example: "Пример",
};

export const SCALE_TYPE_LABELS: Record<string, string> = {
  numeric: "Числовая",
  text: "Текстовая",
  enum: "Перечисление",
  date: "Дата",
};
