"use client";

import React, { useState, useEffect } from "react";
import { getUsageStats } from "@/lib/subscription";

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
      const response = await fetch('/api/usage/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch usage stats');
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <s-card>
        <s-box padding="base">
          <s-stack direction="block" gap="base">
            <s-text variant="headingMd">Usage Dashboard</s-text>
            <s-spinner size="base" />
          </s-stack>
        </s-box>
      </s-card>
    );
  }

  if (error || !stats) {
    return (
      <s-card>
        <s-box padding="base">
          <s-stack direction="block" gap="base">
            <s-text variant="headingMd">Usage Dashboard</s-text>
            <s-text variant="bodyMd" tone="critical">
              {error || 'Failed to load usage statistics'}
            </s-text>
            <s-button onClick={fetchUsageStats}>Retry</s-button>
          </s-stack>
        </s-box>
      </s-card>
    );
  }

  const usagePercentage = (stats.current.total / stats.limits.monthlyLimit) * 100;
  const isNearLimit = usagePercentage > 80;
  const isAtLimit = usagePercentage >= 100;

  return (
    <s-card>
      <s-box padding="base">
        <s-stack direction="block" gap="base">
          <s-text variant="headingMd">Usage Dashboard</s-text>
          
          {/* Current Plan */}
          <s-box padding="tight" background="bg-surface-secondary" borderRadius="base">
            <s-stack direction="row" gap="tight" align="space-between">
              <s-text variant="bodyMd" fontWeight="semibold">
                Current Plan: {stats.plan.charAt(0).toUpperCase() + stats.plan.slice(1)}
              </s-text>
              <s-link href="/plan">Change Plan</s-link>
            </s-stack>
          </s-box>

          {/* Usage Progress */}
          <s-stack direction="block" gap="tight">
            <s-stack direction="row" gap="tight" align="space-between">
              <s-text variant="bodyMd" fontWeight="semibold">Monthly Usage</s-text>
              <s-text variant="bodyMd" tone={isAtLimit ? "critical" : isNearLimit ? "warning" : "subdued"}>
                {stats.current.total} / {stats.limits.monthlyLimit} collections
              </s-text>
            </s-stack>
            
            <s-progress-bar 
              progress={usagePercentage} 
              tone={isAtLimit ? "critical" : isNearLimit ? "warning" : "base"}
            />
            
            {isAtLimit && (
              <s-box padding="tight" background="bg-surface-critical" borderRadius="base">
                <s-text variant="bodyMd" tone="critical">
                  ⚠️ You've reached your monthly limit. Upgrade your plan to continue.
                </s-text>
              </s-box>
            )}
            
            {isNearLimit && !isAtLimit && (
              <s-box padding="tight" background="bg-surface-warning" borderRadius="base">
                <s-text variant="bodyMd" tone="warning">
                  ⚠️ You're approaching your monthly limit. Consider upgrading your plan.
                </s-text>
              </s-box>
            )}
          </s-stack>

          {/* Usage Breakdown */}
          <s-stack direction="block" gap="tight">
            <s-text variant="bodyMd" fontWeight="semibold">This Month's Activity</s-text>
            <s-stack direction="row" gap="base">
              <s-box padding="tight" background="bg-surface-secondary" borderRadius="base" style={{ flex: 1 }}>
                <s-text variant="bodyMd" fontWeight="semibold">Imported</s-text>
                <s-text variant="headingMd">{stats.current.collectionsImported}</s-text>
              </s-box>
              <s-box padding="tight" background="bg-surface-secondary" borderRadius="base" style={{ flex: 1 }}>
                <s-text variant="bodyMd" fontWeight="semibold">Exported</s-text>
                <s-text variant="headingMd">{stats.current.collectionsExported}</s-text>
              </s-box>
            </s-stack>
          </s-stack>

          {/* Reset Date */}
          <s-text variant="bodyMd" tone="subdued">
            Usage resets on {new Date(stats.resetDate).toLocaleDateString()}
          </s-text>

          {/* Upgrade Prompt */}
          {stats.plan === 'free' && (
            <s-box padding="base" background="bg-surface-success" borderRadius="base">
              <s-stack direction="block" gap="tight">
                <s-text variant="bodyMd" fontWeight="semibold">
                  Ready to scale up?
                </s-text>
                <s-text variant="bodyMd">
                  Upgrade to Premium for {stats.limits.monthlyLimit} collections per month and advanced features.
                </s-text>
                <s-button variant="primary" href="/plan">
                  Upgrade Now
                </s-button>
              </s-stack>
            </s-box>
          )}
        </s-stack>
      </s-box>
    </s-card>
  );
}
