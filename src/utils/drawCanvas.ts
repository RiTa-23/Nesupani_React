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
    videoHeight: number
) => {
    // 画面の縦横比を取得
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const screenAspectRatio = screenWidth / screenHeight;

    // Webカメラのアスペクト比を計算
    const videoAspectRatio = videoWidth / videoHeight;

    // キャンバスのサイズを調整
    const canvas = ctx.canvas;
    if (screenAspectRatio > videoAspectRatio) {
        // 横幅が広い場合（縦持ち）
        canvas.height = screenWidth;
        canvas.width = screenWidth / videoAspectRatio;
    } else {
        // 縦幅が広い場合（横持ち）
        canvas.width = screenWidth;
        canvas.height = screenWidth / videoAspectRatio;
    }

    const width = canvas.width;
    const height = canvas.height;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // canvas の左右反転
    ctx.scale(-1, 1);
    ctx.translate(-width, 0);

    // 手の描画
    if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
            drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
            drawLandmarks(ctx, landmarks, { color: '#FF0000', lineWidth: 2, radius: 3 });
        }
        drawCircle(ctx, results.multiHandLandmarks);
    }
    ctx.restore();
};

/**
 * 人差し指の先端と人差し指の先端の間に円を描く
 * @param ctx
 * @param handLandmarks
 */
const drawCircle = (ctx: CanvasRenderingContext2D, handLandmarks: NormalizedLandmarkListList) => {
    if (handLandmarks.length === 2 && handLandmarks[0].length > 8 && handLandmarks[1].length > 8) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        const [x1, y1] = [handLandmarks[0][8].x * width, handLandmarks[0][8].y * height];
        const [x2, y2] = [handLandmarks[1][8].x * width, handLandmarks[1][8].y * height];
        const x = (x1 + x2) / 2;
        const y = (y1 + y2) / 2;
        const r = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)) / 2;

        ctx.strokeStyle = '#0082cf';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2, true);
        ctx.stroke();
    }
};
