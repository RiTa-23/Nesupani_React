import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Trophy } from 'lucide-react';
import Button from '../components/Button';
import PageTransition from '../components/PageTransition';
import TrainIcon from '../components/TrainIcon';
import useSound from 'use-sound';

const BikeGameClearPage: React.FC = () => {
  const navigate = useNavigate();
  const [playClearSound] = useSound('/sounds/clear.mp3', { volume: 0.5 }); // 効果音をロード

  useEffect(() => {
    playClearSound(); // コンポーネントのマウント時に効果音を再生
  }, [playClearSound]);

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-yellow-100 flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8 animate-bounce-slow">
          <div className="relative">
            <TrainIcon size={80} className="mx-auto mb-4" />
            <Trophy size={32} className="absolute -right-2 -top-2 text-yellow-500 animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold text-yellow-600 mb-2">
            ステージクリア！
          </h1>
          <p className="text-xl text-yellow-500 font-medium">電車に無事乗車できました！</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg max-w-md w-full mb-8 animate-fade-in">
          <p className="text-gray-700 text-center mb-4">
            次は寝過ごさないように気をつけましょう！
          </p>
          <div className="flex flex-col space-y-4">
            
            <Button
              onClick={() => navigate('/rungame')}
              variant="secondary"
              className="w-full flex items-center justify-center"
            >
              <Home className="mr-2" size={20} />
              次のステージへ
            </Button>
          </div>
        </div>

        <div className="absolute bottom-4 right-4 animate-pulse">
          <TrainIcon size={36} className="text-yellow-400" />
        </div>
      </div>
    </PageTransition>
  );
};

export default BikeGameClearPage;