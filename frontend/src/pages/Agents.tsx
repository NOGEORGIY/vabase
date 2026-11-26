import { Bot } from "lucide-react";
import { useDocumentTitle } from "../api/hooks";
import {Field, Input, Textarea} from "../ui/primitives";
import {AgentNode} from "./components/AgentNode";
import {ToolNode} from "./components/ToolNode";

import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {useCallback} from "react";

const nodeTypes = {
    agent: AgentNode,
    tool: ToolNode,
};

const initialNodes: Node[] = [
  {
    id: "agent-1",
    type: "agent",
    position: { x: 100, y: 50 },
    data: { label: "Главный агент" },
  },
];


const initialEdges: Edge[] = [
  //{ id: "e1-2", source: "agent-1", target: "agent-2", animated: true },
];

export function Agents() {
    useDocumentTitle("Агенты");
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    const addNewAgent = () => {
        const newNode: Node = {
            id: `agent-${Date.now()}`,
            type: "agent",
            position: { x: Math.random() * 400 + 100, y: Math.random() * 200 + 50 },
            data: { label: `Агент #${nodes.length + 1}` },
        };
        setNodes((nds) => nds.concat(newNode));
    };
    const addNewTool = () => {
        const newNode: Node = {
            id: `tool-${Date.now()}`,
            type: "tool",
            position: { x: Math.random() * 400 + 100, y: Math.random() * 200 + 50 },
            data: { label: `Инструмент #${nodes.length + 1}` },
        };
        setNodes((nds) => nds.concat(newNode));
    };

  return (
      <div style={{width: "100%", height: "85vh", position: "relative"}}>
          <div
              style={{
                  position: "absolute",
                  top: 16,
                  left: 16,
                  zIndex: 10,
                  display: "flex",
                  gap: 8, // отступ между кнопками
              }}
          >
              <button
                  onClick={addNewAgent}
                  style={{
                      padding: "8px 16px",
                      borderRadius: 8,
                      cursor: "pointer",
                  }}
              >
                  + Добавить агента
              </button>

              <button
                  onClick={addNewTool}
                  style={{
                      padding: "8px 16px",
                      borderRadius: 8,
                      cursor: "pointer",
                  }}
              >
                  + Добавить инструмент
              </button>
          </div>

          <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
          >
              <Background color="#000fff" gap={16} bgColor="#ffffff" />
              <Controls/>
          </ReactFlow>
      </div>
  );
}