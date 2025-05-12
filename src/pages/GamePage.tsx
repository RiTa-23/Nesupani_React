import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Timer, MapPin, FileWarning as Running } from 'lucide-react';
import Button from '../components/Button';
import PageTransition from '../components/PageTransition';

const GamePage: React.FC = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [timeLeft/*, setTimeLeft*/] = useState(30); // 30 seconds to catch the train
  
  const handleRun = () => {
    setProgress(prev => Math.min(200, prev + 5));
  };
  
  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-900 flex flex-col relative">
        {/* Platform background */}
        <div className="absolute inset-0 bg-yellow-900 opacity-20 z-0"></div>
        
        {/* Game header */}
        <div className="bg-gray-800 p-4 flex justify-between items-center z-10">
          <Button 
            onClick={() => navigate('/')}
            variant="secondary"
            size="small"
            className="flex items-center"
          >
            <Home size={18} className="mr-1" />
            タイトルへ
          </Button>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-white">
              <Timer size={18} className="mr-1" />
              <span>{timeLeft}秒</span>
            </div>
            <div className="flex items-center text-white">
              <MapPin size={18} className="mr-1" />
              <span>久留米駅</span>
            </div>
          </div>
        </div>
        
        {/* Main game area */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 z-10">
          {/* Platform and train visualization */}
          <div className="bg-gray-100 rounded-xl w-full max-w-4xl p-6 border-4 border-gray-300" style={{ width: '70%' }}>
            <div className="text-center mb-6">
              <p className="text-gray-600">あと{Math.max(0, 200 - progress)}メートル</p>
            </div>
            
            {/* Progress meter */}
            <div className="mb-8">
              <div className="flex items-center mb-2">
          <Running size={20} className="mr-2 text-green-500" />
          <span className="font-medium text-gray-700">ホームまでの距離</span>
              </div>
              <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${progress/2}%` }}
          ></div>
              </div>
            </div>
            
            {/* Game interaction area */}
            <div className="flex justify-center">
                <button 
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-8 rounded-full text-xl transition-transform transform hover:scale-105 active:scale-95 focus:outline-none"
              onClick={handleRun}
                >
              走る！
                </button>
            </div>
          </div>
        </div>
        
        {/* Platform ambient effects */}
        <div className="absolute bottom-0 w-full h-8 bg-gray-800 flex items-center justify-center z-10">
          <div className="w-full max-w-md flex justify-between px-4">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-ping"></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default GamePage;