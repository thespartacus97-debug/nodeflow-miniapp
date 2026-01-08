// TEST-MARK-XYZ

import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Handle,
  Position,
  ConnectionMode,
  BaseEdge,
  getBezierPath,
} from "reactflow";
import "reactflow/dist/style.css";

// ---------- Telegram ----------
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
  inputBg: "#ffffff",
  inputText: "#111111",
};

// ---------- Storage keys ----------
function projectsStorageKey(userId) {
  return `nodeflow:projects:${userId || "guest"}`;
}
function graphStorageKey(userId, projectId) {
  return `nodeflow:graph:${userId || "guest"}:${projectId}`;
}

// ---------- Edge ----------
function NodeflowEdge(props) {
  const {
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerEnd,
    selected,
  } = props;

  const [path] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={28}
        className="react-flow__edge-interaction"
      />
      <BaseEdge
        path={path}
        markerEnd={markerEnd}
        style={{
          stroke: selected ? "#6F42FF" : "rgba(255,255,255,0.35)",
          strokeWidth: 2,
        }}
      />
    </>
  );
}

// ---------- Node ----------
function NodeCard({ data, selected, linkMode }) {
  const status = data?.status || "idea";
  const title = data?.title || "Untitled";

  const bg = "#151517";
  const border = selected ? "#6F42FF" : "rgba(255,255,255,0.10)";
  const titleColor = "#FFFFFF";
  const metaColor = "rgba(255,255,255,0.65)";
  const statusChipBg = "rgba(255,255,255,0.10)";

  const statusLabel =
    status === "done" ? "done" : status === "active" ? "active" : "idea";

  const dotStyle = {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: "#6F42FF",
    border: "1px solid rgba(111,66,255,0.9)",
    boxShadow: "0 0 0 6px rgba(111,66,255,0.18)",
    opacity: linkMode ? 1 : 0,
  };

  const baseHandle = {
    width: 34,
    height: 34,
    borderRadius: 999,
    background: "transparent",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: linkMode ? "all" : "none",
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
      {/* full receiver, but non-blocking in Link OFF */}
      <Handle
        type="target"
        position={Position.Left}
        id="target-all"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          borderRadius: 14,
          opacity: 0,
          border: "none",
          background: "transparent",
          pointerEvents: linkMode ? "all" : "none",
        }}
      />

      {/* 4 target handles */}
      <Handle type="target" position={Position.Left} id="t-left" style={{ ...baseHandle, left: -17 }}>
        <div style={dotStyle} />
      </Handle>
      <Handle type="target" position={Position.Right} id="t-right" style={{ ...baseHandle, right: -17 }}>
        <div style={dotStyle} />
      </Handle>
      <Handle type="target" position={Position.Top} id="t-top" style={{ ...baseHandle, top: -17 }}>
        <div style={dotStyle} />
      </Handle>
      <Handle type="target" position={Position.Bottom} id="t-bottom" style={{ ...baseHandle, bottom: -17 }}>
        <div style={dotStyle} />
      </Handle>

      {/* 4 source handles */}
      <Handle type="source" position={Position.Left} id="s-left" style={{ ...baseHandle, left: -17 }}>
        <div style={dotStyle} />
      </Handle>
      <Handle type="source" position={Position.Right} id="s-right" style={{ ...baseHandle, right: -17 }}>
        <div style={dotStyle} />
      </Handle>
      <Handle type="source" position={Position.Top} id="s-top" style={{ ...baseHandle, top: -17 }}>
        <div style={dotStyle} />
      </Handle>
      <Handle type="source" position={Position.Bottom} id="s-bottom" style={{ ...baseHandle, bottom: -17 }}>
        <div style={dotStyle} />
      </Handle>

      <div style={{ fontWeight: 800, color: titleColor, fontSize: 14 }}>{title}</div>

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
          <div style={{ color: "#6F42FF", fontSize: 12, fontWeight: 800 }}>selected</div>
        )}
      </div>
    </div>
  );
}

// ---------- Error boundary ----------
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, message: String(error?.message || error) };
  }
  componentDidCatch(error) {
    console.log("Nodeflow crash:", error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16, fontFamily: "Arial", background: "#0F0F10", color: "#fff", minHeight: "100dvh" }}>
          <h2 style={{ marginTop: 0 }}>Nodeflow crashed</h2>
          <div style={{ opacity: 0.8, whiteSpace: "pre-wrap" }}>{this.state.message}</div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ---------- Helpers ----------
function nearestTargetHandle({ sourceHandle }) {
  if (sourceHandle === "s-right") return "t-left";
  if (sourceHandle === "s-left") return "t-right";
  if (sourceHandle === "s-top") return "t-bottom";
  if (sourceHandle === "s-bottom") return "t-top";
  return "t-left";
}

// ---------- App ----------
function App() {
  const user = tg?.initDataUnsafe?.user;
  const userId = user?.id;

  // Projects
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
    } catch {}
  }, [pKey, projects]);

  function createProject() {
    const name = newProjectTitle.trim();
    if (!name) return;

    const p = { id: crypto.randomUUID(), title: name, createdAt: Date.now() };
    setProjects((prev) => [p, ...prev]);
    setNewProjectTitle("");
  }

  function deleteProject(projectId) {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    try {
      localStorage.removeItem(graphStorageKey(userId, projectId));
    } catch {}
    if (currentProject?.id === projectId) setCurrentProject(null);
  }

  // Graph
  const gKey = useMemo(
    () => (currentProject ? graphStorageKey(userId, currentProject.id) : null),
    [userId, currentProject]
  );

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);

  const [linkMode, setLinkMode] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [showControls, setShowControls] = useState(true);

  const rfRef = useRef(null);
  const didFitRef = useRef(false);

  const nodeTypes = useMemo(
    () => ({
      card: (props) => <NodeCard {...props} linkMode={linkMode} />,
    }),
    [linkMode]
  );
  const edgeTypes = useMemo(() => ({ nf: NodeflowEdge }), []);

  // reset "fit done" when switching projects
  useEffect(() => {
    didFitRef.current = false;
  }, [gKey]);

  // load graph
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

      const safeNodes = (Array.isArray(data.nodes) ? data.nodes : []).map((n) => {
        const x = Number(n?.position?.x);
        const y = Number(n?.position?.y);
        return {
          ...n,
          position: { x: Number.isFinite(x) ? x : 40, y: Number.isFinite(y) ? y : 40 },
          data: { title: n?.data?.title || "New step", status: n?.data?.status || "idea" },
          type: n?.type || "card",
        };
      });

      const safeEdges = (Array.isArray(data.edges) ? data.edges : [])
        .filter((e) => e && e.id && e.source && e.target)
        .map((e) => ({ ...e, type: "nf" }));

      setNodes(safeNodes);
      setEdges(safeEdges);
    } catch {
      setNodes([]);
      setEdges([]);
    }

    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, [gKey]);

  // IMPORTANT: do fitView only when we have BOTH instance and nodes
  useEffect(() => {
    if (!gKey) return;
    if (didFitRef.current) return;
    if (!rfRef.current) return;

    // even empty graph should have stable viewport
    requestAnimationFrame(() => {
      rfRef.current?.fitView({ padding: 0.25, duration: 0 });
      didFitRef.current = true;
    });
  }, [gKey, nodes.length]);

  // save graph
  useEffect(() => {
    if (!gKey) return;
    try {
      localStorage.setItem(gKey, JSON.stringify({ nodes, edges }));
    } catch {}
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
      if (!linkMode) return;
      if (connection.source === connection.target) return;

      const sourceHandle = connection.sourceHandle || "s-right";
      const targetHandle =
        !connection.targetHandle || connection.targetHandle === "target-all"
          ? nearestTargetHandle({ sourceHandle })
          : connection.targetHandle;

      setEdges((eds) =>
        addEdge(
          { ...connection, id: crypto.randomUUID(), type: "nf", sourceHandle, targetHandle },
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
      data: { title: "New step", status: "idea" },
      type: "card",
    };
    setNodes((prev) => [newNode, ...prev]);
    setSelectedNodeId(id);

    // keep minimap sane after adding
    didFitRef.current = false;
  }

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  function updateSelectedNode(patch) {
    if (!selectedNodeId) return;
    setNodes((prev) =>
      prev.map((n) => (n.id !== selectedNodeId ? n : { ...n, data: { ...n.data, ...patch } }))
    );
    didFitRef.current = false;
  }

  function deleteSelectedNode() {
    if (!selectedNodeId) return;
    setNodes((prev) => prev.filter((n) => n.id !== selectedNodeId));
    setEdges((prev) => prev.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
    didFitRef.current = false;
  }

  function deleteSelectedEdge() {
    if (!selectedEdgeId) return;
    setEdges((prev) => prev.filter((e) => e.id !== selectedEdgeId));
    setSelectedEdgeId(null);
  }

  // ---------- UI: Projects ----------
  if (!currentProject) {
    return (
      <div style={{ padding: 16, fontFamily: "Arial, sans-serif", background: "#0F0F10", minHeight: "100dvh", color: "#FFFFFF" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <h1 style={{ margin: 0 }}>Nodeflow</h1>
          <span style={{ opacity: 0.6, fontSize: 12 }}>
            {user ? `@${user.username || "user"} • id ${user.id}` : "guest"}
          </span>
        </div>

        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
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

  // ---------- UI: Canvas ----------
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
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>Link mode ON</div>
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

          <span style={{ opacity: 0.5, fontSize: 12 }}>build: 001</span>

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
      <div style={{ flex: 1, background: "#0F0F10", touchAction: "none", position: "relative" }}>
        {/* minimap viewport: stroke only */}
        <style>{`
          .react-flow__minimap-viewport {
            fill: transparent !important;
            stroke: rgba(111, 66, 255, 0.85) !important;
            stroke-width: 2px !important;
          }
        `}</style>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{ type: "nf" }}
          preventScrolling={true}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onInit={(instance) => {
            rfRef.current = instance;
            // ensure minimap/viewport is correct right after init
            didFitRef.current = false;
          }}
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
          minZoom={0.15}
          maxZoom={2}
          zoomOnPinch={true}
          zoomOnDoubleClick={false}
          panOnDrag={true}
          zoomOnScroll={!linkMode}
          panOnScroll={!linkMode}
          nodesConnectable={linkMode}
          nodesDraggable={!linkMode}
          connectionRadius={90}
          connectionMode={ConnectionMode.Loose}
          isValidConnection={(c) => c.source !== c.target}
          deleteKeyCode={null}
          multiSelectionKeyCode={null}
          selectionKeyCode={null}
          style={{ background: "#0F0F10" }}
        >
          <Background />

          {/* Controls + Handle */}
          <div style={{ position: "absolute", left: 12, bottom: 12, zIndex: 10, pointerEvents: "auto" }}>
            <button
              onClick={() => setShowControls((v) => !v)}
              style={{
                position: "absolute",
                left: 0,
                bottom: 58,
                width: 14,
                height: 34,
                borderRadius: 10,
                border: "1px solid rgba(183,183,183,0.18)",
                background: "rgba(23,23,23,0.92)",
                color: "rgba(255,255,255,0.75)",
                fontWeight: 900,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
              }}
              aria-label="Toggle controls"
            >
              {showControls ? "❮" : "❯"}
            </button>

            {showControls && (
              <div style={{ marginLeft: 22, borderRadius: 14, overflow: "hidden", border: "none", background: "transparent" }}>
                <Controls />
              </div>
            )}
          </div>

          
        </ReactFlow>
      </div>

      {/* Bottom sheet */}
      <div style={{ padding: 12, borderTop: `1px solid ${theme.border}`, fontFamily: "Arial, sans-serif", background: "#111111", color: "#FFFFFF" }}>
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
                    background: selectedNode.data?.status === s ? "#232326" : "#151517",
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

export default function AppWithBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
