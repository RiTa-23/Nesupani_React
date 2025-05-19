import  { useRef, useEffect, useState, useCallback } from "react";
import { Unity, useUnityContext } from "react-unity-webgl";
import { useNavigate } from 'react-router-dom';
import Webcam from "react-webcam";
import { Hands, type Results } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import { drawCanvas } from "../utils/drawCanvas_tilt.ts";
import PageTransition from '../components/PageTransition.tsx';
import Button from '../components/Button.tsx';
import { Home, Timer, MapPin, FileWarning as Running } from 'lucide-react';

function BikeGamePage() {
  const { unityProvider, sendMessage } = useUnityContext({
    loaderUrl: "/UnityBuild/BikeScene/Nesupani_Unity_Bike.loader.js",
    dataUrl: "/UnityBuild/BikeScene/Nesupani_Unity_Bike.data.br",
    frameworkUrl: "/UnityBuild/BikeScene/Nesupani_Unity_Bike.framework.js.br",
    codeUrl: "/UnityBuild/BikeScene/Nesupani_Unity_Bike.wasm.br",
  });

  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tiltValue, setHandTilt] = useState<number | null>(0);
  const navigate = useNavigate();

  const goalDistance = 500;
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isGameStarted, setIsGameStarted] = useState(false);

  // 傾き値によってUnity関数を呼び出す
  useEffect(() => {
    if (tiltValue === null) return;
    sendMessage("Bike", "ChangeTiltValue", -tiltValue);
  }, [tiltValue, sendMessage]);

  // Mediapipe Handsセットアップ & 手を構えたらスタート
  const onResults = useCallback((results:Results) => {
    const canvas = canvasRef.current;
    const video = webcamRef.current?.video;
    if (!canvas || !video) return;
    drawCanvas(
      canvas.getContext("2d")!,
      results,
      video.videoWidth,
      video.videoHeight,
      setHandTilt
    );
    // 手が画面前に構えられているかを判定
    if (!isGameStarted && results.multiHandLandmarks?.length > 0) {
      setIsGameStarted(true);
    }
  }, [isGameStarted]);

  useEffect(() => {
    const hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults(onResults);

    if (webcamRef.current) {
      const camera = new Camera(webcamRef.current.video!, {
        onFrame: async () => {
          await hands.send({ image: webcamRef.current!.video! });
        },
        width: 1280,
        height: 720,
      });
      camera.start();
    }
  }, [onResults]);

  // 制限時間のカウントダウン
  useEffect(() => {
    if (!isGameStarted) return;
    if (timeLeft <= 0) {
      navigate('/gameover');
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isGameStarted, navigate]);

  // ゴールに到達したらクリア画面に遷移
  useEffect(() => {
    if (progress >= goalDistance) {
      navigate('/gameclear');
    }
  }, [progress, goalDistance, navigate]);

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-900 flex flex-col relative">
        <div className="absolute inset-0 bg-yellow-900 opacity-20 z-0"></div>
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
}

export default BikeGamePage;