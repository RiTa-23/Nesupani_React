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
    setIsHandSwinging: (isHandSwinging: boolean) => void
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
        drawLine(ctx, results.multiHandLandmarks, setIsHandSwinging); // 状態更新用のコールバックを渡す
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
        drawLine(ctx, results.multiHandLandmarks,setIsHandSwinging); // 状態更新用のコールバックを渡す
    }
    ctx.restore();
};

/**
 * 左右の手首の間に垂直方向の線を描く（画面の中心）
 * @param ctx
 * @param handLandmarks
 */
const drawLine = (ctx: CanvasRenderingContext2D, handLandmarks: NormalizedLandmarkListList,
    setIsHandSwinging: (isHandSwinging: boolean) => void
) => {
    if (handLandmarks.length === 2 && handLandmarks[0].length > 8 && handLandmarks[1].length > 8) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;

        const y1 = handLandmarks[0][8].y * height;
        const y2 = handLandmarks[1][8].y * height;
        console.log('y1:', y1, 'y2:', y2);
        
        // 画面の中心からのズレを計算
        const y = (y1 + y2) / 2;
        const ygap=height/2-y;

        // y1とy2の差を計算
        const diff = Math.abs(y1 - y2);
        console.log('diff:', diff);


        
        if(diff > 200) {
            ctx.strokeStyle = '#00FF62FF';
            setIsHandSwinging(true);
        }
        else if(diff < 50){
            ctx.strokeStyle = '#FF0000FF';
            setIsHandSwinging(false);
        }
        else{
            ctx.strokeStyle = '#0082cf';
        }

        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(width/2, y1+ygap);
        ctx.lineTo(width/2, y2+ygap);
        ctx.stroke();
    }
};
