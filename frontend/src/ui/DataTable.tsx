import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { cx, EmptyState, Pagination } from "./primitives";

export interface Column<T> {
  key: string;
  header: ReactNode;
  width?: string;
  align?: "left" | "right";
  primary?: boolean;
  className?: string;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptyText?: string;
  emptyIcon?: ReactNode;
  emptyAction?: ReactNode;
  selectable?: boolean;
  selectedKey?: string | null;
  onRowClick?: (row: T) => void;
  pageSize?: number;
  minWidth?: number;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  emptyTitle = "Пока пусто",
  emptyText = "Добавьте первую запись, чтобы начать работу.",
  emptyIcon,
  emptyAction,
  selectable,
  selectedKey,
  onRowClick,
  pageSize: initialPageSize = 10,
  minWidth = 620,
}: DataTableProps<T>) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  useEffect(() => {
    setPage(1);
  }, [rows.length, pageSize]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleRows = useMemo(
    () => rows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [rows, currentPage, pageSize],
  );

  const allChecked = visibleRows.length > 0 && visibleRows.every((row) => checked.has(rowKey(row)));

  const toggleAll = () => {
    const next = new Set(checked);
    if (allChecked) {
      visibleRows.forEach((row) => next.delete(rowKey(row)));
    } else {
      visibleRows.forEach((row) => next.add(rowKey(row)));
    }
    setChecked(next);
  };

  const toggleRow = (key: string) => {
    const next = new Set(checked);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setChecked(next);
  };

  if (loading) {
    return (
      <div className="table-skeleton" aria-busy="true">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="skeleton row-skeleton" style={{ opacity: 1 - index * 0.12 }} />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        text={emptyText}
        action={emptyAction}
        compact
      />
    );
  }

  return (
    <div>
      <div className="table-wrap">
        <table className="table" style={{ minWidth }}>
          <thead>
            <tr>
              {selectable ? (
                <th className="table-check">
                  <button
                    type="button"
                    className="checkbox"
                    onClick={toggleAll}
                    aria-label="Выбрать все"
                    style={{ background: "none", border: "none", padding: 0 }}
                  >
                    <span className={cx("box", allChecked && "checked")}>
                      {allChecked ? <Check /> : null}
                    </span>
                  </button>
                </th>
              ) : null}
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{ width: column.width, textAlign: column.align ?? "left" }}
                  className={column.className}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => {
              const key = rowKey(row);
              const isSelected = selectedKey === key;
              return (
                <tr
                  key={key}
                  className={cx(onRowClick && "clickable", isSelected && "selected")}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {selectable ? (
                    <td className="table-check" onClick={(event) => event.stopPropagation()}>
                      <button
                        type="button"
                        className="checkbox"
                        onClick={() => toggleRow(key)}
                        aria-label="Выбрать строку"
                        style={{ background: "none", border: "none", padding: 0 }}
                      >
                        <span className={cx("box", checked.has(key) && "checked")}>
                          {checked.has(key) ? <Check /> : null}
                        </span>
                      </button>
                    </td>
                  ) : null}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      style={{ textAlign: column.align ?? "left" }}
                      className={cx(column.primary && "primary", column.className)}
                    >
                      {column.render
                        ? column.render(row)
                        : String((row as Record<string, unknown>)[column.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <div className="page-size" style={{ gap: 12 }}>
          <span>Всего {rows.length}</span>
          <span className="page-size" style={{ gap: 6 }}>
            Записей на стр.
            <select
              className="select"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
            >
              {[5, 10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </span>
        </div>
        <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} />
      </div>
    </div>
  );
}
