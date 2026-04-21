import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'

const API_URL = '/api/quiz'

export default function Quiz() {
  const [quizzes, setQuizzes] = useState([])
  const [current, setCurrent] = useState(0)
  const [phase, setPhase] = useState('loading')
  const [error, setError] = useState(null)
  const [name, setName] = useState('')
  const [timeLimit, setTimeLimit] = useState(120)
  const [remaining, setRemaining] = useState(null)
  const [startTime, setStartTime] = useState(null)
  const [elapsed, setElapsed] = useState(0)

  const answersRef = useRef({})
  const lockRef = useRef(false)
  const [transitioning, setTransitioning] = useState(false)
  const submittedRef = useRef(false)

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => { setQuizzes(data); setPhase('ready') })
      .catch(() => setError('문제를 불러오지 못했습니다.'))
  }, [])

  // 카운트다운 타이머
  useEffect(() => {
    if (phase !== 'quiz') return
    setRemaining(timeLimit)
    const interval = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          clearInterval(interval)
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [phase, timeLimit])

  const submitScore = useCallback((finalAnswers) => {
    if (submittedRef.current) return
    submittedRef.current = true
    const sec = Math.round((Date.now() - startTime) / 1000)
    setElapsed(sec)
    const details = quizzes.map((q, i) => {
      const raw = finalAnswers[i] ?? ''
      const display = raw === '__pass__' ? '패스' : raw === '__wrong__' ? '오답' : raw
      return {
        question: q.description,
        userAnswer: display,
        correctAnswer: q.correctAnswer,
        correct: String(raw).trim() === String(q.correctAnswer).trim()
      }
    })
    const score = details.filter(d => d.correct).length
    fetch('/api/quiz/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), score, total: quizzes.length, elapsed: sec, details })
    }).catch(() => {})
    setPhase('done')
  }, [startTime, quizzes, name])

  // 타임아웃 시 자동 제출
  useEffect(() => {
    if (phase === 'quiz' && remaining === 0 && remaining !== null) {
      submitScore(answersRef.current)
    }
  }, [phase, remaining, submitScore])

  const handleAnswer = useCallback((val) => {
    if (lockRef.current) return
    lockRef.current = true

    answersRef.current = { ...answersRef.current, [current]: val }

    const isLast = current === quizzes.length - 1
    if (isLast) {
      submitScore(answersRef.current)
    } else {
      setTransitioning(true)
      setTimeout(() => {
        setCurrent(c => c + 1)
        setTransitioning(false)
        lockRef.current = false
      }, 50)
      return
    }

    setTimeout(() => { lockRef.current = false }, 300)
  }, [current, quizzes.length, submitScore])

  if (error) return <div className="container"><p className="error">{error}</p></div>
  if (phase === 'loading') return <div className="container"><p>문제를 불러오는 중...</p></div>

  const startQuiz = () => {
    submittedRef.current = false
    setStartTime(Date.now())
    setPhase('quiz')
  }

  if (phase === 'ready') return (
    <div className="container ready">
      <h1>📝 퀴즈</h1>
      <p className="ready-info">총 {quizzes.length}문제</p>
      <input
        className="text-input name-input"
        placeholder="이름을 입력하세요"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && name.trim()) startQuiz() }}
      />
      <div className="time-setting">
        <label>제한시간</label>
        <div className="time-controls">
          <button className="btn time-btn" onClick={() => setTimeLimit(t => Math.max(10, t - 10))}>-10s</button>
          <span className="time-display">{timeLimit}초</span>
          <button className="btn time-btn" onClick={() => setTimeLimit(t => t + 10)}>+10s</button>
        </div>
      </div>
      <button className="btn primary" disabled={!name.trim()} onClick={startQuiz}>시작하기</button>
      <div className="nav-links">
        <Link to="/ranking">랭킹</Link>
      </div>
    </div>
  )

  const formatTime = (s) => `${Math.floor(s / 60)}분 ${s % 60}초`

  if (phase === 'done') return (
    <div className="container ready">
      <h1>🎉 수고하셨습니다!</h1>
      <p className="ready-info">{name}님, 퀴즈가 완료되었습니다.</p>
      <p className="ready-info">소요시간: {formatTime(elapsed)}</p>
      <div className="nav-buttons" style={{ justifyContent: 'center' }}>
        <Link to="/ranking" className="btn">랭킹 보기</Link>
        <button className="btn primary" onClick={() => window.location.reload()}>다시 풀기</button>
      </div>
    </div>
  )

  const quiz = quizzes[current]
  const isLast = current === quizzes.length - 1
  const timerPct = remaining != null ? (remaining / timeLimit) * 100 : 100
  const timerSec = remaining ?? timeLimit
  const timerColor = timerSec <= 10 ? '#dc2626' : timerSec <= 30 ? '#f59e0b' : '#4f46e5'

  return (
    <div className="container">
      <div className="timer-bar">
        <div className="timer-fill" style={{ width: `${timerPct}%`, background: timerColor }} />
      </div>
      <p className={`timer-text ${timerSec <= 10 ? 'timer-danger' : ''}`}>
        ⏱ {Math.floor(timerSec / 60)}:{String(timerSec % 60).padStart(2, '0')}
      </p>

      <div className="progress">
        <div className="progress-bar" style={{ width: `${((current + 1) / quizzes.length) * 100}%` }} />
      </div>
      <p className="counter">{current + 1} / {quizzes.length}</p>

      <div className="quiz-card">
        {transitioning ? null : <>
        <h2 className="question">Q{current + 1}. {quiz.description}</h2>

        {quiz.type === 2 ? (
          <div className={`options${quiz.answers.some(o => o.description.length > 10) ? ' vertical' : ''}`}>
            {quiz.answers.map(opt => (
              <button
                key={opt.num}
                className="option"
                onClick={() => handleAnswer(opt.description)}
              >{opt.description}</button>
            ))}
          </div>
        ) : (
          <div className="judge-zone" onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect()
            const x = (e.clientX - rect.left) / rect.width
            const val = x > 0.66 ? quiz.correctAnswer : x < 0.33 ? '__wrong__' : '__pass__'
            handleAnswer(val)
          }}>
            <p className="judge-hint">답변을 말해주세요</p>
          </div>
        )}
        </>}
      </div>

      <div className="nav-buttons">
        <button className="btn" disabled={current === 0} onClick={() => setCurrent(c => c - 1)}>이전</button>
        {isLast ? (
          <button className="btn primary" onClick={() => submitScore(answersRef.current)}>제출</button>
        ) : (
          <button className="btn primary" onClick={() => setCurrent(c => c + 1)}>다음</button>
        )}
      </div>
    </div>
  )
}
