import { useEffect, useMemo, useState, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Handle,
  Position,
} from "reactflow";


const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}
const isDark = tg?.colorScheme === "dark";

const theme = {
  bg: isDark ? "#0f0f10" : "#ffffff",
  panel: isDark ? "#151517" : "#ffffff",
  text: isDark ? "#f5f5f5" : "#111111",
  muted: isDark ? "rgba(245,245,245,0.65)" : "rgba(17,17,17,0.6)",
  border: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
  btnBg: isDark ? "#ffffff" : "#111111",
  btnText: isDark ? "#111111" : "#ffffff",
  inputBg: isDark ? "#ffffff" : "#ffffff",
  inputText: "#111111",
};

function projectsStorageKey(userId) {
  return `nodeflow:projects:${userId || "guest"}`;
}
function graphStorageKey(userId, projectId) {
  return `nodeflow:graph:${userId || "guest"}:${projectId}`;
}
function NodeCard({ data, selected, linkMode }) {
  const status = data?.status || "idea";
  const title = data?.title || "Untitled";

  const bg = "#151517";
  const border = selected ? "#6F42FF" : "rgba(255,255,255,0.10)";
  const titleColor = "#FFFFFF";
  const metaColor = "rgba(255,255,255,0.65)";

  const statusLabel =
    status === "done" ? "done" : status === "active" ? "active" : "idea";

  const statusChipBg = "rgba(255,255,255,0.10)";

  // Маленькая видимая точка
  const dotStyle = {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: linkMode ? "#6F42FF" : "rgba(255,255,255,0.25)",
    border: linkMode ? "1px solid rgba(111,66,255,0.9)" : "1px solid rgba(255,255,255,0.22)",
    boxShadow: linkMode ? "0 0 0 6px rgba(111,66,255,0.18)" : "none",
  };

  // Большая зона касания (невидимая), но с подсветкой в Link mode
  const handleStyle = {
  width: 32,
  height: 32,
  borderRadius: 999,
  background: "transparent",
  border: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};


  return (
    <div
      style={{
        minWidth: 170,
        maxWidth: 220,
        padding: 12,
        borderRadius: 14,
        background: bg,
        border: `1px solid ${border}`,
        position: "relative",
      }}
    >
      {/* TARGET: входящая связь (слева) */}
      <Handle
  type="target"
  position={Position.Left}
  style={{ ...handleStyle, left: -16 }}
>
  <div style={dotStyle} />
</Handle>


      {/* SOURCE: исходящая связь (справа) */}
      <Handle
  type="source"
  position={Position.Right}
  style={{ ...handleStyle, right: -16 }}
>
  <div style={dotStyle} />
</Handle>


      <div style={{ fontWeight: 800, color: titleColor, fontSize: 14 }}>
        {title}
      </div>

      <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
        <div
          style={{
            padding: "4px 8px",
            borderRadius: 999,
            background: statusChipBg,
            border: "1px solid rgba(255,255,255,0.10)",
            color: metaColor,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {statusLabel}
        </div>

        {selected && (
          <div style={{ color: "#6F42FF", fontSize: 12, fontWeight: 800 }}>
            selected
          </div>
        )}
      </div>
    </div>
  );
}



export default function App() {
  const user = tg?.initDataUnsafe?.user;
  const userId = user?.id;

  // ---------- Projects ----------
  const [projects, setProjects] = useState([]);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [currentProject, setCurrentProject] = useState(null);

  const pKey = useMemo(() => projectsStorageKey(userId), [userId]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(pKey);
      setProjects(raw ? JSON.parse(raw) : []);
    } catch {
      setProjects([]);
    }
  }, [pKey]);

  useEffect(() => {
    try {
      localStorage.setItem(pKey, JSON.stringify(projects));
    } catch {
      // ignore
    }
  }, [pKey, projects]);

  function createProject() {
    const name = newProjectTitle.trim();
    if (!name) return;

    const p = {
      id: crypto.randomUUID(),
      title: name,
      createdAt: Date.now(),
    };

    setProjects((prev) => [p, ...prev]);
    setNewProjectTitle("");
  }

  function deleteProject(projectId) {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    // граф проекта можно не удалять (не критично), но можно и удалить:
    try {
      localStorage.removeItem(graphStorageKey(userId, projectId));
    } catch {}
    if (currentProject?.id === projectId) setCurrentProject(null);
  }

  // ---------- Graph (React Flow) ----------
  const gKey = useMemo(
    () => (currentProject ? graphStorageKey(userId, currentProject.id) : null),
    [userId, currentProject]
  );

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [linkMode, setLinkMode] = useState(false);
  const nodeTypes = useMemo(() => ({
  card: (props) => <NodeCard {...props} linkMode={linkMode} />,
}), [linkMode]);


  // load graph when project opens
  useEffect(() => {
    if (!gKey) return;
    try {
      const raw = localStorage.getItem(gKey);
      if (!raw) {
        setNodes([]);
        setEdges([]);
        return;
      }
      const data = JSON.parse(raw);
      setNodes(Array.isArray(data.nodes) ? data.nodes : []);
      setEdges(Array.isArray(data.edges) ? data.edges : []);
    } catch {
      setNodes([]);
      setEdges([]);
    }
    setSelectedNodeId(null);
  }, [gKey]);

  // save graph
  useEffect(() => {
    if (!gKey) return;
    try {
      localStorage.setItem(gKey, JSON.stringify({ nodes, edges }));
    } catch {
      // ignore
    }
  }, [gKey, nodes, edges]);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
  (connection) => {
    if (!linkMode) return; // 🔒 only in Link mode
    setEdges((eds) =>
      addEdge(
        {
          ...connection,
          id: crypto.randomUUID(),
        },
        eds
      )
    );
  },
  [linkMode]
);


  function addNode() {
    const id = crypto.randomUUID();
    const newNode = {
      id,
      position: { x: 40, y: 40 },
      data: {
        title: "New step",
        status: "idea", // idea | active | done
      },
      type: "card",

    };
    setNodes((prev) => [newNode, ...prev]);
    setSelectedNodeId(id);
  }

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  function updateSelectedNode(patch) {
    if (!selectedNodeId) return;
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== selectedNodeId) return n;
        return {
          ...n,
          data: {
            ...n.data,
            ...patch,
          },
        };
      })
    );
  }

  function deleteSelectedEdge() {
  if (!selectedEdgeId) return;
  setEdges((prev) => prev.filter((e) => e.id !== selectedEdgeId));
  setSelectedEdgeId(null);
}


    // ---------- UI ----------
  if (!currentProject) {
    return (
      <div
        style={{
          padding: 16,
          fontFamily: "Arial, sans-serif",
          background: "#0F0F10",
          minHeight: "100dvh",
          color: "#FFFFFF",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <h1 style={{ margin: 0 }}>Nodeflow</h1>
          <span style={{ opacity: 0.6, fontSize: 12 }}>
            {user ? `@${user.username || "user"} • id ${user.id}` : "guest"}
          </span>
        </div>

        <div
          style={{
            marginTop: 16,
            display: "flex",
            gap: 8,
          }}
        >
          <input
            value={newProjectTitle}
            onChange={(e) => setNewProjectTitle(e.target.value)}
            placeholder="New project name"
            style={{
              flex: 1,
              height: 44,
              padding: "0 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "#151517",
              color: "#FFFFFF",
              outline: "none",
            }}
          />
          <button
            onClick={createProject}
            style={{
              height: 44,
              padding: "0 16px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "#6F42FF",
              color: "#FFFFFF",
              fontWeight: 700,
            }}
          >
            + Add
          </button>
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {projects.map((p) => (
            <div
              key={p.id}
              style={{
                padding: 14,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "#151517",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ cursor: "pointer" }} onClick={() => setCurrentProject(p)}>
                <div style={{ fontWeight: 700 }}>{p.title}</div>
                <div style={{ fontSize: 12, marginTop: 4, opacity: 0.6 }}>
                  {new Date(p.createdAt).toLocaleString()}
                </div>
              </div>

              <button
                onClick={() => deleteProject(p.id)}
                style={{
                  height: 32,
                  padding: "0 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "transparent",
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                Delete
              </button>
            </div>
          ))}

          {projects.length === 0 && (
            <div style={{ marginTop: 6, opacity: 0.65 }}>
              Create your first project to start thinking in flows.
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== Project Canvas (React Flow) =====
  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div
        style={{
          padding: 12,
          borderBottom: `1px solid ${theme.border}`,
          fontFamily: "Arial, sans-serif",
          background: "#0F0F10",
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setCurrentProject(null)}
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "#151517",
              color: "#FFFFFF",
            }}
          >
            ← Back
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
  <div style={{ fontWeight: 800 }}>{currentProject.title}</div>
  {linkMode && (
    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
      Link mode ON
    </div>
  )}
</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
  <button
    onClick={() => setLinkMode((v) => !v)}
    style={{
      padding: "8px 10px",
      borderRadius: 10,
      border: "1px solid rgba(255,255,255,0.12)",
      background: linkMode ? "#6F42FF" : "#151517",
      color: "#FFFFFF",
      fontWeight: 800,
    }}
  >
    Link
  </button>

  <button
    onClick={addNode}
    style={{
      padding: "8px 10px",
      borderRadius: 10,
      border: "1px solid rgba(255,255,255,0.12)",
      background: "#6F42FF",
      color: "#FFFFFF",
      fontWeight: 800,
    }}
  >
    + Node
  </button>
</div>

      </div>

      {/* Canvas */}
      <div style={{ flex: 1, background: "#0F0F10" }}>
        <ReactFlow
  nodes={nodes}
  nodeTypes={nodeTypes}
  edges={edges}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onConnect={onConnect}
  onNodeClick={(_, node) => {
  setSelectedNodeId(node.id);
  setSelectedEdgeId(null);
}}
onEdgeClick={(_, edge) => {
  if (!linkMode) return;
  setSelectedEdgeId(edge.id);
  setSelectedNodeId(null);
}}

  fitView
  panOnDrag={!linkMode}
  zoomOnScroll={!linkMode}
  panOnScroll={!linkMode}
  nodesConnectable={linkMode}
  nodesDraggable={!linkMode}
  connectionRadius={40}
          style={{ background: "#0F0F10" }}
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {/* Bottom sheet */}
      <div
        style={{
          padding: 12,
          borderTop: `1px solid ${theme.border}`,
          fontFamily: "Arial, sans-serif",
          background: "#111111",
          color: "#FFFFFF",
        }}
      >
        {!selectedNode ? (
  selectedEdgeId && linkMode ? (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ opacity: 0.65 }}>Link selected.</div>

      <button
        onClick={deleteSelectedEdge}
        style={{
          padding: "10px 8px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "#151517",
          color: "#FFFFFF",
          fontWeight: 800,
        }}
      >
        Delete link
      </button>

      <div style={{ opacity: 0.6, fontSize: 12 }}>
        Tip: tap another link to switch, or turn off Link mode.
      </div>
    </div>
  ) : (
    <div style={{ opacity: 0.65 }}>Tap a node to edit.</div>
  )
) : (
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontWeight: 800 }}>Node</div>

            <input
              value={selectedNode.data?.title || ""}
              onChange={(e) => updateSelectedNode({ title: e.target.value })}
              placeholder="Title"
              style={{
                padding: 10,
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.12)",
                outline: "none",
                background: "#FFFFFF",
                color: "#111111",
              }}
            />

            <div style={{ display: "flex", gap: 8 }}>
              {["idea", "active", "done"].map((s) => (
                <button
                  key={s}
                  onClick={() => updateSelectedNode({ status: s })}
                  style={{
                    flex: 1,
                    padding: "10px 8px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background:
                      selectedNode.data?.status === s ? "#232326" : "#151517",
                    color: "#FFFFFF",
                    fontWeight: 800,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            <button
              onClick={deleteSelectedNode}
              style={{
                padding: "10px 8px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "#151517",
                color: "#FFFFFF",
              }}
            >
              Delete node
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
