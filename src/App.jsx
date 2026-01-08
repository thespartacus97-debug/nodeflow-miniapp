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
      <Handle
        type="target"
        position={Position.Left}
        id="t-left"
        style={{ ...baseHandle, left: -17 }}
      >
        <div style={dotStyle} />
      </Handle>
      <Handle
        type="target"
        position={Position.Right}
        id="t-right"
        style={{ ...baseHandle, right: -17 }}
      >
        <div style={dotStyle} />
      </Handle>
      <Handle
        type="target"
        position={Position.Top}
        id="t-top"
        style={{ ...baseHandle, top: -17 }}
      >
        <div style={dotStyle} />
      </Handle>
      <Handle
        type="target"
        position={Position.Bottom}
        id="t-bottom"
        style={{ ...baseHandle, bottom: -17 }}
      >
        <div style={dotStyle} />
      </Handle>

      {/* 4 source handles */}
      <Handle
        type="source"
        position={Position.Left}
        id="s-left"
        style={{ ...baseHandle, left: -17 }}
      >
        <div style={dotStyle} />
      </Handle>
      <Handle
        type="source"
        position={Position.Right}
        id="s-right"
        style={{ ...baseHandle, right: -17 }}
      >
        <div style={dotStyle} />
      </Handle>
      <Handle
        type="source"
        position={Position.Top}
        id="s-top"
        style={{ ...baseHandle, top: -17 }}
      >
        <div style={dotStyle} />
      </Handle>
      <Handle
        type="source"
        position={Position.Bottom}
        id="s-bottom"
        style={{ ...baseHandle, bottom: -17 }}
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
        <div
          style={{
            padding: 16,
            fontFamily: "Arial",
            background: "#0F0F10",
            color: "#fff",
            minHeight: "100dvh",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Nodeflow crashed</h2>
          <div style={{ opacity: 0.8, whiteSpace: "pre-wrap" }}>
            {this.state.message}
          </div>
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

// === NF-IDB-IMAGES-START ===
const NF_DB_NAME = "nodeflow_db";
const NF_DB_VERSION = 1;
const NF_IMAGES_STORE = "images";

function nfOpenDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(NF_DB_NAME, NF_DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(NF_IMAGES_STORE)) {
        const store = db.createObjectStore(NF_IMAGES_STORE, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function nfPutImage(blob) {
  const db = await nfOpenDb();
  const id = crypto.randomUUID();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(NF_IMAGES_STORE, "readwrite");
    tx.oncomplete = () => {
      db.close();
      resolve(id);
    };
    tx.onerror = () => {
      const err = tx.error || new Error("IndexedDB tx failed");
      db.close();
      reject(err);
    };
    tx.objectStore(NF_IMAGES_STORE).put({ id, blob, createdAt: Date.now() });
  });
}

async function nfGetImageBlob(id) {
  const db = await nfOpenDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(NF_IMAGES_STORE, "readonly");
    const req = tx.objectStore(NF_IMAGES_STORE).get(id);

    req.onsuccess = () => {
      const row = req.result;
      db.close();
      resolve(row?.blob || null);
    };
    req.onerror = () => {
      const err = req.error || new Error("IndexedDB get failed");
      db.close();
      reject(err);
    };
  });
}

async function nfDeleteImage(id) {
  const db = await nfOpenDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(NF_IMAGES_STORE, "readwrite");
    const req = tx.objectStore(NF_IMAGES_STORE).delete(id);
    req.onsuccess = () => {
      db.close();
      resolve(true);
    };
    req.onerror = () => {
      const err = req.error || new Error("IndexedDB delete failed");
      db.close();
      reject(err);
    };
  });
}

async function nfDownscaleImage(file, maxSide = 1600, quality = 0.82) {
  try {
    const img = new Image();
    const url = URL.createObjectURL(file);
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      img.src = url;
    });

    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;

    const scale = Math.min(1, maxSide / Math.max(w, h));
    const cw = Math.max(1, Math.round(w * scale));
    const ch = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, cw, ch);

    const blob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b || file), "image/jpeg", quality);
    });

    URL.revokeObjectURL(url);
    return blob;
  } catch {
    return file;
  }
}
// === NF-IDB-IMAGES-END ===

// === NF-NODE-IMAGE-THUMB-START ===
function NodeImageThumb({ imageId, getUrl, onOpen, onDelete }) {
  const [url, setUrl] = React.useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const u = await getUrl(imageId);
        if (!alive) return;
        setUrl(u);
      } catch {
        if (!alive) return;
        setUrl(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [imageId, getUrl]);

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.06)",
        aspectRatio: "1 / 1",
      }}
    >
      <button
        onClick={onDelete}
        style={{
          position: "absolute",
          top: 6,
          right: 6,
          zIndex: 2,
          width: 28,
          height: 28,
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(0,0,0,0.55)",
          color: "#fff",
          fontWeight: 900,
          cursor: "pointer",
        }}
        aria-label="Delete image"
      >
        ✕
      </button>

      <button
        onClick={async () => {
          if (url) onOpen(url);
          else {
            const u = await getUrl(imageId);
            if (u) onOpen(u);
          }
        }}
        style={{
          position: "absolute",
          inset: 0,
          border: "none",
          background: "transparent",
          padding: 0,
          cursor: "pointer",
        }}
        aria-label="Open image"
      >
        {url ? (
          <img
            src={url}
            alt="thumb"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.7,
              fontSize: 12,
            }}
          >
            Loading…
          </div>
        )}
      </button>
    </div>
  );
}
// === NF-NODE-IMAGE-THUMB-END ===

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

  // ===== Saved/Unsaved + Debounced autosave =====
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimerRef = useRef(null);

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  const clearSaveTimer = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, []);

  const saveNow = useCallback(() => {
    if (!gKey) return;
    clearSaveTimer();

    setIsSaving(true);
    try {
      localStorage.setItem(
        gKey,
        JSON.stringify({ nodes: nodesRef.current, edges: edgesRef.current })
      );
      setIsDirty(false);
    } catch {
      setIsDirty(true);
    } finally {
      setIsSaving(false);
    }
  }, [gKey, clearSaveTimer]);

  const scheduleSave = useCallback(() => {
    if (!gKey) return;

    setIsDirty(true);
    setIsSaving(true);

    clearSaveTimer();
    saveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(
          gKey,
          JSON.stringify({ nodes: nodesRef.current, edges: edgesRef.current })
        );
        setIsDirty(false);
      } catch {
        setIsDirty(true);
      } finally {
        setIsSaving(false);
        saveTimerRef.current = null;
      }
    }, 700);
  }, [gKey, clearSaveTimer]);

  useEffect(() => {
    return () => {
      if (gKey && (isDirty || isSaving)) {
        try {
          localStorage.setItem(
            gKey,
            JSON.stringify({ nodes: nodesRef.current, edges: edgesRef.current })
          );
        } catch {}
      }
      clearSaveTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gKey]);

  // === Undo/Redo engine ===
  const historyRef = useRef({ past: [], future: [], lastSig: "" });
  const [historyTick, setHistoryTick] = useState(0);

  const MAX_HISTORY = 60;
  const deepCopy = (v) => JSON.parse(JSON.stringify(v));

  const makeSig = (n, e) => {
  const ns = (n || [])
    .slice()
    .sort((a, b) => String(a.id).localeCompare(String(b.id)))
    .map((x) => {
      const px = Math.round(((x.position?.x ?? 0) * 10)) / 10;
      const py = Math.round(((x.position?.y ?? 0) * 10)) / 10;

      const d = x.data || {};
      const title = String(d.title ?? "");
      const status = String(d.status ?? "");
      const notes = String(d.notes ?? "");
      const notesKey = `${notes.length}:${notes.slice(0, 60)}`;

      const img = Array.isArray(d.imageIds) ? d.imageIds.join(",") : "";

      return `${x.id}@${px},${py}|${title}|${status}|${notesKey}|${img}`;
    })
    .join("~");

  const es = (e || [])
    .slice()
    .sort((a, b) => String(a.id).localeCompare(String(b.id)))
    .map(
      (x) =>
        `${x.id}:${x.source}:${x.target}:${x.sourceHandle || ""}:${x.targetHandle || ""}`
    )
    .join("~");

  return `${ns}||${es}`;
};


  const pushHistory = useCallback(
    (nextNodes, nextEdges) => {
      const h = historyRef.current;
      const sig = makeSig(nextNodes, nextEdges);
      if (sig === h.lastSig) return;

      h.past.push({ nodes: deepCopy(nodes), edges: deepCopy(edges) });
      if (h.past.length > MAX_HISTORY) h.past.shift();

      h.future = [];
      h.lastSig = sig;
      setHistoryTick((t) => t + 1);
    },
    [nodes, edges]
  );

  const undo = useCallback(() => {
    const h = historyRef.current;
    if (!h.past.length) return;

    const prev = h.past.pop();
    h.future.push({ nodes: deepCopy(nodes), edges: deepCopy(edges) });

    setNodes(prev.nodes);
    setEdges(prev.edges);
    h.lastSig = makeSig(prev.nodes, prev.edges);
    setHistoryTick((t) => t + 1);
    scheduleSave();
  }, [nodes, edges, scheduleSave]);

  const redo = useCallback(() => {
    const h = historyRef.current;
    if (!h.future.length) return;

    const next = h.future.pop();
    h.past.push({ nodes: deepCopy(nodes), edges: deepCopy(edges) });

    setNodes(next.nodes);
    setEdges(next.edges);
    h.lastSig = makeSig(next.nodes, next.edges);
    setHistoryTick((t) => t + 1);
    scheduleSave();
  }, [nodes, edges, scheduleSave]);

  const canUndo = useMemo(() => historyRef.current.past.length > 0, [historyTick]);
  const canRedo = useMemo(() => historyRef.current.future.length > 0, [historyTick]);

  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);

  const [linkMode, setLinkMode] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [isDetailsCollapsed, setIsDetailsCollapsed] = useState(false);

  const rfRef = useRef(null);
  const didFitRef = useRef(false);

  // === Node details (notes + images) state ===
  const [previewUrl, setPreviewUrl] = useState(null);
  const imageUrlCacheRef = useRef(new Map());
  const fileInputRef = useRef(null);

  const getImageObjectUrl = useCallback(async (imageId) => {
    const cache = imageUrlCacheRef.current;
    if (cache.has(imageId)) return cache.get(imageId);

    const blob = await nfGetImageBlob(imageId);
    if (!blob) return null;

    const url = URL.createObjectURL(blob);
    cache.set(imageId, url);
    return url;
  }, []);

  const revokeImageUrl = useCallback((imageId) => {
    const cache = imageUrlCacheRef.current;
    const url = cache.get(imageId);
    if (url) {
      URL.revokeObjectURL(url);
      cache.delete(imageId);
    }
  }, []);

  useEffect(() => {
    return () => {
      const cache = imageUrlCacheRef.current;
      for (const url of cache.values()) URL.revokeObjectURL(url);
      cache.clear();
    };
  }, [gKey]);

  const nodeTypes = useMemo(
    () => ({
      card: (props) => <NodeCard {...props} linkMode={linkMode} />,
    }),
    [linkMode]
  );

  const edgeTypes = useMemo(() => ({ nf: NodeflowEdge }), []);

  // reset on project switch
  useEffect(() => {
    didFitRef.current = false;
    historyRef.current = { past: [], future: [], lastSig: "" };
    setHistoryTick((t) => t + 1);

    clearSaveTimer();
    setIsDirty(false);
    setIsSaving(false);
    setPreviewUrl(null);
    setIsDetailsCollapsed(false);

  }, [gKey, clearSaveTimer]);

  // load graph
  useEffect(() => {
    if (!gKey) return;

    try {
      const raw = localStorage.getItem(gKey);
      if (!raw) {
        setNodes([]);
        setEdges([]);
        setIsDirty(false);
        setIsSaving(false);
        return;
      }

      const data = JSON.parse(raw);

      const safeNodes = (Array.isArray(data.nodes) ? data.nodes : []).map((n) => {
        const x = Number(n?.position?.x);
        const y = Number(n?.position?.y);
        return {
          ...n,
          position: { x: Number.isFinite(x) ? x : 40, y: Number.isFinite(y) ? y : 40 },
          data: {
            title: n?.data?.title || "New step",
            status: n?.data?.status || "idea",
            notes: typeof n?.data?.notes === "string" ? n.data.notes : "",
            imageIds: Array.isArray(n?.data?.imageIds) ? n.data.imageIds : [],
          },
          type: n?.type || "card",
        };
      });

      const safeEdges = (Array.isArray(data.edges) ? data.edges : [])
        .filter((e) => e && e.id && e.source && e.target)
        .map((e) => ({ ...e, type: "nf" }));

      setNodes(safeNodes);
      setEdges(safeEdges);
      setIsDirty(false);
      setIsSaving(false);
    } catch {
      setNodes([]);
      setEdges([]);
      setIsDirty(false);
      setIsSaving(false);
    }

    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, [gKey]);

  // fitView once
  useEffect(() => {
    if (!gKey) return;
    if (didFitRef.current) return;
    if (!rfRef.current) return;

    requestAnimationFrame(() => {
      rfRef.current?.fitView({ padding: 0.25, duration: 0 });
      didFitRef.current = true;
    });
  }, [gKey, nodes.length]);

  // hotkeys
  useEffect(() => {
    const handler = (e) => {
      const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (!mod) return;

      const key = e.key.toLowerCase();

      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (key === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handler, { passive: false });
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  // handlers
  const onNodesChange = useCallback(
    (changes) => {
      const meaningful = changes.some(
        (c) => c.type === "position" || c.type === "dimensions" || c.type === "remove" || c.type === "add"
      );

      setNodes((nds) => {
        const next = applyNodeChanges(changes, nds);
        if (meaningful) pushHistory(next, edges);
        return next;
      });

      if (meaningful) scheduleSave();
    },
    [pushHistory, edges, scheduleSave]
  );

  const onEdgesChange = useCallback(
    (changes) => {
      const meaningful = changes.some((c) => c.type === "remove" || c.type === "add");

      setEdges((eds) => {
        const next = applyEdgeChanges(changes, eds);
        if (meaningful) pushHistory(nodes, next);
        return next;
      });

      if (meaningful) scheduleSave();
    },
    [pushHistory, nodes, scheduleSave]
  );

  const onConnect = useCallback(
    (params) => {
      setEdges((eds) => {
        const next = addEdge(params, eds);
        pushHistory(nodes, next);
        return next;
      });
      scheduleSave();
    },
    [pushHistory, nodes, scheduleSave]
  );

  function addNode() {
    pushHistory(nodes, edges);

    const id = crypto.randomUUID();
    const newNode = {
      id,
      position: { x: 40, y: 40 },
      data: { title: "New step", status: "idea", notes: "", imageIds: [] },
      type: "card",
    };
    setNodes((prev) => [newNode, ...prev]);
    setSelectedNodeId(id);
    didFitRef.current = false;
    scheduleSave();
  }

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  function updateSelectedNode(patch) {
    if (!selectedNodeId) return;
    pushHistory(nodes, edges);

    setNodes((prev) =>
      prev.map((n) => (n.id !== selectedNodeId ? n : { ...n, data: { ...n.data, ...patch } }))
    );

    didFitRef.current = false;
    scheduleSave();
  }

  function updateSelectedNodeNotes(nextNotes, { commit = false } = {}) {
  if (!selectedNodeId) return;

  // Историю пишем только "commit" (например, когда ушли из поля)
  if (commit) pushHistory(nodes, edges);

  setNodes((prev) =>
    prev.map((n) =>
      n.id !== selectedNodeId
        ? n
        : { ...n, data: { ...n.data, notes: String(nextNotes ?? "") } }
    )
  );

  scheduleSave();
}


  async function addImagesToSelectedNode(files) {
    if (!selectedNodeId) return;
    if (!files || files.length === 0) return;

    const MAX_IMAGES_PER_NODE = 10;

    const current = nodes.find((n) => n.id === selectedNodeId);
    const existing = Array.isArray(current?.data?.imageIds) ? current.data.imageIds : [];
    if (existing.length >= MAX_IMAGES_PER_NODE) return;

    pushHistory(nodes, edges);

    const toAdd = Array.from(files).slice(0, Math.max(0, MAX_IMAGES_PER_NODE - existing.length));

    try {
      const newIds = [];
      for (const f of toAdd) {
        const downscaled = await nfDownscaleImage(f, 1600, 0.82);
        const id = await nfPutImage(downscaled);
        newIds.push(id);
      }

      setNodes((prev) =>
        prev.map((n) => {
          if (n.id !== selectedNodeId) return n;
          const prevIds = Array.isArray(n?.data?.imageIds) ? n.data.imageIds : [];
          return { ...n, data: { ...n.data, imageIds: [...prevIds, ...newIds] } };
        })
      );

      scheduleSave();
    } catch (e) {
      console.log("addImagesToSelectedNode error:", e);
    }
  }

  async function deleteImageFromSelectedNode(imageId) {
    if (!selectedNodeId || !imageId) return;

    pushHistory(nodes, edges);

    try {
      setNodes((prev) =>
        prev.map((n) => {
          if (n.id !== selectedNodeId) return n;
          const prevIds = Array.isArray(n?.data?.imageIds) ? n.data.imageIds : [];
          return { ...n, data: { ...n.data, imageIds: prevIds.filter((id) => id !== imageId) } };
        })
      );

      await nfDeleteImage(imageId);
      revokeImageUrl(imageId);
      scheduleSave();
    } catch (e) {
      console.log("deleteImageFromSelectedNode error:", e);
    }
  }

  function deleteSelectedNode() {
    if (!selectedNodeId) return;
    pushHistory(nodes, edges);

    const removingId = selectedNodeId;
    const current = nodes.find((n) => n.id === removingId);
    const imgs = Array.isArray(current?.data?.imageIds) ? current.data.imageIds : [];

    setNodes((prev) => prev.filter((n) => n.id !== removingId));
    setEdges((prev) => prev.filter((e) => e.source !== removingId && e.target !== removingId));
    setSelectedNodeId(null);

    didFitRef.current = false;
    scheduleSave();

    // best-effort cleanup blobs
    (async () => {
      try {
        for (const id of imgs) {
          await nfDeleteImage(id);
          revokeImageUrl(id);
        }
      } catch {}
    })();
  }

  function deleteSelectedEdge() {
    if (!selectedEdgeId) return;
    pushHistory(nodes, edges);

    setEdges((prev) => prev.filter((e) => e.id !== selectedEdgeId));
    setSelectedEdgeId(null);
    scheduleSave();
  }

  // ---------- UI: Projects ----------
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
  const saveLabel = isSaving ? "Saving…" : isDirty ? "Unsaved" : "Saved";
  const saveChipBg = isSaving
    ? "rgba(111,66,255,0.18)"
    : isDirty
      ? "rgba(255,180,0,0.18)"
      : "rgba(0,255,160,0.14)";
  const saveChipBorder = isSaving
    ? "rgba(111,66,255,0.35)"
    : isDirty
      ? "rgba(255,180,0,0.35)"
      : "rgba(0,255,160,0.30)";
  const saveChipText = isSaving
    ? "rgba(210,200,255,1)"
    : isDirty
      ? "rgba(255,220,150,1)"
      : "rgba(160,255,220,1)";

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", position: "relative" }}>
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
            onClick={() => {
              if (isDirty || isSaving) saveNow();
              setCurrentProject(null);
            }}
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

            <div
              style={{
                fontSize: 12,
                padding: "4px 8px",
                borderRadius: 999,
                border: `1px solid ${saveChipBorder}`,
                background: saveChipBg,
                color: saveChipText,
                fontWeight: 800,
              }}
              title="Autosave status"
            >
              {saveLabel}
            </div>

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
      <div style={{ flex: 1, background: "#0F0F10", touchAction: "none", position: "relative" }}>
        {/* Undo/Redo */}
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            zIndex: 50,
            display: "flex",
            gap: 8,
          }}
        >
          <button
            onClick={undo}
            disabled={!canUndo}
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.35)",
              color: "white",
              opacity: canUndo ? 1 : 0.5,
            }}
          >
            Undo
          </button>

          <button
            onClick={redo}
            disabled={!canRedo}
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.35)",
              color: "white",
              opacity: canRedo ? 1 : 0.5,
            }}
          >
            Redo
          </button>
        </div>

        {/* Hidden input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => {
            const files = e.target.files;
            if (files && files.length) addImagesToSelectedNode(files);
            e.target.value = "";
          }}
        />

        {/* Preview modal */}
        {previewUrl && (
          <div
            onClick={() => setPreviewUrl(null)}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 200,
              background: "rgba(0,0,0,0.72)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <img
              src={previewUrl}
              alt="preview"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.12)",
              }}
              onClick={(ev) => ev.stopPropagation()}
            />
          </div>
        )}

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

          {/* Controls */}
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
<div
  style={{
    padding: 12,
    borderTop: `1px solid ${theme.border}`,
    fontFamily: "Arial, sans-serif",
    background: "#111111",
    color: "#FFFFFF",
    maxHeight: isDetailsCollapsed ? 56 : "46dvh",
    paddingTop: 22,
overflow: "visible",

    overflowY: isDetailsCollapsed ? "hidden" : "auto",
    WebkitOverflowScrolling: "touch",
    transition: "max-height 180ms ease",
    position: "relative",
  }}
>

{selectedNode && (
  <button
    onClick={() => setIsDetailsCollapsed((v) => !v)}
    style={{
      position: "absolute",
      top: -14,
      left: "50%",
      transform: "translateX(-50%)",
      height: 28,
      width: 56,
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,0.14)",
      background: "rgba(21,21,23,0.92)",
      color: "rgba(255,255,255,0.85)",
      fontWeight: 900,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 30,
    }}
    aria-label={isDetailsCollapsed ? "Expand panel" : "Collapse panel"}
    title={isDetailsCollapsed ? "Expand" : "Collapse"}
  >
    {isDetailsCollapsed ? "▴" : "▾"}
  </button>
)}




        {isDetailsCollapsed ? null : !selectedNode ? (

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

            {/* Notes */}
            <textarea
              value={selectedNode.data?.notes || ""}
              onChange={(e) => updateSelectedNodeNotes(e.target.value, { commit: false })}
onBlur={(e) => updateSelectedNodeNotes(e.target.value, { commit: true })}

              placeholder="Notes (internal text, not shown on the node)"
              rows={5}
              style={{
                padding: 10,
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.12)",
                outline: "none",
                background: "#FFFFFF",
                color: "#111111",
                resize: "vertical",
                fontFamily: "Arial, sans-serif",
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

            {/* Images */}
<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
  <div style={{ fontWeight: 800 }}>Images</div>
  <button
    onClick={() => fileInputRef.current?.click()}
    style={{
      padding: "8px 10px",
      borderRadius: 10,
      border: "1px solid rgba(255,255,255,0.12)",
      background: "#151517",
      color: "#FFFFFF",
      fontWeight: 800,
    }}
  >
    + Add image
  </button>
</div>

{/* Scroll area for many images */}
<div
  style={{
    maxHeight: 260,
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    paddingRight: 4,
    marginTop: 8,
  }}
>
  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
    {(Array.isArray(selectedNode.data?.imageIds) ? selectedNode.data.imageIds : []).map((imgId) => (
      <NodeImageThumb
        key={imgId}
        imageId={imgId}
        getUrl={getImageObjectUrl}
        onOpen={(url) => setPreviewUrl(url)}
        onDelete={() => deleteImageFromSelectedNode(imgId)}
      />
    ))}
  </div>

  {(Array.isArray(selectedNode.data?.imageIds) ? selectedNode.data.imageIds.length : 0) === 0 && (
    <div style={{ opacity: 0.65, fontSize: 12, marginTop: 8 }}>
      No images yet. Add one from your gallery.
    </div>
  )}
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

              {isDetailsCollapsed && (
  <div style={{ opacity: 0.75, fontSize: 12, paddingTop: 18 }}>
    Node details скрыты — нажми ▴ чтобы открыть
  </div>
)}

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
