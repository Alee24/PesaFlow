
import Link from 'next/link';
import { ArrowRight, CheckCircle2, DollarSign, LayoutDashboard, ShieldCheck, Smartphone, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900">

      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Zap className="text-white w-5 h-5 fill-current" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              PayFlow
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-300">
            <a href="#features" className="hover:text-indigo-600 dark:hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-indigo-600 dark:hover:text-white transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-indigo-600 dark:hover:text-white transition-colors">Testimonials</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
              Log in
            </Link>
            <Link href="/auth/register">
              <Button>Get Started <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-sm font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            v2.0 Now Available with STK Push
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 dark:text-white mb-8">
            Payments made <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              seamless & instant.
            </span>
          </h1>

          <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-12">
            The all-in-one SaaS platform for merchants to manage sales, track inventory, and process M-Pesa payments purely via STK Push. No hardware needed.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full h-12 px-8 text-base">Start Free Trial</Button>
            </Link>
            <Link href="#demo" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full h-12 px-8 text-base">View Demo</Button>
            </Link>
          </div>

          {/* Hero Image / Dashboard Preview */}
          <div className="mt-20 relative mx-auto max-w-5xl">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20"></div>
            <div className="relative rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
              <div className="aspect-[16/9] w-full bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center text-gray-400">
                {/* Placeholder for actual dashboard screenshot if available, using a text for now or mock UI */}
                <div className="flex flex-col items-center">
                  <LayoutDashboard className="w-16 h-16 mb-4 text-indigo-200 dark:text-gray-700" />
                  <span className="text-sm">Interactive Dashboard Preview</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partners / Social Proof */}
      <section className="py-10 border-y border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm font-medium text-gray-500 mb-6">TRUSTED BY INNOVATIVE MERCHANTS</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-300">
            {['Acme Corp', 'GlobalTech', 'Nebula', 'Spherule', 'CodeBox'].map((brand) => (
              <span key={brand} className="text-xl font-bold font-serif text-gray-800 dark:text-white">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Everything you need to run your business</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">From POS to Inventory, we provide the tools to help you scale.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Smartphone className="w-6 h-6 text-indigo-600" />,
                title: "M-Pesa STK Push",
                desc: "Trigger payments directly to your customer's phone. No manual entry errors, higher conversion rates."
              },
              {
                icon: <LayoutDashboard className="w-6 h-6 text-purple-600" />,
                title: "Cloud POS",
                desc: "Access your Point of Sale from any device. Ring up sales on your phone, tablet, or laptop."
              },
              {
                icon: <ShieldCheck className="w-6 h-6 text-emerald-600" />,
                title: "Secure Wallets",
                desc: "Each merchant gets a dedicated digital wallet. Withdraw your earnings to M-Pesa instantly."
              },
              {
                icon: <LayoutDashboard className="w-6 h-6 text-pink-600" />,
                title: "Inventory Management",
                desc: "Track stock levels, set prices, and manage SKUs with ease. Never run out of best-sellers."
              },
              {
                icon: <Zap className="w-6 h-6 text-yellow-500" />,
                title: "Real-time Analytics",
                desc: "Visualize your sales data. See what's selling and when, to make better business decisions."
              },
              {
                icon: <CheckCircle2 className="w-6 h-6 text-blue-500" />,
                title: "Easy Setup",
                desc: "Get started in under 2 minutes. Our installation wizard makes deployment a breeze."
              }
            ].map((feature, i) => (
              <div key={i} className="p-8 rounded-2xl bg-gray-50 dark:bg-gray-900 hover:bg-white dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 shadow-sm hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-lg bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto rounded-3xl bg-indigo-600 px-6 py-16 md:px-20 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-purple-500 rounded-full blur-3xl opacity-50"></div>

          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 relative z-10">Start accepting payments today.</h2>
          <p className="text-indigo-100 text-lg mb-10 max-w-2xl mx-auto relative z-10">
            Join thousands of merchants growing their business with PayFlow. No credit card required for trial.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
            <Link href="/auth/register">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100 border-none h-12 px-8">Get Started Now</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
              <Zap className="text-white w-3 h-3 fill-current" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white">PayFlow</span>
          </div>
          <div className="text-sm text-gray-500">
            © {new Date().getFullYear()} PayFlow Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
