'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'

// ─── Questions pool ───────────────────────────────────────────────────────────
const QUESTIONS = [
  'Who is most likely to ghost someone? 👻',
  'Who would survive a zombie apocalypse? 🧟',
  'Who is secretly the funniest person here? 😂',
  'Who would sell you out for a pizza? 🍕',
  'Who is most likely to become famous? 🌟',
  'Who takes the longest to reply to texts? 📱',
  'Who would win in a roast battle? 🔥',
  'Who is most likely to get lost in a new city? 🗺️',
  'Who has the most chaotic energy? 💥',
  'Who would cheat on a test? 📝',
]

type Phase = 'join' | 'waiting' | 'voting' | 'results'

interface User { id: string; name: string }

export default function Room() {
  const params = useParams()
  const id = params.id as string

  // ── Auth state
  const [name, setName] = useState('')
  const [userId, setUserId] = useState('')
  const [isHost, setIsHost] = useState(false)
  const [phase, setPhase] = useState<Phase>('join')

  // ── Game state
  const [users, setUsers] = useState<User[]>([])
  const [round, setRound] = useState(0)
  const [voted, setVoted] = useState(false)
  const [results, setResults] = useState<Record<string, number>>({})
  const [timeLeft, setTimeLeft] = useState(20)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const question = QUESTIONS[round % QUESTIONS.length]

  // ── Polling: keep user list fresh in waiting room ─────────────────────────
  const pollUsers = useCallback(async () => {
    if (!id) return
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: id }),
      })
      const data: User[] = await res.json()
      setUsers(data)
    } catch {}
  }, [id])

  useEffect(() => {
    if (phase === 'waiting') {
      pollUsers()
      pollRef.current = setInterval(pollUsers, 2000)
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [phase, pollUsers])

  // ── Join ──────────────────────────────────────────────────────────────────
  const joinRoom = async () => {
    if (!name.trim()) return
    try {
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), roomId: id }),
      })
      if (!res.ok) { alert('Could not join room'); return }
      const user = await res.json()
      setUserId(user.userId)

      const usersRes = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: id }),
      })
      const data: User[] = await usersRes.json()
      setUsers(data)
      if (data.length === 1) setIsHost(true)
      setPhase('waiting')
    } catch { alert('Something went wrong') }
  }

  // ── Start Game (host only) ────────────────────────────────────────────────
  const startGame = () => {
    setPhase('voting')
    setVoted(false)
    setTimeLeft(20)
  }

  // ── Vote ──────────────────────────────────────────────────────────────────
  const vote = async (targetName: string) => {
    if (voted) return
    setVoted(true)
    await fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: id, userId, target: targetName }),
    })
  }

  // ── Fetch results ─────────────────────────────────────────────────────────
  const fetchResults = useCallback(async () => {
    const res = await fetch('/api/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: id }),
    })
    const data = await res.json()
    setResults(data || {})
    setPhase('results')
  }, [id])

  // ── Voting timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'voting') return
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          fetchResults()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, fetchResults])

  // ── Next round ────────────────────────────────────────────────────────────
  const nextRound = () => {
    setRound((r) => r + 1)
    setVoted(false)
    setResults({})
    setTimeLeft(20)
    setPhase('voting')
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const winner =
    Object.keys(results).length > 0
      ? Object.entries(results).reduce((a, b) => (a[1] >= b[1] ? a : b))
      : null

  const timerPct = (timeLeft / 20) * 100
  const timerColor =
    timeLeft > 10 ? '#22c55e' : timeLeft > 5 ? '#f59e0b' : '#ef4444'

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #050508; font-family: 'DM Sans', sans-serif; }

        .page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          position: relative;
        }

        /* Background */
        .bg-glow { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
        .glow-a {
          position: absolute; width: 500px; height: 500px; border-radius: 50%;
          background: radial-gradient(circle, rgba(139,92,246,0.16) 0%, transparent 70%);
          top: -120px; left: 50%; transform: translateX(-50%);
          animation: driftA 9s ease-in-out infinite alternate;
        }
        .glow-b {
          position: absolute; width: 350px; height: 350px; border-radius: 50%;
          background: radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%);
          bottom: -80px; right: -60px;
          animation: driftA 11s ease-in-out infinite alternate-reverse;
        }
        @keyframes driftA {
          from { transform: translateX(-50%) translateY(0); }
          to   { transform: translateX(-50%) translateY(28px); }
        }
        .noise {
          position: fixed; inset: 0; pointer-events: none; z-index: 1; opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }

        .content {
          position: relative; z-index: 2;
          width: 100%; max-width: 460px;
          display: flex; flex-direction: column; align-items: center; gap: 0;
          animation: fadeUp 0.5s ease both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .logo {
          font-family: 'Syne', sans-serif;
          font-size: 28px; font-weight: 800;
          background: linear-gradient(135deg, #fff 0%, #c4b5fd 60%, #f472b6 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 32px;
          letter-spacing: -0.02em;
        }

        /* Card shell */
        .card {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px; padding: 32px;
          backdrop-filter: blur(12px);
        }

        /* ── JOIN PHASE ── */
        .join-title {
          font-family: 'Syne', sans-serif;
          font-size: 22px; font-weight: 700; color: white;
          text-align: center; margin-bottom: 6px;
        }
        .join-sub {
          text-align: center; color: rgba(255,255,255,0.35);
          font-size: 13px; margin-bottom: 28px;
        }
        .room-id-chip {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(139,92,246,0.12); border: 1px solid rgba(139,92,246,0.25);
          border-radius: 100px; padding: 4px 12px;
          font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
          color: #a78bfa; margin-bottom: 28px;
        }
        .field-label {
          display: block; font-size: 11px; letter-spacing: 0.08em;
          text-transform: uppercase; color: rgba(255,255,255,0.3);
          margin-bottom: 8px;
        }
        input.name-input {
          width: 100%; padding: 14px 16px;
          border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05); color: white;
          font-family: 'DM Sans', sans-serif; font-size: 15px;
          outline: none; transition: border-color 0.2s; margin-bottom: 12px;
        }
        input.name-input:focus { border-color: rgba(139,92,246,0.5); }
        input.name-input::placeholder { color: rgba(255,255,255,0.18); }

        /* ── WAITING PHASE ── */
        .phase-label {
          font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
          color: rgba(255,255,255,0.3); text-align: center; margin-bottom: 12px;
        }
        .waiting-title {
          font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 700;
          color: white; text-align: center; margin-bottom: 4px;
        }
        .waiting-sub {
          text-align: center; color: rgba(255,255,255,0.35);
          font-size: 13px; margin-bottom: 28px;
        }
        .player-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
        .player-row {
          display: flex; align-items: center; gap: 12px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; padding: 12px 16px;
          animation: fadeUp 0.3s ease both;
        }
        .player-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #ec4899);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; color: white; flex-shrink: 0;
        }
        .player-name { color: white; font-size: 14px; font-weight: 500; flex: 1; }
        .host-badge {
          font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase;
          background: rgba(139,92,246,0.2); border: 1px solid rgba(139,92,246,0.3);
          color: #a78bfa; border-radius: 6px; padding: 2px 8px;
        }

        .pulse-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #22c55e;
          animation: pulse 1.5s ease-in-out infinite;
          display: inline-block; margin-right: 6px;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.75); }
        }

        .waiting-hint {
          text-align: center; color: rgba(255,255,255,0.2);
          font-size: 12px; margin-top: 16px;
        }

        /* Share link */
        .share-box {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; padding: 12px 16px;
          display: flex; align-items: center; gap: 10px; margin-bottom: 20px;
          cursor: pointer; transition: background 0.2s;
        }
        .share-box:hover { background: rgba(255,255,255,0.06); }
        .share-link { font-size: 12px; color: rgba(255,255,255,0.3); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .copy-btn { font-size: 11px; color: #a78bfa; white-space: nowrap; letter-spacing: 0.04em; }

        /* ── VOTING PHASE ── */
        .question-card {
          width: 100%; margin-bottom: 28px;
          background: linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.1));
          border: 1px solid rgba(139,92,246,0.2);
          border-radius: 20px; padding: 28px 24px; text-align: center;
        }
        .round-tag {
          font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
          color: rgba(255,255,255,0.3); margin-bottom: 12px;
        }
        .question-text {
          font-family: 'Syne', sans-serif; font-size: clamp(17px, 4vw, 21px);
          font-weight: 700; color: white; line-height: 1.3;
        }

        /* Timer bar */
        .timer-wrap { width: 100%; margin-bottom: 20px; }
        .timer-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 8px;
        }
        .timer-label { font-size: 12px; color: rgba(255,255,255,0.3); letter-spacing: 0.04em; }
        .timer-count { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 700; transition: color 0.3s; }
        .timer-track {
          height: 4px; background: rgba(255,255,255,0.07); border-radius: 100px; overflow: hidden;
        }
        .timer-bar { height: 100%; border-radius: 100px; transition: width 0.9s linear, background 0.3s; }

        /* Vote buttons */
        .vote-grid { display: flex; flex-direction: column; gap: 10px; width: 100%; }
        .vote-btn {
          width: 100%; padding: 14px 18px;
          border-radius: 14px; border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04); color: white;
          font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 500;
          cursor: pointer; transition: all 0.18s; text-align: left;
          display: flex; align-items: center; gap: 12px;
        }
        .vote-btn:hover:not(.voted-state) {
          background: rgba(139,92,246,0.2); border-color: rgba(139,92,246,0.4);
          transform: translateX(4px);
        }
        .vote-btn.voted-state { opacity: 0.4; cursor: not-allowed; }
        .vote-btn.selected-vote {
          background: rgba(139,92,246,0.25); border-color: rgba(139,92,246,0.5);
          opacity: 1 !important;
        }
        .vote-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #ec4899);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: white; flex-shrink: 0;
        }
        .voted-msg {
          text-align: center; color: rgba(255,255,255,0.35); font-size: 13px;
          padding: 12px; border: 1px dashed rgba(255,255,255,0.1); border-radius: 12px;
        }

        /* ── RESULTS PHASE ── */
        .winner-card {
          width: 100%; margin-bottom: 20px;
          background: linear-gradient(135deg, rgba(239,68,68,0.18), rgba(236,72,153,0.12));
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 20px; padding: 28px 24px; text-align: center;
          animation: popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.88); }
          to   { opacity: 1; transform: scale(1); }
        }
        .skull { font-size: 48px; display: block; margin-bottom: 12px; }
        .exposed-label {
          font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
          color: rgba(255,255,255,0.35); margin-bottom: 6px;
        }
        .exposed-name {
          font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 800;
          color: white; margin-bottom: 4px;
        }
        .exposed-votes { font-size: 13px; color: rgba(255,255,255,0.35); }

        .results-list { width: 100%; display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
        .result-row {
          display: flex; align-items: center; gap: 12px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; padding: 12px 16px; overflow: hidden; position: relative;
          animation: fadeUp 0.3s ease both;
        }
        .result-fill {
          position: absolute; inset: 0; border-radius: 12px;
          background: rgba(139,92,246,0.08); transform-origin: left;
          transition: transform 0.6s ease;
        }
        .result-name { color: white; font-size: 14px; flex: 1; position: relative; z-index: 1; }
        .result-count {
          font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700;
          color: rgba(255,255,255,0.7); position: relative; z-index: 1;
        }

        .no-votes {
          text-align: center; color: rgba(255,255,255,0.3); font-size: 14px;
          padding: 28px; border: 1px dashed rgba(255,255,255,0.08); border-radius: 16px;
          margin-bottom: 20px;
        }

        /* ── GENERIC BUTTONS ── */
        .btn-primary {
          width: 100%; padding: 15px;
          border-radius: 12px; border: none;
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          color: white; font-family: 'DM Sans', sans-serif;
          font-size: 15px; font-weight: 500; cursor: pointer;
          transition: all 0.2s;
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(139,92,246,0.4);
        }
        .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

        .btn-ghost {
          width: 100%; padding: 14px;
          border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);
          background: transparent; color: rgba(255,255,255,0.5);
          font-family: 'DM Sans', sans-serif; font-size: 14px; cursor: pointer;
          transition: all 0.2s; margin-top: 8px;
        }
        .btn-ghost:hover { background: rgba(255,255,255,0.05); color: white; }
      `}</style>

      <div className="page">
        <div className="bg-glow">
          <div className="glow-a" />
          <div className="glow-b" />
        </div>
        <div className="noise" />

        <div className="content">
          <div className="logo">Inside Circle 😈</div>

          {/* ── JOIN ───────────────────────────────────────────────────── */}
          {phase === 'join' && (
            <div className="card">
              <h2 className="join-title">You're invited 🔥</h2>
              <p className="join-sub">Enter your name to jump in</p>
              <div className="room-id-chip">Room · {id.slice(0, 8)}…</div>

              <label className="field-label">Your name</label>
              <input
                className="name-input"
                placeholder="e.g. Pradeep"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                autoFocus
              />
              <button className="btn-primary" onClick={joinRoom}>
                Enter the Circle →
              </button>
            </div>
          )}

          {/* ── WAITING ────────────────────────────────────────────────── */}
          {phase === 'waiting' && (
            <div className="card">
              <p className="phase-label"><span className="pulse-dot" />Waiting room</p>
              <h2 className="waiting-title">Everyone in?</h2>
              <p className="waiting-sub">Share the link, then start when ready</p>

              <div
                className="share-box"
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href)
                }}
              >
                <span className="share-link">{typeof window !== 'undefined' ? window.location.href : ''}</span>
                <span className="copy-btn">Copy 📋</span>
              </div>

              <div className="player-list">
                {users.map((u, i) => (
                  <div className="player-row" key={u.id} style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="player-avatar">{u.name[0].toUpperCase()}</div>
                    <span className="player-name">{u.name}</span>
                    {i === 0 && <span className="host-badge">👑 Host</span>}
                  </div>
                ))}
              </div>

              {isHost ? (
                <button
                  className="btn-primary"
                  onClick={startGame}
                  disabled={users.length < 2}
                >
                  {users.length < 2 ? 'Waiting for players…' : `Start Game 🚀 (${users.length} players)`}
                </button>
              ) : (
                <p className="waiting-hint">⏳ Waiting for the host to start…</p>
              )}
            </div>
          )}

          {/* ── VOTING ─────────────────────────────────────────────────── */}
          {phase === 'voting' && (
            <>
              <div className="question-card">
                <p className="round-tag">Round {round + 1}</p>
                <p className="question-text">{question}</p>
              </div>

              <div className="timer-wrap">
                <div className="timer-header">
                  <span className="timer-label">⏳ Time left</span>
                  <span className="timer-count" style={{ color: timerColor }}>{timeLeft}s</span>
                </div>
                <div className="timer-track">
                  <div
                    className="timer-bar"
                    style={{ width: `${timerPct}%`, background: timerColor }}
                  />
                </div>
              </div>

              <div className="vote-grid">
                {voted ? (
                  <div className="voted-msg">✅ Vote locked in! Results coming soon…</div>
                ) : (
                  users.filter(u => u.id !== userId).map((u) => (
                    <button
                      key={u.id}
                      className="vote-btn"
                      onClick={() => vote(u.name)}
                    >
                      <div className="vote-avatar">{u.name[0].toUpperCase()}</div>
                      {u.name}
                    </button>
                  ))
                )}
              </div>
            </>
          )}

          {/* ── RESULTS ────────────────────────────────────────────────── */}
          {phase === 'results' && (
            <>
              {winner ? (
                <div className="winner-card">
                  <span className="skull">💀</span>
                  <p className="exposed-label">Most votes</p>
                  <p className="exposed-name">{winner[0]}</p>
                  <p className="exposed-votes">got exposed with {winner[1]} vote{winner[1] !== 1 ? 's' : ''}!</p>
                </div>
              ) : (
                <div className="no-votes">No votes were cast this round 👀</div>
              )}

              <div className="results-list">
                {Object.entries(results)
                  .sort((a, b) => b[1] - a[1])
                  .map(([n, count], i) => {
                    const max = Math.max(...Object.values(results))
                    const pct = max > 0 ? (count / max) * 100 : 0
                    return (
                      <div className="result-row" key={n} style={{ animationDelay: `${i * 80}ms` }}>
                        <div className="result-fill" style={{ transform: `scaleX(${pct / 100})` }} />
                        <span className="result-name">{n}</span>
                        <span className="result-count">{count}</span>
                      </div>
                    )
                  })}
              </div>

              {isHost && (
                <button className="btn-primary" onClick={nextRound}>
                  Next Round 🔁
                </button>
              )}
              {!isHost && (
                <p className="waiting-hint" style={{ marginTop: 12 }}>⏳ Waiting for host to start next round…</p>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
