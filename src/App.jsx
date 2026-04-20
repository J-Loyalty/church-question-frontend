import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Quiz from './pages/Quiz'
import Answers from './pages/Answers'
import Ranking from './pages/Ranking'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Quiz />} />
        <Route path="/answers" element={<Answers />} />
        <Route path="/ranking" element={<Ranking />} />
      </Routes>
    </BrowserRouter>
  )
}
