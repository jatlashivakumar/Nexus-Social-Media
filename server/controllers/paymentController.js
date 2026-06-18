import crypto from 'crypto';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import logger from '../utils/logger.js';

// Map our plan names to Razorpay Plan IDs (created in Razorpay Dashboard)
const PLAN_IDS = {
  pro:     process.env.RAZORPAY_PRO_PLAN_ID,
  creator: process.env.RAZORPAY_CREATOR_PLAN_ID,
};

// Upgrade the user's subscription plan (free → pro/creator)

export const upgradePlan = asyncHandler(async (req, res) => {
  const { plan } = req.body;

  if (!['free', 'pro', 'creator'].includes(plan)) {
    return next(new AppError('Invalid plan', 400));
  }

  await User.findByIdAndUpdate(req.user._id, {
    subscription: plan,
  });

  res.status(200).json({
    success: true,
    message: `Plan changed to ${plan}`,
  });
});

// Get the user's current subscription plan
export const getSubscription = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    data: {
      plan: user.subscription || 'free',
    },
  });
});