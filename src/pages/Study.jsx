import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE } from '../api'

export default function Study() {
  const [chapters, setChapters] = useState([])
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [mode, setMode] = useState('chapters') // chapters | study
  const [wrongIds, setWrongIds] = useState(() => JSON.parse(localStorage.getItem('wrongIds') || '[]'))
  const [knownIds, setKnownIds] = useState(() => JSON.parse(localStorage.getItem('knownIds') || '[]'))

  useEffect(() => {
    fetch(`${API_BASE}/api/study/chapters`)
      .then(r => r.json())
      .then(setChapters)
      .catch(() => {})
  }, [])

  const saveWrongIds = (ids) => {
    setWrongIds(ids)
    localStorage.setItem('wrongIds', JSON.stringify(ids))
  }

  const saveKnownIds = (ids) => {
    setKnownIds(ids)
    localStorage.setItem('knownIds', JSON.stringify(ids))
  }

  const loadChapter = (ch) => {
    fetch(`${API_BASE}/api/study/chapter/${ch}`)
      .then(r => r.json())
      .then(data => { setQuestions(data); setCurrent(0); setFlipped(false); setMode('study') })
  }

  const loadReview = () => {
    if (wrongIds.length === 0) return
    fetch(`${API_BASE}/api/study/review?questionIds=${wrongIds.join(',')}`)
      .then(r => r.json())
      .then(data => { setQuestions(data); setCurrent(0); setFlipped(false); setMode('study') })
  }

  const next = useCallback(() => {
    if (current < questions.length - 1) { setCurrent(c => c + 1); setFlipped(false) }
  }, [current, questions.length])

  const prev = useCallback(() => {
    if (current > 0) { setCurrent(c => c - 1); setFlipped(false) }
  }, [current])

  const markWrong = () => {
    const qId = questions[current].questionId
    if (!wrongIds.includes(qId)) saveWrongIds([...wrongIds, qId])
    saveKnownIds(knownIds.filter(id => id !== qId))
    next()
  }

  const markCorrect = () => {
    const qId = questions[current].questionId
    saveWrongIds(wrongIds.filter(id => id !== qId))
    if (!knownIds.includes(qId)) saveKnownIds([...knownIds, qId])
    next()
  }

  useEffect(() => {
    const handler = (e) => {
      if (mode !== 'study') return
      if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === ' ') { e.preventDefault(); setFlipped(f => !f) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [mode, next, prev])

  if (mode === 'chapters') {
    return (
      <div className="container ready">
        <h1>📖 학습 모드</h1>
        <p className="ready-info">장을 선택하여 플래시카드로 학습하세요</p>

        {wrongIds.length > 0 && (
          <button className="btn review-btn" onClick={loadReview}>
            🔄 오답 복습 ({wrongIds.length}문제)
          </button>
        )}

        <div className="chapter-grid">
          {chapters.map(ch => (
            <button key={ch.chapter} className="chapter-card" onClick={() => loadChapter(ch.chapter)}>
              <span className="chapter-name">{ch.name}</span>
              <span className="chapter-count">{ch.count}문제</span>
            </button>
          ))}
        </div>

        <div className="nav-links">
          <Link to="/">퀴즈</Link>
          <Link to="/ranking">랭킹</Link>
        </div>
      </div>
    )
  }

  const q = questions[current]
  if (!q) return null

  return (
    <div className="container">
      <div className="study-progress">
        <span>{current + 1} / {questions.length}</span>
        <div className="progress">
          <div className="progress-bar" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
        </div>
      </div>

      <div className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(f => !f)}>
        {wrongIds.includes(q.questionId) && <span className="status-badge wrong">❌ 복습 필요</span>}
        {knownIds.includes(q.questionId) && !wrongIds.includes(q.questionId) && <span className="status-badge known">✅ 알고있음</span>}
        <div className="flashcard-inner">
          <div className="flashcard-front">
            <span className="flash-type">{q.type === 1 ? '✏️ 주관식' : '📋 객관식'}</span>
            <p className="flash-question">{q.description}</p>
            <span className="flash-hint">탭하여 정답 보기</span>
          </div>
          <div className="flashcard-back">
            <p className="flash-answer">{q.correctAnswer}</p>
            {q.type === 2 && q.answers && (
              <ul className="flash-choices">
                {q.answers.map(a => (
                  <li key={a.num} className={a.description === q.correctAnswer ? 'correct' : ''}>
                    {a.description === q.correctAnswer ? '✓ ' : '· '}{a.description}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="study-controls">
        <button className={`btn danger ${wrongIds.includes(q.questionId) ? 'active' : ''}`} onClick={markWrong}>❌ 모르겠음</button>
        <button className={`btn success ${!wrongIds.includes(q.questionId) ? 'active' : ''}`} onClick={markCorrect}>✅ 알고있음</button>
      </div>

      <div className="nav-buttons">
        <button className="btn" disabled={current === 0} onClick={prev}>◀ 이전</button>
        <button className="btn" onClick={() => setMode('chapters')}>📚 장 선택</button>
        <button className="btn primary" disabled={current === questions.length - 1} onClick={next}>다음 ▶</button>
      </div>
    </div>
  )
}
