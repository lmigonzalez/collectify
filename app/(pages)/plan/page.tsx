"use client";

import React, { useEffect, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";

type PlanStats = {
  plan: string;
  status: string;
  limits: {
    monthlyLimit: number;
    perOperationLimit: number;
    price: number;
    features: string[];
  };
};

type PlanDetail = {
  id: string;
  name: string;
  price: number;
  features: string[];
  aliases?: string[];
};

const PLAN_DETAILS: PlanDetail[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    features: [
      "100 collections download per month",
      "100 collections upload per month",
      "100 collections per CSV file",
      "Advanced download filters",
      "Example templates",
      "Fast support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 999,
    aliases: ["premium"],
    features: [
      "10,000 collections download per month",
      "10,000 collections upload per month",
      "1,000 collections per CSV file",
      "Advanced download filters",
      "Example templates",
      "Fast support",
    ],
  },
];

export default function PlanPage() {
  const appBridge = useAppBridge();
  const [planStats, setPlanStats] = useState<PlanStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlanStats = async () => {
      try {
        setLoading(true);

        // Get JWT token from App Bridge for authentication
        const token = await appBridge.idToken();

        // Fetch current subscription from Shopify
        const subResponse = await fetch("/api/subscriptions/status", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!subResponse.ok) {
          throw new Error("Unable to load subscription information.");
        }
        const subData = await subResponse.json();
        console.debug("Current subscription from Shopify:", subData);

        // Fetch usage stats
        const statsResponse = await fetch("/api/usage/stats", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!statsResponse.ok) {
          throw new Error("Unable to load plan information.");
        }

        const data = await statsResponse.json();
        console.debug("Current plan response", data);

        // Use the plan from Shopify subscription if available
        const actualPlan = subData.plan || data.plan;

        setPlanStats({
          plan: actualPlan,
          status: data.status,
          limits: data.limits,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchPlanStats();
  }, []);

  const renderPrice = (priceInCents: number) => {
    if (priceInCents === 0) {
      return "Included";
    }

    return `$${(priceInCents / 100).toFixed(2)} / month`;
  };

  return (
    <s-page heading="Your Plan" inlineSize="large">
      <s-stack>
        {" "}
        <s-box padding="large">
          <s-stack direction="block" gap="large">
            {loading && (
              <s-stack direction="inline" gap="base">
                <s-spinner size="base" />
                <span>Loading your plan…</span>
              </s-stack>
            )}

            {error && (
              <s-box background="subdued" padding="base" borderRadius="base">
                <s-stack direction="block" gap="base">
                  <s-text>{error}</s-text>
                  <s-button onClick={() => window.location.reload()}>
                    Try again
                  </s-button>
                </s-stack>
              </s-box>
            )}

             {!loading && !error && planStats && (
              <s-stack direction="block" gap="large">
                <div className="flex flex-wrap gap-6">
                   {PLAN_DETAILS.map((planDetail) => {
                     const normalizedPlan = planStats.plan.toLowerCase();
                     const matchesAlias = planDetail.aliases?.some(
                       (alias) => alias.toLowerCase() === normalizedPlan
                     );
                     const isCurrent =
                       normalizedPlan === planDetail.id.toLowerCase() ||
                       Boolean(matchesAlias);

                    return (
                      <div
                         key={planDetail.id}
                        className={`flex-1 min-w-[320px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${
                          isCurrent ? "ring-2 ring-blue-500" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h2 className="text-xl font-bold">
                            {planDetail.name}
                          </h2>
                          {isCurrent && (
                            <s-badge tone="success" size="large-100">
                              Current
                            </s-badge>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-slate-600">
                          {renderPrice(
                            isCurrent
                              ? planStats.limits.price
                              : planDetail.price
                          )}
                        </p>
                        <div className="my-4 h-px w-full bg-slate-200" />
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            Includes:
                          </p>
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                            {planDetail.features.map((feature) => (
                              <li key={feature}>{feature}</li>
                            ))}
                          </ul>
                        </div>
                        {isCurrent && (
                          <div className="mt-4 space-y-1 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
                            <p>
                              Status:{" "}
                              <span className="capitalize">
                                {planStats.status}
                              </span>
                            </p>
                            <p>
                              Monthly limit: {planStats.limits.monthlyLimit}
                            </p>
                            <p>
                              Per operation limit:{" "}
                              {planStats.limits.perOperationLimit}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <s-button
                  variant="primary"
                  href="https://admin.shopify.com/charges/collectify-6/pricing_plans"
                >
                  Manage plan
                </s-button>
              </s-stack>
            )}
          </s-stack>
        </s-box>
      </s-stack>
    </s-page>
  );
}
