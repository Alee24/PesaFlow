'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Shield, Smartphone, ArrowRight, Lock, LayoutDashboard, 
  Menu, X, BarChart3, Box, Receipt, Store, CheckCircle2 
} from 'lucide-react';

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);

    const fetchSettings = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const response = await fetch(`${baseUrl}/api/settings/public`);
        if (response.ok) {
          const data = await response.json();
          if (data.logoUrl) {
            setLogoUrl(data.logoUrl.startsWith('http') ? data.logoUrl : `${baseUrl}${data.logoUrl}`);
          }
        }
      } catch (error) {
        console.error('Failed to fetch public settings', error);
      }
    };
    fetchSettings();
  }, []);

  const features = [
    {
      icon: Store,
      title: 'Smart Point of Sale',
      description: 'Process cash and digital payments quickly. Our POS interface is designed for speed, helping your staff serve customers faster without complicated training.',
    },
    {
      icon: Smartphone,
      title: 'Seamless M-Pesa Payments',
      description: 'Receive payments directly to your till or paybill via STK Push. No more manual verification—transactions are automatically recorded in real-time.',
    },
    {
      icon: Box,
      title: 'Reliable Inventory Tracking',
      description: 'Know exactly what you have in stock at any moment. Get automatic alerts when items run low so you never miss a sale.',
    },
    {
      icon: Receipt,
      title: 'Professional Invoicing',
      description: 'Send clear, branded invoices to your clients. Track who has paid, who is pending, and automatically send reminders to overdue accounts.',
    },
    {
      icon: BarChart3,
      title: 'Clear Business Insights',
      description: 'See your daily revenue, top-selling items, and overall growth at a glance. Make informed decisions based on accurate, easy-to-read reports.',
    },
    {
      icon: Shield,
      title: 'KRA Compliance',
      description: 'Stay compliant effortlessly. The system automatically calculates necessary taxes and generates reports ready for your KRA returns.',
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 selection:bg-emerald-200">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="flex items-center gap-2">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
              ) : (
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
              )}
              <span className="font-bold text-xl tracking-tight text-zinc-900">Mpesa Connect</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">Features</a>
              <a href="#security" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">Security</a>
              <div className="flex items-center gap-4 ml-4">
                {isLoggedIn ? (
                  <Link 
                    href="/dashboard" 
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 transition-all shadow-sm"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link href="/auth/login" className="text-sm font-semibold text-zinc-700 hover:text-zinc-900 transition-colors">
                      Sign In
                    </Link>
                    <Link 
                      href="/auth/register" 
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-all shadow-sm"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-zinc-600 hover:text-zinc-900"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-zinc-200 px-4 pt-2 pb-4 space-y-3">
            <a href="#features" className="block px-3 py-2 text-base font-medium text-zinc-700 hover:bg-zinc-50 rounded-lg">Features</a>
            <a href="#security" className="block px-3 py-2 text-base font-medium text-zinc-700 hover:bg-zinc-50 rounded-lg">Security</a>
            <div className="pt-2 border-t border-zinc-100 flex flex-col gap-2">
              {isLoggedIn ? (
                <Link href="/dashboard" className="w-full text-center px-4 py-3 bg-zinc-900 text-white font-semibold rounded-lg">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/auth/login" className="w-full text-center px-4 py-3 border border-zinc-200 text-zinc-700 font-semibold rounded-lg">
                    Sign In
                  </Link>
                  <Link href="/auth/register" className="w-full text-center px-4 py-3 bg-emerald-600 text-white font-semibold rounded-lg">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-zinc-900 tracking-tight leading-tight max-w-4xl mx-auto mb-6">
            Run your business with <span className="text-emerald-600">confidence</span>.
          </h1>
          <p className="text-lg md:text-xl text-zinc-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Everything you need to manage sales, track inventory, and accept M-Pesa payments in one unified platform. Built for modern Kenyan businesses.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link 
              href={isLoggedIn ? '/dashboard' : '/auth/register'}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-emerald-600 rounded-full hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all"
            >
              Start using Mpesa Connect
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="#features"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-full hover:bg-zinc-50 transition-all"
            >
              Explore Features
            </Link>
          </div>
        </div>

        {/* Decorative background elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-100/40 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="py-12 bg-white border-y border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-2 md:p-4 shadow-sm">
            <div className="rounded-xl overflow-hidden border border-zinc-200 shadow-xl bg-white flex flex-col md:flex-row h-[400px]">
              {/* Mock Sidebar */}
              <div className="w-60 bg-zinc-950 p-4 hidden md:flex flex-col gap-2">
                <div className="h-8 w-24 bg-zinc-800 rounded mb-6"></div>
                <div className="h-10 w-full bg-emerald-500/10 border border-emerald-500/20 rounded-lg mb-2"></div>
                <div className="h-10 w-full bg-zinc-900 rounded-lg mb-2"></div>
                <div className="h-10 w-full bg-zinc-900 rounded-lg mb-2"></div>
                <div className="mt-auto h-12 w-full bg-zinc-900 rounded-lg"></div>
              </div>
              {/* Mock Content */}
              <div className="flex-1 p-6 flex flex-col gap-6 bg-zinc-50">
                <div className="flex justify-between items-center">
                  <div className="h-6 w-48 bg-zinc-200 rounded-md"></div>
                  <div className="h-8 w-32 bg-zinc-200 rounded-full"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white border border-zinc-200 p-4 rounded-xl h-24 flex flex-col justify-between">
                      <div className="h-3 w-16 bg-zinc-100 rounded"></div>
                      <div className="h-6 w-24 bg-zinc-200 rounded"></div>
                    </div>
                  ))}
                </div>
                <div className="flex-1 bg-white border border-zinc-200 rounded-xl p-4">
                  <div className="h-4 w-32 bg-zinc-100 rounded mb-4"></div>
                  <div className="w-full h-full bg-zinc-50 rounded border border-zinc-100"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-4">A complete toolkit for your operations</h2>
            <p className="text-lg text-zinc-600">
              We provide all the essential tools you need to run your storefront or online business, integrated neatly into one intuitive dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">{feature.title}</h3>
                <p className="text-zinc-600 leading-relaxed text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Security */}
      <section id="security" className="py-24 bg-zinc-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Bank-grade security for your peace of mind.</h2>
              <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
                Your business data and financial transactions are protected by industry-leading security protocols. We take the safety of your information seriously so you can focus on growing your business.
              </p>
              <div className="space-y-6">
                {[
                  'End-to-End Encryption for all data transfers',
                  'Secure Safaricom Daraja API Integration',
                  'Automated daily database backups',
                  'Role-based access control for your staff'
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                    <p className="text-zinc-300 font-medium">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500 blur-[100px] opacity-20 rounded-full"></div>
              <div className="relative bg-zinc-800 border border-zinc-700 p-8 rounded-2xl">
                <Shield className="w-16 h-16 text-emerald-400 mb-6" />
                <h3 className="text-2xl font-bold mb-4">Secure Infrastructure</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Our systems are continually monitored and updated to protect against vulnerabilities. Every payment request is securely validated to ensure your funds reach your account without fail.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-emerald-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Ready to streamline your business?</h2>
          <p className="text-emerald-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            Join other forward-thinking businesses using Mpesa Connect to simplify payments, track inventory, and accelerate growth.
          </p>
          <Link 
            href="/auth/register"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold text-emerald-700 bg-white rounded-full hover:bg-emerald-50 hover:scale-105 transition-all shadow-xl"
          >
            Create Your Free Account
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-950 text-zinc-400 py-12 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center">
              <span className="text-emerald-500 font-bold text-lg">M</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-white">Mpesa Connect</span>
          </div>
          <p className="text-sm">
            © {new Date().getFullYear()} Mpesa Connect. Powered by <a href="https://kkdes.co.ke/" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-emerald-400 transition-colors">KK Dynamic Enterprise Solutions</a>.
          </p>
        </div>
      </footer>
    </div>
  );
}
