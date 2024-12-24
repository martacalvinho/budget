import React from 'react';
import { Wallet, Shield, Clock, ArrowRight } from 'lucide-react';

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const Feature: React.FC<FeatureProps> = ({ icon, title, description }) => (
  <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-md">
    <div className="p-3 bg-blue-50 rounded-full mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const LandingPage: React.FC<{ onGetStarted: () => void }> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Smart Finance Management
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Take control of your finances with our comprehensive tracking and analytics platform.
            Monitor expenses, set budgets, and achieve your financial goals.
          </p>
          <button
            onClick={onGetStarted}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Feature
            icon={<Wallet className="h-8 w-8 text-blue-600" />}
            title="Expense Tracking"
            description="Track all your expenses in one place with detailed categorization and analysis."
          />
          <Feature
            icon={<Shield className="h-8 w-8 text-blue-600" />}
            title="Secure & Private"
            description="Your financial data is protected with enterprise-grade security and encryption."
          />
          <Feature
            icon={<Clock className="h-8 w-8 text-blue-600" />}
            title="Real-time Updates"
            description="Get instant insights into your spending patterns and financial health."
          />
        </div>
      </div>

      {/* Social Proof Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Trusted by thousands of users worldwide
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {['10K+', '98%', '24/7', '150+'].map((stat, index) => (
                <div key={index} className="flex flex-col items-center">
                  <span className="text-3xl font-bold text-blue-600">{stat}</span>
                  <span className="text-gray-600 mt-2">
                    {index === 0 && 'Active Users'}
                    {index === 1 && 'Satisfaction'}
                    {index === 2 && 'Support'}
                    {index === 3 && 'Countries'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;