import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RunGamePage from './pages/RunGamePage';
import BikeGameOverPage from './pages/BikeGameOverPage';
import BikeGameClearPage from './pages/BikeGameClearPage';
import BikeGamePage from './pages/BikeGamePage';
import RunGameClearPage from './pages/RunGameClearPage';
import RunGameOverPage from './pages/RunGameOverPage';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/rungame" element={<RunGamePage />} />
        <Route path="/bikegameover" element={<BikeGameOverPage />} />
        <Route path="/bikegameclear" element={<BikeGameClearPage />} />
        <Route path="/bikegame" element={<BikeGamePage />} />
        <Route path="/rungameclear" element={<RunGameClearPage />} />
        <Route path="/rungameover" element={<RunGameOverPage />} />
      </Routes>
    </Router>
  );
}

export default App;