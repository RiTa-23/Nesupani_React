import  { useRef, useEffect, useState } from "react";
import { Unity, useUnityContext } from "react-unity-webgl";
import Webcam from "react-webcam";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import { drawCanvas } from "../utils/drawCanvas_tilt";
import PageTransition from '../components/PageTransition';

function UnityTest() {
  const { unityProvider, sendMessage } = useUnityContext({
    loaderUrl: "/UnityBuild/BikeScene/Nesupani_Unity_Bike.loader.js",
    dataUrl: "/UnityBuild/BikeScene/Nesupani_Unity_Bike.data.br",
    frameworkUrl: "/UnityBuild/BikeScene/Nesupani_Unity_Bike.framework.js.br",
    codeUrl: "/UnityBuild/BikeScene/Nesupani_Unity_Bike.wasm.br",
  });

  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tiltValue, setHandTilt] = useState<number | null>(0);

  // 傾き値によってUnity関数を呼び出す
  useEffect(() => {
    if (tiltValue === null) return;
    sendMessage("Bike", "ChangeTiltValue", -tiltValue);
  }, [tiltValue, sendMessage]);

  // Mediapipe Handsセットアップ
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

    hands.onResults((results) => {
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
    });

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
  }, []);

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-900 flex flex-col relative">
        {/* Platform background */}
        <div className="absolute inset-0 bg-yellow-900 opacity-20 z-0"></div>

        {/* Main game area */}
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
      </div>
    </PageTransition>
  );
}

export default UnityTest;