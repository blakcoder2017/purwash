const { processSettlements } = require('../utils/settlement');

const verifyCronSecret = (req) => {
  const headerSecret = req.get('x-cron-secret');
  const querySecret = req.query?.secret;
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return { ok: false, message: 'CRON_SECRET is not configured' };
  }
  if (headerSecret === expected || querySecret === expected) {
    return { ok: true };
  }
  return { ok: false, message: 'Unauthorized cron request' };
};

const runSettlementCron = async (req, res) => {
  const auth = verifyCronSecret(req);
  if (!auth.ok) {
    return res.status(401).json({ success: false, message: auth.message });
  }

  const result = await processSettlements();
  if (!result.success) {
    return res.status(500).json(result);
  }
  return res.json(result);
};

module.exports = {
  runSettlementCron
};
