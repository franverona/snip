import { ShortenForm } from '@/components/ShortenForm'

export default function Page() {
  return (
    <div>
      <h1
        style={{
          fontSize: '1.875rem',
          fontWeight: 700,
          marginBottom: '0.5rem',
        }}
      >
        Shorten a URL
      </h1>
      <p
        style={{
          color: '#6b7280',
          marginBottom: '2rem',
          fontSize: '0.95rem',
        }}
      >
        Paste a long URL and get a short link instantly. Optionally add a custom slug or expiry
        date.
      </p>
      <ShortenForm />
    </div>
  )
}
