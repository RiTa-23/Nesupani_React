import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import GamePage from './pages/GamePage';
import HandsTest from './pages/HandsTest';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/test" element={<HandsTest />} />
      </Routes>
    </Router>
  );
}

export default App;