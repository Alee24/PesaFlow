'use client';

import Link from 'next/link';
import { Store, Package, CreditCard, BarChart3, Shield, Users, Zap, CheckCircle, Smartphone, FileText, ArrowRight, Star, Mail, PieChart, Layers } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function LandingPage() {
  const features = [
    {
      icon: Store,
      title: 'Advanced POS',
      description: 'Streamline sales with a powerful Point of Sale system. Handle discounts, split payments, and inventory updates in real-time.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Users,
      title: 'CRM & Customer Insights',
      description: 'Build stronger relationships. Track customer history, detailed interactions, notes, and lifetime value.',
      color: 'from-violet-500 to-purple-500'
    },
    {
      icon: Layers,
      title: 'Smart Segmentation',
      description: 'Group customers dynamically based on spending behavior, location, or purchase history for targeted marketing.',
      color: 'from-indigo-500 to-blue-600'
    },
    {
      icon: Mail,
      title: 'Email Campaigns',
      description: 'Engage your audience with built-in email marketing. Send offers to specific segments directly from your dashboard.',
      color: 'from-pink-500 to-rose-500'
    },
    {
      icon: Smartphone,
      title: 'M-Pesa Integration',
      description: 'Seamless payments. Trigger STK Pushes directly from invoices or POS, with automatic reconciliation.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: FileText,
      title: 'Professional Invoicing',
      description: 'Generate branded PDF invoices, email them instantly, and allow customers to pay via M-Pesa with one click.',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: BarChart3,
      title: 'Real-Time Analytics',
      description: 'Make data-driven decisions. Visual dashboards for sales trends, profit margins, and inventory performance.',
      color: 'from-teal-500 to-emerald-500'
    },
    {
      icon: Shield,
      title: 'Secure & Compliant',
      description: 'Bank-grade security for your data and wallet. Merchant verification (KYC) tailored for Kenyan businesses.',
      color: 'from-slate-700 to-slate-900'
    }
  ];

  const stats = [
    { value: '99.9%', label: 'Uptime Guarantee' },
    { value: 'Instant', label: 'Payment Settlement' },
    { value: '24/7', label: 'Local Support' },
    { value: 'Secure', label: 'Bank-Grade Security' }
  ];

  const pricingPlans = [
    {
      name: 'Free',
      price: 'Free',
      period: 'Forever',
      description: 'Perfect for getting started',
      features: [
        'POS System',
        'Inventory Management',
        'Unlimited Transactions',
        'Basic Support'
      ],
      cta: 'Get Started Free',
      popular: false
    },
    {
      name: 'Basic',
      price: '1,500 KES',
      period: '/month',
      description: 'For small businesses',
      features: [
        'Everything in Free',
        'Invoice Management',
        'Basic Reports',
        '100 Transactions/mo',
        'Email Support'
      ],
      cta: 'Start Trial',
      popular: false
    },
    {
      name: 'Pro',
      price: '2,500 KES',
      period: '/month',
      description: 'For growing businesses',
      features: [
        'Everything in Basic',
        'Unlimited Transactions',
        'Up to 10 Branches',
        'Withdrawal Management',
        'Advanced Analytics',
        'Priority Suppport'
      ],
      cta: 'Start Trial',
      popular: true
    },
    {
      name: 'Enterprise',
      price: '75,000 KES',
      period: '/one-time',
      description: 'Full system ownership',
      features: [
        'Full Source Code / Self-Hosted',
        'Unlimited Branches',
        'Custom Branding',
        'Lifetime Updates',
        'Dedicated Account Manager'
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Hero Section */}
      <header className="relative overflow-hidden bg-white dark:bg-gray-900 pt-6 pb-20 lg:pb-32">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-purple-200/50 dark:bg-purple-900/20 blur-3xl" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-200/50 dark:bg-indigo-900/20 blur-3xl" />
        </div>

        <nav className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Store className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                PesaFlow
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">Features</Link>
              <Link href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">Pricing</Link>
              <Link href="/auth/login" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">Sign In</Link>
              <Link href="/auth/register">
                <Button className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-full px-6">
                  Get Started
                </Button>
              </Link>
            </div>
            {/* Mobile Menu Button - simplified */}
            <div className="md:hidden">
              <Link href="/auth/login">
                <Button size="sm" variant="ghost">Log In</Button>
              </Link>
            </div>
          </div>
        </nav>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 mb-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">New: CRM & Smart Invoicing 2.0</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            The Operating System for <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
              Modern African Commerce
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            Accept M-Pesa payments, manage inventory, track customers, and send professional invoices—all from one beautiful dashboard.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <Link href="/auth/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:h-14 sm:px-10 text-lg rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/30 transition-all hover:scale-105">
                Start Free Trial <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="#demo" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:h-14 sm:px-10 text-lg rounded-full border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                View Live Demo
              </Button>
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="mt-20 pt-10 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 md:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</p>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white dark:bg-gray-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-base font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-2">Capabilities</h2>
            <p className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">Everything you need to grow.</p>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              We've integrated the most powerful tools into one seamless platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="group relative p-8 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-black/50 hover:-translate-y-1">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} p-3.5 mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-full h-full text-white" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-indigo-900 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 opacity-20 dark:opacity-40">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-purple-500 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/50 to-transparent"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20 text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Simple, Transparent Pricing</h2>
            <p className="text-xl text-indigo-200 max-w-2xl mx-auto">
              Start for free, upgrade as you grow. No hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-start">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative p-8 rounded-3xl transition-all duration-300 ${plan.popular
                  ? 'bg-white text-gray-900 shadow-2xl shadow-black/20 scale-105 z-10'
                  : 'bg-indigo-800/50 text-white border border-indigo-700 backdrop-blur-sm'
                  }`}
              >
                {plan.popular && (
                  <div className="absolute -top-5 left-0 right-0 mx-auto w-fit px-4 py-1.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-lg">
                    Most Popular
                  </div>
                )}

                <div className="mb-8">
                  <h3 className={`text-xl font-bold mb-2 ${plan.popular ? 'text-gray-900' : 'text-white'}`}>{plan.name}</h3>
                  <p className={`text-sm ${plan.popular ? 'text-gray-500' : 'text-indigo-200'}`}>{plan.description}</p>
                </div>

                <div className="mb-8 flex items-baseline gap-1">
                  <span className={`text-5xl font-bold ${plan.popular ? 'text-gray-900' : 'text-white'}`}>{plan.price}</span>
                  <span className={`text-lg ${plan.popular ? 'text-gray-500' : 'text-indigo-300'}`}>{plan.period}</span>
                </div>

                <ul className="space-y-4 mb-10">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className={`w-5 h-5 flex-shrink-0 ${plan.popular ? 'text-indigo-600' : 'text-indigo-400'}`} />
                      <span className={`text-sm font-medium ${plan.popular ? 'text-gray-700' : 'text-indigo-100'}`}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/auth/register" className="block">
                  <Button
                    size="lg"
                    className={`w-full h-12 rounded-xl text-base font-semibold transition-all ${plan.popular
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 hover:shadow-xl'
                      : 'bg-indigo-700/50 hover:bg-indigo-700 text-white border border-indigo-600/50'
                      }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[3rem] p-12 md:p-20 relative overflow-hidden shadow-2xl shadow-indigo-500/20">
            <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Ready to revolutionize your workflow?
              </h2>
              <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
                Join over 5,000 Kenyan businesses using PesaFlow to scale faster.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/register">
                  <Button size="lg" className="h-14 px-10 rounded-full bg-white text-indigo-900 hover:bg-gray-50 hover:scale-105 transition-all text-lg font-bold shadow-lg">
                    Get Started Now
                  </Button>
                </Link>
              </div>
              <p className="mt-6 text-sm text-indigo-200 opacity-80">No credit card required for trial.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">PesaFlow</span>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            &copy; 2025 PesaFlow Project. All rights reserved.
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-gray-400 hover:text-indigo-600 transition-colors"><span className="sr-only">Twitter</span><svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg></a>
            <a href="#" className="text-gray-400 hover:text-indigo-600 transition-colors"><span className="sr-only">GitHub</span><svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
