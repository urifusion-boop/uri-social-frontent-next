'use client';

import DashboardLayout from '@/src/components/app/atoms/DashboardLayout';
import { useRouter } from 'next/navigation';
import { Settings, Link as LinkIcon, Share2, Palette } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();

  const settingsSections = [
    {
      title: 'Social Accounts',
      description: 'Connect and manage your social media accounts',
      icon: Share2,
      href: '/settings/social-accounts',
      color: '#CD1B78',
    },
    {
      title: 'Connections',
      description: 'Manage WhatsApp and other platform connections',
      icon: LinkIcon,
      href: '/settings/connections',
      color: '#CD1B78',
    },
    {
      title: 'Visual Style',
      description: 'Choose up to 3 visual styles Uri rotates through when creating your content',
      icon: Palette,
      href: '/settings/visual-style',
      color: '#CD1B78',
    },
  ];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Settings className="w-8 h-8 text-[#CD1B78]" />
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            </div>
            <p className="text-gray-600">Manage your account settings and preferences</p>
          </div>

          {/* Settings Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {settingsSections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.href}
                  onClick={() => router.push(section.href)}
                  className="bg-white rounded-xl p-6 border border-gray-200 hover:border-[#CD1B78] hover:shadow-lg transition-all duration-200 text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-pink-50 group-hover:bg-pink-100 transition-colors">
                      <Icon className="w-6 h-6" style={{ color: section.color }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{section.title}</h3>
                      <p className="text-sm text-gray-600">{section.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
