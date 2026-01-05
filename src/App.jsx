const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
}

export default function App() {
  const user = tg?.initDataUnsafe?.user;

  return (
    <div style={{ padding: 16, fontFamily: "Arial, sans-serif" }}>
      <h1>Nodeflow</h1>

      <p>
        Opened in Telegram:{" "}
        <b>{tg ? "YES ✅" : "NO ❌"}</b>
      </p>

      {user ? (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            border: "1px solid #ddd",
            borderRadius: 12,
          }}
        >
          <p><b>User ID:</b> {user.id}</p>
          <p><b>Username:</b> @{user.username || "—"}</p>
          <p><b>First name:</b> {user.first_name}</p>
        </div>
      ) : (
        <p style={{ marginTop: 16 }}>
          User data not available
        </p>
      )}
    </div>
  );
}
