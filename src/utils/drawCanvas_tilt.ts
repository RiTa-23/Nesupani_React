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
    setHandTilt: (tiltValue: number | null) => void // コールバック名と型を変更
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

    // canvas の左右反転
    ctx.scale(-1, 1);
    ctx.translate(-width, 0);

    // 手の描画
    if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
            drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
            drawLandmarks(ctx, landmarks, { color: '#FF0000', lineWidth: 2, radius: 3 });
        }
        drawLine(ctx, results.multiHandLandmarks, setHandTilt); // コールバック名を変更
    }
    ctx.restore();
};

/**
 * 左右の手首の傾きに平行な線を描く（画面の中心）
 * @param ctx
 * @param handLandmarks
 */
const drawLine = (
    ctx: CanvasRenderingContext2D,
    handLandmarks: NormalizedLandmarkListList,
    setHandStill: (tiltValue: number | null) => void // コールバック名と型を変更
) => {
    if (handLandmarks.length === 2 && handLandmarks[0].length > 8 && handLandmarks[1].length > 8) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;

        // 手首の位置を取得
        const rightHand = handLandmarks[0][0];
        const leftHand = handLandmarks[1][0];

        const x1 = rightHand.x * width;
        const x2 = leftHand.x * width;

        const y1 = rightHand.y * height;
        const y2 = leftHand.y * height;

        // 傾きを計算
        const tiltValue = (y1 - y2) / (x1 - x2);

        // 傾きに応じて線の色を変化
        if (tiltValue > 0.2) {
            ctx.strokeStyle = '#FF5959FF';
        } else if (tiltValue < -0.2) {
            ctx.strokeStyle = '#6467FFFF';
        } else {
            ctx.strokeStyle = '#98FFBEFF';
        }

        setHandStill(tiltValue); // 傾き値をセット

        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
};
