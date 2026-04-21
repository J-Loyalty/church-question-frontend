import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE } from '../api'

export default function Ranking() {
  const [rankings, setRankings] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE}/api/quiz/ranking`)
      .then(res => res.json())
      .then(data => { setRankings(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const formatTime = (s) => s != null ? `${Math.floor(s / 60)}분 ${s % 60}초` : '-'

  if (loading) return <div className="container"><p>불러오는 중...</p></div>

  return (
    <div className="container">
      <h1>🏆 랭킹</h1>
      {rankings.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#888' }}>아직 기록이 없습니다.</p>
      ) : (
        <div className="ranking-list">
          {rankings.map((r, i) => (
            <div key={i} className={`ranking-card ${i < 3 ? `rank-${i + 1}` : ''}`}>
              <div className="ranking-row" onClick={() => setExpanded(expanded === i ? null : i)}>
                <span className="ranking-rank">{i + 1}</span>
                <span className="ranking-name">{r.name}</span>
                <span className="ranking-score">{r.score} / {r.total}</span>
                <span className="ranking-time">{formatTime(r.elapsed)}</span>
                <span className="ranking-toggle">{expanded === i ? '▲' : '▼'}</span>
              </div>
              {expanded === i && r.details && (
                <div className="ranking-details">
                  {r.details.map((d, j) => (
                    <div key={j} className={`result-item ${d.correct ? 'correct' : 'wrong'}`}>
                      <span className="result-num">Q{j + 1}</span>
                      <span className="result-question">{d.question}</span>
                      <span className="result-answer">
                        답: <strong>{d.userAnswer || '미응답'}</strong>
                        {!d.correct && <> / 정답: <strong>{d.correctAnswer}</strong></>}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="nav-buttons" style={{ justifyContent: 'center', marginTop: 24 }}>
        <Link to="/" className="btn">퀴즈로 돌아가기</Link>
      </div>
    </div>
  )
}
