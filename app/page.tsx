'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Home() {
  const router = useRouter()
  const [roomCode, setRoomCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'idle' | 'join'>('idle')

  const createRoom = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/create-room', { method: 'POST' })
      const data = await res.json()
      router.push(`/room/${data.roomId}`)
    } catch {
      alert('Failed to create room')
      setLoading(false)
    }
  }

  const joinRoom = () => {
    if (!roomCode.trim()) {
      alert('Enter a room ID')
      return
    }
    router.push(`/room/${roomCode.trim()}`)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #050508;
          font-family: 'DM Sans', sans-serif;
          overflow: hidden;
        }

        .page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 2rem;
        }

        /* Layered background */
        .bg-glow {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }
        .glow-1 {
          position: absolute;
          width: 600px; height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%);
          top: -150px; left: 50%;
          transform: translateX(-50%);
          animation: drift 8s ease-in-out infinite alternate;
        }
        .glow-2 {
          position: absolute;
          width: 400px; height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%);
          bottom: -100px; right: -80px;
          animation: drift 10s ease-in-out infinite alternate-reverse;
        }
        .glow-3 {
          position: absolute;
          width: 300px; height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%);
          bottom: 100px; left: -50px;
          animation: drift 12s ease-in-out infinite alternate;
        }

        /* Noise texture overlay */
        .noise {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1;
          opacity: 0.035;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }

        @keyframes drift {
          from { transform: translateX(-50%) translateY(0px); }
          to { transform: translateX(-50%) translateY(30px); }
        }

        .content {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          width: 100%;
          max-width: 420px;
          animation: fadeUp 0.6s ease both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Logo badge */
        .badge {
          background: rgba(139,92,246,0.15);
          border: 1px solid rgba(139,92,246,0.3);
          border-radius: 100px;
          padding: 6px 16px;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #a78bfa;
          margin-bottom: 20px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
        }

        .logo {
          font-family: 'Syne', sans-serif;
          font-size: clamp(52px, 12vw, 80px);
          font-weight: 800;
          line-height: 0.95;
          text-align: center;
          margin-bottom: 16px;
          background: linear-gradient(135deg, #fff 0%, #c4b5fd 50%, #f472b6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
        }

        .tagline {
          color: rgba(255,255,255,0.38);
          font-size: 14px;
          text-align: center;
          margin-bottom: 52px;
          letter-spacing: 0.01em;
          line-height: 1.5;
        }

        /* Card */
        .card {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 32px;
          backdrop-filter: blur(10px);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* Buttons */
        .btn-primary {
          width: 100%;
          padding: 15px;
          border-radius: 12px;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          color: white;
          letter-spacing: 0.01em;
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 30px rgba(139,92,246,0.4);
        }
        .btn-primary:active { transform: translateY(0); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-secondary {
          width: 100%;
          padding: 15px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.1);
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.7);
        }
        .btn-secondary:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.2);
          color: white;
        }

        /* Divider */
        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          color: rgba(255,255,255,0.15);
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .divider::before, .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.08);
        }

        /* Join expand */
        .join-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
          animation: slideDown 0.25s ease;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        input.room-input {
          width: 100%;
          padding: 14px 16px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          color: white;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          outline: none;
          transition: border-color 0.2s;
          letter-spacing: 0.06em;
        }
        input.room-input:focus {
          border-color: rgba(139,92,246,0.5);
          background: rgba(255,255,255,0.07);
        }
        input.room-input::placeholder { color: rgba(255,255,255,0.2); }

        .btn-join-confirm {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #059669, #10b981);
          color: white;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-join-confirm:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(16,185,129,0.35);
        }

        .footer-text {
          margin-top: 32px;
          color: rgba(255,255,255,0.18);
          font-size: 12px;
          text-align: center;
          letter-spacing: 0.04em;
        }
      `}</style>

      <div className="page">
        <div className="bg-glow">
          <div className="glow-1" />
          <div className="glow-2" />
          <div className="glow-3" />
        </div>
        <div className="noise" />

        <div className="content">
          <div className="badge">🔥 Party Game</div>

          <h1 className="logo">Inside<br />Circle</h1>

          <p className="tagline">
            Anonymous votes. Real reactions.<br />Someone always gets exposed.
          </p>

          <div className="card">
            <button
              className="btn-primary"
              onClick={createRoom}
              disabled={loading}
            >
              {loading ? 'Creating room...' : '✦ Create a Room'}
            </button>

            <div className="divider">or</div>

            {mode === 'idle' ? (
              <button
                className="btn-secondary"
                onClick={() => setMode('join')}
              >
                Join with Room ID 🔗
              </button>
            ) : (
              <div className="join-section">
                <input
                  className="room-input"
                  placeholder="Paste room ID here"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                  autoFocus
                />
                <button className="btn-join-confirm" onClick={joinRoom}>
                  Enter Room →
                </button>
              </div>
            )}
          </div>

          <p className="footer-text">No account needed · 100% anonymous voting</p>
        </div>
      </div>
    </>
  )
}
