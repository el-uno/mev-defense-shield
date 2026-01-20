import React, { useState, useEffect } from 'react';

export const Settings = () => {
  const [settings, setSettings] = useState({
    mevProtectionEnabled: true,
    autoJitoRouting: true,
    alertsEnabled: true
  });

  useEffect(() => {
    chrome.storage.local.get(['mevProtectionEnabled', 'autoJitoRouting', 'alertsEnabled'], (data) => {
      setSettings(data);
    });
  }, []);

  const updateSetting = (key, value) => {
    chrome.storage.local.set({ [key]: value });
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Extension Settings</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">MEV Protection</h3>
            <p className="text-sm text-gray-400">Enable MEV monitoring on DEX sites</p>
          </div>
          <button
            onClick={() => updateSetting('mevProtectionEnabled', !settings.mevProtectionEnabled)}
            className={`w-12 h-6 rounded-full ${settings.mevProtectionEnabled ? 'bg-green-500' : 'bg-gray-600'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full transition-all ${settings.mevProtectionEnabled ? 'ml-7' : 'ml-1'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Auto Jito Routing</h3>
            <p className="text-sm text-gray-400">Automatically use Jito for high-risk trades</p>
          </div>
          <button
            onClick={() => updateSetting('autoJitoRouting', !settings.autoJitoRouting)}
            className={`w-12 h-6 rounded-full ${settings.autoJitoRouting ? 'bg-green-500' : 'bg-gray-600'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full transition-all ${settings.autoJitoRouting ? 'ml-7' : 'ml-1'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Trade Alerts</h3>
            <p className="text-sm text-gray-400">Show notifications for detected trades</p>
          </div>
          <button
            onClick={() => updateSetting('alertsEnabled', !settings.alertsEnabled)}
            className={`w-12 h-6 rounded-full ${settings.alertsEnabled ? 'bg-green-500' : 'bg-gray-600'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full transition-all ${settings.alertsEnabled ? 'ml-7' : 'ml-1'}`} />
          </button>
        </div>
      </div>
    </div>
  );
};