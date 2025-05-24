// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
admin.initializeApp();

const LINE_CHANNEL_ACCESS_TOKEN = functions.config().line.channel_access_token; // 環境変数で管理

exports.sendLineGameStart = functions.https.onCall(async (data, context) => {
  const { gameId } = data;
  if (!gameId) throw new functions.https.HttpsError('invalid-argument', 'gameId required');

  // FirestoreからlineUserId取得
  const doc = await admin.firestore().collection('gameIds').doc(gameId).get();
  if (!doc.exists) throw new functions.https.HttpsError('not-found', 'gameId not found');
  const lineUserId = doc.data().lineUserId;
  if (!lineUserId) throw new functions.https.HttpsError('not-found', 'lineUserId not found');

  // LINE Messaging APIでメッセージ送信
  try {
    await axios.post(
      'https://api.line.me/v2/bot/message/push',
      {
        to: lineUserId,
        messages: [{ type: 'text', text: 'ゲーム開始！' }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
        }
      }
    );
    return { success: true };
  } catch (error) {
    console.error("LINE送信エラー", error.response?.data || error.message || error);
    throw new functions.https.HttpsError('internal', 'LINE API送信失敗', error.message);
  }
});