"use client";

import React, { useState, useEffect } from "react";
import { redirectToPricingPage } from "@/lib/shopify-managed-pricing";

interface Subscription {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  currentPeriodEnd: string;
  lineItems: Array<{
    id: string;
    plan: {
      pricingDetails: {
        price: {
          amount: number;
          currencyCode: string;
        };
        interval: string;
      };
    };
  }>;
}

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  subscription: Subscription | null;
  allSubscriptions: Subscription[];
}

export default function PlanPage() {
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch("/api/subscriptions/status");
      const data = await response.json();
      setSubscriptionStatus(data);
    } catch (error) {
      console.error("Error fetching subscription status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelection = () => {
    // Redirect to Shopify's hosted plan selection page
    redirectToPricingPage();
  };

  const getPlanPrice = (subscription: Subscription | null) => {
    if (!subscription) return null;
    const lineItem = subscription.lineItems[0];
    return lineItem?.plan?.pricingDetails?.price;
  };

  const isCurrentPlan = (planType: "free" | "pro" | "proYearly") => {
    if (!subscriptionStatus?.subscription) return false;

    const price = getPlanPrice(subscriptionStatus.subscription);
    if (!price) return false;

    if (planType === "free" && price.amount === 0) return true;
    if (planType === "pro" && price.amount === 10) return true;
    if (planType === "proYearly" && price.amount === 100) return true;

    return false;
  };

  if (loading) {
    return (
      <s-page heading="Choose Your Plan">
        <s-stack direction="block" gap="large" padding="large">
          <s-box>
            <s-text>Loading subscription status...</s-text>
          </s-box>
        </s-stack>
      </s-page>
    );
  }

  return (
    <s-page heading="Choose Your Plan">
      <s-button href="https://admin.shopify.com/charges/collectify/pricing_plans">
        Test
      </s-button>
      <s-stack direction="block" gap="large" padding="large">
        {/* Current Subscription Status */}
        {subscriptionStatus?.hasActiveSubscription &&
          subscriptionStatus.subscription && (
            <s-box padding="large">
              <s-stack direction="block" gap="small">
                <s-text>Current Plan</s-text>
                <s-text>
                  <strong>{subscriptionStatus.subscription.name}</strong>
                </s-text>
                <s-text tone="neutral">
                  Status: {subscriptionStatus.subscription.status}
                </s-text>
                {getPlanPrice(subscriptionStatus.subscription) && (
                  <s-text tone="neutral">
                    Price: $
                    {getPlanPrice(subscriptionStatus.subscription)!.amount}{" "}
                    {
                      getPlanPrice(subscriptionStatus.subscription)!
                        .currencyCode
                    }{" "}
                    /{" "}
                    {subscriptionStatus.subscription.lineItems[0]?.plan
                      ?.pricingDetails?.interval === "ANNUAL"
                      ? "year"
                      : "month"}
                  </s-text>
                )}
              </s-stack>
            </s-box>
          )}

        {/* Plan Selection */}
        <s-stack direction="block" gap="large">
          <s-text>Available Plans</s-text>

          {/* Free Plan */}
          <s-grid gridTemplateColumns="repeat(3, 1fr)" gap="large">
            <s-grid-item>
              <s-box
                padding="large"
                background="base"
                border="base"
                borderRadius="large"
              >
                <s-stack direction="block" gap="large">
                  <s-stack direction="inline" gap="large">
                    <s-stack direction="block" gap="small">
                      <s-text>Free Plan</s-text>
                      <s-text tone="neutral">
                        Perfect for getting started with Collectify
                      </s-text>
                    </s-stack>
                    <s-stack direction="block">
                      <s-text>$0</s-text>
                      <s-text tone="neutral">per month</s-text>
                    </s-stack>
                  </s-stack>

                  <s-stack direction="block" gap="small">
                    <s-text>✓ Basic collection management</s-text>
                    <s-text>✓ Up to 100 collections per month</s-text>
                    <s-text>✓ CSV import/export (100 collections/month)</s-text>
                    <s-text>✓ Basic support</s-text>
                  </s-stack>

                  <s-button
                    variant={isCurrentPlan("free") ? "secondary" : "primary"}
                    disabled={isCurrentPlan("free")}
                    onClick={handlePlanSelection}
                  >
                    {isCurrentPlan("free")
                      ? "Current Plan"
                      : "Select Free Plan"}
                  </s-button>
                </s-stack>
              </s-box>
            </s-grid-item>
            <s-grid-item>
              {/* Pro Plan Monthly */}
              <s-box
                padding="large"
                background="base"
                border="base"
                borderRadius="large"
              >
                <s-stack direction="block" gap="large">
                  <s-stack direction="inline" gap="large">
                    <s-stack direction="block" gap="small">
                      <s-text>Pro Plan (Monthly)</s-text>
                      <s-text tone="neutral">
                        Unlimited collections with batch processing
                      </s-text>
                    </s-stack>
                    <s-stack direction="block">
                      <s-text>$10</s-text>
                      <s-text tone="neutral">per month</s-text>
                    </s-stack>
                  </s-stack>

                  <s-stack direction="block" gap="small">
                    <s-text>✓ Everything in Free Plan</s-text>
                    <s-text>✓ Unlimited collections per month</s-text>
                    <s-text>
                      ✓ Batch processing (1000 collections per batch)
                    </s-text>
                    <s-text>✓ Priority support</s-text>
                    <s-text>✓ Advanced analytics</s-text>
                    <s-text>✓ API access</s-text>
                  </s-stack>

                  <s-button
                    variant={isCurrentPlan("pro") ? "secondary" : "primary"}
                    disabled={isCurrentPlan("pro")}
                    onClick={handlePlanSelection}
                  >
                    {isCurrentPlan("pro")
                      ? "Current Plan"
                      : "Select Pro Plan (Monthly)"}
                  </s-button>
                </s-stack>
              </s-box>
            </s-grid-item>
            <s-grid-item>
              {/* Pro Plan Yearly */}
              <s-box
                padding="large"
                background="base"
                border="base"
                borderRadius="large"
              >
                <s-stack direction="block" gap="large">
                  <s-stack direction="inline" gap="large">
                    <s-stack direction="block" gap="small">
                      <s-text>Pro Plan (Yearly)</s-text>
                      <s-text tone="neutral">
                        Best value - Save 17% with annual billing
                      </s-text>
                    </s-stack>
                    <s-stack direction="block">
                      <s-text>$100</s-text>
                      <s-text tone="neutral">per year</s-text>
                      <s-text tone="success">Save $20/year</s-text>
                    </s-stack>
                  </s-stack>

                  <s-stack direction="block" gap="small">
                    <s-text>✓ Everything in Pro Monthly</s-text>
                    <s-text>✓ Unlimited collections per month</s-text>
                    <s-text>
                      ✓ Batch processing (1000 collections per batch)
                    </s-text>
                    <s-text>✓ Priority support</s-text>
                    <s-text>✓ Advanced analytics</s-text>
                    <s-text>✓ API access</s-text>
                    <s-text>✓ 17% savings vs monthly</s-text>
                  </s-stack>

                  <s-button
                    variant={
                      isCurrentPlan("proYearly") ? "secondary" : "primary"
                    }
                    disabled={isCurrentPlan("proYearly")}
                    onClick={handlePlanSelection}
                  >
                    {isCurrentPlan("proYearly")
                      ? "Current Plan"
                      : "Select Pro Plan (Yearly)"}
                  </s-button>
                </s-stack>
              </s-box>
            </s-grid-item>
          </s-grid>
        </s-stack>

        {/* Managed Pricing Notice */}
        <s-box padding="large">
          <s-stack direction="block" gap="small">
            <s-text>
              <strong>Note:</strong> Subscription management is handled securely
              by Shopify. When you click any plan button, you&apos;ll be redirected
              to Shopify&apos;s billing portal to complete your subscription.
            </s-text>
            <s-text tone="neutral">
              You can manage your subscription, view billing history, and update
              payment methods directly in your Shopify admin.
            </s-text>
          </s-stack>
        </s-box>
      </s-stack>
    </s-page>
  );
}
