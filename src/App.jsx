export default function App() {
  return (
    <div style={{ padding: 16, fontFamily: "Inter, system-ui, Arial" }}>
      <h1 style={{ margin: 0 }}>Nodeflow</h1>
      <p style={{ marginTop: 8 }}>
        Mini App is running ✅
      </p>

      <div style={{
        marginTop: 16,
        padding: 12,
        border: "1px solid #ddd",
        borderRadius: 12
      }}>
        <b>Next steps:</b>
        <ul>
          <li>Connect Telegram bot</li>
          <li>Deploy to HTTPS</li>
          <li>Add nodes + links</li>
        </ul>
      </div>
    </div>
  );
}
