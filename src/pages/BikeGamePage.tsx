import  { useRef, useEffect, useState, useCallback } from "react";
import { Unity, useUnityContext } from "react-unity-webgl";
import { useNavigate } from 'react-router-dom';
import Webcam from "react-webcam";
import { Hands, type Results } from "@mediapipe/hands";
import { Box, LinearProgress } from "@mui/material";
import { Camera } from "@mediapipe/camera_utils";
import { drawCanvas } from "../utils/drawCanvas_tilt.ts";
import PageTransition from '../components/PageTransition.tsx';
import Button from '../components/Button.tsx';
import { Home, Timer, MapPin, FileWarning as Running } from 'lucide-react';
import { AppLoading } from "../components/AppLoading";
import { db } from '../firebase';
import { doc, getDoc } from "firebase/firestore";

const goalDistance = 360;
const timeLimit = 60;

function BikeGamePage() {
  const { unityProvider, sendMessage, isLoaded, loadingProgression } = useUnityContext({
    loaderUrl: "/UnityBuild/BikeScene/Nesupani_Unity_Bike.loader.js",
    dataUrl: "/UnityBuild/BikeScene/Nesupani_Unity_Bike.data.br",
    frameworkUrl: "/UnityBuild/BikeScene/Nesupani_Unity_Bike.framework.js.br",
    codeUrl: "/UnityBuild/BikeScene/Nesupani_Unity_Bike.wasm.br",
  });

  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tiltValue, setHandTilt] = useState<number | null>(0);
  const navigate = useNavigate();

  // Unityから受け取る値
  const [speed, setSpeed] = useState(0);
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(50);
  const [isGameStarted, setIsGameStarted] = useState(false);

  // ゲームID存在チェック
  const [loadingGameId, setLoadingGameId] = useState(true);
  const [gameIdError, setGameIdError] = useState<string | null>(null);

  useEffect(() => {
    const checkGameId = async () => {
      const gameId = localStorage.getItem("gameId");
      if (!gameId) {
        setGameIdError("ゲームIDが見つかりません。URLを確認してください。");
        setLoadingGameId(false);
        return;
      }
      const docRef = doc(db, "gameIds", gameId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setGameIdError("ゲームIDが見つかりません。URLを確認してください。");
        setLoadingGameId(false);
        return;
      }

      const data = docSnap.data();
      if (data.stage1Completed === true) {
        setGameIdError("このゲームは既にクリア済みです。");
        setLoadingGameId(false);
        return;
      }

      // stage1Completedがfalseならゲーム開始可
      setGameIdError(null);
      setLoadingGameId(false);
    };
    checkGameId();
  }, []);

  // Unity→Reactのコールバック受け取り
  useEffect(() => {
    window.ReactUnityBridge = {
      onDistance: (distance: number) => setProgress(distance),
      onTime: (time: number) => setTimeLeft(time),
      onSpeed: (speed: number) => setSpeed(speed),
    };
    return () => {
      delete window.ReactUnityBridge;
    };
  }, []);

  // 傾き値によってUnity関数を呼び出す
  useEffect(() => {
    if (tiltValue === null) return;
    sendMessage("Bike", "ChangeTiltValue", -tiltValue);
    sendMessage("Bike", "GameStart");
  }, [tiltValue, sendMessage]);

  // Mediapipe Handsセットアップ & 手を構えたらスタート
  const onResults = useCallback((results: Results) => {
    if (loadingGameId || gameIdError) return;
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
  }, [isGameStarted, loadingGameId, gameIdError]);

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

    if (webcamRef.current && webcamRef.current.video) {
      const camera = new Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (webcamRef.current && webcamRef.current.video) {
            await hands.send({ image: webcamRef.current.video });
          }
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
    if ((timeLimit-timeLeft) <= 0) {
      navigate('/bikegameover');
    }
  }, [timeLeft, isGameStarted, navigate]);

  // ゴールに到達したらクリア画面に遷移
  useEffect(() => {
    const updateStage1Completed = async () => {
      if (progress >= goalDistance) {
        const gameId = localStorage.getItem("gameId");
        const timescore= (timeLimit - timeLeft).toFixed(2);
        if (gameId) {
          const docRef = doc(db, "gameIds", gameId);
          await import("firebase/firestore").then(({ updateDoc }) =>
            updateDoc(docRef, {
              stage1Completed: true,
              status: "stage1",
              stage1Score: Math.round((45 + Number(timescore)) * 20)
            })
          );
          console.log("stage1score", Math.round((45 + Number(timescore)) * 20));
        }
        navigate('/bikegameclear');
      }
    };
    updateStage1Completed();
  }, [progress, navigate]);

  // エラー時のカードUI
  const renderErrorCard = () => (
    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full flex flex-col items-center mx-auto mt-24">
      <div className="text-red-500 mb-4">
        <svg width="48" height="48" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="12" fill="#FEE2E2"/>
          <path d="M12 8v4m0 4h.01" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h2 className="text-2xl font-bold mb-2 text-gray-800">ゲームを開始できません</h2>
      <p className="mb-6 text-gray-600">{gameIdError}</p>
      <Button
        onClick={() => navigate('/rungame')}
        className="w-full mb-2 bg-green-500 hover:bg-green-600 text-white"
      >
        Stage2へ
      </Button>
      <Button
        onClick={() => navigate('/')}
        className="w-full mb-2 bg-green-500 hover:bg-green-600 text-white"
      >
        タイトルへ戻る
      </Button>
    </div>
  );

  if (loadingGameId) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
          読み込み中...
        </div>
      </PageTransition>
    );
  }
  if (gameIdError) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          {renderErrorCard()}
        </div>
      </PageTransition>
    );
  }

  const percent = Math.min((progress / goalDistance) * 100, 100);

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
            <div
              style={{
              position: "absolute",
              left: `${100 / 9}%`, // 画面幅の左からずらす
              zIndex: 20,
              }}
            >
              <Button
              onClick={() => window.location.reload()}
              variant="secondary"
              size="small"
              className="flex items-center mr-2 bg-yellow-500 hover:bg-yellow-600 text-white"
              >
              リトライ
              </Button>
            </div>
            <div className="flex items-center space-x-4">
            <div className="flex items-center text-white bg-red-600 px-4 py-2 rounded-lg shadow-lg" style={{ minWidth: 140, justifyContent: 'center' }}>
              <Timer size={24} className="mr-2" />
              <span className="text-2xl font-bold tracking-widest" style={{ minWidth: 70, display: 'inline-block', textAlign: 'right' }}>
              {(timeLimit - timeLeft).toFixed(0)}秒
              </span>
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
            <Box bgcolor={"#000000"} position="relative" width="100%" height="100%">
              <AppLoading
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  visibility: isLoaded ? "hidden" : "visible",
                  zIndex: 10,
                }}
                loadingProgression={loadingProgression}
              />
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
              {/* 速度メーター（縦LinearProgressバー） */}
              {/* 数値として表示 */}
              <div
                style={{
                  position: "absolute",
                  top: "5px",
                  right: "-63%",
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  zIndex: 21,
                }}
              >
                <span
                  style={{
                    color: "#fff",
                    fontWeight: "bold",
                    fontSize: "1.5rem",
                    textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                    background: "rgba(0,0,0,0.5)",
                    borderRadius: 8,
                    padding: "2px 12px",
                  }}
                >
                  速度：{speed.toFixed(2)}
                </span>
              {/* バー本体 */}
              </div>
                  <div
                  style={{
                  position: "absolute",
                  top: "45%",
                  right: "-33%",
                  height: "15%",
                  width: "40%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  zIndex: 20,
                  }}
                >
                  <LinearProgress
                  variant="determinate"
                  value={Math.min(speed) / 40 * 100}
                  sx={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 8,
                    transform: 'rotate(-90deg)',
                    backgroundColor: '#e5e7eb',
                    '& .MuiLinearProgress-bar': {
                    background:
                      speed > 30
                      ? 'linear-gradient(to top, #ef4444, #b91c1c)'
                      : speed >= 20
                        ? 'linear-gradient(to top, #fde047, #facc15)'
                        : 'linear-gradient(to top, #22d3ee, #2563eb)',
                    },
                  }}
                  />
                </div>

            </Box>
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
              <span className="ml-2 text-sm text-gray-500">
              ({progress.toFixed(2)} / {goalDistance})
              </span>
            </div>
            <LinearProgress
              variant="determinate"
              value={percent}
              sx={{ height: 24, borderRadius: 8 }}
            />
            </div>
        </div>
      </div>
    </PageTransition>
  );
}

export default BikeGamePage;