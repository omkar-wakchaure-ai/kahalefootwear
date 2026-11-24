const admin = require('firebase-admin');
const { setGlobalOptions } = require('firebase-functions/v2');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentUpdated } = require('firebase-functions/v2/firestore');

admin.initializeApp();

setGlobalOptions({ region: 'asia-south1', maxInstances: 10 });

const CANCELLABLE_STATUSES = new Set(['new', 'pending', 'placed', 'confirmed']);
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const ORDER_CHANNEL_ID = 'order-alerts';

const digitsOnly = (value) => String(value || '').replace(/\D/g, '');

const isExpoPushToken = (token) =>
  typeof token === 'string' &&
  (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken['));

const customerOwnsOrder = (order, auth) => {
  if (order.customerUid && order.customerUid === auth.uid) return true;

  const tokenPhone = digitsOnly(auth.token?.phone_number);
  if (tokenPhone.length < 10) return false;

  return [order.customerPhone, order.mobileNumber].some((orderPhone) => {
    const normalized = digitsOnly(orderPhone);
    return normalized.length >= 10 && normalized.slice(-10) === tokenPhone.slice(-10);
  });
};

exports.cancelOrder = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Please sign in to cancel this order.');
  }

  const orderId = typeof request.data?.orderId === 'string' ? request.data.orderId.trim() : '';
  if (!orderId) {
    throw new HttpsError('invalid-argument', 'A valid order id is required.');
  }

  const reason = typeof request.data?.reason === 'string' ? request.data.reason.trim() : '';
  const cancelReason = reason.slice(0, 300) || 'Cancelled by customer';

  const orderRef = admin.firestore().collection('Orders').doc(orderId);
  const orderSnapshot = await orderRef.get();

  if (!orderSnapshot.exists) {
    throw new HttpsError('not-found', 'This order could not be found.');
  }

  const order = orderSnapshot.data();
  const currentStatus = String(order.status || '').toLowerCase();

  if (!CANCELLABLE_STATUSES.has(currentStatus)) {
    throw new HttpsError('failed-precondition', 'This order can no longer be cancelled.');
  }

  if (!customerOwnsOrder(order, request.auth)) {
    throw new HttpsError('permission-denied', 'You are not allowed to cancel this order.');
  }

  await orderRef.update({
    status: 'Cancelled',
    cancelledBy: 'customer',
    cancelReason,
    cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true, status: 'Cancelled' };
});

exports.notifyShopkeeperOrderCancelled = onDocumentUpdated('Orders/{orderId}', async (event) => {
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();

  if (!before || !after) return;
  if (String(before.status || '').toLowerCase() === 'cancelled') return;
  if (String(after.status || '').toLowerCase() !== 'cancelled') return;
  if (after.cancelledBy !== 'customer') return;

  const orderId = event.params.orderId;
  const items = Array.isArray(after.items) ? after.items : [];
  const primaryItem = items[0] || {};
  const productName = after.shoeName || primaryItem.shoeName || 'Product';
  const size = after.selectedSize ?? primaryItem.selectedSize ?? 'N/A';
  const color = primaryItem.selectedColor || after.selectedColor || 'N/A';
  const customerName = after.customerName || 'Customer';

  const title = 'Order Cancelled by Customer';
  const body = `Order #${orderId} (${productName} - Size ${size}, Color ${color}) was cancelled by ${customerName}.`;

  const shopkeepersSnapshot = await admin.firestore().collection('shopkeepers').get();
  const recipients = [];

  shopkeepersSnapshot.forEach((shopkeeperDoc) => {
    const tokens = shopkeeperDoc.data()?.pushTokens;
    if (!Array.isArray(tokens)) return;

    tokens.filter(isExpoPushToken).forEach((token) => {
      recipients.push({ token, ref: shopkeeperDoc.ref });
    });
  });

  if (recipients.length === 0) {
    console.log('No shopkeeper push tokens registered for order cancellation:', orderId);
    return;
  }

  const messages = recipients.map(({ token }) => ({
    to: token,
    title,
    body,
    sound: 'default',
    priority: 'high',
    channelId: ORDER_CHANNEL_ID,
    vibration: [0, 500, 200, 500],
    data: { type: 'order_cancelled', orderId },
  }));

  const response = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    throw new Error(`Expo push request failed with status ${response.status}`);
  }

  const payload = await response.json().catch(() => ({}));
  const receipts = Array.isArray(payload.data) ? payload.data : [];

  const staleTokens = new Set();
  receipts.forEach((receipt, index) => {
    if (receipt?.status === 'error' && receipt?.details?.error === 'DeviceNotRegistered') {
      if (recipients[index]) staleTokens.add(recipients[index].token);
    }
  });

  if (staleTokens.size > 0) {
    await Promise.all(
      recipients
        .filter(({ token }) => staleTokens.has(token))
        .map(async ({ token, ref }) => {
          try {
            await ref.update({ pushTokens: admin.firestore.FieldValue.arrayRemove(token) });
          } catch (cleanupError) {
            console.error('Failed to remove stale shopkeeper push token:', cleanupError);
          }
        }),
    );
  }
});
