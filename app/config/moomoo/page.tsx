'use client';

import { useState, useEffect } from 'react';
import GlassButton from '@/app/lib/ui/GlassButton';

export default function MoomooSettingsPage() {
  const [config, setConfig] = useState({
    api_key: '',
    custom_host: '',
    custom_port: '',
    enable_ssl: false,
  });
  
  const [testing, setTesting] = useState(false);

  const handleSave = async () => {
    const response = await fetch('/api/system-api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_code: 'MOOMOO_OPEND',
        api_key: config.api_key,
        key_name: 'My Moomoo Key',
        // Only send custom fields if specified
        ...(config.custom_host && { custom_host: config.custom_host }),
        ...(config.custom_port && { custom_port: parseInt(config.custom_port) }),
        enable_ssl: config.enable_ssl ? 1 : 0,
      }),
    });

    if (response.ok) {
      alert('✅ Moomoo configuration saved!');
    } else {
      alert('❌ Failed to save configuration');
    }
  };

  const handleTest = async () => {
    setTesting(true);
    // TODO: Add test connection endpoint
    setTesting(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Moomoo OpenD Settings</h1>

      <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 border border-white/20 space-y-4">
        
        {/* WebSocket Key */}
        <div>
          <label className="block text-blue-200 text-sm mb-2">
            WebSocket Auth Key *
          </label>
          <input
            type="text"
            value={config.api_key}
            onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
            placeholder="pk_..."
            className="funding-input w-full rounded-xl px-4 py-2"
          />
          <p className="text-xs text-blue-300 mt-1">
            Found in Moomoo OpenD → API Settings → WebSocket Auth
          </p>
        </div>

        {/* Advanced Settings */}
        <details className="pt-4">
          <summary className="text-blue-200 cursor-pointer font-medium">
            Advanced: Custom Connection (Optional)
          </summary>
          
          <div className="mt-4 space-y-4 pl-4 border-l-2 border-blue-500/30">
            
            {/* Custom Host */}
            <div>
              <label className="block text-blue-200 text-sm mb-2">
                Custom Host
              </label>
              <input
                type="text"
                value={config.custom_host}
                onChange={(e) => setConfig({ ...config, custom_host: e.target.value })}
                placeholder="Leave empty for 127.0.0.1"
                className="funding-input w-full rounded-xl px-4 py-2"
              />
              <p className="text-xs text-blue-300 mt-1">
                Only needed if OpenD is on a different computer
              </p>
            </div>

            {/* Custom Port */}
            <div>
              <label className="block text-blue-200 text-sm mb-2">
                Custom Port
              </label>
              <input
                type="number"
                value={config.custom_port}
                onChange={(e) => setConfig({ ...config, custom_port: e.target.value })}
                placeholder="33333"
                className="funding-input w-full rounded-xl px-4 py-2"
              />
              <p className="text-xs text-blue-300 mt-1">
                Default: 33333
              </p>
            </div>

            {/* Enable SSL */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="enable_ssl"
                checked={config.enable_ssl}
                onChange={(e) => setConfig({ ...config, enable_ssl: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="enable_ssl" className="text-blue-200 text-sm">
                Enable SSL
              </label>
            </div>
          </div>
        </details>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <GlassButton
            onClick={handleTest}
            disabled={testing || !config.api_key}
            variant="secondary"
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </GlassButton>
          
          <GlassButton
            onClick={handleSave}
            disabled={!config.api_key}
            variant="primary"
          >
            Save Configuration
          </GlassButton>
        </div>
      </div>

      {/* User Guide */}
      <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 border border-white/20">
        <h2 className="text-lg font-semibold text-white mb-3">Setup Guide</h2>
        <ol className="text-blue-200 text-sm space-y-2 list-decimal list-inside">
          <li>Install and open Moomoo OpenD on your computer</li>
          <li>Go to OpenD Settings → API Settings</li>
          <li>Copy the WebSocket Auth Key</li>
          <li>Paste it in the field above</li>
          <li>Click "Test Connection" to verify</li>
          <li>Click "Save Configuration"</li>
        </ol>
        
        <div className="mt-4 p-3 bg-blue-500/20 rounded-lg">
          <p className="text-xs text-blue-200">
            ℹ️ <strong>Note:</strong> Moomoo OpenD must be running on this computer (or accessible on your local network) for sync to work. The app connects directly to your OpenD instance.
          </p>
        </div>
      </div>
    </div>
  );
}