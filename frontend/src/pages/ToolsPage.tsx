import { useDocumentTitle } from "../api/hooks";
import { PageHeader } from "../ui/primitives";
import { ToolsPanel } from "./ToolsPanel";

export function ToolsPage() {
  useDocumentTitle("Инструменты");

  return (
    <>
      <PageHeader
        title="Инструменты"
        subtitle="Действия, которые смогут вызывать агенты."
      />
      <ToolsPanel />
    </>
  );
}
