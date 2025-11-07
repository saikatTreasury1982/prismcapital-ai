'use client';

import { Bell, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

export default function NotificationsCard() {
  // Sample notifications - to be replaced with real data later
  const sampleNotifications = [
    {
      id: 1,
      type: 'dividend',
      icon: TrendingUp,
      color: 'text-emerald-400',
      message: 'Dividend received from ABBV',
      amount: '$12.45',
      time: '2 hours ago',
    },
    {
      id: 2,
      type: 'alert',
      icon: AlertCircle,
      color: 'text-orange-400',
      message: 'PM price target reached',
      amount: '+5.2%',
      time: '5 hours ago',
    },
    {
      id: 3,
      type: 'success',
      icon: CheckCircle,
      color: 'text-blue-400',
      message: 'Order executed: CB',
      amount: '29 shares',
      time: '1 day ago',
    },
    {
      id: 4,
      type: 'dividend',
      icon: TrendingUp,
      color: 'text-emerald-400',
      message: 'Upcoming dividend: GILD',
      amount: 'Ex-date: Nov 15',
      time: '2 days ago',
    },
  ];

  return (
    <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-yellow-400" />
            Notifications
          </h3>
          <span className="bg-yellow-400/20 text-yellow-400 text-xs px-2 py-1 rounded-full">
            {sampleNotifications.length}
          </span>
        </div>

        <div className="space-y-3">
          {sampleNotifications.map((notification) => {
            const Icon = notification.icon;
            return (
              <div
                key={notification.id}
                className="bg-white/5 rounded-lg p-3 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-4 h-4 ${notification.color} flex-shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm mb-1">{notification.message}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${notification.color} font-medium`}>
                        {notification.amount}
                      </span>
                      <span className="text-blue-200 text-xs">{notification.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 text-center">
          <button className="text-blue-300 hover:text-white text-sm transition-colors">
            View All Notifications
          </button>
        </div>
      </div>
    </div>
  );
}