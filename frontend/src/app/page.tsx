'use client';

import Link from 'next/link';
import { Store, Package, CreditCard, BarChart3, Shield, Users, Zap, CheckCircle, TrendingUp, Lock, Smartphone, FileText, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function LandingPage() {
  const features = [
    {
      icon: Store,
      title: 'Advanced POS System',
      description: 'Complete point-of-sale with barcode scanning, discounts, split payments, and real-time inventory updates.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Package,
      title: 'Inventory Management',
      description: 'Track stock levels, set reorder points, manage suppliers, batch tracking, and automated low-stock alerts.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Smartphone,
      title: 'M-Pesa Integration',
      description: 'Seamless STK Push payments, automatic reconciliation, and instant wallet crediting with 2.5 KES fee.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: FileText,
      title: 'Smart Invoicing',
      description: 'Create professional invoices, track payments, send email notifications, and generate PDF receipts.',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Shield,
      title: 'Merchant Verification',
      description: 'KYC document upload, admin review system, account activation workflow, and compliance tracking.',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reports',
      description: 'Sales statistics, inventory valuation, profit margins, stock movements, and comprehensive dashboards.',
      color: 'from-pink-500 to-rose-500'
    },
    {
      icon: CreditCard,
      title: 'Withdrawal Management',
      description: 'Request payouts to M-Pesa, admin approval workflow, automatic fee deduction (2%), and transaction history.',
      color: 'from-teal-500 to-cyan-500'
    },
    {
      icon: Users,
      title: 'Multi-User Support',
      description: 'Role-based access control, merchant and admin accounts, status-based restrictions, and user management.',
      color: 'from-violet-500 to-purple-500'
    }
  ];

  const stats = [
    { value: '100%', label: 'Uptime Guarantee' },
    { value: '2.5 KES', label: 'Transaction Fee' },
    { value: '24/7', label: 'Support Available' },
    { value: 'Instant', label: 'Payment Processing' }
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: 'Free',
      description: 'Perfect for small businesses getting started',
      features: [
        'Up to 100 transactions/month',
        'Basic POS system',
        'Inventory management',
        'M-Pesa integration',
        'Email support'
      ],
      cta: 'Get Started',
      popular: false
    },
    {
      name: 'Professional',
      price: '2,500 KES',
      period: '/month',
      description: 'For growing businesses with advanced needs',
      features: [
        'Unlimited transactions',
        'Advanced POS with discounts',
        'Full inventory tracking',
        'Priority M-Pesa processing',
        'Analytics & reports',
        'Barcode scanning',
        'Priority support'
      ],
      cta: 'Start Free Trial',
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'Tailored solutions for large organizations',
      features: [
        'Everything in Professional',
        'Multi-location support',
        'Custom integrations',
        'Dedicated account manager',
        'SLA guarantee',
        'Custom training',
        '24/7 phone support'
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-purple-600/10 to-pink-600/10 dark:from-indigo-600/20 dark:via-purple-600/20 dark:to-pink-600/20"></div>

        <nav className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Store className="w-8 h-8 text-indigo-600" />
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                Mpesa Connect
              </span>
            </div>
            <div className="flex gap-4">
              <Link href="/auth/login">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/auth/register">
                <Button>Get Started Free</Button>
              </Link>
            </div>
          </div>
        </nav>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400 text-sm font-semibold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Zap className="w-4 h-4" />
              Complete Business Management Platform
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              Manage Your Business
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                All in One Place
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-10 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              Advanced POS, Inventory Management, M-Pesa Integration, and Merchant Verification.
              Everything you need to run a successful business in Kenya.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <Link href="/auth/register">
                <Button size="lg" className="text-lg px-8 py-6 shadow-2xl shadow-indigo-500/50">
                  Start Free Trial <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Powerful Features for Modern Businesses
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Everything you need to manage sales, inventory, payments, and grow your business
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-1"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} p-3 mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-full h-full text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-indigo-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Choose the plan that fits your business needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative p-8 bg-white dark:bg-gray-800 rounded-2xl border-2 ${plan.popular
                    ? 'border-indigo-500 shadow-2xl shadow-indigo-500/30 scale-105'
                    : 'border-gray-200 dark:border-gray-700'
                  } transition-all duration-300 hover:shadow-xl`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold rounded-full flex items-center gap-1">
                    <Star className="w-4 h-4 fill-current" />
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {plan.description}
                  </p>
                </div>

                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900 dark:text-white">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-gray-600 dark:text-gray-400">
                      {plan.period}
                    </span>
                  )}
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300 text-sm">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link href="/auth/register">
                  <Button
                    className="w-full"
                    variant={plan.popular ? 'primary' : 'outline'}
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
      <section className="py-20 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-indigo-100 mb-10">
            Join hundreds of businesses already using Mpesa Connect to streamline operations and boost sales
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100 text-lg px-8 py-6">
                Start Free Trial <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8 py-6">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Store className="w-6 h-6 text-indigo-400" />
                <span className="text-xl font-bold text-white">Mpesa Connect</span>
              </div>
              <p className="text-sm">
                Complete business management platform for modern Kenyan businesses.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2025 Mpesa Connect. All rights reserved. Built with ❤️ in Kenya.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
