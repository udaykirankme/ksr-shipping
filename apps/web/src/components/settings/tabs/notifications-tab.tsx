import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SettingsService } from "@/lib/settings-service";
import { toast } from "sonner";

export default function NotificationsTab() {
  const [localSettings, setLocalSettings] = useState({
    notifyQuoteRequest: true,
    notifyContactMessage: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await SettingsService.getSettings();
      setLocalSettings({
        notifyQuoteRequest: data.notify_quote_request !== 'false',
        notifyContactMessage: data.notify_contact_message !== 'false',
      });
    } catch (error) {
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
    } catch (error) {
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
    </div>
  );
}
