'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield, Zap, CheckCircle2, Smartphone, FileText, ArrowRight, 
  Sun, Moon, Lock, Server, Database, Menu, X, LayoutDashboard, 
  Heart, Activity, Sparkles, Users, BarChart3, HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeContext';

export default function LandingPage() {
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const services = [
    {
      icon: Heart,
      title: 'Care-Centered Point of Sale',
      description: 'Facilitate swift, empathetic transactions with a modern, high-contrast POS. Seamlessly process service records, track daily checkouts, and manage inventory in real-time.',
      color: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
    },
    {
      icon: BarChart3,
      title: 'Operational Health Analytics',
      description: 'Diagnose your growth with powerful real-time reports. Access visual trends of revenue flow, product diagnostics, and team performance from a single secure view.',
      color: 'bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400'
    },
    {
      icon: FileText,
      title: 'Empathetic Invoicing',
      description: 'Generate professional digital invoices, receipts, and service breakdowns instantly. Keep documentation clear, organized, and reassuring for your patients and clients.',
      color: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
    },
    {
      icon: Smartphone,
      title: 'Direct M-Pesa Integration',
      description: 'Enjoy seamless, safe payments via M-Pesa. Connect directly using secure Safaricom channels or input your own API credentials for complete control over settlements.',
      color: 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400'
    }
  ];

  const securityFeatures = [
    {
      icon: Lock,
      title: 'End-to-End Encryption',
      description: 'All sensitive patient and payment data is shielded using military-grade AES-256 standards both in transit and at rest.'
    },
    {
      icon: Server,
      title: 'Redundant Secure Backups',
      description: 'Daily automated data synchronization keeps your operational records safe and easily restorable without any risk of data loss.'
    },
    {
      icon: Shield,
      title: 'Granular Access Control',
      description: 'Role-based access permissions guarantee team members only access what they need, preserving administrative privacy.'
    },
    {
      icon: Database,
      title: 'Local Compliance & Speed',
      description: 'Hosted on top-tier infrastructure compliant with local data protection acts, delivering lightning-fast latency.'
    }
  ];

  const testimonials = [
    {
      quote: "PesaFlow transformed how we manage our physical wellness practice's daily billing. The layout is clean, fast, and the complete lack of paywalls gives our staff absolute peace of mind.",
      author: "Dr. Sarah Vance",
      role: "Clinical Director, Vance Wellness Group"
    },
    {
      quote: "The direct M-Pesa payment flow is incredibly reassuring for our patients. There are no limits, no hidden transaction fees, and the design looks beautifully tailored for care-based operations.",
      author: "Marcus Gikuyu",
      role: "Lead Administrator, CarePath Services"
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-zinc-950 font-sans selection:bg-[#087c46] selection:text-white transition-colors duration-300">
      
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-neutral-200/50 dark:border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#087c46] flex items-center justify-center shadow-lg shadow-[#087c46]/20">
                <Heart className="w-5 h-5 text-white animate-pulse" />
              </div>
              <span className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
                PesaFlow
              </span>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="#services" className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:text-[#087c46] dark:hover:text-[#087c46] transition-colors py-2">Services</Link>
              <Link href="#security" className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:text-[#087c46] dark:hover:text-[#087c46] transition-colors py-2">Security</Link>
              <Link href="#testimonials" className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:text-[#087c46] dark:hover:text-[#087c46] transition-colors py-2">Testimonials</Link>

              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-full bg-neutral-100 dark:bg-zinc-900 text-neutral-600 dark:text-neutral-400 hover:text-[#087c46] hover:scale-105 transition-all outline-none"
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {isLoggedIn ? (
                <Link href="/dashboard">
                  <Button className="bg-[#087c46] hover:bg-[#066539] text-white rounded-full px-8 py-6 text-sm font-bold shadow-lg shadow-[#087c46]/20 flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/login" className="text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:text-[#087c46] transition-colors">Sign In</Link>
                  <Link href="/auth/register">
                    <Button className="bg-[#087c46] hover:bg-[#066539] text-white rounded-full px-8 py-6 text-sm font-bold shadow-lg shadow-[#087c46]/20">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-full bg-neutral-100 dark:bg-zinc-900 text-neutral-600 dark:text-neutral-400"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2.5 text-neutral-700 dark:text-neutral-200"
                aria-label="Toggle Menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-white dark:bg-zinc-950 border-b border-neutral-200 dark:border-zinc-800 shadow-2xl animate-in slide-in-from-top-5 duration-200">
            <div className="px-4 py-8 space-y-4 flex flex-col">
              <Link href="#services" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-semibold text-neutral-700 dark:text-neutral-200 hover:text-[#087c46] p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-zinc-900">Services</Link>
              <Link href="#security" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-semibold text-neutral-700 dark:text-neutral-200 hover:text-[#087c46] p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-zinc-900">Security</Link>
              <Link href="#testimonials" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-semibold text-neutral-700 dark:text-neutral-200 hover:text-[#087c46] p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-zinc-900">Testimonials</Link>

              <div className="h-px bg-neutral-200 dark:bg-zinc-800 my-4"></div>

              {isLoggedIn ? (
                <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full bg-[#087c46] hover:bg-[#066539] text-white rounded-xl py-6 flex items-center justify-center gap-2">
                    <LayoutDashboard className="w-5 h-5" /> Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full rounded-xl py-6 border-neutral-300 dark:border-zinc-700">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full bg-[#087c46] hover:bg-[#066539] text-white rounded-xl py-6">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <header className="relative pt-36 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-emerald-500/5 dark:bg-emerald-500/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#087c46]/5 dark:bg-[#087c46]/10 blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/30 mb-8 animate-fade-in-up">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#087c46] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#087c46]"></span>
            </span>
            <span className="text-xs font-bold text-[#087c46] dark:text-[#087c46] uppercase tracking-wider">Premium Access Unlocked</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-neutral-900 dark:text-white tracking-tight mb-8 leading-tight">
            Empowering Your Business Operations <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#087c46] to-teal-600">
              With Soothing, Care-Centered Design
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto mb-12 leading-relaxed">
            Discover a reliable, beautifully optimized payment and point-of-sale workflow designed to keep your business running smoothly. Manage sales, track real-time analytics, and connect with your clients seamlessly. 
            <span className="block mt-4 text-[#087c46] dark:text-[#087c46] font-bold text-lg">
              100% Free Lifetime Platform Access • All Premium Features Unlocked
            </span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:h-16 sm:px-10 text-base rounded-full bg-[#087c46] hover:bg-[#066539] text-white shadow-xl shadow-[#087c46]/20 font-bold transition-all transform hover:scale-[1.03]">
                Start Operating Now <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="#services" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:h-16 sm:px-10 text-base rounded-full border-neutral-300 dark:border-zinc-700 hover:bg-neutral-100 dark:hover:bg-zinc-900 text-neutral-700 dark:text-neutral-300 font-bold transition-all">
                Explore Care Features
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Services Section */}
      <section id="services" className="py-28 bg-white dark:bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center justify-center p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-2xl text-[#087c46] mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold text-neutral-900 dark:text-white mb-6">
              Tailored for Reassuring Service
            </h2>
            <p className="text-lg text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
              We replace complex, fragmented billing structures with one cohesive dashboard focused on performance, clarity, and trust.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {services.map((service, index) => (
              <div 
                key={index} 
                className="group p-8 bg-neutral-50 dark:bg-zinc-900 rounded-3xl hover:bg-white dark:hover:bg-zinc-800 transition-all duration-300 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 border border-neutral-200/50 dark:border-zinc-800/50 flex flex-col md:flex-row gap-6 items-start"
              >
                <div className={`w-14 h-14 rounded-2xl ${service.color} flex items-center justify-center flex-shrink-0 shadow-inner`}>
                  <service.icon className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3 group-hover:text-[#087c46] transition-colors">{service.title}</h3>
                  <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed text-sm">{service.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-28 bg-[#044c2a] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#087c46_1px,transparent_1px)] [background-size:24px_24px] opacity-10"></div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-900/20 to-transparent"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-950/60 border border-emerald-800 mb-6">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Uncompromising Standards</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
                Your Operations Shielded. <br />Safe & Reassuring.
              </h2>
              <p className="text-lg text-emerald-100/80 mb-10 leading-relaxed">
                PesaFlow is built to uphold the highest levels of privacy and data security. Rest easy knowing your transaction database and records remain permanently isolated and secure.
              </p>

              <div className="grid sm:grid-cols-2 gap-8">
                {securityFeatures.map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="mt-1 flex-shrink-0">
                      <div className="p-2.5 bg-emerald-900/60 rounded-xl text-emerald-400">
                        <item.icon className="w-5 h-5" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1.5">{item.title}</h4>
                      <p className="text-xs text-emerald-200/70 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:w-1/2 w-full">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-emerald-800/80 bg-[#03371e] p-8">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-[#087c46]"></div>
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-emerald-900/50 pb-5">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-red-500"></div>
                      <div className="w-3.5 h-3.5 rounded-full bg-yellow-500"></div>
                      <div className="w-3.5 h-3.5 rounded-full bg-green-500"></div>
                    </div>
                    <div className="text-[11px] text-emerald-500 font-mono tracking-wider">SECURE LINK HEALTHY</div>
                  </div>
                  <div className="space-y-4 font-mono text-sm">
                    <div className="flex justify-between items-center py-1.5 border-b border-emerald-900/20">
                      <span className="text-emerald-400">Security Engine</span>
                      <span className="text-green-400 font-bold flex items-center gap-1.5">
                        <Activity className="w-4 h-4 animate-pulse" /> Active & Safe
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-emerald-900/20">
                      <span className="text-emerald-400">Access Isolation</span>
                      <span className="text-white">Active (Granular)</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-emerald-900/20">
                      <span className="text-emerald-400">Database Guard</span>
                      <span className="text-white">AES-256 Enabled</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-emerald-400">Uptime Check</span>
                      <span className="text-green-400 font-bold">99.99% Guaranteed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-28 bg-neutral-50 dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center justify-center p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-2xl text-[#087c46] mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold text-neutral-900 dark:text-white mb-6">
              Trusted by Leading Professionals
            </h2>
            <p className="text-lg text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
              Real testimonials from clinical and business owners operating PesaFlow daily.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
            {testimonials.map((test, index) => (
              <div 
                key={index} 
                className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-neutral-200/50 dark:border-zinc-800/50 shadow-sm relative flex flex-col justify-between"
              >
                <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-8 italic text-base">
                  &ldquo;{test.quote}&rdquo;
                </p>
                <div>
                  <h4 className="font-bold text-[#087c46] text-lg">{test.author}</h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{test.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-28 bg-white dark:bg-zinc-900 border-t border-neutral-200/50 dark:border-zinc-800/50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-br from-[#087c46] to-emerald-800 rounded-[3rem] p-12 sm:p-16 relative overflow-hidden shadow-2xl shadow-[#087c46]/20">
            <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:32px_32px] opacity-10"></div>
            <div className="relative z-10 text-white">
              <h2 className="text-3xl sm:text-5xl font-extrabold mb-6 leading-tight">Ready to Align Your Business?</h2>
              <p className="text-lg text-emerald-100/90 mb-10 max-w-xl mx-auto leading-relaxed">
                Join thousands of merchants who trust our warm, secure, and professional point-of-sale workflow every day.
              </p>
              <Link href="/auth/register">
                <Button size="lg" className="h-16 px-12 rounded-full bg-white text-[#087c46] hover:bg-neutral-50 hover:scale-[1.03] transition-all text-base font-bold shadow-xl">
                  Get Started for Free
                </Button>
              </Link>
              <p className="mt-6 text-sm text-emerald-200/80">100% Unlocked Lifetime Access • No Billing Subscriptions Ever</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-100 dark:bg-zinc-950 pt-20 pb-12 border-t border-neutral-200 dark:border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-lg bg-[#087c46] flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-neutral-900 dark:text-white">PesaFlow</span>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                The care-centered all-in-one payment workflow for modern commerce. Streamlining transactions, invoices, and diagnostics with pure integrity.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-neutral-900 dark:text-white mb-5 text-sm uppercase tracking-wider">Features</h4>
              <ul className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
                <li><Link href="#services" className="hover:text-[#087c46] transition-colors">POS Billing</Link></li>
                <li><Link href="#services" className="hover:text-[#087c46] transition-colors">Reports & Analytics</Link></li>
                <li><Link href="#services" className="hover:text-[#087c46] transition-colors">Safe M-Pesa</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-neutral-900 dark:text-white mb-5 text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
                <li><Link href="#" className="hover:text-[#087c46] transition-colors">About Care</Link></li>
                <li><Link href="#" className="hover:text-[#087c46] transition-colors">Contact Solutions</Link></li>
                <li><Link href="#" className="hover:text-[#087c46] transition-colors">Privacy Shield</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-neutral-900 dark:text-white mb-5 text-sm uppercase tracking-wider">Support</h4>
              <ul className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400 font-mono">
                <li>info@kkdes.co.ke</li>
                <li>+254 724 454 757</li>
                <li>Nairobi, Kenya</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-neutral-200 dark:border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              &copy; {new Date().getFullYear()} KK Dynamic Enterprise Solutions LTD. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
