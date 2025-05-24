import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Train, Info, Play } from 'lucide-react';
import Button from '../components/Button';
import Modal from '../components/Modal';
import PageTransition from '../components/PageTransition';
import TrainIcon from '../components/TrainIcon';
import { db } from '../firebase';
import { doc, getDoc } from "firebase/firestore";

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [inputId, setInputId] = useState<string | null>(null);
  const [idExists, setIdExists] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);

  // URLからidを取得し、Firestoreで存在チェック
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    setInputId(id);

    if (!id) {
      setError('IDが見つかりません');
      setLoading(false);
      return;
    }

    const checkId = async () => {
      const docRef = doc(db, "gameIds", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setIdExists(true);
        setError('');
      } else {
        setError('IDが見つかりません');
        setIdExists(false);
      }
      setLoading(false);
    };

    checkId();
  }, [location]);

  // スタートボタン押下時の処理
  const handleStartGame = async () => {
    if (!inputId || !idExists) return;
    localStorage.setItem("gameId", inputId);
    navigate('/bikegame');
  };

  // エラー時のカードUI
  const renderErrorCard = () => (
    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full flex flex-col items-center">
      <div className="text-red-500 mb-4">
        <svg width="48" height="48" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="12" fill="#FEE2E2"/>
          <path d="M12 8v4m0 4h.01" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h2 className="text-2xl font-bold mb-2 text-gray-800">ゲームを開始できません</h2>
      <p className="mb-6 text-gray-600">ゲームIDが見つかりません。URLを確認してください。</p>
    </div>
  );

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex flex-col items-center justify-center p-4">
        {loading ? (
          <div>読み込み中...</div>
        ) : error ? (
          renderErrorCard()
        ) : (
          <>
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
          </>
        )}
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
            <p>夜更かし気味のこうくんはどうやら寝坊して遅刻ギリギリのようです。<br />
              電車の出発時刻が刻々と迫っています！<br />
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