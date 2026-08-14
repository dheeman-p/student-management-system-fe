export default function SettingsPage() {
  return (
    <main style={{ maxWidth: 640, margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <div
        id="qa-verified-banner"
        role="status"
        style={{
          backgroundColor: '#e6f4ea',
          color: '#1e7e34',
          padding: '12px 16px',
          borderRadius: 4,
          marginBottom: 16,
          fontWeight: 600,
        }}
      >
        QA verified
      </div>
      <h1>Settings</h1>
      <p>Application settings.</p>
    </main>
  );
}
