'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield, Zap, CheckCircle2, Smartphone, FileText, ArrowRight,
  Sun, Moon, Lock, Server, Database, Menu, X, LayoutDashboard,
  Heart, Activity, Sparkles, Users, BarChart3, HelpCircle, PhoneCall,
  Gift, Box, Store, Banknote, Briefcase, FileSignature, Receipt
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
      title: 'Smart Point of Sale (POS)',
      description: 'Facilitate swift, secure transactions with a modern, patient-friendly POS. Manage daily checkouts effortlessly.',
      color: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
    },
    {
      icon: Box,
      title: 'Inventory & Stock Management',
      description: 'Track your inventory in real-time. Receive automated low-stock alerts to ensure you never run out of essential supplies.',
      color: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
    },
    {
      icon: Smartphone,
      title: 'Direct M-Pesa Integration',
      description: 'Enjoy seamless, safe payments via M-Pesa STK Push. Funds hit your till immediately with zero hidden fees.',
      color: 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400'
    },
    {
      icon: Gift,
      title: 'CRM & Loyalty Program',
      description: 'Build lasting relationships. Reward your customers with points for every visit, fostering trust and loyalty.',
      color: 'bg-fuchsia-50 dark:bg-fuchsia-950/30 text-fuchsia-600 dark:text-fuchsia-400'
    },
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      description: 'Monitor growth with visual reports on revenue flow, product performance, and team activity from a single secure view.',
      color: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
    },
    {
      icon: Store,
      title: 'Team & Branch Management',
      description: 'Manage multiple branches and staff effortlessly. Assign roles and track individual staff performance directly.',
      color: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400'
    },
    {
      icon: Receipt,
      title: 'Professional Invoicing',
      description: 'Generate beautiful digital invoices, receipts, and detailed sales breakdowns instantly for your clients.',
      color: 'bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400'
    },
    {
      icon: FileSignature,
      title: 'KRA Compliance Ready',
      description: 'Ensure smooth, headache-free tax operations with our integrated KRA module built straight into your billing flow.',
      color: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'
    }
  ];

  const securityFeatures = [
    {
      icon: Lock,
      title: 'End-to-End Encryption',
      description: 'Sensitive client and payment data is shielded using military-grade AES-256 standards both in transit and at rest.'
    },
    {
      icon: Server,
      title: 'Redundant Secure Backups',
      description: 'Automated data synchronization keeps your operational records safe and easily restorable.'
    },
    {
      icon: Shield,
      title: 'Granular Access Control',
      description: 'Role-based access permissions guarantee team members only access what they need, preserving privacy.'
    },
    {
      icon: Database,
      title: 'Local Compliance & Speed',
      description: 'Hosted on top-tier infrastructure compliant with local data protection acts, delivering lightning-fast latency.'
    }
  ];

  const testimonials = [
    {
      quote: "Mpesa Connect completely transformed how we manage our clinic's daily billing. The layout is clean, reassuringly fast, and completely free. Our staff absolutely love it.",
      author: "Dr. Sarah Vance",
      role: "Lead Physician, Care Solutions"
    },
    {
      quote: "The direct M-Pesa payment flow and integrated loyalty program made a huge difference. There are no hidden fees, and the modern design makes the patient experience incredibly smooth.",
      author: "Marcus Gikuyu",
      role: "Operations Manager, HealthHaven"
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-zinc-950 font-sans selection:bg-blue-600 selection:text-white transition-colors duration-300">
      
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-neutral-200/50 dark:border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                <Heart className="w-5 h-5 text-white animate-pulse" />
              </div>
              <span className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                Mpesa Connect
              </span>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="#services" className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-2">Features</Link>
              <Link href="#why-free" className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-2">Pricing</Link>
              <Link href="#security" className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-2">Security</Link>

              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-full bg-neutral-100 dark:bg-zinc-900 text-neutral-600 dark:text-neutral-400 hover:text-blue-600 hover:scale-105 transition-all outline-none"
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {isLoggedIn ? (
                <Link href="/dashboard">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-6 text-sm font-bold shadow-lg shadow-blue-600/20 flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/login" className="text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:text-blue-600 transition-colors">Sign In</Link>
                  <Link href="/auth/register">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-6 text-sm font-bold shadow-lg shadow-blue-600/20">
                      Start for Free
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
              <Link href="#services" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-semibold text-neutral-700 dark:text-neutral-200 hover:text-blue-600 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-zinc-900">Features</Link>
              <Link href="#why-free" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-semibold text-neutral-700 dark:text-neutral-200 hover:text-blue-600 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-zinc-900">Pricing</Link>
              <Link href="#security" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-semibold text-neutral-700 dark:text-neutral-200 hover:text-blue-600 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-zinc-900">Security</Link>

              <div className="h-px bg-neutral-200 dark:bg-zinc-800 my-4"></div>

              {isLoggedIn ? (
                <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6 flex items-center justify-center gap-2">
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
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6">
                      Start for Free
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
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/5 dark:bg-blue-600/10 blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-200 dark:border-emerald-800/50 mb-8 animate-fade-in-up">
            <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-widest">
              100% Free Lifetime Access
            </span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold text-neutral-900 dark:text-white tracking-tight mb-8 leading-tight">
            The Patient-Centered <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">
              Point of Sale & Billing Platform
            </span>
          </h1>

          <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto mb-12 leading-relaxed">
            A comprehensive, beautifully designed ecosystem to manage your inventory, staff, customer loyalty, and M-Pesa payments—all natively integrated and entirely free to use.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:h-16 sm:px-10 text-lg rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20 font-bold transition-all transform hover:scale-[1.03]">
                Start Using It for Free <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="#services" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:h-16 sm:px-10 text-lg rounded-full border-neutral-300 dark:border-zinc-700 hover:bg-neutral-100 dark:hover:bg-zinc-900 text-neutral-700 dark:text-neutral-300 font-bold transition-all">
                Explore All Features
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Services Grid Section */}
      <section id="services" className="py-28 bg-white dark:bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center justify-center p-3 bg-blue-50 dark:bg-blue-950/50 rounded-2xl text-blue-600 mb-4">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold text-neutral-900 dark:text-white mb-6">
              Everything You Need. Unlocked.
            </h2>
            <p className="text-lg text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
              We replaced complex, expensive billing software with one cohesive, modern dashboard. Access enterprise-grade features without the enterprise price tag.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {services.map((service, index) => (
              <div 
                key={index} 
                className="group p-8 bg-neutral-50 dark:bg-zinc-900 rounded-[2rem] hover:bg-white dark:hover:bg-zinc-800 transition-all duration-300 shadow-sm hover:shadow-2xl hover:-translate-y-2 border border-neutral-200/50 dark:border-zinc-800/50 flex flex-col items-start relative overflow-hidden"
              >
                <div className={`w-14 h-14 rounded-2xl ${service.color} flex items-center justify-center shadow-inner mb-6 transition-transform group-hover:scale-110`}>
                  <service.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{service.title}</h3>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-sm flex-grow">{service.description}</p>
                <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                  <service.icon className="w-24 h-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why It's Free Section */}
      <section id="why-free" className="py-28 bg-emerald-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-10"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/50 blur-[100px]"></div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-800/50 border border-emerald-500 mb-6">
            <Shield className="w-5 h-5 text-emerald-200" />
            <span className="text-sm font-bold text-emerald-100 tracking-wider">No Subscriptions. No Hidden Fees.</span>
          </div>
          
          <h2 className="text-4xl sm:text-6xl font-extrabold mb-8 leading-tight">
            Built to Serve.<br /> Completely Free to Use.
          </h2>
          
          <p className="text-xl text-emerald-50 mb-12 leading-relaxed max-w-2xl mx-auto">
            We believe that robust operational tools should be accessible to all businesses. You get unlimited users, unlimited transactions, and unlimited branches—forever free. Our mission is to streamline your workflows, not drain your margins.
          </p>

          <Link href="/auth/register">
            <Button size="lg" className="h-16 px-12 rounded-full bg-white text-emerald-700 hover:bg-emerald-50 hover:scale-[1.03] transition-all text-lg font-bold shadow-2xl">
              Create Your Free Account Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-28 bg-[#0a2560] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-900/20 to-transparent"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-blue-950/60 border border-blue-800 mb-6">
                <Shield className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">Uncompromising Standards</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
                Your Operations Shielded. <br />Safe & Reassuring.
              </h2>
              <p className="text-lg text-blue-100/80 mb-10 leading-relaxed">
                Mpesa Connect is built to uphold the highest levels of privacy and data security. Rest easy knowing your transaction database and records remain permanently isolated and secure.
              </p>

              <div className="grid sm:grid-cols-2 gap-8">
                {securityFeatures.map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="mt-1 flex-shrink-0">
                      <div className="p-2.5 bg-blue-900/60 rounded-xl text-blue-400">
                        <item.icon className="w-5 h-5" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1.5">{item.title}</h4>
                      <p className="text-xs text-blue-200/70 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:w-1/2 w-full">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-blue-800/80 bg-[#071940] p-8">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-blue-900/50 pb-5">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-red-500"></div>
                      <div className="w-3.5 h-3.5 rounded-full bg-yellow-500"></div>
                      <div className="w-3.5 h-3.5 rounded-full bg-blue-500"></div>
                    </div>
                    <div className="text-[11px] text-blue-500 font-mono tracking-wider">SECURE LINK HEALTHY</div>
                  </div>
                  <div className="space-y-4 font-mono text-sm">
                    <div className="flex justify-between items-center py-1.5 border-b border-blue-900/20">
                      <span className="text-blue-400">Security Engine</span>
                      <span className="text-blue-300 font-bold flex items-center gap-1.5">
                        <Activity className="w-4 h-4 animate-pulse" /> Active & Safe
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-blue-900/20">
                      <span className="text-blue-400">Access Isolation</span>
                      <span className="text-white">Active (Granular)</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-blue-900/20">
                      <span className="text-blue-400">Database Guard</span>
                      <span className="text-white">AES-256 Enabled</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-blue-400">Uptime Check</span>
                      <span className="text-blue-300 font-bold">99.99% Guaranteed</span>
                    </div>
                  </div>
                </div>
              </div>
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
                <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-neutral-900 dark:text-white">Mpesa Connect</span>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                The care-centered all-in-one payment workflow for modern commerce. Streamlining transactions, invoices, and diagnostics with pure integrity.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-neutral-900 dark:text-white mb-5 text-sm uppercase tracking-wider">Features</h4>
              <ul className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
                <li><Link href="#services" className="hover:text-blue-600 transition-colors">POS Billing</Link></li>
                <li><Link href="#services" className="hover:text-blue-600 transition-colors">Reports & Analytics</Link></li>
                <li><Link href="#services" className="hover:text-blue-600 transition-colors">Safe M-Pesa</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-neutral-900 dark:text-white mb-5 text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
                <li><Link href="#" className="hover:text-blue-600 transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Contact</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</Link></li>
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
