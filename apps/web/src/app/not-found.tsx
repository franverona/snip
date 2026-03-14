export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 0' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>404</h1>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>That short URL does not exist.</p>
      <a href="/" style={{ color: '#2563eb' }}>
        ← Back to home
      </a>
    </div>
  )
}
