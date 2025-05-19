import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Timer, MapPin, FileWarning as Running } from 'lucide-react';
import Webcam from 'react-webcam';
import { Camera } from '@mediapipe/camera_utils';
import { Hands } from '@mediapipe/hands';
import type { Results } from '@mediapipe/hands';
import { drawCanvas } from '../utils/drawCanvas_swing.ts';
import Button from '../components/Button.tsx';
import PageTransition from '../components/PageTransition.tsx';
import useSound from 'use-sound';
import { Unity, useUnityContext } from "react-unity-webgl";

const GamePage: React.FC = () => {
  const { unityProvider, sendMessage } = useUnityContext({
    loaderUrl: "/UnityBuild/RunScene/Nesupani_Unity_Run.loader.js",
    dataUrl: "/UnityBuild/RunScene/Nesupani_Unity_Run.data.br",
    frameworkUrl: "/UnityBuild/RunScene/Nesupani_Unity_Run.framework.js.br",
    codeUrl: "/UnityBuild/RunScene/Nesupani_Unity_Run.wasm.br",
  });

  const [stepSound] = useSound('/sounds/step.mp3', { volume: 0.5 });
  const goalDistance = 500;
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30); // 制限時間を30秒に設定
  const [HandSwinging, setHandSwinging] = useState(1); // 手の振り具合を管理
  const [isGameStarted, setIsGameStarted] = useState(false); // ゲームがスタートしたかどうかを管理
  const prevIsHandSwinging = useRef(HandSwinging); // 前回の状態を追跡

  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleRun = () => {
    stepSound(); // 足音の音を再生
    sendMessage("Player", "SpeedUp"); // UnityのPlayerオブジェクトにメッセージを送信
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
      (value: number | null) => {
        if (typeof value === 'number') setHandSwinging(value);
      } // 状態更新用の関数を渡す
    );

    // 手が画面前に構えられているかを判定
    if (!isGameStarted && results.multiHandLandmarks?.length > 0) {
      setIsGameStarted(true); // ゲームをスタート
    }
  }, [isGameStarted]);

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

  // 手の振り具合が変化したときの処理（前回と異なる場合のみ走る）
  useEffect(() => {
    if (HandSwinging!==0 && prevIsHandSwinging.current !== HandSwinging) {
      if(HandSwinging==99){
        sendMessage("Player", "Jump"); 
      }
      else{
        handleRun();
      }
      
    }
    prevIsHandSwinging.current = HandSwinging;
  }, [HandSwinging]);

  // 制限時間のカウントダウン
  useEffect(() => {
    if (!isGameStarted) return;
    if (timeLeft <= 0) {
      navigate('/gameover'); // 制限時間が0になったらゲームオーバー画面に遷移
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer); // クリーンアップ
  }, [timeLeft, isGameStarted, navigate]);

  // ゴールに到達したらクリア画面に遷移
  useEffect(() => {
    if (progress >= goalDistance) {
      navigate('/gameclear'); // ゴールに到達したらゲームクリア画面に遷移
    }
  }, [progress, goalDistance, navigate]);

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
        <div>
          {!isGameStarted && (
            <div
              className="fixed inset-0 flex flex-col items-center justify-center z-50 pointer-events-none"
              style={{ background: "rgba(0,0,0,0.3)" }}
            >
              <div className="text-center text-white pointer-events-auto">
          <h2 className="text-2xl font-bold mb-4">手を画面前に構えてください</h2>
          <p className="text-lg">ゲームがスタートします</p>
              </div>
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-4 z-10">
          <div
            style={{
              position: "relative",
              width: "70vw",
              height: "70vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
            }}
          >
            <Unity
              unityProvider={unityProvider}
              style={{
                width: "100%",
                height: "100%",
                display: "block",
                borderRadius: "16px",
                boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
                background: "#222",
              }}
            />
            <Webcam
              audio={false}
              ref={webcamRef}
              style={{ visibility: "hidden", position: "absolute" }}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                width: window.innerWidth,
                height: window.innerHeight,
                facingMode: 'user'
              }}
            />
            <canvas
              ref={canvasRef}
              className="absolute"
              style={{
                left: 0,
                top: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>
        {/* Progress bar */}
        <div className="bg-gray-100 rounded-xl w-full max-w-10xl p-6 border-4 border-gray-300" style={{ width: '100%' }}>

          {/* Progress meter */}
          <div className="mb-8">
            <div className="flex items-center mb-2">
              <Running size={20} className="mr-2 text-green-500" />
              <span className="font-medium text-gray-700">ゴールまでの距離</span>
            </div>
            <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${(progress / goalDistance) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default GamePage;