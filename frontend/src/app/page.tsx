'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Store, Shield, Users, Zap, CheckCircle, Smartphone,
  FileText, ArrowRight, Sun, Moon, Lock, Server,
  CreditCard, BarChart2, Globe, Database, Menu, X, LayoutDashboard
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

  const features = [
    {
      icon: Store,
      title: 'Advanced POS',
      description: 'Streamline sales with a powerful Point of Sale system. Handle discounts, split payments, and inventory updates in real-time.',
      color: 'bg-blue-500'
    },
    {
      icon: Users,
      title: 'CRM & Insights',
      description: 'Build stronger relationships. Track customer history, detailed interactions, notes, and lifetime value.',
      color: 'bg-violet-500'
    },
    {
      icon: Smartphone,
      title: 'M-Pesa Integration',
      description: 'Seamless payments via Mpesa Connect, or integrate your own direct Safaricom API credentials for full control over settlements.',
      color: 'bg-green-500'
    },
    {
      icon: BarChart2,
      title: 'Real-Time Analytics',
      description: 'Make data-driven decisions. Visual dashboards for sales trends, profit margins, and inventory performance.',
      color: 'bg-teal-500'
    },
    {
      icon: FileText,
      title: 'Digital Invoicing',
      description: 'Generate, send, and track professional tax-compliant invoices and print thermal receipts seamlessly.',
      color: 'bg-orange-500'
    },
    {
      icon: Database,
      title: 'Multi-Branch Sync',
      description: 'Manage multiple branches, synchronize stock levels, and assign managers to specific business locations.',
      color: 'bg-sky-500'
    },
    {
      icon: CreditCard,
      title: 'Withdrawals & Payouts',
      description: 'Process instant Safaricom B2C payouts and transfer wallet funds securely with dual-authorization safety.',
      color: 'bg-pink-500'
    },
    {
      icon: Shield,
      title: 'Role-Based Staff Access',
      description: 'Restrict sensitive financial data. Control cashier and manager permissions with customized role configurations.',
      color: 'bg-indigo-500'
    }
  ];

  const securityFeatures = [
    {
      icon: Lock,
      title: 'End-to-End Encryption',
      description: 'All sensitive data is encrypted using military-grade AES-256 standards both in transit and at rest.'
    },
    {
      icon: Server,
      title: 'Daily Backups',
      description: 'Your data is backed up automatically every day to secure, redundant servers to prevent data loss.'
    },
    {
      icon: Shield,
      title: 'Role-Based Access',
      description: 'Granular controls ensure employees only see what they need to do their job, protecting sensitive business info.'
    },
    {
      icon: Database,
      title: 'Data Sovereignty',
      description: 'Hosted securely to comply with local data protection regulations and ensure maximum speed.'
    }
  ];

  const stats = [
    { value: '99.99%', label: 'Uptime' },
    { value: '50M+', label: 'Transactions' },
    { value: '5,000+', label: 'Merchants' },
    { value: '24/7', label: 'Support' }
  ];



  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-300">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                Mpesa Connect
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Features</Link>
              <Link href="#security" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Security</Link>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-gray-500 hover:text-indigo-600"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>

              {isLoggedIn ? (
                <Link href="/dashboard">
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/login" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Sign In</Link>
                  <Link href="/auth/register">
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-gray-500 hover:text-indigo-600"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-600 dark:text-gray-300 hover:text-indigo-600"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-xl animate-in slide-in-from-top-5 duration-200">
            <div className="px-4 py-6 space-y-4 flex flex-col">
              <Link href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">Features</Link>
              <Link href="#security" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">Security</Link>

              <div className="h-px bg-gray-100 dark:bg-gray-800 my-4"></div>

              {isLoggedIn ? (
                <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-6 flex items-center justify-center gap-2">
                    <LayoutDashboard className="w-5 h-5" /> Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full rounded-xl py-6 border-gray-200 dark:border-gray-700">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-6">
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
      <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/10 dark:bg-purple-500/20 blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 mb-8 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">100% Free Lifetime Access</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-8 leading-tight">
            The Operating System for <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Modern African Commerce
            </span>
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Manage your entire business from one dashboard. Accept M-Pesa payments, track inventory, manage branches, and engage customers. <span className="text-indigo-600 dark:text-indigo-400 font-bold">All premium features are 100% free with no monthly subscription charges ever.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:h-14 sm:px-8 text-lg rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20">
                Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="#demo" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:h-14 sm:px-8 text-lg rounded-full border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                View Live Demo
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-20 pt-10 border-t border-gray-200/50 dark:border-gray-700/50 grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i}>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Everything you need to grow
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Replace your fragmented tools with one cohesive platform designed for performance.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group p-8 bg-gray-50 dark:bg-gray-800 rounded-3xl hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 border border-gray-100 dark:border-gray-700">
                <div className={`w-12 h-12 rounded-2xl ${feature.color} flex items-center justify-center mb-6 shadow-lg`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-24 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-900/20 to-transparent"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/50 border border-indigo-700 mb-6">
                <Shield className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wide">Enterprise Grade Security</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Your data is safe.<br />Guaranteed.
              </h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                We take security seriously. Mpesa Connect is built with the same security standards used by leading banks and financial institutions.
              </p>

              <div className="grid sm:grid-cols-2 gap-6">
                {securityFeatures.map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="mt-1">
                      <item.icon className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-400 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:w-1/2 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-6">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-700 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="text-xs text-gray-500 font-mono">SECURE CONNECTION</div>
                  </div>
                  <div className="space-y-2 font-mono text-sm">
                    <div className="flex justify-between">
                      <span className="text-indigo-400">Status</span>
                      <span className="text-green-400">● M-Pesa Secure</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-indigo-400">Encryption</span>
                      <span className="text-white">AES-256-GCM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-indigo-400">DDoS Protection</span>
                      <span className="text-white">Active</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-indigo-400">Last Backup</span>
                      <span className="text-white">Just Now</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-600 rounded-full blur-[60px] opacity-20"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-600 rounded-full blur-[60px] opacity-20"></div>
            </div>
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="py-24 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[3rem] p-12 relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="relative z-10 text-white">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to scale your business?</h2>
              <p className="text-lg text-indigo-100 mb-10 max-w-xl mx-auto">
                Join thousands of merchants who trust Mpesa Connect to power their daily operations.
              </p>
              <Link href="/auth/register">
                <Button size="lg" className="h-14 px-10 rounded-full bg-white text-indigo-900 hover:bg-gray-100 hover:scale-105 transition-all text-lg font-bold shadow-xl">
                  Get Started Free
                </Button>
              </Link>
              <p className="mt-6 text-sm text-indigo-200 opacity-80">100% Free Lifetime Platform • No Credit Card Required</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-900 pt-16 pb-12 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <Store className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">Mpesa Connect</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                The all-in-one platform for modern African commerce. Simplifying payments, inventory, and customer management.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="#features" className="hover:text-indigo-600">Features</Link></li>
                <li><Link href="#security" className="hover:text-indigo-600">Security</Link></li>
                <li><Link href="#" className="hover:text-indigo-600">API Documentation</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="#" className="hover:text-indigo-600">About Us</Link></li>
                <li><Link href="#" className="hover:text-indigo-600">Careers</Link></li>
                <li><Link href="#" className="hover:text-indigo-600">Blog</Link></li>
                <li><Link href="#" className="hover:text-indigo-600">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>info@kkdes.co.ke</li>
                <li>+254 724 454 757</li>
                <li>Nairobi, Kenya</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              &copy; {new Date().getFullYear()} KK Dynamic Enterprise Solutions LTD. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-gray-400 hover:text-indigo-600 transition-colors">
                <Globe className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-indigo-600 transition-colors">
                <Store className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
