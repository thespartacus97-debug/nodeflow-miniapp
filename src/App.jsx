import { useEffect, useMemo, useState } from "react";

const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
}

function storageKey(userId) {
  return `nodeflow:projects:${userId || "guest"}`;
}

export default function App() {
  const user = tg?.initDataUnsafe?.user;
  const userId = user?.id;

  const key = useMemo(() => storageKey(userId), [userId]);

  const [projects, setProjects] = useState([]);
  const [title, setTitle] = useState("");

  // загрузка проектов
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      setProjects(raw ? JSON.parse(raw) : []);
    } catch {
      setProjects([]);
    }
  }, [key]);

  // сохранение проектов
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(projects));
    } catch {
      // ignore
    }
  }, [key, projects]);

  function createProject() {
    const name = title.trim();
    if (!name) return;

    const newProject = {
      id: crypto.randomUUID(),
      title: name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setProjects((p) => [newProject, ...p]);
    setTitle("");
  }

  function deleteProject(id) {
    setProjects((p) => p.filter((x) => x.id !== id));
  }

  return (
    <div style={{ padding: 16, fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <h1 style={{ margin: 0 }}>Nodeflow</h1>
        <span style={{ opacity: 0.6, fontSize: 12 }}>
          {user ? `@${user.username || "user"} • id ${user.id}` : "guest"}
        </span>
      </div>

      <div
        style={{
          marginTop: 14,
          padding: 12,
          border: "1px solid #ddd",
          borderRadius: 12,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Projects</div>

        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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

        {projects.length === 0 ? (
          <div style={{ marginTop: 12, opacity: 0.65 }}>
            No projects yet. Create your first one.
          </div>
        ) : (
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
                <div>
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
        )}
      </div>
    </div>
  );
}
