import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Train, Info, Play } from 'lucide-react';
import Button from '../components/Button';
import Modal from '../components/Modal';
import PageTransition from '../components/PageTransition';
import TrainIcon from '../components/TrainIcon';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  
  const handleStartGame = () => {
    navigate('/rungame');
  };
  
  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8 animate-bounce-slow">
          <TrainIcon size={80} className="mx-auto mb-4" />
          <h1 className="text-5xl font-bold text-blue-600 mb-2">
            寝過ごしパニック
          </h1>
        </div>
        
        <div className="flex flex-col items-center space-y-4 w-64 animate-fade-in">
          <Button 
            onClick={handleStartGame} 
            size="large" 
            className="w-full flex items-center justify-center"
          >
            <Play className="mr-2" size={20} />
            スタート
          </Button>
          
          <Button 
            onClick={() => setIsHowToPlayOpen(true)} 
            variant="secondary" 
            size="large" 
            className="w-full flex items-center justify-center"
          >
            <Info className="mr-2" size={20} />
            遊び方
          </Button>
        </div>
        
        <div className="absolute bottom-4 right-4 animate-pulse">
          <Train size={36} className="text-blue-300" />
        </div>
        
        <Modal 
          isOpen={isHowToPlayOpen} 
          onClose={() => setIsHowToPlayOpen(false)}
          title="遊び方 (How to Play)"
        >
          <div className="space-y-4">
            <p>ステージ１は電車が出発してしまう前にダッシュして乗り込むゲームです</p>
            <h3 className="font-bold text-lg mt-4">ステージ１:</h3>
            <p>夜更かし気味のこうくんはどうやら寝坊して遅刻ギリギリのようです。<br></br>
              電車の出発時刻が刻々と迫っています！<br></br>
              電車が出発してしまう前に全速力でダッシュして乗り込みましょう！</p>
            <h3 className="font-bold text-lg mt-4">ルール:</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>このゲームではカメラを使用するので、カメラの権限を許可してください</li>
              <li>カメラの前で走るように両手を振る動作をすると、降った回数に応じてキャラクターが前に進みます</li>
              <li>出発までに間に合わないとゲームオーバーになります</li>
            </ul>
            <p className="mt-4 font-bold">遅刻しないように急いで電車に乗り込みましょう！</p>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
};

export default HomePage;