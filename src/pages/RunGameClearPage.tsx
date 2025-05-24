import React, { useEffect, useState } from 'react';
import { Home, Trophy } from 'lucide-react';
import Button from '../components/Button';
import PageTransition from '../components/PageTransition';
import TrainIcon from '../components/TrainIcon';
import useSound from 'use-sound';
import { db } from '../firebase';
import { doc, getDoc } from "firebase/firestore";

const RunGameClearPage: React.FC = () => {
  const [playClearSound] = useSound('/sounds/clear.mp3', { volume: 0.5 });
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    playClearSound();
  }, [playClearSound]);

  // スコア取得
  useEffect(() => {
    const fetchScore = async () => {
      const gameId = localStorage.getItem("gameId");
      if (!gameId) return;
      const docRef = doc(db, "gameIds", gameId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (typeof data.stage2Score === "number") {
          setScore(data.stage2Score);
        }
      }
    };
    fetchScore();
  }, []);

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
          {/* スコア表示 */}
          <div className="text-center my-4">
            <span className="text-lg font-bold text-yellow-700">スコア：</span>
            <span className="text-2xl font-extrabold text-yellow-600">
              {score !== null ? score : "取得中..."}
            </span>
          </div>
          <div className="flex flex-col space-y-4">
            <Button
              onClick={() => {
                const gameId = localStorage.getItem('gameId');
                window.location.href = `https://nesugoshipanic.web.app/?id=${gameId}`;
              }}
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

export default RunGameClearPage;