"use client";

import { useState } from "react";
import { completeOnboarding } from "@/lib/actions/auth";
import { OnboardingTour } from "./tour";

interface OnboardingWrapperProps {
  showTour: boolean;
}

export function OnboardingWrapper({ showTour }: OnboardingWrapperProps) {
  const [visible, setVisible] = useState(showTour);

  if (!visible) return null;

  async function handleComplete() {
    setVisible(false);
    await completeOnboarding();
  }

  return <OnboardingTour onComplete={handleComplete} />;
}
