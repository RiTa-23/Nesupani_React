import React, { useRef, useEffect, useState } from "react";
import { Unity, useUnityContext } from "react-unity-webgl";
import Webcam from "react-webcam";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import { drawCanvas } from "../utils/drawCanvas_tilt";

function UnityTest() {
  const { unityProvider, sendMessage } = useUnityContext({
    loaderUrl: "/Build/ReactTest.loader.js",
    dataUrl: "/Build/ReactTest.data.br",
    frameworkUrl: "/Build/ReactTest.framework.js.br",
    codeUrl: "/Build/ReactTest.wasm.br",
  });

  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tiltValue, setHandTilt] = useState<number | null>(0);
  const prevHandTilt = useRef<number | null>(0);

  // 傾き値によってUnity関数を呼び出す
  useEffect(() => {
    if (tiltValue === null) return;

    // 傾いた方向に移動
    sendMessage("Cube", "MoveLeft", tiltValue);

    prevHandTilt.current = tiltValue;
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
        setHandTilt // ここで傾き値を受け取る
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
    <div
      style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      position: "relative",
      }}
    >
      <h1>ReactとUnityの連携テスト</h1>
      <h2>傾き検知：{tiltValue}</h2>

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
      <canvas
      ref={canvasRef}
      width={640}
      height={480}
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 2,
        pointerEvents: "none",
      }}
      />
      <div
      style={{
        position: "relative",
        width: "70vw",
        height: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1,
      }}
      >
      <Unity
        unityProvider={unityProvider}
        style={{
        width: "100%",
        height: "100%",
        display: "block",
        }}
      />
      </div>
    </div>
  );
}

export default UnityTest;