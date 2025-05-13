import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Timer, MapPin, FileWarning as Running } from 'lucide-react';
import Webcam from 'react-webcam';
import { Camera } from '@mediapipe/camera_utils';
import { Hands } from '@mediapipe/hands';
import type { Results } from '@mediapipe/hands';
import { drawCanvas } from '../utils/drawCanvas.ts';
import Button from '../components/Button';
import PageTransition from '../components/PageTransition';

const GamePage: React.FC = () => {
  const goalDistance = 500; // ゴールまでの距離
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30); // 制限時間を30秒に設定
  const [isHandSwinging, setIsHandSwinging] = useState(true); // 手の振り具合を管理
  const prevIsHandSwinging = useRef(isHandSwinging); // 前回の状態を追跡

  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleRun = () => {
    setProgress(prev => Math.min(goalDistance, prev + 5));
  };

  /**
   * 検出結果（フレーム毎に呼び出される）
   * @param results
   */
  const onResults = useCallback((results: Results) => {
    const canvasCtx = canvasRef.current!.getContext('2d')!;
    drawCanvas(
      canvasCtx,
      results,
      webcamRef.current!.video!.videoWidth,
      webcamRef.current!.video!.videoHeight,
      setIsHandSwinging // 状態更新用の関数を渡す
    );
  }, []);

  // 初期設定
  useEffect(() => {
    const hands = new Hands({
      locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    hands.onResults(onResults);

    if (webcamRef.current) {
      const camera = new Camera(webcamRef.current.video!, {
        onFrame: async () => {
          await hands.send({ image: webcamRef.current!.video! });
        },
        width: 1280,
        height: 720
      });
      camera.start();
    }
  }, [onResults]);

  // 手の振り具合が「小さい」から「大きい」に変化したときの処理
  useEffect(() => {
    if (!prevIsHandSwinging.current && isHandSwinging) {
      console.log('手の振り具合が小さいから大きいに変化しました！');
      handleRun(); // 腕を振ることで走る処理を実行
    }
    prevIsHandSwinging.current = isHandSwinging; // 前回の状態を更新
  }, [isHandSwinging]);

  // 制限時間のカウントダウン
  useEffect(() => {
    if (timeLeft <= 0) {
      navigate('/gameover'); // 制限時間が0になったらゲームオーバー画面に遷移
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer); // クリーンアップ
  }, [timeLeft, navigate]);

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
              <span>目的地：基山駅</span>
            </div>
          </div>
        </div>

        {/* Main game area */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 z-10">
          {/* Webcam and Canvas for Hand Landmarks */}
          <div
            className="relative w-full flex justify-center items-center"
            style={{ height: '60vh' }} // Set height to 70% of the viewport height
          >
            <Webcam
              audio={false}
              style={{ visibility: 'hidden' }}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                width: window.innerWidth,
                height: window.innerHeight,
                facingMode: 'user'
              }}
            />
            <canvas ref={canvasRef} className="absolute w-full h-full" />
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-gray-100 rounded-xl w-full max-w-10xl p-6 border-4 border-gray-300" style={{ width: '100%' }}>
          <div className="text-center mb-6">
            <p className="text-gray-600">あと{Math.max(0, goalDistance - progress)}メートル</p>
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
                style={{ width: `${progress / goalDistance *100}%` }}
              ></div>
            </div>
          </div>

          {/* デバッグ用 */}
          {/* <div>手の振り具合: {isHandSwinging ? '大きい' : '小さい'}</div>
          <div className="flex justify-center">
            <button
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-0 px-8 rounded-full text-xl transition-transform transform hover:scale-105 active:scale-95 focus:outline-none"
              onClick={handleRun}
            >
              走る！
            </button>
          </div> */}

        </div>
      </div>
      
    </PageTransition>
  );
};

export default GamePage;