import React from "react";
import { UploadStep } from "../../types/upload";

interface ProgressStepsProps {
  currentStep: UploadStep;
}

export const ProgressSteps: React.FC<ProgressStepsProps> = ({
  currentStep,
}) => {
  const steps = [
    { key: "upload", label: "Upload File" },
    { key: "preview", label: "Review Data" },
    { key: "import", label: "Import" },
  ];

  const isStepActive = (stepKey: string) => {
    switch (stepKey) {
      case "upload":
        return currentStep.step === "upload";
      case "preview":
        return currentStep.step === "preview";
      case "import":
        return ["uploading", "complete"].includes(currentStep.step);
      default:
        return false;
    }
  };

  return (
    <div className="flex items-center gap-8 mb-6">
      {steps.map((step, index) => (
        <div key={step.key} className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-full ${
              isStepActive(step.key) ? "bg-green-500" : "bg-gray-200"
            } flex items-center justify-center text-white text-xs font-bold`}
          >
            {index + 1}
          </div>
          <span
            style={{
              fontSize: "14px",
              color: isStepActive(step.key) ? "#202223" : "#6d7175",
            }}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
};
