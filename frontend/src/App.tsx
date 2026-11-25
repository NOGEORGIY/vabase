import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { type ReactNode } from "react";
import { useAuth } from "./context/AuthContext";
import { AppLayout } from "./layout/AppLayout";
import { Brand } from "./layout/Logo";
import { Agents } from "./pages/Agents";
import { Login } from "./pages/Login";
import { Prompts } from "./pages/Prompts";
import { ToolsPage } from "./pages/ToolsPage";

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
        <Route index element={<Navigate to="/agents" replace />} />
        <Route path="agents" element={<Agents />} />
        <Route path="tools" element={<ToolsPage />} />
        <Route path="prompts" element={<Prompts />} />
        <Route path="*" element={<Navigate to="/agents" replace />} />
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
