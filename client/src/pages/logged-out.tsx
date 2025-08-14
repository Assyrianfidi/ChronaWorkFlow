import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogOut, ArrowRight } from "lucide-react";

export default function LoggedOut() {
  const handleLoginAgain = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-purple-700 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <LogOut className="h-8 w-8 text-white" />
          </div>
          
          <h1 className="text-2xl font-bold text-slate-800 mb-4">
            You've been logged out
          </h1>
          
          <p className="text-slate-600 mb-8 leading-relaxed">
            Thank you for using Chrona Workflow. Your session has been safely terminated and all data has been cleared.
          </p>
          
          <Button 
            onClick={handleLoginAgain}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 text-base"
          >
            Log in again
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              Need help? Contact support at{" "}
              <a href="mailto:support@chronaworkflow.com" className="text-blue-600 hover:underline">
                support@chronaworkflow.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}