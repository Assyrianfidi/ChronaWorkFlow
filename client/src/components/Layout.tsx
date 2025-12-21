import React from "react";
import Navigation from "@/components/Navigation";
import BreadcrumbNavigation from "@/components/BreadcrumbNavigation";
import ErrorBoundary from "@/components/ErrorBoundary";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  showBreadcrumb?: boolean;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title = "AccuBooks",
  description = "Financial Management System",
  showBreadcrumb = true,
}) => {
  React.useEffect(() => {
    document.title = title;

    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute("content", description);
  }, [title, description]);

  return (
    <ErrorBoundary fallback={<div>Something went wrong.</div>}>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        {showBreadcrumb && <BreadcrumbNavigation />}
        <main role="main" className="flex-1">
          {children}
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default Layout;
