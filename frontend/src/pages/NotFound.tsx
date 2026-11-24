import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { useDocumentTitle } from "../api/hooks";
import { EmptyState } from "../ui/primitives";

export function NotFound() {
  useDocumentTitle("Страница не найдена");
  return (
    <div className="card" style={{ marginTop: 40 }}>
      <EmptyState
        icon={<Compass />}
        title="Страница не найдена"
        text="Возможно, раздел переехал или ссылка устарела. Вернитесь на главную и продолжите работу."
        action={
          <Link to="/" className="btn btn-primary">
            На главную
          </Link>
        }
      />
    </div>
  );
}
