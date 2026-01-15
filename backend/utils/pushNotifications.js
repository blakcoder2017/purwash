const axios = require('axios');
const User = require('../models/User');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const isExpoToken = (token) => typeof token === 'string' && token.startsWith('ExponentPushToken');

const sendPushToUser = async (userId, { title, body, data = {} }) => {
  const user = await User.findById(userId).select('pushTokens');
  if (!user || !Array.isArray(user.pushTokens)) return;

  const tokens = user.pushTokens.filter(isExpoToken);
  if (tokens.length === 0) return;

  const payload = tokens.map((token) => ({
    to: token,
    sound: 'default',
    title,
    body,
    data
  }));

  await axios.post(EXPO_PUSH_URL, payload, {
    headers: { 'Content-Type': 'application/json' }
  });
};

module.exports = {
  sendPushToUser
};
