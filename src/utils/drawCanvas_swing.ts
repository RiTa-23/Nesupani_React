import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { HAND_CONNECTIONS } from '@mediapipe/hands';
import type { NormalizedLandmarkListList, Results } from '@mediapipe/hands';

/**
 * canvasに描画する
 * @param ctx canvas context
 * @param results 手の検出結果
 * @param videoWidth Webカメラの幅
 * @param videoHeight Webカメラの高さ
 */
export const drawCanvas = (
    ctx: CanvasRenderingContext2D,
    results: Results,
    videoWidth: number,
    videoHeight: number,
    setHandSwinging: (HandSwinging: number|null) => void
) => {
    // 画面の縦横比を取得
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const screenAspectRatio = screenWidth / screenHeight;

    // Webカメラのアスペクト比を計算
    const videoAspectRatio = videoWidth / videoHeight;

    // キャンバスのサイズを調整
    const canvas = ctx.canvas;
    if (screenAspectRatio < 1) {
        // 横幅が広い場合（縦持ち）
        canvas.height = screenHeight;
        canvas.width = screenHeight * videoAspectRatio;
    } else {
        // 縦幅が広い場合（横持ち）
        canvas.width = screenWidth;
        canvas.height = screenWidth / videoAspectRatio;
    }

    const width = canvas.width;
    const height = canvas.height;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    if (results.multiHandLandmarks) {
        drawLine(ctx, results.multiHandLandmarks, setHandSwinging); // 状態更新用のコールバックを渡す
      }

    // canvas の左右反転
    ctx.scale(-1, 1);
    ctx.translate(-width, 0);

    // 手の描画
    if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
            drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
            drawLandmarks(ctx, landmarks, { color: '#FF0000', lineWidth: 2, radius: 3 });
        }
        drawLine(ctx, results.multiHandLandmarks,setHandSwinging); // 状態更新用のコールバックを渡す
    }
    ctx.restore();
};

/**
 * 左右の手首の間に垂直方向の線を描く（画面の中心）
 * @param ctx
 * @param handLandmarks
 */
const drawLine = (
  ctx: CanvasRenderingContext2D,
  handLandmarks: NormalizedLandmarkListList,
  setHandSwinging: (isHandSwinging: number) => void
) => {
  if (
    handLandmarks.length === 2 &&
    handLandmarks[0].length > 8 &&
    handLandmarks[1].length > 8
  ) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    const y1 = handLandmarks[0][0].y * height;
    const y2 = handLandmarks[1][0].y * height;

    // 画面の中心からのズレを計算
    const y = (y1 + y2) / 2;
    const ygap = height / 2 - y;

    // y1とy2の差を計算
    const diff = y1 - y2;

    // 両手とも上にある場合のみ判定
    const hands = handLandmarks.slice(0, 2); // 両手
    const bothOpenAndRaised = hands.every(hand => {
      const wristY = hand[0].y * height;
      const isRaised = wristY < height / 2;
      return isRaised;
    });

    if (bothOpenAndRaised) {
      ctx.strokeStyle = '#FFD700'; // ゴールド
      setHandSwinging(99); // 99の値で「両手を上に挙げた」ことを通知
      //丸を描く
      ctx.beginPath();
      ctx.lineWidth = 5;
      ctx.arc(width / 2, height /2, 30, 0, Math.PI * 2);
      ctx.stroke();
    }
    else{
        if (diff > 200) {
      ctx.strokeStyle = '#00FF62FF';
      setHandSwinging(1);
    } 
    else if (diff < -200) {
      ctx.strokeStyle = '#00FF62FF';
      setHandSwinging(-1);
    }
    else if (diff < 150) {
      ctx.strokeStyle = '#FF0000FF';
      setHandSwinging(0);
    }
    else {
      ctx.strokeStyle = '#0082cf';
    }

    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(width / 2, y1 + ygap);
    ctx.lineTo(width / 2, y2 + ygap);
    ctx.stroke();
    }

  }
};
