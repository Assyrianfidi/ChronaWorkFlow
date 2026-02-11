import React, { useState } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Building2,
  Users,
  Zap,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface OnboardingData {
  companyName: string;
  industry: string;
  companySize: string;
  fiscalYearEnd: string;
  teamMembers: string[];
  selectedPlan: string;
}

const steps = [
  { id: 1, name: "Welcome", icon: Sparkles },
  { id: 2, name: "Company Setup", icon: Building2 },
  { id: 3, name: "Team", icon: Users },
  { id: 4, name: "Plan", icon: Zap },
  { id: 5, name: "Complete", icon: Check },
];

const industries = [
  "Technology",
  "Healthcare",
  "Finance",
  "Retail",
  "Manufacturing",
  "Professional Services",
  "Real Estate",
  "Other",
];

const companySizes = [
  "1-10 employees",
  "11-50 employees",
  "51-200 employees",
  "201-500 employees",
  "500+ employees",
];

export const OnboardingWizard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    companyName: "",
    industry: "",
    companySize: "",
    fiscalYearEnd: "December 31",
    teamMembers: [],
    selectedPlan: "",
  });

  const handleNext = async () => {
    if (currentStep === 5) {
      await completeOnboarding();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSkip = () => {
    if (currentStep === 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await fetch(`${import.meta.env.VITE_API_URL}/users/onboarding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Error completing onboarding:", error);
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return true;
      case 2:
        return data.companyName && data.industry && data.companySize;
      case 3:
        return true;
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      currentStep > step.id
                        ? "bg-green-500 text-white"
                        : currentStep === step.id
                          ? "bg-primary text-white ring-4 ring-primary/20"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-6 h-6" />
                    )}
                  </div>
                  <p className="text-xs mt-2 text-gray-600 dark:text-gray-400 hidden sm:block">
                    {step.name}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded transition-all ${
                      currentStep > step.id
                        ? "bg-green-500"
                        : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="p-8">
          {/* Step 1: Welcome */}
          {currentStep === 1 && (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Welcome to AccuBooks!
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Let's get your account set up in just a few steps
                </p>
              </div>
              <div className="max-w-md mx-auto text-left space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Quick Setup
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Takes less than 5 minutes
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Guided Experience
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      We'll walk you through everything
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Skip Anytime
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      You can always complete this later
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Company Setup */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Tell us about your company
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  This helps us customize your experience
                </p>
              </div>

              <div className="space-y-4 max-w-md mx-auto">
                <div>
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={data.companyName}
                    onChange={(e) =>
                      setData({ ...data, companyName: e.target.value })
                    }
                    placeholder="Acme Corporation"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="industry">Industry *</Label>
                  <select
                    id="industry"
                    value={data.industry}
                    onChange={(e) =>
                      setData({ ...data, industry: e.target.value })
                    }
                    className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                  >
                    <option value="">Select industry</option>
                    {industries.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="companySize">Company Size *</Label>
                  <select
                    id="companySize"
                    value={data.companySize}
                    onChange={(e) =>
                      setData({ ...data, companySize: e.target.value })
                    }
                    className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                  >
                    <option value="">Select size</option>
                    {companySizes.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="fiscalYearEnd">Fiscal Year End</Label>
                  <Input
                    id="fiscalYearEnd"
                    value={data.fiscalYearEnd}
                    onChange={(e) =>
                      setData({ ...data, fiscalYearEnd: e.target.value })
                    }
                    placeholder="December 31"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Team Invitations */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Invite your team
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Collaborate with your team members (optional)
                </p>
              </div>

              <div className="max-w-md mx-auto">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  You can invite team members now or do this later from
                  settings.
                </p>
                <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Team invitations coming soon
                  </p>
                  <Button variant="outline" onClick={handleSkip}>
                    Skip for Now
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Plan Selection */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Choose your plan
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Start with a 14-day free trial, no credit card required
                </p>
              </div>

              <div className="max-w-md mx-auto text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  You're currently on a free trial. You can explore all features
                  and choose a plan later.
                </p>
                <Button
                  onClick={() => navigate("/pricing")}
                  variant="outline"
                  className="mb-4"
                >
                  View Pricing Plans
                </Button>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  or continue with free trial
                </p>
              </div>
            </div>
          )}

          {/* Step 5: Complete */}
          {currentStep === 5 && (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full">
                <Check className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  You're all set!
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Welcome to AccuBooks, {user?.name || "there"}!
                </p>
              </div>
              <div className="max-w-md mx-auto text-left space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Dashboard Ready
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Your personalized dashboard is ready to use
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Free Trial Active
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      14 days to explore all features
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Help Available
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Access our help center anytime
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div>
              {currentStep > 1 && currentStep < 5 && (
                <Button variant="ghost" onClick={handleBack}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              {currentStep < 5 && currentStep !== 1 && (
                <Button
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                >
                  Skip Setup
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={!isStepValid()}
                loading={loading}
              >
                {currentStep === 5 ? "Go to Dashboard" : "Continue"}
                {currentStep < 5 && <ChevronRight className="w-4 h-4 ml-1" />}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingWizard;
