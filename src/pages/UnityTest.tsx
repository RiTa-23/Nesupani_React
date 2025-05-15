import React, { useRef, useCallback, useEffect, useState } from "react";
import { Unity, useUnityContext } from "react-unity-webgl";
import Webcam from "react-webcam";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import { drawCanvas } from "../utils/drawCanvas_tilt";

function UnityTest() {
  const { unityProvider, sendMessage } = useUnityContext({
    loaderUrl: "/UnityBuild/ReactTest.loader.js",
    dataUrl: "/UnityBuild/ReactTest.data.br",
    frameworkUrl: "/UnityBuild/ReactTest.framework.js.br",
    codeUrl: "/UnityBuild/ReactTest.wasm.br",
  });

  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isHandSwinging, setIsHandSwinging] = useState(false);
  const prevIsHandSwinging = useRef(false);

  // Unityへ手の動きに応じてメッセージ送信
  useEffect(() => {
    if (!prevIsHandSwinging.current && isHandSwinging) {
      sendMessage("Cube", "MoveRight", 1); // 例: 右に動かす
    }
    prevIsHandSwinging.current = isHandSwinging;
  }, [isHandSwinging, sendMessage]);

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
        setIsHandSwinging
      );
    });

    if (webcamRef.current) {
      const camera = new Camera(webcamRef.current.video!, {
        onFrame: async () => {
          await hands.send({ image: webcamRef.current!.video! });
        },
        width: 640,
        height: 480,
      });
      camera.start();
    }
  }, []);

  return (
    <div>
      <h1>ReactにUnity埋め込んでみた</h1>
      <Webcam
        ref={webcamRef}
        style={{ visibility: "hidden", position: "absolute" }}
        width={640}
        height={480}
        screenshotFormat="image/jpeg"
        videoConstraints={{
          width: 640,
          height: 480,
          facingMode: "user",
        }}
      />
      <canvas ref={canvasRef} style={{ position: "absolute", left: 0, top: 0, zIndex: 2 }} />
      <Unity
        unityProvider={unityProvider}
        style={{
          position: "absolute",
          top: 50,
          left: 0,
          width: "50%",
          height: "50%",
          zIndex: 1,
        }}
      />
    </div>
  );
}

export default UnityTest;