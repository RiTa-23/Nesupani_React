import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Timer, MapPin, FileWarning as Running } from 'lucide-react';
import { Box, LinearProgress } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import Webcam from 'react-webcam';
import { Camera } from '@mediapipe/camera_utils';
import { Hands } from '@mediapipe/hands';
import type { Results } from '@mediapipe/hands';
import { drawCanvas } from '../utils/drawCanvas_swing.ts';
import Button from '../components/Button.tsx';
import PageTransition from '../components/PageTransition.tsx';
import useSound from 'use-sound';
import { Unity, useUnityContext } from "react-unity-webgl";
import { AppLoading } from "../components/AppLoading";
import { db } from '../firebase';
import { doc, getDoc } from "firebase/firestore";

export type UnityAppProps = {
  sx?: SxProps<Theme>;
};

declare global {
  interface Window {
    ReactUnityBridge?: {
      onDistance?: (distance: number) => void;
      onTime?: (time: number) => void;
      onSpeed?: (speed: number) => void;
    };
  }
}

const RunGamePage: React.FC = () => {
  // 追加: ゲームID存在チェック用
  const [loadingGameId, setLoadingGameId] = useState(true);
  const [gameIdError, setGameIdError] = useState<string | null>(null);

  // --- 既存のstate ---
  const { unityProvider, sendMessage, isLoaded, loadingProgression } = useUnityContext({
    loaderUrl: "/UnityBuild/RunScene/Nesupani_Unity_Run.loader.js",
    dataUrl: "/UnityBuild/RunScene/Nesupani_Unity_Run.data.br",
    frameworkUrl: "/UnityBuild/RunScene/Nesupani_Unity_Run.framework.js.br",
    codeUrl: "/UnityBuild/RunScene/Nesupani_Unity_Run.wasm.br",
  });

  const [stepSound] = useSound('/sounds/step.mp3', { volume: 0.5 });
  const goalDistance = 80;
  const timeLimit = 30;
  const navigate = useNavigate();
  const [speed, setSpeed] = useState(0);
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [HandSwinging, setHandSwinging] = useState(1);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const prevIsHandSwinging = useRef(HandSwinging);
  const [progressPercentage, setProgressPercentage] = useState(0);

  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- 追加: ゲームID存在チェック ---
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
      if (data.stage2Completed === true) {
        setGameIdError("このゲームは既にクリア済みです。");
        setLoadingGameId(false);
        return;
      }
      // stage2Completedがfalseならゲーム開始可
      setGameIdError(null);
      setLoadingGameId(false);
    };
    checkGameId();
  }, []);

  // Unity→Reactのコールバック受け取り
  useEffect(() => {
    // グローバルブリッジを作成
    window.ReactUnityBridge = {
      onDistance: (distance: number) => {
        setProgress(distance);
        // プログレスバーの幅を更新
        setProgressPercentage((distance / goalDistance) * 100);
      },
      onTime: (time: number) => {
        setTimeLeft(time);
      },
      onSpeed: (speed: number) => {
        setSpeed(speed);
        console.log("Speed: ", speed);
      }
    };
    // クリーンアップ
    return () => {
      delete window.ReactUnityBridge;
    };
  }, [goalDistance]);

  const handleRun = () => {
    stepSound(); // 足音の音を再生
    sendMessage("Player", "GameStart");
    sendMessage("Player", "SpeedUp"); // UnityのPlayerオブジェクトにメッセージを送信
  };

  /**
   * 検出結果（フレーム毎に呼び出される）
   * @param results
   */
  const onResults = useCallback((results: Results) => {
    // 追加: ゲームIDチェックが終わっていない or エラー時は何もしない
    if (loadingGameId || gameIdError) return;

    const canvasCtx = canvasRef.current!.getContext('2d')!;
    drawCanvas(
      canvasCtx,
      results,
      webcamRef.current!.video!.videoWidth,
      webcamRef.current!.video!.videoHeight,
      (value: number | null) => {
        if (typeof value === 'number') setHandSwinging(value);
      }
    );

    // 手が画面前に構えられているかを判定
    if (!isGameStarted && results.multiHandLandmarks?.length > 0) {
      setIsGameStarted(true); // ゲームをスタート
    }
  }, [isGameStarted, loadingGameId, gameIdError]);

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

    if (webcamRef.current && webcamRef.current.video) {
      const camera = new Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (webcamRef.current && webcamRef.current.video) {
            await hands.send({ image: webcamRef.current.video });
          }
        },
        width: 1280,
        height: 720
      });
      camera.start();
    }
  }, [onResults]);

  // 手の振り具合が変化したときの処理（前回と異なる場合のみ走る）
  useEffect(() => {
    if (HandSwinging !== 0 && prevIsHandSwinging.current !== HandSwinging) {
      if (HandSwinging === 99) {
        sendMessage("Player", "Jump"); 
      } else {
        handleRun();
      }
    }
    prevIsHandSwinging.current = HandSwinging;
  }, [HandSwinging]);

  // 制限時間のカウントダウン
  useEffect(() => {
    if (!isGameStarted) return; // ゲームがスタートしていない場合は何もしない
    if (timeLimit - timeLeft <= 0) {
      navigate('/rungameover'); // 制限時間が0になったらゲームオーバー画面に遷移
    } 
  }, [timeLeft, isGameStarted, navigate, timeLimit]);

  // ゴールに到達したらクリア画面に遷移
  useEffect(() => {
    const updateStage2Completed = async () => {
    if (progress >= goalDistance) {
      const gameId = localStorage.getItem("gameId");
        if (gameId) {
          const docRef = doc(db, "gameIds", gameId);
          await import("firebase/firestore").then(({ updateDoc }) =>
            updateDoc(docRef, { stage2Completed: true })
          );
        }
      navigate('/rungameclear'); // ゴールに到達したらゲームクリア画面に遷移
    }
  }
    updateStage2Completed();
  }, [progress, goalDistance, navigate]);

  // デバッグ用：progressの変更を確認
  useEffect(() => {
    console.log("Progress updated:", progress);
    setProgressPercentage((progress / goalDistance) * 100);
    console.log("Progress percentage:", progressPercentage);
    console.log("Progress percentage updated:", Math.min(progressPercentage, 100));
  }, [progress, progressPercentage]);

  const percent = Math.min(progress/ goalDistance * 100, 100);

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
        onClick={() => {
          const gameId = localStorage.getItem('gameId');
          window.location.href = `https://nesugoshipanic.web.app/?id=${gameId}`;
       }}
        className="w-full mb-2 bg-green-500 hover:bg-green-600 text-white"
      >
        Stage3へ
      </Button>
      <Button
        onClick={() => navigate('/')}
        className="w-full mb-2 bg-green-500 hover:bg-green-600 text-white"
      >
        タイトルへ戻る
      </Button>
    </div>
  );

  // --- エラー時・ロード時の分岐 ---
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

  // --- ここから下は既存のゲーム画面のまま ---
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
              <span>{(timeLimit-timeLeft).toFixed(2)}秒</span>
            </div>
            <div className="flex items-center text-white">
              <MapPin size={18} className="mr-1" />
              <span>速さ：{speed.toFixed(2)}｜距離:{progress.toFixed(2)}</span>
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
            <LinearProgress variant='determinate' value={percent} />
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default RunGamePage;