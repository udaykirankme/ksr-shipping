export const SHIPMENT_STATUSES = [
  'Dispatched',
  'Picked Up',
  'Shipment Bagged',
  'Shipment Received',
  'In Transit',
  'Out for Delivery',
  'Delivered'
] as const;

export const statusColors: Record<string, string> = {
  'Dispatched': 'bg-slate-50 text-slate-700 ring-slate-600/20',
  'Picked Up': 'bg-blue-50 text-blue-700 ring-blue-600/20',
  'Shipment Bagged': 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
  'Shipment Received': 'bg-teal-50 text-teal-700 ring-teal-600/20',
  'In Transit': 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  'Out for Delivery': 'bg-orange-50 text-orange-700 ring-orange-600/20',
  'Delivered': 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
};

export const getStatusColor = (status: string) => {
  return statusColors[status] || 'bg-gray-50 text-gray-600 ring-gray-500/10';
};
