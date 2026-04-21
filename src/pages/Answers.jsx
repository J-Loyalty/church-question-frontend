import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE } from '../api'

export default function Answers() {
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/api/quiz`)
      .then(res => res.json())
      .then(data => { setQuizzes(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="container"><p>불러오는 중...</p></div>

  return (
    <div className="container">
      <h1>📋 정답 확인</h1>
      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>문제</th>
            <th>유형</th>
            <th>정답</th>
          </tr>
        </thead>
        <tbody>
          {quizzes.map((q, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{q.description}</td>
              <td>{q.type === 2 ? '객관식' : '주관식'}</td>
              <td><strong>{q.correctAnswer}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="nav-buttons" style={{ justifyContent: 'center', marginTop: 24 }}>
        <Link to="/" className="btn">퀴즈로 돌아가기</Link>
      </div>
    </div>
  )
}
