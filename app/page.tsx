import React from 'react';
import Link from 'next/link';
import { ArrowRight, MessageSquare, Shield, Zap, Users, Globe, Star, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import PaymentButton from '@/components/PaymentButton';
import RiddleChallenge from '@/components/RiddleChallenge';

type FeatureCardProps = {
  icon: React.ElementType;
  title: string;
  description: string;
}

type TestimonialProps = {
  content: string;
  author: string;
  role: string;
  avatar: string;
}

const FeatureCard = ({ icon: Icon, title, description }: FeatureCardProps) => (
  <div className="group relative bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="relative">
      <div className="mb-4 inline-flex p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-semibold mb-2 dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  </div>
);

const Testimonial = ({ content, author, role, avatar }: TestimonialProps) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
    <div className="flex items-center mb-4">
      <div className="relative w-12 h-12 mr-4">
        <Image
          src={avatar}
          alt={author}
          fill
          className="rounded-full object-cover"
        />
      </div>
      <div>
        <h4 className="font-semibold dark:text-white">{author}</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">{role}</p>
      </div>
    </div>
    <p className="text-gray-600 dark:text-gray-300 italic">{content}</p>
  </div>
);

const StatCard = ({ value, label }: { value: string; label: string }) => (
  <div className="text-center">
    <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">{value}</div>
    <div className="text-gray-600 dark:text-gray-300">{label}</div>
  </div>
);

export default function Home() {
  const features = [
    {
      icon: MessageSquare,
      title: "Smart Conversations",
      description: "Experience AI-powered chat that understands context and delivers meaningful responses in real-time."
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Get instant responses with our optimized infrastructure and advanced caching system for seamless communication."
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Your conversations are protected with state-of-the-art encryption and security measures that exceed industry standards."
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Work together seamlessly with powerful collaboration tools designed for modern teams."
    },
    {
      icon: Globe,
      title: "Global Access",
      description: "Connect from anywhere with our distributed infrastructure ensuring low-latency worldwide access."
    },
    {
      icon: Star,
      title: "Premium Experience",
      description: "Enjoy a polished, intuitive interface with features that enhance your daily communication."
    }
  ];

  const testimonials = [
    {
      content: "This platform has transformed how our team communicates. The AI features are incredibly intuitive.",
      author: "Sarah Johnson",
      role: "Product Manager at TechCorp",
      avatar: "https://www.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50?s=200"
    },
    {
      content: "The speed and reliability are unmatched. It's become an essential tool for our remote team.",
      author: "Michael Chen",
      role: "CTO at StartupX",
      avatar: "https://www.gravatar.com/avatar/00000000000000000000000000000000?s=200"
    },
    {
      content: "Security was our top concern, and this platform exceeded all our expectations.",
      author: "Emma Davis",
      role: "Security Director at SecureNet",
      avatar: "https://www.gravatar.com/avatar/305e460b479e2e5b48aec07710c08d50?s=200"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
          <div className="absolute top-40 left-40 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000" />
        </div>

        <div className="relative px-4 py-20 mx-auto max-w-7xl sm:px-6 lg:px-8 lg:py-32">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 mb-8 text-sm bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full">
              <span className="px-2 py-1 mr-2 text-xs bg-blue-500 text-white rounded-full">Limited</span>
              One-time Lifetime Access
            </div>
            
            <h1 className="mb-8 text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-6xl lg:text-7xl">
              Welcome to
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-6 leading-tight py-2">
                OHF Partners
              </span>
            </h1>
            
            <p className="max-w-2xl mx-auto mb-12 text-xl text-gray-600 dark:text-gray-300">
              Join the elite community of teams using advanced technology to transform their communication. One-time payment, lifetime access.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link 
                href="/auth" 
                className="group flex items-center px-8 py-3 text-lg font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Get Lifetime Access
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                One-time payment of $1,000
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="relative py-16 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <StatCard value="1,000+" label="Premium Users" />
            <StatCard value="99.9%" label="Uptime" />
            <StatCard value="150+" label="Enterprise Clients" />
            <StatCard value="24/7" label="Priority Support" />
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="relative px-4 py-20 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            Premium Features for Elite Teams
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Everything you need to elevate your team's communication, included in your lifetime access.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="relative py-20 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Loved by Teams Worldwide
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              See what our users have to say about their experience.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Testimonial key={index} {...testimonial} />
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-20">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="relative p-8 overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl">
            <div className="absolute right-0 top-0 -mt-20 -mr-20 w-40 h-40 bg-white rounded-full opacity-10" />
            <div className="relative text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                Join the Elite Communication Platform
              </h2>
              <p className="text-lg text-blue-100 mb-4">
                Transform your team's communication with lifetime access to premium features.
              </p>
              <div className="text-2xl font-bold text-white mb-8">
                $1,000 <span className="text-lg font-normal">one-time payment</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <PaymentButton 
                  className="group flex items-center px-8 py-3 text-lg font-medium text-blue-600 bg-white rounded-lg hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Get Lifetime Access
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </PaymentButton>
                <Link 
                  href="/enterprise" 
                  className="px-8 py-3 text-lg font-medium text-white border-2 border-white/30 rounded-lg hover:bg-white/10 transition-all duration-300"
                >
                  Enterprise Custom Pricing
                </Link>
              </div>
              <p className="mt-4 text-sm text-blue-100/80">
                All sales are final. No refunds will be issued.
              </p>
              <div className="mt-8 border-t border-white/10 pt-8">
                <p className="text-blue-100 mb-4">Or try your luck:</p>
                <RiddleChallenge />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with Legal */}
      <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
              OHF Partners reserves the right to require users to upgrade to an Enterprise License based on internal usage metrics, compliance requirements, and other factors determined at our sole discretion. Enterprise licensing criteria are subject to change without notice.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Legal</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/legal/terms" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/legal/privacy" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/legal/data-policy" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    Data Policy
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Policies</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/legal/ai-policy" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    AI Policy
                  </Link>
                </li>
                <li>
                  <Link href="/legal/no-refund-policy" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    No Refund Policy
                  </Link>
                </li>
                <li>
                  <Link href="/legal/accessibility" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    Accessibility
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Security</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/legal/security" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    Security Measures
                  </Link>
                </li>
                <li>
                  <Link href="/legal/compliance" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    Compliance
                  </Link>
                </li>
                <li>
                  <Link href="/legal/cookie-policy" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Support</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/support/contact" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/support/enterprise" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    Enterprise Sales
                  </Link>
                </li>
                <li>
                  <Link href="/support/status" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    System Status
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
            <div className="text-center text-sm text-gray-400">
              © {new Date().getFullYear()} OHF Partners, a product of Idea Trek LLC. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
