import {
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  Inbox,
  Search,
  X,
} from "lucide-react";
import { initials, statusLabel, statusTone } from "../lib/format";

export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ buttons */

type ButtonVariant = "primary" | "secondary" | "outline" | "soft" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "xs";
  block?: boolean;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size,
  block,
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cx("btn", `btn-${variant}`, size && `btn-${size}`, block && "btn-block", className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="spinner" /> : children}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm";
  plain?: boolean;
}

export function IconButton({ size, plain, className, children, ...props }: IconButtonProps) {
  return (
    <button className={cx("icon-btn", size, plain && "plain", className)} {...props}>
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------- fields */

export function Field({
  label,
  hint,
  error,
  className,
  required,
  children,
}: {
  label?: string;
  hint?: string;
  error?: string;
  className?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className={cx("field", className)}>
      {label ? (
        <span className="field-label">
          {label}
          {required ? <span style={{ color: "var(--blue)" }}> *</span> : null}
        </span>
      ) : null}
      {children}
      {error ? <span className="field-error">{error}</span> : null}
      {!error && hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx("input", props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx("textarea", props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx("select", props.className)} />;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Поиск",
  onGray,
  onSubmit,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onGray?: boolean;
  onSubmit?: () => void;
}) {
  return (
    <div className={cx("search-field", onGray && "on-gray")}>
      <Search />
      <input
        className="input"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && onSubmit) onSubmit();
        }}
      />
    </div>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className="checkbox">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="box">{checked ? <Check /> : null}</span>
      {label ? <span>{label}</span> : null}
    </label>
  );
}

/* ------------------------------------------------------------------ badges */

export function Badge({
  children,
  tone = "gray",
  noDot,
  className,
}: {
  children: ReactNode;
  tone?: "gray" | "green" | "blue" | "amber" | "red" | "violet";
  noDot?: boolean;
  className?: string;
}) {
  return <span className={cx("badge", tone, noDot && "no-dot", className)}>{children}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTone(status)}>{statusLabel(status)}</Badge>;
}

export function Avatar({
  name,
  color,
  size,
}: {
  name: string;
  color?: string;
  size?: "sm" | "lg";
}) {
  return (
    <span
      className={cx("avatar", size)}
      style={color ? { background: `linear-gradient(135deg, ${color}, ${color}cc)` } : undefined}
      title={name}
    >
      {initials(name)}
    </span>
  );
}

/* ------------------------------------------------------------- empty/loading */

export function EmptyState({
  icon,
  title,
  text,
  action,
  compact,
}: {
  icon?: ReactNode;
  title: string;
  text?: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={cx("empty-state", compact && "compact")}>
      <span className="empty-icon">{icon ?? <Inbox />}</span>
      <span className="empty-title">{title}</span>
      {text ? <span className="empty-text">{text}</span> : null}
      {action ? <div style={{ marginTop: 8 }}>{action}</div> : null}
    </div>
  );
}

export function Spinner({ dark }: { dark?: boolean }) {
  return <span className={cx("spinner", dark && "dark")} />;
}

export function CenterLoader({ label = "Загружаем данные" }: { label?: string }) {
  return (
    <div className="center-loader">
      <Spinner dark />
      <span>{label}</span>
    </div>
  );
}

/* ------------------------------------------------------------------- modal */

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={cx("modal", wide && "wide")} role="dialog" aria-modal="true">
        <div className="modal-head">
          <div>
            <h2 className="modal-title">{title}</h2>
            {subtitle ? <p className="modal-subtitle">{subtitle}</p> : null}
          </div>
          <IconButton plain size="sm" onClick={onClose} aria-label="Закрыть">
            <X />
          </IconButton>
        </div>
        {children}
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({
  open,
  title,
  text,
  confirmLabel = "Удалить",
  onConfirm,
  onClose,
  loading,
}: {
  open: boolean;
  title: string;
  text: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p style={{ color: "var(--muted-2)", fontSize: 14 }}>{text}</p>
    </Modal>
  );
}

/* ---------------------------------------------------------------- dropdown */

export function Dropdown({
  trigger,
  children,
  align = "right",
  className,
}: {
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className={cx("dropdown", className)} ref={ref}>
      <div onClick={() => setOpen((value) => !value)}>{trigger}</div>
      {open ? (
        <div
          className={cx("dropdown-menu", align)}
          onClick={() => {
            setOpen(false);
          }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function DropdownLink({
  to,
  icon,
  children,
  onClick,
}: {
  to?: string;
  icon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
}) {
  if (to) {
    return (
      <Link className="dropdown-item" to={to} onClick={onClick}>
        {icon}
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className="dropdown-item" onClick={onClick}>
      {icon}
      {children}
    </button>
  );
}

export function DropdownSeparator() {
  return <div className="dropdown-sep" />;
}

export function DropdownLabel({ children }: { children: ReactNode }) {
  return <div className="dropdown-label">{children}</div>;
}

/* -------------------------------------------------------------- page header */

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="page-head">
      <div className="page-head-main">
        <h1 className="page-title">{title}</h1>
        {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="page-head-actions">{actions}</div> : null}
    </header>
  );
}

/* ------------------------------------------------------------ misc visuals */

export function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1).filter(
    (value) => value === 1 || value === pageCount || Math.abs(value - page) <= 1,
  );

  const items: Array<number | "ellipsis"> = [];
  pages.forEach((value, index) => {
    if (index > 0 && value - pages[index - 1] > 1) items.push("ellipsis");
    items.push(value);
  });

  return (
    <div className="pagination">
      <button
        type="button"
        className="page-btn"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Предыдущая страница"
      >
        <ChevronLeft size={15} />
      </button>
      {items.map((item, index) =>
        item === "ellipsis" ? (
          <span key={`e-${index}`} className="page-btn" style={{ cursor: "default" }}>
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            className={cx("page-btn", item === page && "active")}
            onClick={() => onChange(item)}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        className="page-btn"
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount}
        aria-label="Следующая страница"
      >
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

export function ValidationRow({
  status,
  label,
  message,
}: {
  status: "ok" | "warning" | "error";
  label: string;
  message?: string;
}) {
  return (
    <div className={cx("validation-row", status)}>
      <span className="v-icon">
        {status === "ok" ? <Check /> : status === "warning" ? <Circle /> : <X />}
      </span>
      <div>
        <div>{label}</div>
        {message ? <div className="msg">{message}</div> : null}
      </div>
    </div>
  );
}

export function WarningNote({ text }: { text: string }) {
  return (
    <div className="login-error">
      <AlertTriangle />
      <span>{text}</span>
    </div>
  );
}

export function ChevronDownIcon() {
  return <ChevronDown size={15} />;
}
