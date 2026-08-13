const Settings = require('../../models/Settings');
const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/response');

// GET /admin/settings
exports.get = asyncHandler(async (req, res) => {
  const settings = await Settings.getSingleton();
  return ok(res, settings);
});

// PUT /admin/settings
exports.update = asyncHandler(async (req, res) => {
  const settings = await Settings.getSingleton();
  const allowed = ['siteName', 'contactInfo', 'examSettings', 'demoSettings', 'subscriptionPlans', 'maintenanceMode'];
  allowed.forEach((f) => {
    if (req.body[f] !== undefined) settings[f] = req.body[f];
  });
  await settings.save();
  return ok(res, settings, 'Sozlamalar saqlandi');
});
