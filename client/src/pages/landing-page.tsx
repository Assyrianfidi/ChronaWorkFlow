import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ShieldCheck, Clock, Users, BarChart3, MapPin } from "lucide-react";

export default function LandingPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl font-bold">CW</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chrona Workflow</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Business Management Platform</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
          Streamline Your Business Operations
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-3xl mx-auto">
          Complete workforce management with QR code time tracking, GPS monitoring, 
          client management, project oversight, and professional invoicing.
        </p>

        {/* Access Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Business Admin Access */}
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-200" 
                onClick={() => setLocation("/business-auth")}>
            <CardHeader className="pb-4">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-2xl mb-2">Business Access</CardTitle>
              <CardDescription className="text-base">
                Access your business management dashboard and control all operations
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Button size="lg" className="w-full mb-4" onClick={() => setLocation("/business-auth")}>
                Business Login
              </Button>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                For business owners and administrators
              </p>
            </CardContent>
          </Card>

          {/* Platform Admin Access */}
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-purple-200" 
                onClick={() => setLocation("/admin-setup")}>
            <CardHeader className="pb-4">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-2xl mb-2">Platform Admin</CardTitle>
              <CardDescription className="text-base">
                Manage multiple businesses and oversee platform operations
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Button size="lg" variant="outline" className="w-full mb-4 border-purple-600 text-purple-600 hover:bg-purple-50" 
                      onClick={() => setLocation("/admin-auth")}>
                Admin Login
              </Button>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                Platform administrator access
                <br />
                <button 
                  className="text-purple-600 hover:text-purple-700 underline text-xs mt-1"
                  onClick={() => setLocation("/admin-setup")}
                >
                  First time? Create admin account
                </button>
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Platform Features
        </h3>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h4 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">QR Time Tracking</h4>
            <p className="text-gray-600 dark:text-gray-400">
              Workers clock in/out using QR codes with GPS location verification for accurate time tracking
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Multi-Business Platform</h4>
            <p className="text-gray-600 dark:text-gray-400">
              Each business manages their own workers, clients, and projects with complete data isolation
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h4 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Analytics & Invoicing</h4>
            <p className="text-gray-600 dark:text-gray-400">
              Generate professional invoices and access detailed analytics and reporting dashboards
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
            <h4 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">GPS Tracking</h4>
            <p className="text-gray-600 dark:text-gray-400">
              Monitor worker locations in real-time with interactive maps and location history
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h4 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Project Management</h4>
            <p className="text-gray-600 dark:text-gray-400">
              Organize work by projects, assign workers, track progress, and manage client relationships
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-teal-600 dark:text-teal-400" />
            </div>
            <h4 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Secure & Scalable</h4>
            <p className="text-gray-600 dark:text-gray-400">
              Enterprise-grade security with role-based access control and unlimited scalability
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">CW</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Chrona Workflow</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Professional business management platform for modern businesses
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}