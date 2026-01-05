import { useEffect, useMemo, useState } from "react";

const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

function key(userId, projectId) {
  return `nodeflow:nodes:${userId || "guest"}:${projectId}`;
}

export default function App() {
  const user = tg?.initDataUnsafe?.user;
  const userId = user?.id;

  const [projects, setProjects] = useState([]);
  const [title, setTitle] = useState("");
  const [currentProject, setCurrentProject] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [nodeTitle, setNodeTitle] = useState("");

  const projectsKey = `nodeflow:projects:${userId || "guest"}`;
  const nodesKey = useMemo(
    () => currentProject && key(userId, currentProject.id),
    [userId, currentProject]
  );

  // load projects
  useEffect(() => {
    const raw = localStorage.getItem(projectsKey);
    setProjects(raw ? JSON.parse(raw) : []);
  }, [projectsKey]);

  // save projects
  useEffect(() => {
    localStorage.setItem(projectsKey, JSON.stringify(projects));
  }, [projectsKey, projects]);

  // load nodes
  useEffect(() => {
    if (!nodesKey) return;
    const raw = localStorage.getItem(nodesKey);
    setNodes(raw ? JSON.parse(raw) : []);
  }, [nodesKey]);

  // save nodes
  useEffect(() => {
    if (!nodesKey) return;
    localStorage.setItem(nodesKey, JSON.stringify(nodes));
  }, [nodesKey, nodes]);

  function createProject() {
    if (!title.trim()) return;
    setProjects([
      { id: crypto.randomUUID(), title: title.trim() },
      ...projects,
    ]);
    setTitle("");
  }

  function createNode() {
    if (!nodeTitle.trim()) return;
    setNodes([
      {
        id: crypto.randomUUID(),
        title: nodeTitle.trim(),
        status: "idea",
      },
      ...nodes,
    ]);
    setNodeTitle("");
  }

  // ================= UI =================

  // PROJECT LIST
  if (!currentProject) {
    return (
      <div style={{ padding: 16, fontFamily: "Arial" }}>
        <h1>Nodeflow</h1>

        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New project"
            style={{ flex: 1, padding: 10 }}
          />
          <button onClick={createProject}>+ Add</button>
        </div>

        <div style={{ marginTop: 12 }}>
          {projects.map((p) => (
            <div
              key={p.id}
              onClick={() => setCurrentProject(p)}
              style={{
                padding: 12,
                border: "1px solid #ddd",
                marginBottom: 8,
                borderRadius: 10,
                cursor: "pointer",
              }}
            >
              {p.title}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // PROJECT CANVAS
  return (
    <div style={{ padding: 16, fontFamily: "Arial" }}>
      <button onClick={() => setCurrentProject(null)}>← Back</button>
      <h2>{currentProject.title}</h2>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={nodeTitle}
          onChange={(e) => setNodeTitle(e.target.value)}
          placeholder="New node (idea / step)"
          style={{ flex: 1, padding: 10 }}
        />
        <button onClick={createNode}>+ Node</button>
      </div>

      <div style={{ marginTop: 16 }}>
        {nodes.length === 0 && (
          <div style={{ opacity: 0.6 }}>
            No nodes yet. Add your first idea.
          </div>
        )}

        {nodes.map((n) => (
          <div
            key={n.id}
            style={{
              padding: 12,
              border: "1px solid #eee",
              borderRadius: 10,
              marginBottom: 8,
            }}
          >
            <b>{n.title}</b>
            <div style={{ fontSize: 12, opacity: 0.6 }}>
              status: {n.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
