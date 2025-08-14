import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Clock, Users, FileText, QrCode, BarChart3, Shield, LogIn, UserPlus, Building2 } from "lucide-react";

export default function Landing() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, redirect to Replit auth for admin verification
    window.location.href = '/api/login';
  };

  const handleBusinessSignup = () => {
    window.location.href = '/api/login';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Login Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="text-left mb-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                  <FileText className="text-white text-2xl" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-slate-800">Chrona Workflow</h1>
                  <p className="text-xl text-slate-600">Business Management Platform</p>
                </div>
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-4">
                Complete Business Management for Multiple Organizations
              </h2>
              <p className="text-lg text-slate-600 mb-6">
                Streamline your business operations with our comprehensive solution for worker time tracking, 
                client management, project oversight, and invoicing. Designed for businesses of all sizes.
              </p>
              
              {/* Key Features */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center p-3 bg-slate-50 rounded-lg">
                  <QrCode className="h-8 w-8 text-primary mb-2" />
                  <span className="text-sm font-medium">QR Time Tracking</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-slate-50 rounded-lg">
                  <Users className="h-8 w-8 text-primary mb-2" />
                  <span className="text-sm font-medium">Team Management</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-slate-50 rounded-lg">
                  <FileText className="h-8 w-8 text-primary mb-2" />
                  <span className="text-sm font-medium">Invoicing</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-slate-50 rounded-lg">
                  <BarChart3 className="h-8 w-8 text-primary mb-2" />
                  <span className="text-sm font-medium">Analytics</span>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Login Section */}
          <div className="lg:col-span-1">
            <Card className="border-2 border-primary/20 shadow-lg">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                  <Building2 className="text-white text-xl" />
                </div>
                <CardTitle className="text-xl font-bold">Business Admin Access</CardTitle>
                <p className="text-sm text-slate-600">
                  Sign in to manage your organization's workflow
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Admin Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@yourcompany.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full"
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit"
                    className="w-full bg-primary hover:bg-blue-700 text-white"
                    size="lg"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Admin Sign In
                  </Button>
                </form>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-slate-500">Or</span>
                  </div>
                </div>
                
                <Button 
                  onClick={handleBusinessSignup}
                  variant="outline"
                  className="w-full border-green-200 text-green-700 hover:bg-green-50"
                  size="lg"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Register New Business
                </Button>
                
                <p className="text-xs text-center text-slate-500">
                  Secure authentication for multi-business platform
                </p>
              </CardContent>
            </Card>
          </div>
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
          <div className="text-center">
            <Button
              onClick={handleBusinessSignup}
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Start Your Business Account
            </Button>
            <p className="text-xs text-slate-400 mt-4">
              Multi-business platform • Secure authentication • No credit card required
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
