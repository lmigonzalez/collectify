"use client";

import React from "react";

interface UpgradePromptProps {
  currentPlan: string;
  usagePercentage: number;
  remainingCollections: number;
  onUpgrade?: () => void;
  onDismiss?: () => void;
}

export default function UpgradePrompt({
  currentPlan,
  usagePercentage,
  remainingCollections,
  onUpgrade,
  onDismiss
}: UpgradePromptProps) {
  const isAtLimit = usagePercentage >= 100;
  const isNearLimit = usagePercentage > 80;

  if (!isNearLimit && !isAtLimit) {
    return null;
  }

  return (
    <s-box 
      padding="base" 
      background="base"
      borderRadius="base"
      border="base"
    >
      <s-stack direction="block" gap="base">
        <s-stack direction="inline" gap="base">
          <s-stack direction="block" gap="small">
            <s-text>
              {isAtLimit ? "🚫 Monthly Limit Reached" : "⚠️ Approaching Monthly Limit"}
            </s-text>
            <s-text>
              {isAtLimit 
                ? "You've used all your collections for this month. Upgrade to continue."
                : `You have ${remainingCollections} collections remaining this month.`
              }
            </s-text>
          </s-stack>
          
          {onDismiss && (
            <s-button variant="tertiary" onClick={onDismiss}>
              ✕
            </s-button>
          )}
        </s-stack>

        <s-stack direction="inline" gap="base">
          <s-button 
            variant="primary" 
            href="/plan"
            onClick={onUpgrade}
          >
            {currentPlan === 'free' ? 'Upgrade to Premium' : 'View Plans'}
          </s-button>
          
          {isAtLimit && (
            <s-text>
              Usage resets next month
            </s-text>
          )}
        </s-stack>
      </s-stack>
    </s-box>
  );
}
