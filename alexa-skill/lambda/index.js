/**
 * TimeKernel Alexa Skill
 *
 * 対応インテント:
 * - 今日の予定を教えて
 * - 明日の予定を教えて
 * - X月Y日の予定を教えて
 * - 予定を追加して（タイトル、日付、時間）
 * - 今月のバイト代は？
 * - 次の予定は？
 */

const Alexa = require('ask-sdk-core');
const admin = require('firebase-admin');

// Firebase初期化（Lambda環境変数 FIREBASE_SERVICE_ACCOUNT にJSON文字列を設定）
if (!admin.apps.length) {
  const credJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (credJson) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(credJson)),
    });
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
}
const db = admin.firestore();

// ── ヘルパー関数 ──

async function getUserCalendarIds(uid) {
  const userDoc = await db.doc(`users/${uid}`).get();
  if (!userDoc.exists) return [];
  return userDoc.data().calendars || [];
}

async function getEventsForDate(uid, date) {
  const calendarIds = await getUserCalendarIds(uid);
  const events = [];

  // 共有カレンダーのイベント
  for (const calId of calendarIds) {
    try {
      const snap = await db
        .collection(`calendars/${calId}/events`)
        .where('date', '==', date)
        .orderBy('startTime')
        .get();

      for (const doc of snap.docs) {
        events.push({ id: doc.id, calendarId: calId, ...doc.data() });
      }
    } catch {}
  }

  // ローカルカレンダーのミラーイベント
  try {
    const mirrorSnap = await db
      .collection(`users/${uid}/eventMirror`)
      .where('date', '==', date)
      .get();

    for (const doc of mirrorSnap.docs) {
      events.push({ id: doc.id, ...doc.data() });
    }
  } catch {}

  return events.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
}

async function getShiftSummary(uid, yearMonth) {
  const calendarIds = await getUserCalendarIds(uid);
  const [year, month] = yearMonth.split('-').map(Number);
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

  let totalHours = 0;
  let totalPay = 0;
  let shiftCount = 0;

  for (const calId of calendarIds) {
    const snap = await db
      .collection(`calendars/${calId}/events`)
      .where('date', '>=', startDate)
      .where('date', '<', endDate)
      .get();

    for (const doc of snap.docs) {
      const data = doc.data();
      if (data.type !== 'shift' || !data.hourlyWage) continue;
      const [sh, sm] = (data.startTime || '0:0').split(':').map(Number);
      const [eh, em] = (data.endTime || '0:0').split(':').map(Number);
      let startMin = sh * 60 + sm;
      let endMin = eh * 60 + em;
      if (endMin <= startMin) endMin += 24 * 60;
      const hours = (endMin - startMin) / 60;
      totalHours += hours;
      totalPay += Math.round(hours * data.hourlyWage);
      shiftCount++;
    }
  }

  return { totalHours: Math.round(totalHours * 10) / 10, totalPay, shiftCount };
}

async function addEventViaQueue(uid, calendarId, eventData) {
  const ref = db.collection(`users/${uid}/eventQueue`).doc();
  await ref.set({
    action: 'add',
    calendarId,
    eventId: null,
    eventData,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getUidFromSession(handlerInput) {
  // Account LinkingでFirebase UIDを取得
  const accessToken = handlerInput.requestEnvelope.context.System.user.accessToken;
  // TODO: accessTokenからFirebase UIDを解決する
  // 開発中はハードコードまたは環境変数から取得
  return process.env.TIMEKERNEL_UID || '';
}

// ── インテントハンドラー ──

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speech = 'タイムカーネルです。今日の予定、予定の追加、バイト代の確認ができます。何をしますか？';
    return handlerInput.responseBuilder
      .speak(speech)
      .reprompt('今日の予定を聞きますか？それとも予定を追加しますか？')
      .getResponse();
  },
};

const GetTodayEventsHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetTodayEventsIntent'
    );
  },
  async handle(handlerInput) {
    const uid = getUidFromSession(handlerInput);
    if (!uid) return handlerInput.responseBuilder.speak('アカウント連携が必要です。アプリから設定してください。').getResponse();

    const today = formatDate(new Date());
    const events = await getEventsForDate(uid, today);

    if (events.length === 0) {
      return handlerInput.responseBuilder.speak('今日の予定はありません。').getResponse();
    }

    const eventList = events
      .map((e) => `${e.startTime}から ${e.title}`)
      .join('、');

    return handlerInput.responseBuilder
      .speak(`今日の予定は${events.length}件です。${eventList}。`)
      .getResponse();
  },
};

const GetDateEventsHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetDateEventsIntent'
    );
  },
  async handle(handlerInput) {
    const uid = getUidFromSession(handlerInput);
    if (!uid) return handlerInput.responseBuilder.speak('アカウント連携が必要です。').getResponse();

    const dateSlot = Alexa.getSlotValue(handlerInput.requestEnvelope, 'date');
    if (!dateSlot) return handlerInput.responseBuilder.speak('日付がわかりませんでした。').getResponse();

    const events = await getEventsForDate(uid, dateSlot);

    if (events.length === 0) {
      return handlerInput.responseBuilder.speak(`${dateSlot}の予定はありません。`).getResponse();
    }

    const eventList = events
      .map((e) => `${e.startTime}から ${e.title}`)
      .join('、');

    return handlerInput.responseBuilder
      .speak(`${dateSlot}の予定は${events.length}件です。${eventList}。`)
      .getResponse();
  },
};

const GetNextEventHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetNextEventIntent'
    );
  },
  async handle(handlerInput) {
    const uid = getUidFromSession(handlerInput);
    if (!uid) return handlerInput.responseBuilder.speak('アカウント連携が必要です。').getResponse();

    const now = new Date();
    const today = formatDate(now);
    const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const events = await getEventsForDate(uid, today);

    const next = events.find((e) => e.startTime > nowTime);
    if (!next) {
      return handlerInput.responseBuilder.speak('今日この後の予定はありません。').getResponse();
    }

    return handlerInput.responseBuilder
      .speak(`次の予定は${next.startTime}から、${next.title}です。`)
      .getResponse();
  },
};

const AddEventHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'AddEventIntent'
    );
  },
  async handle(handlerInput) {
    const uid = getUidFromSession(handlerInput);
    if (!uid) return handlerInput.responseBuilder.speak('アカウント連携が必要です。').getResponse();

    const date = Alexa.getSlotValue(handlerInput.requestEnvelope, 'date');
    const time = Alexa.getSlotValue(handlerInput.requestEnvelope, 'time');

    // 日付がなければ今日をデフォルトに
    const eventDate = date || formatDate(new Date());
    const startTime = time || '09:00';

    // セッションに日付・時間を保存してタイトルを聞く
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    sessionAttributes.pendingEventDate = eventDate;
    sessionAttributes.pendingEventTime = startTime;
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

    return handlerInput.responseBuilder
      .speak(`${eventDate}の${startTime}に予定を追加します。予定のタイトルを教えてください。`)
      .reprompt('予定のタイトルは何ですか？')
      .getResponse();
  },
};

const SetEventTitleHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'SetEventTitleIntent'
    );
  },
  async handle(handlerInput) {
    const uid = getUidFromSession(handlerInput);
    if (!uid) return handlerInput.responseBuilder.speak('アカウント連携が必要です。').getResponse();

    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const eventDate = sessionAttributes.pendingEventDate;
    const startTime = sessionAttributes.pendingEventTime;

    if (!eventDate) {
      return handlerInput.responseBuilder.speak('まず「予定を追加して」と言ってください。').getResponse();
    }

    const title = Alexa.getSlotValue(handlerInput.requestEnvelope, 'title');
    if (!title) {
      return handlerInput.responseBuilder.speak('タイトルが聞き取れませんでした。もう一度お願いします。').reprompt('予定のタイトルは？').getResponse();
    }

    const calendarIds = await getUserCalendarIds(uid);
    if (calendarIds.length === 0) {
      return handlerInput.responseBuilder.speak('カレンダーがありません。アプリから作成してください。').getResponse();
    }

    const [h, m] = startTime.split(':').map(Number);
    const endTime = `${String(Math.min(h + 1, 23)).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    await addEventViaQueue(uid, calendarIds[0], {
      title,
      type: 'event',
      date: eventDate,
      startTime,
      endTime,
      color: '#e74c3c',
      createdBy: uid,
    });

    // セッション属性をクリア
    sessionAttributes.pendingEventDate = null;
    sessionAttributes.pendingEventTime = null;
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

    return handlerInput.responseBuilder
      .speak(`${eventDate}の${startTime}に「${title}」を追加しました。`)
      .getResponse();
  },
};

const GetShiftSummaryHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetShiftSummaryIntent'
    );
  },
  async handle(handlerInput) {
    const uid = getUidFromSession(handlerInput);
    if (!uid) return handlerInput.responseBuilder.speak('アカウント連携が必要です。').getResponse();

    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const summary = await getShiftSummary(uid, yearMonth);

    if (summary.shiftCount === 0) {
      return handlerInput.responseBuilder.speak('今月のバイトはまだ記録されていません。').getResponse();
    }

    return handlerInput.responseBuilder
      .speak(`今月のバイトは${summary.shiftCount}回、合計${summary.totalHours}時間で、見込み給料は${summary.totalPay.toLocaleString()}円です。`)
      .getResponse();
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent'
    );
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('「今日の予定」「明日の予定」「予定を追加」「今月のバイト代」と話しかけてください。')
      .reprompt('何をしますか？')
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent' ||
        Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent')
    );
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder.speak('またね！').getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.error('Error:', error);
    return handlerInput.responseBuilder
      .speak('すみません、エラーが発生しました。もう一度試してください。')
      .getResponse();
  },
};

// ── スキルビルダー ──

exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    GetTodayEventsHandler,
    GetDateEventsHandler,
    GetNextEventHandler,
    AddEventHandler,
    SetEventTitleHandler,
    GetShiftSummaryHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
