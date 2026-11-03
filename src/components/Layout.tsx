import { NavLink, Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="app">
      <header className="header">
        <NavLink to="/" className="logo">
          스쿨뷰
        </NavLink>
        <nav className="nav">
          <NavLink to="/" end>
            학교
          </NavLink>
          <NavLink to="/explore">진로 탐색</NavLink>
          <NavLink to="/clubs">동아리 모집</NavLink>
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <p>스쿨뷰는 학교 순위·별점을 제공하지 않으며, 시험·수행평가 자료를 다루지 않아요.</p>
        <p>재학생 답변은 학생회·담당 교사의 확인을 거쳐 공개돼요.</p>
      </footer>
    </div>
  )
}
