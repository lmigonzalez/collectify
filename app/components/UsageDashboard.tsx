"use client";

import React, { useState, useEffect } from "react";

interface UsageStats {
  current: {
    collectionsImported: number;
    collectionsExported: number;
    total: number;
  };
  limits: {
    monthlyLimit: number;
    perOperationLimit: number;
    price: number;
    features: string[];
  };
  plan: string;
  status: string;
  resetDate: string;
}

export default function UsageDashboard() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsageStats();
  }, []);

  const fetchUsageStats = async () => {
    try {
      setLoading(true);
      // In a real app, you'd get the shop from the session
      const response = await fetch("/api/usage/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch usage stats");
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <s-page>
        <s-box padding="base">
          <s-stack direction="block" gap="base">
            <s-text>Usage Dashboard</s-text>
            <s-spinner size="base" />
          </s-stack>
        </s-box>
      </s-page>
    );
  }

  if (error || !stats) {
    return (
      <s-page>
        <s-box padding="base">
          <s-stack direction="block" gap="base">
            <s-text>Usage Dashboard</s-text>
            <s-text>{error || "Failed to load usage statistics"}</s-text>
            <s-button onClick={fetchUsageStats}>Retry</s-button>
          </s-stack>
        </s-box>
      </s-page>
    );
  }

  const usagePercentage =
    (stats.current.total / stats.limits.monthlyLimit) * 100;
  const isNearLimit = usagePercentage > 80;
  const isAtLimit = usagePercentage >= 100;

  return (
    <s-page>
      <s-box padding="base">
        <s-stack direction="block" gap="base">
          <s-text>Usage Dashboard</s-text>

          {/* Current Plan */}
          <s-box background="base" border="base" borderRadius="base">
            <s-stack direction="inline" gap="base">
              <s-text>
                Current Plan:{" "}
                {stats.plan.charAt(0).toUpperCase() + stats.plan.slice(1)}
              </s-text>
              <s-link href="/plan">Change Plan</s-link>
            </s-stack>
          </s-box>

          {/* Usage Progress */}
          <s-stack direction="block" gap="base">
            <s-stack direction="inline" gap="base">
              <s-text>Monthly Usage</s-text>
              <s-text>
                {stats.current.total} / {stats.limits.monthlyLimit} collections
              </s-text>
            </s-stack>

            {/* <s-progress value={usagePercentage} /> */}

            {isAtLimit && (
              <s-box padding="base" background="strong" borderRadius="base">
                <s-text>
                  ⚠️ You&lsquo;ve reached your monthly limit. Upgrade your plan
                  to continue.
                </s-text>
              </s-box>
            )}

            {isNearLimit && !isAtLimit && (
              <s-box padding="base" background="subdued" borderRadius="base">
                <s-text>
                  ⚠️ You&apos;re approaching your monthly limit. Consider
                  upgrading your plan.
                </s-text>
              </s-box>
            )}
          </s-stack>

          {/* Usage Breakdown */}
          <s-stack direction="block" gap="base">
            <s-text>This Month&apos;s Activity</s-text>
            <s-stack direction="inline" gap="base">
              <s-box padding="base" background="base" borderRadius="base">
                <s-text>Imported</s-text>
                <s-text>{stats.current.collectionsImported}</s-text>
              </s-box>
              <s-box padding="base" background="base" borderRadius="base">
                <s-text>Exported</s-text>
                <s-text>{stats.current.collectionsExported}</s-text>
              </s-box>
            </s-stack>
          </s-stack>

          {/* Reset Date */}
          <s-text>
            Usage resets on {new Date(stats.resetDate).toLocaleDateString()}
          </s-text>

          {/* Upgrade Prompt */}
          {stats.plan === "free" && (
            <s-box padding="base" background="base" borderRadius="base">
              <s-stack direction="block" gap="base">
                <s-text>Ready to scale up?</s-text>
                <s-text>
                  Upgrade to Premium for {stats.limits.monthlyLimit} collections
                  per month and advanced features.
                </s-text>
                <s-button href="/plan">Upgrade Now</s-button>
              </s-stack>
            </s-box>
          )}
        </s-stack>
      </s-box>
    </s-page>
  );
}
