import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SettingsService } from "@/lib/settings-service";
import { toast } from "sonner";
import { usePushNotifications } from "@/lib/use-push-notifications";

export default function NotificationsTab() {
  const { isSupported, permission, subscription, subscribe, unsubscribe } = usePushNotifications();
  const [localSettings, setLocalSettings] = useState({
    notifyQuoteRequest: true,
    notifyContactMessage: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const data = await SettingsService.getSettings();
      setLocalSettings({
        notifyQuoteRequest: data.notify_quote_request !== 'false',
        notifyContactMessage: data.notify_contact_message !== 'false',
      });
    } catch {
      toast.error("Unable to load notification settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await SettingsService.updateSettings({
        notify_quote_request: localSettings.notifyQuoteRequest.toString(),
        notify_contact_message: localSettings.notifyContactMessage.toString(),
      });
      toast.success("Notification preferences saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Notification Settings</h2>
        <p className="text-sm text-gray-700">Manage which events trigger system notifications.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="notifyQuoteRequest"
                type="checkbox"
                checked={localSettings.notifyQuoteRequest}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, notifyQuoteRequest: e.target.checked }))}
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="notifyQuoteRequest" className="font-medium text-gray-700">Quote Request Notifications</label>
              <p className="text-gray-700">Receive a notification when a new quote request is submitted.</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="notifyContactMessage"
                type="checkbox"
                checked={localSettings.notifyContactMessage}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, notifyContactMessage: e.target.checked }))}
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="notifyContactMessage" className="font-medium text-gray-700">Contact Message Notifications</label>
              <p className="text-gray-700">Receive a notification when a new contact message is received.</p>
            </div>
          </div>
        </div>

        <div>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </form>

      {/* Push Notifications Section */}
      <div className="pt-8 border-t border-gray-200">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Web Push Notifications</h2>
        <p className="text-sm text-gray-700 mb-4">
          Enable browser push notifications to get real-time alerts even when the dashboard is closed.
        </p>

        {!isSupported ? (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            Push notifications are not supported in this browser.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-gray-700">Current Status:</span>
              {subscription ? (
                <span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">Enabled & Subscribed</span>
              ) : permission === 'denied' ? (
                <span className="text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded">Blocked by Browser</span>
              ) : (
                <span className="text-gray-600 font-semibold bg-gray-100 px-2 py-0.5 rounded">Not Enabled</span>
              )}
            </div>

            <div className="flex gap-3">
              {!subscription && permission !== 'denied' && (
                <Button onClick={subscribe} type="button" className="bg-orange-600 hover:bg-orange-700">
                  Enable Push Notifications
                </Button>
              )}
              {subscription && (
                <Button onClick={unsubscribe} type="button" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                  Disable Push Notifications
                </Button>
              )}
              {permission === 'denied' && (
                <p className="text-sm text-gray-500">
                  You have blocked notifications in your browser settings. Please allow them to enable this feature.
                </p>
              )}
            </div>
            
            {/* Debug utility to force re-sync if subscription is stale */}
            {subscription && (
              <p className="text-xs text-gray-500 mt-2">
                Not receiving notifications? Try disabling and re-enabling them to sync your device.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
