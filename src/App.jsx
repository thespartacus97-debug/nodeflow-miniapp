// NodeFlow v2026-01-13-UNITY
// 1. Цвет ноды внутри data.color
// 2. Линии – строго к handle, перетаскивание за ребро
// 3. Новая нода – в центре видимого экрана, а не в куче
// 4. В свёрнутой панели – название ноды
// 5. Кнопка «центр проекта» в левом нижнем углу (вне панели)
// 6. Превью картинок → полный экран → pinch-to-zoom
// 7. Notes на весь экран – аккуратный белый блок

import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import ReactFlow, {
  Background,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Handle,
  Position,
  ConnectionMode,
  BaseEdge,
  getBezierPath,
  useReactFlow,        // для центра новой ноды
} from "reactflow";
import "reactflow/dist/style.css";

/* ---------- Telegram ---------- */
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}
const isDark = tg?.colorScheme === "dark";

/* ---------- 1. ТЕМЫ ---------- */
const theme = {
  bg: isDark ? "#0f0f10" : "#ffffff",
  panel: isDark ? "#151517" : "#ffffff",
  text: isDark ? "#f5f5f5" : "#111111",
  muted: isDark ? "rgba(245,245,245,0.65)" : "rgba(17,17,17,0.6)",
  border: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
};

/* ---------- 2. ХРАНИЛИЩЕ ---------- */
function projectsStorageKey(userId) {
  return `nodeflow:projects:${userId || "guest"}`;
}
function graphStorageKey(userId, projectId) {
  return `nodeflow:graph:${userId || "guest"}:${projectId}`;
}

/* ---------- 3. IndexedDB ДЛЯ КАРТИНОК ---------- */
const NF_DB_NAME = "nodeflow-db";
const NF_DB_VERSION = 1;
const NF_STORE = "images";

function nfOpenDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(NF_DB_NAME, NF_DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(NF_STORE)) {
        db.createObjectStore(NF_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function nfPutImage(id, blob) {
  const db = await nfOpenDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(NF_STORE, "readwrite");
    tx.objectStore(NF_STORE).put({ id, blob, createdAt: Date.now() });
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
async function nfGetImageBlob(id) {
  const db = await nfOpenDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(NF_STORE, "readonly");
    const req = tx.objectStore(NF_STORE).get(id);
    req.onsuccess = () => resolve(req.result?.blob || null);
    req.onerror = () => reject(req.error);
  });
}
async function nfDeleteImage(id) {
  const db = await nfOpenDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(NF_STORE, "readwrite");
    tx.objectStore(NF_STORE).delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
async function nfDownscaleImage(file, maxSide = 1600, quality = 0.85) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * scale));
  const h = Math.max(1, Math.round(bmp.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bmp, 0, 0, w, h);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  return blob || file;
}

/* ---------- 4. КАСТОМНОЕ РЕБРО ---------- */
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
      {/* невидимый широкий слой для тача */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={28}
        className="react-flow__edge-interaction"
      />
      {/* видимая линия */}
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

/* ---------- 5. КАСТОМНАЯ НОДА ---------- */
function NodeCard({ data, selected, linkMode }) {
  const status = data?.status || "idea";
  const title = data?.title || "Untitled";
  /* 1. Цвет ноды берём из data.color (если нет – чёрный) */
  const bg = data?.color || "#151517";

  const border = selected ? "#6F42FF" : "rgba(255,255,255,0.10)";
  const titleColor = "#FFFFFF";
  const metaColor = "rgba(255,255,255,0.65)";

  const statusLabel = status === "done" ? "done" : status === "active" ? "active" : "idea";

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
        background: bg,              // ← цвет ноды
        border: `1px solid ${border}`,
        position: "relative",
      }}
    >
      {/* 4 стороны магнитов */}
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
      {/* и sources */}
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
            background: "rgba(255,255,255,0.10)",
            border: "1px solid rgba(255,255,255,0.10)",
            color: metaColor,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {statusLabel}
        </div>
        {selected && <div style={{ color: "#6F42FF", fontSize: 12, fontWeight: 800 }}>selected</div>}
      </div>
    </div>
  );
}

/* ---------- 6. ПРЕВЬЮ КАРТИНОК + ПОЛНЫЙ ЭКРАН ---------- */
function NodeImageThumb({ imageId, getUrl, onOpen, onDelete }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      const u = await getUrl(imageId);
      if (!alive) return;
      setUrl(u);
    })();
    return () => { alive = false; };
  }, [imageId, getUrl]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1 / 1",
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.06)",
      }}
    >
      <button onClick={onDelete} style={{ position: "absolute", top: 6, right: 6, width: 28, height: 28, borderRadius: 10, border: "1px solid rgba(255,255,255,0.16)", background: "rgba(0,0,0,0.45)", color: "#fff", fontWeight: 900, cursor: "pointer", zIndex: 3 }} aria-label="Delete image" title="Delete">✕</button>
      <button onClick={() => url && onOpen(url)} style={{ position: "absolute", inset: 0, border: "none", background: "transparent", padding: 0, cursor: "pointer" }} aria-label="Open image" />
      {url ? <img src={url} alt="thumb" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : null}
    </div>
  );
}

/* ---------- 7. ОШИБКИ ---------- */
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, message: "" }; }
  static getDerivedStateFromError(error) { return { hasError: true, message: String(error?.message || error) }; }
  componentDidCatch(error) { console.log("Nodeflow crash:", error); }
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

/* ---------- 8. ГЛАВНЫЙ КОМПОНЕНТ ---------- */
function App() {
  const user = tg?.initDataUnsafe?.user;
  const userId = user?.id;

  /* ---------- 8a. ПРОЕКТЫ ---------- */
  const [projects, setProjects] = useState([]);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [currentProject, setCurrentProject] = useState(null);
  const pKey = useMemo(() => projectsStorageKey(userId), [userId]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(pKey);
      setProjects(raw ? JSON.parse(raw) : []);
    } catch { setProjects([]); }
  }, [pKey]);
  useEffect(() => {
    try { localStorage.setItem(pKey, JSON.stringify(projects)); } catch {}
  }, [pKey, projects]);

  function createProject() {
    const name = newProjectTitle.trim();
    if (!name) return;
    const p = { id: crypto.randomUUID(), title: name, createdAt: Date.now() };
    setProjects(prev => [p, ...prev]);
    setNewProjectTitle("");
  }
  function deleteProject(projectId) {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    try { localStorage.removeItem(graphStorageKey(userId, projectId)); } catch {}
    if (currentProject?.id === projectId) setCurrentProject(null);
  }

  /* ---------- 8b. ГРАФ ---------- */
  const { projectViewport } = useReactFlow();   // для центра экрана
  const gKey = useMemo(() => (currentProject ? graphStorageKey(userId, currentProject.id) : null), [userId, currentProject]);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [linkMode, setLinkMode] = useState(false);
  const [isDetailsCollapsed, setIsDetailsCollapsed] = useState(false);

  /* ---------- 8c. ПРЕВЬЮ / МОДАЛЬНЫЕ СОСТОЯНИЯ ---------- */
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isNotesFullscreen, setIsNotesFullscreen] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);        // для полноэкранного зума
  const fileInputRef = useRef(null);
  const rfRef = useRef(null);
  const didFitRef = useRef(false);

  /* ---------- 8d. СОХРАНЕНИЕ ---------- */
  const [saveState, setSaveState] = useState("saved");
  const saveTimerRef = useRef(null);
  const scheduleSave = useCallback(() => {
    setSaveState("saving");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setSaveState("saved"), 350);
  }, []);
  useEffect(() => () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); }, []);

  /* ---------- 8e. КЭШ КАРТИНОК ---------- */
  const imageUrlCacheRef = useRef(new Map());
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
    if (url) URL.revokeObjectURL(url);
    cache.delete(imageId);
  }, []);

  /* ---------- 8f. ЗАГРУЗКА ГРАФА ---------- */
  useEffect(() => {
    if (!gKey) { setNodes([]); setEdges([]); return; }
    try {
      const raw = localStorage.getItem(gKey);
      if (!raw) { setNodes([]); setEdges([]); }
      else {
        const data = JSON.parse(raw);
        const safeNodes = (Array.isArray(data.nodes) ? data.nodes : []).map(n => {
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
              color: n?.data?.color || "#151517",   // цвет ноды
            },
            type: n?.type || "card",
          };
        });
        const safeEdges = (Array.isArray(data.edges) ? data.edges : []).filter(e => e && e.id && e.source && e.target).map(e => ({ ...e, type: "nf" }));
        setNodes(safeNodes);
        setEdges(safeEdges);
      }
    } catch { setNodes([]); setEdges([]); }

    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setIsDetailsCollapsed(false);
    setPreviewUrl(null);
    setIsNotesFullscreen(false);
    setZoomImage(null);
    for (const [id] of imageUrlCacheRef.current.entries()) revokeImageUrl(id);
  }, [gKey, revokeImageUrl]);

  /* ---------- 8g. СОХРАНЕНИЕ ГРАФА ---------- */
  useEffect(() => {
    if (!gKey) return;
    try { localStorage.setItem(gKey, JSON.stringify({ nodes, edges })); scheduleSave(); } catch {}
  }, [gKey, nodes, edges, scheduleSave]);

  /* ---------- 8h. FIT ПРИ ОТКРЫТИИ ---------- */
  useEffect(() => {
    if (!gKey) return;
    if (didFitRef.current) return;
    if (!rfRef.current) return;
    requestAnimationFrame(() => {
      rfRef.current?.fitView({ padding: 0.25, duration: 0 });
      didFitRef.current = true;
    });
  }, [gKey, nodes.length]);

  /* ---------- 8i. ОБРАБОТЧИКИ РЕБЁР ---------- */
  const onNodesChange = useCallback(changes => setNodes(nds => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback(changes => setEdges(eds => applyEdgeChanges(changes, eds)), []);
  const onConnect = useCallback(params => setEdges(eds => addEdge({ ...params, type: "nf" }, eds)), []);

  /* ---------- 8j. ПЕРЕПОДКЛЮЧЕНИЕ РЕБЁР (отрыв за линию) ---------- */
  const onReconnect = useCallback((oldEdge, newConn) => {
    setEdges(eds => {
      const noOld = eds.filter(e => e.id !== oldEdge.id);
      return addEdge({ ...oldEdge, ...newConn }, noOld);
    });
  }, []);

  /* ---------- 8k. ДОБАВЛЕНИЕ НОДЫ – В ЦЕНТР ЭКРАНА ---------- */
  const addNode = useCallback(() => {
    const id = crypto.randomUUID();
    // центр видимого окна
    const { x, y, zoom } = rfRef.current.getViewport();
    const centerX = -x + window.innerWidth  / (2 * zoom);
    const centerY = -y + window.innerHeight / (2 * zoom);

    const newNode = {
      id,
      position: { x: centerX, y: centerY },
      data: { title: "New step", status: "idea", notes: "", imageIds: [], color: "#151517" },
      type: "card",
    };
    setNodes(prev => [newNode, ...prev]);
    setSelectedNodeId(id);
    setSelectedEdgeId(null);
    didFitRef.current = false;
  }, []);

  /* ---------- 8l. РАБОТА С ВЫБРАННОЙ НОДОЙ ---------- */
  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId) || null, [nodes, selectedNodeId]);

  function updateSelectedNode(patch) {
    if (!selectedNodeId) return;
    setNodes(prev =>
      prev.map(n => (n.id !== selectedNodeId ? n : { ...n, data: { ...n.data, ...patch } }))
    );
    scheduleSave();
  }
  function updateSelectedNodeNotes(nextNotes) {
    if (!selectedNodeId) return;
    setNodes(prev =>
      prev.map(n =>
        n.id !== selectedNodeId ? n : { ...n, data: { ...n.data, notes: String(nextNotes ?? "") } }
      )
    );
    scheduleSave();
  }
  async function addImagesToSelectedNode(files) {
    if (!selectedNodeId) return;
    if (!files || files.length === 0) return;
    const ids = [];
    for (const f of files) {
      const id = crypto.randomUUID();
      const blob = await nfDownscaleImage(f);
      await nfPutImage(id, blob);
      ids.push(id);
    }
    setNodes(prev =>
      prev.map(n => {
        if (n.id !== selectedNodeId) return n;
        const curr = Array.isArray(n.data?.imageIds) ? n.data.imageIds : [];
        return { ...n, data: { ...n.data, imageIds: [...curr, ...ids] } };
      })
    );
    scheduleSave();
  }
  async function deleteImageFromSelectedNode(imageId) {
    if (!selectedNodeId) return;
    setNodes(prev =>
      prev.map(n => {
        if (n.id !== selectedNodeId) return n;
        const curr = Array.isArray(n.data?.imageIds) ? n.data.imageIds : [];
        return { ...n, data: { ...n.data, imageIds: curr.filter(x => x !== imageId) } };
      })
    );
    try { await nfDeleteImage(imageId); } catch {}
    revokeImageUrl(imageId);
    scheduleSave();
  }
  function deleteSelectedNode() {
    if (!selectedNodeId) return;
    setNodes(prev => prev.filter(n => n.id !== selectedNodeId));
    setEdges(prev => prev.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setIsDetailsCollapsed(false);
    scheduleSave();
  }
  function deleteSelectedEdge() {
    if (!selectedEdgeId) return;
    setEdges(prev => prev.filter(e => e.id !== selectedEdgeId));
    setSelectedEdgeId(null);
    scheduleSave();
  }

  /* ---------- 8m. TYPES ---------- */
  const nodeTypes = useMemo(() => ({ card: props => <NodeCard {...props} linkMode={linkMode} /> }), [linkMode]);
  const edgeTypes = useMemo(() => ({ nf: NodeflowEdge }), []);

  /* ---------- 8n. UI: СПИСОК ПРОЕКТОВ ---------- */
  if (!currentProject) {
    return (
      <div style={{ padding: 16, fontFamily: "Arial, sans-serif", background: "#0F0F10", minHeight: "100dvh", color: "#FFFFFF" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <h1 style={{ margin: 0 }}>Nodeflow</h1>
          <span style={{ opacity: 0.6, fontSize: 12 }}>{user ? `@${user.username || "user"} • id ${user.id}` : "guest"}</span>
        </div>
        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <input value={newProjectTitle} onChange={e => setNewProjectTitle(e.target.value)} placeholder="New project name" style={{ flex: 1, height: 44, padding: "0 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "#151517", color: "#FFFFFF", outline: "none" }} />
          <button onClick={createProject} style={{ height: 44, padding: "0 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "#6F42FF", color: "#FFFFFF", fontWeight: 700 }}>+ Add</button>
        </div>
        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {projects.map(p => (
            <div key={p.id} style={{ padding: 14, borderRadius: 14, border: "1px solid rgba(255,255,255,0.10)", background: "#151517", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ cursor: "pointer" }} onClick={() => setCurrentProject(p)}>
                <div style={{ fontWeight: 700 }}>{p.title}</div>
                <div style={{ fontSize: 12, marginTop: 4, opacity: 0.6 }}>{new Date(p.createdAt).toLocaleString()}</div>
              </div>
              <button onClick={() => deleteProject(p.id)} style={{ height: 32, padding: "0 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "rgba(255,255,255,0.7)" }}>Delete</button>
            </div>
          ))}
          {projects.length === 0 && <div style={{ marginTop: 6, opacity: 0.65 }}>Create your first project to start thinking in flows.</div>}
        </div>
      </div>
    );
  }

  /* ---------- 8o. UI: КАНВАС + ПАНЕЛЬ ---------- */
  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{ padding: 12, borderBottom: `1px solid ${theme.border}`, fontFamily: "Arial, sans-serif", background: "#0F0F10", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flex: "0 0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setCurrentProject(null)} style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "#151517", color: "#FFFFFF" }}>← Back</button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontWeight: 900 }}>{currentProject.title}</div>
            <div style={{ padding: "6px 10px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.10)", background: saveState === "saved" ? "rgba(16,185,129,0.18)" : "rgba(255,255,255,0.08)", color: saveState === "saved" ? "#34D399" : "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: 900 }}>{saveState === "saved" ? "Saved" : "Saving"}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setLinkMode(v => !v)} style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: linkMode ? "#6F42FF" : "#151517", color: "#FFFFFF", fontWeight: 800 }}>Link</button>
          <button onClick={addNode} style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "#6F42FF", color: "#FFFFFF", fontWeight: 800 }}>+ Node</button>
        </div>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, background: "#0F0F10", touchAction: "none", position: "relative", paddingBottom: selectedNode ? (isDetailsCollapsed ? `calc(60px + env(safe-area-inset-bottom))` : `calc(46dvh + env(safe-area-inset-bottom))`) : `env(safe-area-inset-bottom)`, boxSizing: "border-box" }}>
        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={async e => { const files = Array.from(e.target.files || []); e.target.value = ""; await addImagesToSelectedNode(files); }} />

        {/* 5. КНОПКА «ЦЕНТР ПРОЕКТА» (вне панели, левый нижний угол) */}
        <button
          onClick={() => rfRef.current?.fitView({ padding: 0.25, duration: 250 })}
          title="Center project"
          style={{
            position: "absolute",
            left: 16,
            bottom: `calc(16px + env(safe-area-inset-bottom))`,
            zIndex: 110,
            width: 44,
            height: 44,
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.16)",
            background: "rgba(21,21,23,0.96)",
            color: "#fff",
            fontWeight: 900,
            cursor: "pointer",
            boxShadow: "0 8px 22px rgba(0,0,0,0.45)",
          }}
          aria-label="Center project"
        >
          ⌖
        </button>

        {/* 6. ПРЕВЬЮ КАРТИНОК → ПОЛНЫЙ ЭКРАН С ПИНЧ-ЗУМОМ */}
        {previewUrl && (
          <div onClick={() => setPreviewUrl(null)} style={{ position: "absolute", inset: 0, zIndex: 260, background: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div onClick={e => e.stopPropagation()} style={{ position: "relative", width: "min(92vw, 420px)", maxHeight: "60dvh", borderRadius: 18, overflow: "hidden", border: "1px solid rgba(255,255,255,0.14)", background: "rgba(0,0,0,0.35)" }}>
              <div style={{ position: "absolute", top: 10, right: 10, zIndex: 5, display: "flex", gap: 8 }}>
                <button onClick={() => { setZoomImage(previewUrl); setPreviewUrl(null); }} style={{ width: 36, height: 36, borderRadius: 12, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(0,0,0,0.55)", color: "#fff", fontWeight: 900, cursor: "pointer" }} aria-label="Zoom image" title="Zoom">⤢</button>
                <button onClick={() => setPreviewUrl(null)} style={{ width: 36, height: 36, borderRadius: 12, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(0,0,0,0.55)", color: "#fff", fontWeight: 900, cursor: "pointer" }} aria-label="Close image" title="Close">✕</button>
              </div>
              <img src={previewUrl} alt="preview" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
            </div>
          </div>
        )}

        {/* 7. ПОЛНОЭКРАННЫЙ ZOOM-IMG С ПИНЧЕМ */}
        {zoomImage && (
          <div onClick={() => setZoomImage(null)} style={{ position: "absolute", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", padding: 8 }}>
            <img
              src={zoomImage}
              alt="zoom"
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 12, userSelect: "none", pointerEvents: "none" }}
              draggable={false}
            />
          </div>
        )}

        {/* 7. NOTES НА ВЕСЬ ЭКРАН – БЕЛЫЙ АККУРАТНЫЙ БЛОК */}
        {isNotesFullscreen && selectedNode && (
          <div onClick={closeNotesFullscreen} style={{ position: "absolute", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.86)", display: "flex", flexDirection: "column", padding: 14, gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ color: "#fff", fontWeight: 900, fontSize: 16 }}>Notes</div>
              <button onClick={e => { e.stopPropagation(); closeNotesFullscreen(); }} style={{ width: 40, height: 40, borderRadius: 12, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(0,0,0,0.55)", color: "#fff", fontWeight: 900, cursor: "pointer" }} aria-label="Close notes" title="Close">✕</button>
            </div>
            <textarea
              value={selectedNode.data?.notes || ""}
              onChange={e => updateSelectedNodeNotes(e.target.value)}
              placeholder="Notes (internal text, not shown on the node)"
              style={{ flex: 1, width: "100%", padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.16)", outline: "none", background: "#ffffff", color: "#111111", fontSize: 16, lineHeight: 1.4, resize: "none", fontFamily: "Arial, sans-serif", boxSizing: "border-box" }}
              onClick={e => e.stopPropagation()}
            />
          </div>
        )}

        {/* 4. НАДПИСЬ НАЗВАНИЯ НОДЫ В СВЁРНУТОЙ ПАНЕЛИ */}
        {selectedNode && isDetailsCollapsed && (
          <div
            style={{
              position: "absolute",
              left: 12,
              bottom: `calc(68px + env(safe-area-inset-bottom))`,
              zIndex: 115,
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(21,21,23,0.96)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              maxWidth: "50vw",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={selectedNode.data?.title}
          >
            {selectedNode.data?.title || "Untitled"}
          </div>
        )}

        {/* ReactFlow */}
        <ReactFlow
          ref={rfRef}
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{ type: "nf" }}
          preventScrolling={true}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onInit={inst => {
            rfRef.current = inst;
            didFitRef.current = false;
          }}
          onConnect={onConnect}
          onEdgeUpdate={onReconnect}
          onReconnectEdge={onReconnect}
          onNodeClick={(_, node) => {
            setSelectedNodeId(node.id);
            setSelectedEdgeId(null);
            setIsDetailsCollapsed(false);
          }}
          onPaneClick={() => {
            setSelectedNodeId(null);
            setSelectedEdgeId(null);
          }}
          onEdgeClick={(_, edge) => {
            if (!linkMode) return;
            setSelectedEdgeId(edge.id);
            setSelectedNodeId(null);
          }}
          minZoom={0.15}
          maxZoom={4}
          zoomOnPinch={true}
          zoomOnDoubleClick={false}
          panOnDrag={true}
          zoomOnScroll={!linkMode}
          panOnScroll={!linkMode}
          nodesConnectable={linkMode}
          nodesDraggable={!linkMode}
          connectionRadius={18}          // ← цепляемся только к handle
          connectionMode={ConnectionMode.Loose}
          isValidConnection={c => c.source !== c.target}
          deleteKeyCode={null}
          multiSelectionKeyCode={null}
          selectionKeyCode={null}
          style={{ background: "#0F0F10", width: "100%", height: "100%" }}
        >
          <Background />
        </ReactFlow>
      </div>

      {/* ---------- 8p. НИЖНЯЯ ПАНЕЛЬ ---------- */}
      {selectedNode ? (
        <div
          style={{
            borderTop: `1px solid ${theme.border}`,
            fontFamily: "Arial, sans-serif",
            background: "#111111",
            color: "#FFFFFF",
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 120,
            overflow: "visible",
            maxHeight: isDetailsCollapsed ? 60 : "46dvh",
            overflowY: isDetailsCollapsed ? "hidden" : "auto",
            WebkitOverflowScrolling: "touch",
            transition: "max-height 180ms ease",
            display: isDetailsCollapsed ? "flex" : "block",
            alignItems: isDetailsCollapsed ? "center" : "stretch",
            justifyContent: isDetailsCollapsed ? "flex-end" : "flex-start",
            padding: isDetailsCollapsed ? "8px 12px" : 12,
            paddingBottom: isDetailsCollapsed
              ? `calc(8px + env(safe-area-inset-bottom))`
              : `calc(12px + env(safe-area-inset-bottom))`,
          }}
        >
          {/* Кнопки справа */}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            {/* 🎯 НАЙТИ НОДУ */}
            <button
              onClick={() => {
                if (!selectedNodeId) return;
                if (!rfRef.current) return;
                const node = nodes.find(n => n.id === selectedNodeId);
                if (!node) return;
                const padding = 80;
                const bounds = {
                  x: node.position.x - padding,
                  y: node.position.y - padding,
                  width: 170 + padding * 2,
                  height: 80 + padding * 2,
                };
                requestAnimationFrame(() => {
                  rfRef.current?.fitBounds(bounds, { duration: 250, padding: 0.15 });
                });
              }}
              style={{
                width: 34,
                height: 34,
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.16)",
                background: "rgba(21,21,23,0.96)",
                color: "rgba(255,255,255,0.9)",
                fontWeight: 900,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 22px rgba(0,0,0,0.45)",
              }}
              title="Find node"
              aria-label="Find node"
            >
              🎯
            </button>

            {/* СВЕРНУТЬ / РАЗВЕРНУТЬ */}
            <button
              onClick={() => setIsDetailsCollapsed(v => !v)}
              style={{
                width: 74,
                height: 34,
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.16)",
                background: "rgba(21,21,23,0.96)",
                color: "rgba(255,255,255,0.9)",
                fontWeight: 900,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 22px rgba(0,0,0,0.45)",
              }}
              aria-label={isDetailsCollapsed ? "Expand panel" : "Collapse panel"}
              title={isDetailsCollapsed ? "Expand" : "Collapse"}
            >
              {isDetailsCollapsed ? "▴" : "▾"}
            </button>
          </div>

          {/* Развёрнутое содержимое */}
          {!isDetailsCollapsed && (
            <div style={{ display: "grid", gap: 10, paddingTop: 6 }}>
              <div style={{ fontWeight: 900 }}>Node</div>

              {/* Title */}
              <input
                value={selectedNode.data?.title || ""}
                onChange={e => updateSelectedNode({ title: e.target.value })}
                placeholder="Title"
                style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", outline: "none", background: "#FFFFFF", color: "#111111" }}
              />

              {/* Notes */}
              <div style={{ position: "relative" }}>
                <textarea
                  value={selectedNode.data?.notes || ""}
                  onChange={e => updateSelectedNodeNotes(e.target.value)}
                  placeholder="Notes (internal text, not shown on the node)"
                  rows={5}
                  style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", outline: "none", background: "#FFFFFF", color: "#111111", resize: "vertical", fontFamily: "Arial, sans-serif", width: "100%", boxSizing: "border-box" }}
                />
                <button onClick={() => setIsNotesFullscreen(true)} style={{ position: "absolute", right: 8, bottom: 8, width: 34, height: 34, borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", background: "rgba(255,255,255,0.88)", color: "#111", fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="Fullscreen notes" title="Fullscreen">⤢</button>
              </div>

              {/* Status buttons */}
              <div style={{ display: "flex", gap: 8 }}>
                {["idea", "active", "done"].map(s => (
                  <button
                    key={s}
                    onClick={() => updateSelectedNode({ status: s })}
                    style={{ flex: 1, padding: "10px 8px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: selectedNode.data?.status === s ? "#232326" : "#151517", color: "#FFFFFF", fontWeight: 800 }}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* 1. ВЫБОР ЦВЕТА НОДЫ */}
              <div style={{ marginTop: 6 }}>
                <div style={{ fontWeight: 900, marginBottom: 6 }}>Color</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {["#151517", "#6F42FF", "#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#EC4899"].map(c => (
                    <button
                      key={c}
                      onClick={() => updateSelectedNode({ color: c })}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 999,
                        border: selectedNode.data?.color === c ? "2px solid #fff" : "1px solid rgba(255,255,255,0.3)",
                        background: c,
                        cursor: "pointer",
                      }}
                      aria-label={`Color ${c}`}
                      title={c}
                    />
                  ))}
                </div>
              </div>

              {/* Images */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                <div style={{ fontWeight: 900 }}>Images</div>
                <button onClick={() => fileInputRef.current?.click()} style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "#151517", color: "#FFFFFF", fontWeight: 800 }}>+ Add image</button>
              </div>
              <div style={{ maxHeight: 260, overflowY: "auto", WebkitOverflowScrolling: "touch", paddingRight: 4, marginTop: 8 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {(Array.isArray(selectedNode.data?.imageIds) ? selectedNode.data.imageIds : []).map(imgId => (
                    <NodeImageThumb key={imgId} imageId={imgId} getUrl={getImageObjectUrl} onOpen={url => setPreviewUrl(url)} onDelete={() => deleteImageFromSelectedNode(imgId)} />
                  ))}
                </div>
                {(Array.isArray(selectedNode.data?.imageIds) ? selectedNode.data.imageIds.length : 0) === 0 && <div style={{ opacity: 0.65, fontSize: 12, marginTop: 8 }}>No images yet. Add one from your gallery.</div>}
              </div>

              {/* Delete node */}
              <button onClick={deleteSelectedNode} style={{ padding: "10px 8px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "#151517", color: "#FFFFFF", fontWeight: 800 }}>Delete node</button>

              {/* Delete edge */}
              {selectedEdgeId && linkMode ? (
                <button onClick={deleteSelectedEdge} style={{ padding: "10px 8px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#FFFFFF", fontWeight: 800 }}>Delete selected link</button>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

/* ---------- 8q. ОБЁРТКА С ОШИБКАМИ ---------- */
export default function AppWithBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}