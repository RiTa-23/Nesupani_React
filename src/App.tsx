import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RunGamePage from './pages/RunGamePage';
import GameOverPage from './pages/GameOverPage';
import GameClearPage from './pages/GameClearPage';
import BikeGamePage from './pages/BikeGamePage';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/rungame" element={<RunGamePage />} />
        <Route path="/gameover" element={<GameOverPage />} />
        <Route path="/gameclear" element={<GameClearPage />} />
        <Route path="/bikegame" element={<BikeGamePage />} />
      </Routes>
    </Router>
  );
}

export default App;