import { HashRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Clubs from './pages/Clubs'
import Explore from './pages/Explore'
import Home from './pages/Home'
import SchoolDetail from './pages/SchoolDetail'

// HashRouter: GitHub Pages 같은 정적 호스팅에서도 새로고침 시 404가 나지 않는다.
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/school/:id" element={<SchoolDetail />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/clubs" element={<Clubs />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
