import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Users, FileText, QrCode, BarChart3, Shield, LogIn, UserPlus } from "lucide-react";

export default function Landing() {
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);

  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  const handleSignup = () => {
    window.location.href = '/api/login';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <FileText className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-800">Chrona Workflow</h1>
              <p className="text-xl text-slate-600">Business Management</p>
            </div>
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold text-slate-800 mb-6">
            Complete Business Management Platform
          </h2>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            Streamline your business operations with our comprehensive solution for worker time tracking, 
            client management, project oversight, and invoicing - all in one powerful platform.
          </p>
          <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="bg-primary hover:bg-blue-700 text-white px-8 py-4 text-lg"
              >
                Get Started
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-center text-2xl font-bold">
                  Welcome to Chrona Workflow
                </DialogTitle>
              </DialogHeader>
              
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login" className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Login
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Sign Up
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="space-y-4 mt-6">
                  <div className="text-center space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Welcome Back</h3>
                      <p className="text-sm text-slate-600">
                        Sign in to your Chrona Workflow account to continue managing your business operations.
                      </p>
                    </div>
                    
                    <Button 
                      onClick={handleLogin}
                      className="w-full bg-primary hover:bg-blue-700 text-white py-3"
                      size="lg"
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      Login with Replit Account
                    </Button>
                    
                    <p className="text-xs text-slate-500">
                      Secure authentication through Replit
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="signup" className="space-y-4 mt-6">
                  <div className="text-center space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Create Your Account</h3>
                      <p className="text-sm text-slate-600">
                        Join thousands of businesses streamlining their operations with Chrona Workflow.
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
                        <div className="flex flex-col items-center p-2 bg-slate-50 rounded">
                          <QrCode className="h-6 w-6 mb-1 text-primary" />
                          <span>QR Tracking</span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-slate-50 rounded">
                          <Users className="h-6 w-6 mb-1 text-primary" />
                          <span>Team Mgmt</span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-slate-50 rounded">
                          <FileText className="h-6 w-6 mb-1 text-primary" />
                          <span>Invoicing</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleSignup}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                      size="lg"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create Account with Replit
                    </Button>
                    
                    <p className="text-xs text-slate-500">
                      No credit card required • Free to start
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
          
          <p className="text-sm text-slate-500 mt-4">
            Trusted by businesses worldwide • Secure Replit authentication
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <QrCode className="text-primary text-2xl" />
              </div>
              <CardTitle className="text-xl font-semibold">QR Code Time Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Workers can easily clock in and out using unique QR codes. GPS verification ensures 
                accurate location tracking for all time entries.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="text-accent text-2xl" />
              </div>
              <CardTitle className="text-xl font-semibold">Worker Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Manage your workforce efficiently with comprehensive profiles, hourly rates, 
                and project assignments. Generate unique QR codes for each worker.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="text-purple-600 text-2xl" />
              </div>
              <CardTitle className="text-xl font-semibold">Project Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Monitor project progress, assign workers, track deadlines, and maintain 
                detailed project histories with integrated time logging.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="text-yellow-600 text-2xl" />
              </div>
              <CardTitle className="text-xl font-semibold">Invoice Generation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Create professional invoices with multiple line items, tax calculations, 
                and discount support. Export to PDF and send directly to clients.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="text-accent text-2xl" />
              </div>
              <CardTitle className="text-xl font-semibold">Analytics & Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Gain insights into your business with comprehensive analytics, revenue tracking, 
                hours worked summaries, and project completion rates.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="text-red-600 text-2xl" />
              </div>
              <CardTitle className="text-xl font-semibold">Secure & Reliable</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Enterprise-grade security with encrypted data storage, secure authentication, 
                and reliable cloud infrastructure to protect your business data.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-slate-50 rounded-2xl p-12">
          <h3 className="text-2xl font-bold text-slate-800 mb-4">
            Ready to Transform Your Business Management?
          </h3>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Join businesses that have streamlined their operations with Chrona Workflow. 
            Sign up with your Replit account to get started immediately.
          </p>
          <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="bg-primary hover:bg-blue-700 text-white px-8 py-4 text-lg"
              >
                Login / Sign Up
              </Button>
            </DialogTrigger>
          </Dialog>
          
          <p className="text-xs text-slate-400 mt-4">
            Secure authentication through Replit • No credit card required
          </p>
        </div>
      </div>
    </div>
  );
}
