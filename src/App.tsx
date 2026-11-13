import { lazy, Suspense } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Clubs from './pages/Clubs'
import Explore from './pages/Explore'
import Home from './pages/Home'
import SchoolDetail from './pages/SchoolDetail'

// 교사·학생회용 화면은 학생 대부분이 쓰지 않으므로 열 때 불러온다.
const SchoolEditor = lazy(() => import('./pages/SchoolEditor'))
const Review = lazy(() => import('./pages/Review'))

// HashRouter: GitHub Pages 같은 정적 호스팅에서도 새로고침 시 404가 나지 않는다.
export default function App() {
  return (
    <HashRouter>
      <Suspense fallback={<p className="muted">불러오는 중…</p>}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/school/:id" element={<SchoolDetail />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/clubs" element={<Clubs />} />
            <Route path="/editor" element={<SchoolEditor />} />
            <Route path="/review" element={<Review />} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  )
}
