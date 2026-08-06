import { useState, useEffect } from "react";
import { ServiceThroughApi, ServiceItem } from "@/lib/services-api";
import { toast } from "sonner";
import { Plus, Edit, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ServiceThroughTab() {
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<ServiceItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ name: "", is_enabled: true });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const data = await ServiceThroughApi.getItems();
      setItems(data.sort((a, b) => a.display_order - b.display_order));
    } catch (error: unknown) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, name: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.name.trim() === '') {
      toast.error("Service Through name is required.");
      return;
    }
    try {
      if (isEditing) {
        await ServiceThroughApi.updateItem(isEditing.id, formData);
        toast.success("Transport method updated");
      } else {
        await ServiceThroughApi.createItem({ ...formData, display_order: items.length });
        toast.success("Transport method created");
      }
      setIsEditing(null);
      setIsCreating(false);
      setFormData({ name: "", is_enabled: true });
      loadData();
    } catch (error: unknown) {
      toast.error((error as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this transport method?")) return;
    try {
      await ServiceThroughApi.deleteItem(id);
      toast.success("Transport method deleted");
      loadData();
    } catch (error: unknown) {
      toast.error((error as Error).message);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === items.length - 1)) return;
    
    const newItems = [...items];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    const temp = newItems[index];
    newItems[index] = newItems[swapIndex];
    newItems[swapIndex] = temp;
    
    const updates = newItems.map((item, idx) => ({ id: item.id, display_order: idx }));
    setItems(newItems.map((item, idx) => ({ ...item, display_order: idx })));

    try {
      await ServiceThroughApi.reorderItems(updates);
    } catch (error: unknown) {
      toast.error("Failed to save new order");
      loadData(); // revert
    }
  };

  const handleToggleEnable = async (item: ServiceItem) => {
    try {
      await ServiceThroughApi.updateItem(item.id, { is_enabled: !item.is_enabled });
      setItems(items.map(i => i.id === item.id ? { ...i, is_enabled: !i.is_enabled } : i));
    } catch (error: unknown) {
      toast.error((error as Error).message);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Service Through</h2>
          <p className="text-sm text-gray-700">Manage transport methods (e.g. Air, Surface, Sea) used across the platform.</p>
        </div>
        {!isCreating && !isEditing && (
          <Button onClick={() => { setIsCreating(true); setFormData({ name: "", is_enabled: true }); }}>
            <Plus className="w-4 h-4 mr-2" /> Add Method
          </Button>
        )}
      </div>

      {(isCreating || isEditing) && (
        <form onSubmit={handleSave} className="bg-gray-50 p-4 rounded-lg space-y-4 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input 
                required 
                type="text" 
                value={formData.name} 
                onChange={handleNameChange}
                placeholder="e.g. Air"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400 disabled:opacity-50"
              />
            </div>
            <div className="md:col-span-2 flex items-center">
              <input 
                type="checkbox" 
                id="is_enabled" 
                checked={formData.is_enabled} 
                onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_enabled" className="ml-2 block text-sm text-gray-900">
                Enabled
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { setIsCreating(false); setIsEditing(null); }}>Cancel</Button>
            <Button type="submit">Save Method</Button>
          </div>
        </form>
      )}

      {!isCreating && !isEditing && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name / Slug</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-50"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === items.length - 1}
                        className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-50"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    <div className="text-sm text-gray-700">{item.slug}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      onClick={() => handleToggleEnable(item)}
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.is_enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.is_enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => { setIsEditing(item); setFormData({ name: item.name, is_enabled: item.is_enabled }); }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-700">No transport methods found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
