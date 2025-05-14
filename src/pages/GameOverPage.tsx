import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, RotateCcw } from 'lucide-react';
import Button from '../components/Button';
import PageTransition from '../components/PageTransition';
import TrainIcon from '../components/TrainIcon';
import useSound from 'use-sound';

const GameOverPage: React.FC = () => {
  const navigate = useNavigate();
  const [playGameOverSound] = useSound('/sounds/gameover.mp3', { volume: 0.5 }); // 効果音をロード

  useEffect(() => {
    playGameOverSound(); // コンポーネントのマウント時に効果音を再生
  }, [playGameOverSound]);

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-red-100 flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8 animate-bounce-slow">
          <TrainIcon size={80} className="mx-auto mb-4 opacity-50" />
          <h1 className="text-4xl font-bold text-red-600 mb-2">
            ゲームオーバー
          </h1>
          <p className="text-xl text-red-500 font-medium">遅刻確定</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg max-w-md w-full mb-8 animate-fade-in">
          <p className="text-gray-700 text-center mb-4">
            電車に間に合いませんでした...
          </p>
          <div className="flex flex-col space-y-4">
            <Button
              onClick={() => navigate('/game')}
              className="w-full flex items-center justify-center"
            >
              <RotateCcw className="mr-2" size={20} />
              もう一度挑戦
            </Button>
            
            <Button
              onClick={() => navigate('/')}
              variant="secondary"
              className="w-full flex items-center justify-center"
            >
              <Home className="mr-2" size={20} />
              タイトルに戻る
            </Button>
          </div>
        </div>

        <div className="absolute bottom-4 right-4 animate-pulse opacity-30">
          <TrainIcon size={36} />
        </div>
      </div>
    </PageTransition>
  );
};

export default GameOverPage;