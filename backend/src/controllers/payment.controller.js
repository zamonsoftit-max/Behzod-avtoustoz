const { v4: uuidv4 } = require('uuid');
const Payment = require('../models/Payment');
const Settings = require('../models/Settings');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const { getPaging } = require('../utils/pagination');
const click = require('../services/payment/click.service');
const payme = require('../services/payment/payme.service');
const { activateSubscription } = require('../services/subscription.service');
const { pick } = require('../utils/i18n');

// GET /payments/plans  va  GET /payments/subscription-types
exports.getPlans = asyncHandler(async (req, res) => {
  const settings = await Settings.getSingleton();
  const plans = settings.subscriptionPlans
    .filter((p) => p.isActive)
    .map((p) => ({
      key: p.key,
      name: pick(p.name, req.lang) || p.key,
      nameMulti: p.name,
      price: p.price,
      durationDays: p.durationDays,
      type: p.type,
      features: p.features,
      popular: p.popular,
    }));
  return ok(res, plans);
});

// POST /payments/create  { plan, paymentMethod }
exports.create = asyncHandler(async (req, res) => {
  const { plan: planKey, paymentMethod } = req.body;
  if (!['click', 'payme', 'manual'].includes(paymentMethod)) {
    throw ApiError.badRequest('To\'lov usuli noto\'g\'ri');
  }

  const settings = await Settings.getSingleton();
  const plan = settings.subscriptionPlans.find((p) => p.key === planKey && p.isActive);
  if (!plan) throw ApiError.notFound('Tarif rejasi topilmadi');

  const transactionId = uuidv4();
  const payment = await Payment.create({
    user: req.user._id,
    plan: plan.key,
    subscriptionType: pick(plan.name, req.lang) || plan.key,
    amount: plan.price,
    durationDays: plan.durationDays,
    paymentMethod,
    status: 'pending',
    transactionId,
  });

  const returnUrl = `${env.CLIENT_URL.split(',')[0]}/student/payments`;
  let paymentUrl = '';

  if (paymentMethod === 'click') {
    paymentUrl = click.buildPaymentUrl({ amount: plan.price, transactionId, returnUrl });
  } else if (paymentMethod === 'payme') {
    paymentUrl = payme.buildCheckoutUrl({ amount: plan.price, orderId: transactionId, returnUrl });
  }
  payment.paymentUrl = paymentUrl;
  await payment.save();

  // Dev rejimda darhol tasdiqlash uchun maslahat beramiz
  const devHint = (paymentMethod === 'click' && env.clickDevMode) || (paymentMethod === 'payme' && env.paymeDevMode);

  return ok(
    res,
    { paymentId: payment._id, paymentUrl, transactionId, devMode: devHint },
    'To\'lov yaratildi'
  );
});

// GET /payments/history
exports.history = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaging(req.query);
  const filter = { user: req.user._id };
  const [items, total] = await Promise.all([
    Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Payment.countDocuments(filter),
  ]);
  return res.json({
    success: true,
    data: items,
    pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  });
});

// GET /payments/:paymentId
exports.getOne = asyncHandler(async (req, res) => {
  const payment = await Payment.findOne({ _id: req.params.paymentId, user: req.user._id });
  if (!payment) throw ApiError.notFound('To\'lov topilmadi');
  return ok(res, payment);
});

// GET /payments/:paymentId/status
exports.getStatus = asyncHandler(async (req, res) => {
  const payment = await Payment.findOne({ _id: req.params.paymentId, user: req.user._id }).select('status paidAt');
  if (!payment) throw ApiError.notFound('To\'lov topilmadi');
  return ok(res, { status: payment.status, paidAt: payment.paidAt });
});

// POST /payments/:paymentId/cancel
exports.cancel = asyncHandler(async (req, res) => {
  const payment = await Payment.findOne({ _id: req.params.paymentId, user: req.user._id });
  if (!payment) throw ApiError.notFound('To\'lov topilmadi');
  if (payment.status === 'completed') throw ApiError.badRequest('To\'langan to\'lovni bekor qilib bo\'lmaydi');
  payment.status = 'cancelled';
  payment.cancelledAt = new Date();
  await payment.save();
  return ok(res, payment, 'To\'lov bekor qilindi');
});

// POST /payments/test/complete  { paymentId }  — faqat dev rejim uchun
exports.testComplete = asyncHandler(async (req, res) => {
  if (env.isProd) throw ApiError.forbidden('Bu amal faqat development rejimida mavjud');
  const payment = await Payment.findOne({ _id: req.body.paymentId, user: req.user._id });
  if (!payment) throw ApiError.notFound('To\'lov topilmadi');
  payment.providerTransId = `DEV-${Date.now()}`;
  await activateSubscription(payment);
  return ok(res, payment, 'To\'lov (dev) tasdiqlandi va obuna faollashtirildi');
});

// ===== Click webhook'lari =====
// Click serveri quyidagi endpointlarni chaqiradi. Javob Click formatida bo'lishi shart.

// POST /payments/click/prepare
exports.clickPrepare = asyncHandler(async (req, res) => {
  if (!click.verifySign(req.body)) {
    return res.json(click.buildError(click.ERR.SIGN_CHECK_FAILED, 'Imzo noto\'g\'ri'));
  }
  const payment = await Payment.findOne({ transactionId: req.body.merchant_trans_id });
  if (!payment) return res.json(click.buildError(click.ERR.TRANSACTION_NOT_FOUND, 'Tranzaksiya topilmadi'));
  if (payment.status === 'completed') return res.json(click.buildError(click.ERR.ALREADY_PAID, 'Allaqachon to\'langan'));
  if (Number(req.body.amount) !== payment.amount) {
    return res.json(click.buildError(click.ERR.INCORRECT_AMOUNT, 'Summa noto\'g\'ri'));
  }

  payment.providerTransId = req.body.click_trans_id;
  payment.status = 'pending';
  await payment.save();

  return res.json({
    error: click.ERR.SUCCESS,
    error_note: 'Success',
    click_trans_id: req.body.click_trans_id,
    merchant_trans_id: req.body.merchant_trans_id,
    merchant_prepare_id: payment._id.toString(),
  });
});

// POST /payments/click/complete
exports.clickComplete = asyncHandler(async (req, res) => {
  if (!click.verifySign(req.body)) {
    return res.json(click.buildError(click.ERR.SIGN_CHECK_FAILED, 'Imzo noto\'g\'ri'));
  }
  const payment = await Payment.findOne({ transactionId: req.body.merchant_trans_id });
  if (!payment) return res.json(click.buildError(click.ERR.TRANSACTION_NOT_FOUND, 'Tranzaksiya topilmadi'));

  // error < 0 => Click foydalanuvchi tomonidan bekor qilindi
  if (Number(req.body.error) < 0) {
    payment.status = 'cancelled';
    await payment.save();
    return res.json(click.buildError(click.ERR.TRANSACTION_CANCELLED, 'Bekor qilindi'));
  }

  if (payment.status !== 'completed') {
    await activateSubscription(payment);
  }

  return res.json({
    error: click.ERR.SUCCESS,
    error_note: 'Success',
    click_trans_id: req.body.click_trans_id,
    merchant_trans_id: req.body.merchant_trans_id,
    merchant_confirm_id: payment._id.toString(),
  });
});

// ===== Payme =====
// Frontend tomonidan chaqiriladigan create/perform (dev rejim uchun soddalashtirilgan).

// POST /payments/payme/create  { paymentId }
exports.paymeCreate = asyncHandler(async (req, res) => {
  const payment = await Payment.findOne({ _id: req.body.paymentId, user: req.user._id });
  if (!payment) throw ApiError.notFound('To\'lov topilmadi');
  const returnUrl = `${env.CLIENT_URL.split(',')[0]}/student/payments`;
  const url = payme.buildCheckoutUrl({ amount: payment.amount, orderId: payment.transactionId, returnUrl });
  payment.paymentUrl = url;
  await payment.save();
  return ok(res, { paymentUrl: url, paymentId: payment._id });
});

// POST /payments/payme/perform  { paymentId }  — dev rejimda darhol tasdiqlaydi
exports.paymePerform = asyncHandler(async (req, res) => {
  if (env.isProd && !env.paymeDevMode) {
    throw ApiError.forbidden('Payme to\'lovi gateway orqali tasdiqlanadi');
  }
  const payment = await Payment.findOne({ _id: req.body.paymentId, user: req.user._id });
  if (!payment) throw ApiError.notFound('To\'lov topilmadi');
  payment.providerState = payme.STATE.PERFORMED;
  payment.providerTransId = `PAYME-DEV-${Date.now()}`;
  await activateSubscription(payment);
  return ok(res, payment, 'To\'lov tasdiqlandi');
});

// POST /payments/payme  — Payme JSON-RPC gateway (haqiqiy Payme serveri chaqiradi)
exports.paymeGateway = asyncHandler(async (req, res) => {
  if (!payme.checkAuth(req)) {
    return res.json(payme.rpcError(req.body?.id, payme.ERR.INSUFFICIENT_PRIVILEGE, 'Ruxsat yo\'q'));
  }
  const { id, method, params } = req.body || {};

  try {
    switch (method) {
      case 'CheckPerformTransaction': {
        const payment = await Payment.findOne({ transactionId: params.account?.order_id });
        if (!payment) return res.json(payme.rpcError(id, payme.ERR.ORDER_NOT_FOUND, 'Buyurtma topilmadi'));
        if (params.amount !== payment.amount * 100) {
          return res.json(payme.rpcError(id, payme.ERR.INVALID_AMOUNT, 'Summa noto\'g\'ri'));
        }
        return res.json(payme.rpcResult(id, { allow: true }));
      }
      case 'CreateTransaction': {
        const payment = await Payment.findOne({ transactionId: params.account?.order_id });
        if (!payment) return res.json(payme.rpcError(id, payme.ERR.ORDER_NOT_FOUND, 'Buyurtma topilmadi'));
        payment.providerTransId = params.id;
        payment.providerState = payme.STATE.CREATED;
        await payment.save();
        return res.json(payme.rpcResult(id, { create_time: Date.now(), transaction: payment._id.toString(), state: payme.STATE.CREATED }));
      }
      case 'PerformTransaction': {
        const payment = await Payment.findOne({ providerTransId: params.id });
        if (!payment) return res.json(payme.rpcError(id, payme.ERR.TRANSACTION_NOT_FOUND, 'Tranzaksiya topilmadi'));
        if (payment.providerState !== payme.STATE.PERFORMED) {
          payment.providerState = payme.STATE.PERFORMED;
          await activateSubscription(payment);
        }
        return res.json(payme.rpcResult(id, { perform_time: Date.now(), transaction: payment._id.toString(), state: payme.STATE.PERFORMED }));
      }
      case 'CancelTransaction': {
        const payment = await Payment.findOne({ providerTransId: params.id });
        if (!payment) return res.json(payme.rpcError(id, payme.ERR.TRANSACTION_NOT_FOUND, 'Tranzaksiya topilmadi'));
        payment.providerState = payment.providerState === payme.STATE.PERFORMED ? payme.STATE.CANCELLED_AFTER_PERFORM : payme.STATE.CANCELLED;
        payment.status = 'cancelled';
        payment.cancelReason = params.reason;
        await payment.save();
        return res.json(payme.rpcResult(id, { cancel_time: Date.now(), transaction: payment._id.toString(), state: payment.providerState }));
      }
      case 'CheckTransaction': {
        const payment = await Payment.findOne({ providerTransId: params.id });
        if (!payment) return res.json(payme.rpcError(id, payme.ERR.TRANSACTION_NOT_FOUND, 'Tranzaksiya topilmadi'));
        return res.json(payme.rpcResult(id, {
          create_time: payment.createdAt.getTime(),
          perform_time: payment.paidAt ? payment.paidAt.getTime() : 0,
          cancel_time: payment.cancelledAt ? payment.cancelledAt.getTime() : 0,
          transaction: payment._id.toString(),
          state: payment.providerState,
          reason: payment.cancelReason || null,
        }));
      }
      default:
        return res.json(payme.rpcError(id, payme.ERR.RPC_METHOD_NOT_FOUND, 'Metod topilmadi'));
    }
  } catch (err) {
    return res.json(payme.rpcError(id, payme.ERR.TRANSPORT, err.message));
  }
});
