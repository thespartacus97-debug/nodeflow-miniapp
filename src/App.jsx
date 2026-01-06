import { useEffect, useMemo, useState, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
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
      // connection: { source, target }
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
    []
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
      type: "default",
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

  function deleteSelectedNode() {
    if (!selectedNodeId) return;
    const id = selectedNodeId;
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setEdges((prev) => prev.filter((e) => e.source !== id && e.target !== id));
    setSelectedNodeId(null);
  }

  // ---------- UI ----------
  if (!currentProject) {
    return (
      <div style={{ padding: 16, fontFamily: "Arial, sans-serif" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <h1 style={{ margin: 0 }}>Nodeflow</h1>
          <span style={{ opacity: 0.6, fontSize: 12 }}>
            {user ? `@${user.username || "user"} • id ${user.id}` : "guest"}
          </span>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <input
            value={newProjectTitle}
            onChange={(e) => setNewProjectTitle(e.target.value)}
            placeholder="New project name"
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 10,
              border: "1px solid #ccc",
              outline: "none",
            }}
          />
          <button
            onClick={createProject}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #ccc",
              background: "white",
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
                padding: 12,
                border: "1px solid #eee",
                borderRadius: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{ cursor: "pointer" }}
                onClick={() => setCurrentProject(p)}
              >
                <div style={{ fontWeight: 700 }}>{p.title}</div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>
                  {new Date(p.createdAt).toLocaleString()}
                </div>
              </div>

              <button
                onClick={() => deleteProject(p.id)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid #eee",
                  background: "white",
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>

        {projects.length === 0 && (
          <div style={{ marginTop: 12, opacity: 0.65 }}>
            No projects yet. Create your first one.
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div
        style={{
  padding: "8px 10px",
  borderRadius: 10,
  border: `1px solid ${theme.border}`,
  background: theme.btnBg,
  color: theme.btnText,
  fontWeight: 800,
}}

      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
  onClick={() => setCurrentProject(null)}
  style={{
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid #ddd",
    background: "#ffffff",
    color: "#111111",
  }}
>
  ← Back
</button>

          <div style={{ fontWeight: 800 }}>{currentProject.title}</div>
        </div>

        <button
  onClick={addNode}
  style={{
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid #ddd",
    background: "#ffffff",
    color: "#111111",
    fontWeight: 800,
  }}
>
  + Node
</button>

      </div>

      {/* Canvas */}
      <div style={{ flex: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          fitView
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
  borderTop: "1px solid #eee",
  fontFamily: "Arial, sans-serif",
  background: "#111111",
  color: "#ffffff",
}}

      >
        {!selectedNode ? (
          <div style={{ opacity: 0.65 }}>Tap a node to edit.</div>
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
  border: "1px solid #ccc",
  outline: "none",
  background: "#ffffff",
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
                    border: "1px solid #ddd",
                    background:
                      selectedNode.data?.status === s ? "#f2f2f2" : "white",
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
                border: "1px solid #eee",
                background: "white",
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
