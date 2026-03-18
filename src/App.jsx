import { useState, useEffect } from 'react'
import './App.css'

const API_URL = '/api/quiz'

export default function App() {
  const [quizzes, setQuizzes] = useState([])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [phase, setPhase] = useState('loading')
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => { setQuizzes(data); setPhase('quiz') })
      .catch(() => setError('문제를 불러오지 못했습니다.'))
  }, [])

  if (error) return <div className="container"><p className="error">{error}</p></div>
  if (phase === 'loading') return <div className="container"><p>문제를 불러오는 중...</p></div>

  if (phase === 'result') {
    const score = quizzes.reduce((acc, q, i) =>
      acc + (String(answers[i] ?? '').trim() === String(q.correctAnswer).trim() ? 1 : 0), 0)
    return (
      <div className="container result">
        <h1>결과</h1>
        <p className="score">{quizzes.length}문제 중 <strong>{score}문제</strong> 정답</p>
        <div className="result-list">
          {quizzes.map((q, i) => {
            const correct = String(answers[i] ?? '').trim() === String(q.correctAnswer).trim()
            return (
              <div key={i} className={`result-item ${correct ? 'correct' : 'wrong'}`}>
                <span className="result-num">Q{i + 1}</span>
                <span className="result-question">{q.description}</span>
                <span className="result-answer">
                  내 답: <strong>{answers[i] || '미응답'}</strong>
                  {!correct && <> / 정답: <strong>{q.correctAnswer}</strong></>}
                </span>
              </div>
            )
          })}
        </div>
        <button className="btn" onClick={() => window.location.reload()}>다시 풀기</button>
      </div>
    )
  }

  const quiz = quizzes[current]
  const isLast = current === quizzes.length - 1
  const setAnswer = (val) => setAnswers(prev => ({ ...prev, [current]: val }))

  return (
    <div className="container">
      <div className="progress">
        <div className="progress-bar" style={{ width: `${((current + 1) / quizzes.length) * 100}%` }} />
      </div>
      <p className="counter">{current + 1} / {quizzes.length}</p>

      <div className="quiz-card">
        <h2 className="question">Q{current + 1}. {quiz.description}</h2>

        {quiz.type === 2 ? (
          <div className="options">
            {quiz.answers.map(opt => (
              <button
                key={opt.num}
                className={`option ${answers[current] === opt.description ? 'selected' : ''}`}
                onClick={() => setAnswer(opt.description)}
              >{opt.description}</button>
            ))}
          </div>
        ) : (
          <input
            className="text-input"
            placeholder="정답을 입력하세요"
            value={answers[current] ?? ''}
            onChange={e => setAnswer(e.target.value)}
          />
        )}
      </div>

      <div className="nav-buttons">
        <button className="btn" disabled={current === 0} onClick={() => setCurrent(c => c - 1)}>이전</button>
        {isLast ? (
          <button className="btn primary" onClick={() => setPhase('result')}>제출</button>
        ) : (
          <button className="btn primary" onClick={() => setCurrent(c => c + 1)}>다음</button>
        )}
      </div>
    </div>
  )
}
