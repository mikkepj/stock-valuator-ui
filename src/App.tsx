import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { WatchlistPage } from './pages/WatchlistPage'
import { TickerDetailPage } from './pages/TickerDetailPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<WatchlistPage />} />
          <Route path="ticker/:ticker" element={<TickerDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
