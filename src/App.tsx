import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import GamePage from './pages/RunGamePage';
import GameOverPage from './pages/GameOverPage';
import GameClearPage from './pages/GameClearPage';
import UnityTest from './pages/UnityTest';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/gameover" element={<GameOverPage />} />
        <Route path="/gameclear" element={<GameClearPage />} />
        <Route path="/unitytest" element={<UnityTest />} />
      </Routes>
    </Router>
  );
}

export default App;