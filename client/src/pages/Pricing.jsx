import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  RiCheckLine,
  RiLoader4Line,
  RiVipCrownFill,
  RiRocketFill,
} from "react-icons/ri";
import { paymentApi } from "@/services/api";
import { cn } from "@/utils";
import toast from "react-hot-toast";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    Icon: null,
    description: "Get started with the basics",
    features: [
      "10 posts per day",
      "Basic messaging",
      "Standard support",
      "Public profile",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 799,
    Icon: RiRocketFill,
    popular: true,
    description: "For active creators who want more",
    features: [
      "Unlimited posts",
      "Verified badge",
      "Profile analytics",
      "Priority support",
      "Advanced privacy controls",
    ],
  },
  {
    id: "creator",
    name: "Creator",
    price: 1999,
    Icon: RiVipCrownFill,
    description: "Everything you need to grow and monetize",
    features: [
      "Everything in Pro",
      "Monetization tools",
      "Custom profile themes",
      "Advanced analytics dashboard",
      "Early access features",
      "Dedicated account manager",
    ],
  },
];

export default function Pricing() {
  const qc = useQueryClient();
  const [loadingPlan, setLoadingPlan] = useState(null);

  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => paymentApi.getSubscription().then((r) => r.data.data),
  });

  const currentPlan = subscription?.plan || "free";

  const handleSubscribe = async (planId) => {
    if (planId === currentPlan) return;

    try {
      setLoadingPlan(planId);

      await paymentApi.upgradePlan(planId);

      await qc.invalidateQueries({
        queryKey: ["subscription"],
      });

      toast.success(`Switched to ${planId.toUpperCase()} plan`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update plan");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleCancel = async () => {
    try {
      setLoadingPlan("free");

      await paymentApi.upgradePlan("free");

      await qc.invalidateQueries({
        queryKey: ["subscription"],
      });

      toast.success("Switched to Free plan");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update plan");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>Pricing · Nexus</title>
      </Helmet>

      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold mb-3">
          Choose your <span className="text-gradient">plan</span>
        </h1>
        <p className="text-secondary text-base max-w-md mx-auto">
          Upgrade anytime. Cancel anytime. Prices in INR.
        </p>
      </div>

      {currentPlan !== "free" && (
        <div className="card p-4 mb-8 flex items-center justify-between bg-nexus/5 border-nexus/20">
          <div>
            <p className="text-sm font-semibold">
              You're on the{" "}
              <span className="text-nexus capitalize">{currentPlan}</span> plan
            </p>
          </div>
          <button
            onClick={handleCancel}
            disabled={loadingPlan === "free"}
            className="btn-secondary btn text-sm"
          >
            {loadingPlan === "free" ? (
              <RiLoader4Line size={15} className="animate-spin" />
            ) : (
              "Switch to Free"
            )}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {PLANS.map((plan, i) => {
          const isCurrent = plan.id === currentPlan;
          const isLoading = loadingPlan === plan.id;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={cn(
                "card p-6 relative flex flex-col",
                plan.popular &&
                  "border-nexus shadow-glow-sm ring-1 ring-nexus/30",
              )}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-nexus text-white text-xs font-bold px-3 py-1 rounded-full shadow-glow-sm">
                  Most Popular
                </span>
              )}

              <div className="flex items-center gap-2 mb-1">
                {plan.Icon && <plan.Icon size={20} className="text-nexus" />}
                <h3 className="font-display font-bold text-lg">{plan.name}</h3>
              </div>
              <p className="text-sm text-muted mb-4">{plan.description}</p>

              <div className="mb-5">
                <span className="text-3xl font-extrabold">₹{plan.price}</span>
                {plan.price > 0 && (
                  <span className="text-sm text-muted">/month</span>
                )}
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <RiCheckLine
                      size={16}
                      className="text-emerald-500 flex-shrink-0 mt-0.5"
                    />
                    <span className="text-secondary">{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={isLoading || isCurrent}
                className={cn(
                  "btn w-full",
                  plan.id === "free" || isCurrent
                    ? "btn-secondary"
                    : "btn-primary",
                )}
              >
                {isLoading ? (
                  <RiLoader4Line size={16} className="animate-spin" />
                ) : isCurrent ? (
                  "Current Plan"
                ) : plan.id === "free" ? (
                  "Free Forever"
                ) : (
                  `Upgrade to ${plan.name}`
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted mt-8">
        Upgrade your Nexus experience with premium features.
      </p>
    </>
  );
}
