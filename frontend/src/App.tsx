import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { type ReactNode } from "react";
import {
  Contact,
  GitBranch,
  MessagesSquare,
  Radio,
  Workflow,
} from "lucide-react";
import { useAuth } from "./context/AuthContext";
import { AppLayout } from "./layout/AppLayout";
import { ProjectLayout } from "./layout/ProjectLayout";
import { Home } from "./pages/Home";
import { InfoModel } from "./pages/InfoModel";
import { InterpretedData } from "./pages/InterpretedData";
import { Login } from "./pages/Login";
import { NotFound } from "./pages/NotFound";
import { ProjectAssistants } from "./pages/ProjectAssistants";
import { ProjectEntities } from "./pages/ProjectEntities";
import { ProjectOverview } from "./pages/ProjectOverview";
import { ProjectResources } from "./pages/ProjectResources";
import { ProjectSection } from "./pages/ProjectSection";
import { Projects } from "./pages/Projects";
import { PromptEngineering } from "./pages/PromptEngineering";
import { SearchResults } from "./pages/SearchResults";
import { Services } from "./pages/Services";
import { Brand } from "./layout/Logo";

function Protected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-shell" style={{ display: "block" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 18,
          }}
        >
          <Brand />
          <span className="spinner dark" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <Protected>
            <AppLayout />
          </Protected>
        }
      >
        <Route index element={<Home />} />
        <Route path="projects" element={<Projects />} />
        <Route path="services" element={<Services />} />
        <Route
          path="prompt-engineering"
          element={<Navigate to="/prompt-engineering/prompts" replace />}
        />
        <Route path="prompt-engineering/:tab" element={<PromptEngineering />} />
        <Route path="info-model" element={<Navigate to="/info-model/categories" replace />} />
        <Route path="info-model/:tab" element={<InfoModel />} />
        <Route
          path="interpreted-data"
          element={<Navigate to="/interpreted-data/dictionaries" replace />}
        />
        <Route path="interpreted-data/:tab" element={<InterpretedData />} />
        <Route path="search" element={<SearchResults />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route
        path="/projects/:projectId"
        element={
          <Protected>
            <ProjectLayout />
          </Protected>
        }
      >
        <Route index element={<ProjectOverview />} />
        <Route path="assistants" element={<ProjectAssistants />} />
        <Route path="entities" element={<ProjectEntities />} />
        <Route path="components" element={<ProjectResources />} />
        <Route
          path="channels"
          element={
            <ProjectSection
              title="Каналы связи"
              description="Подключение внешних каналов, через которые приходят обращения."
              icon={<Radio />}
              features={[
                "Telegram, WhatsApp, веб-чат и почта в одном списке",
                "Маршрутизация входящих обращений",
                "Единый журнал диалогов",
                "Привязка канала к сценарию проекта",
              ]}
              note="Канал станет точкой входа для агента: задача будет попадать в подсистему вместе с контекстом диалога."
            />
          }
        />
        <Route
          path="dialog"
          element={
            <ProjectSection
              title="Разговорный интерфейс"
              description="Сценарий общения с пользователем: приветствие, вопросы и ответы."
              icon={<MessagesSquare />}
              features={[
                "Приветствие и стартовое меню",
                "Сбор контактных данных",
                "Передача оператору",
                "Настройка тона и языка ответа",
              ]}
            />
          }
        />
        <Route
          path="dialog-control"
          element={
            <ProjectSection
              title="Управление диалогом"
              description="Правила ветвления, таймауты и эскалация внутри диалога."
              icon={<GitBranch />}
              features={[
                "Правила ветвления диалога",
                "Ожидание ответа и таймауты",
                "Эскалация к оператору",
                "Условия завершения диалога",
              ]}
            />
          }
        />
        <Route
          path="crm"
          element={
            <ProjectSection
              title="CRM компонент"
              description="Данные клиентов, история обращений и интеграция с CRM."
              icon={<Contact />}
              features={[
                "Карточка клиента и история обращений",
                "Сделки и задачи",
                "Синхронизация с внешней CRM",
                "Права доступа к полям карточки",
              ]}
            />
          }
        />
        <Route
          path="scenarios"
          element={
            <ProjectSection
              title="Редактор сценариев"
              description="Визуальный конструктор процессов из узлов и связей."
              icon={<Workflow />}
              features={[
                "Поле графа с узлами и связями",
                "Узел «AI Agent» для вызова подсистемы агентов",
                "Узел «Вызов инструмента» из реестра",
                "Запуск, отладка и публикация версии",
              ]}
              note="Агент подключается как обычный узел сценария с входами и выходами — после появления вкладки «Ассистенты»."
            />
          }
        />
        <Route
          path="scenarios-2"
          element={
            <ProjectSection
              title="Редактор сценариев 2"
              description="Экспериментальная площадка для второй версии конструктора."
              icon={<Workflow />}
              features={[
                "Импорт сценария из основного редактора",
                "Новые типы узлов",
                "Песочница для отладки",
              ]}
            />
          }
        />
        <Route path="*" element={<Navigate to="." replace />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
