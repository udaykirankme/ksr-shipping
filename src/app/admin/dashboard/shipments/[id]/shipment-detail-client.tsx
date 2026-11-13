"use client";

import { isCancelledOrReturnedStatus } from '@/lib/courier/normalization';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { shipmentService } from '@/lib/shipment-service';
import { formatDateTime, formatCurrency, formatDateToYYYYMMDD, formatIndianNumberString } from '@/lib/format';
import {
  getCurrentBusinessDateTimeInput,
  toBusinessDateTimeFields,
  toBusinessTimeInput,
  toBusinessDateInput,
} from '@/lib/datetime';
import { ArrowLeft, Save, MapPin, Clock, Copy, ArchiveRestore, Trash2, Truck, Plane, CheckCircle2, RefreshCw, Share2, Edit3, RotateCcw, X, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PremiumSelect } from "@/components/ui/PremiumSelect";
import { PremiumDatePicker } from "@/components/ui/PremiumDatePicker";
import { PremiumTimePicker } from "@/components/ui/PremiumTimePicker";
import { ServicesApi, ServiceThroughApi, ServiceItem } from '@/lib/services-api';
import {
  buildStatusUpdateShareMessage,
  openWhatsAppShare,
} from '@/lib/whatsapp-share';
import { useConfirm } from "@/components/ui/confirm-modal";

const STATUS_WORKFLOW = [
  'Shipment Created',
  'Picked Up',
  'Shipment Bagged',
  'Shipment Received',
  'Dispatched',
  'In Transit',
  'At Hub',
  'Out For Delivery',
  'Delivered',
  'Returned',
  'Cancelled'
];

function getOfficialTrackingInfo(service: string, trackingId: string) {
  if (!service || !trackingId) return null;
  const s = service.toLowerCase();
  
  if (s.includes('dhl')) {
    return { name: 'DHL', url: `https://www.dhl.com/in-en/home/tracking.html?tracking-id=${trackingId}&submit=1` };
  }
  if (s.includes('ups')) {
    return { name: 'UPS', url: `https://www.ups.com/track?loc=en_IN&requester=ST/&tracknum=${trackingId}` };
  }
  if (s.includes('fedex')) {
    return { name: 'FedEx', url: `https://www.fedex.com/en-in/tracking.html?trackingnumber=${trackingId}` };
  }
  if (s.includes('delhivery')) {
    return { name: 'Delhivery', url: `https://www.delhivery.com/tracking?id=${trackingId}` };
  }
  if (s.includes('dtdc')) {
    return { name: 'DTDC', url: `https://www.dtdc.com/track-your-shipment/?trkNo=${trackingId}` };
  }
  if (s.includes('united')) {
    return { name: 'United', url: `https://unitedexpress.in/track` };
  }
  
  return null;
}

function getCurrentOccurredAt(): string {
  return getCurrentBusinessDateTimeInput();
}

function getNextStatusUpdate(currentStatus: string) {
  if (!currentStatus) return { status: '', occurred_at: '' };
  const normalized = currentStatus.trim().toLowerCase();
  const currentIndex = STATUS_WORKFLOW.findIndex(s => s.toLowerCase() === normalized);
  const deliveredIndex = STATUS_WORKFLOW.findIndex(s => s.toLowerCase() === 'delivered');
  
  if (currentIndex > -1 && currentIndex < deliveredIndex) {
    return {
      status: STATUS_WORKFLOW[currentIndex + 1],
      occurred_at: '',
    };
  }
  return { status: '', occurred_at: '' };
}

type SavedStatusShare = {
  status: string;
  location: string;
  occurredAt: string;
  note?: string;
};

function isStatusFormComplete(update: {
  status: string;
  location: string;
  occurred_at: string;
}): boolean {
  if (!update.status?.trim() || !update.location?.trim()) return false;
  if (!update.occurred_at?.includes('T')) return false;
  const [datePart, timePart] = update.occurred_at.split('T');
  return Boolean(datePart && timePart?.substring(0, 5));
}

function getShareableStatus(shipment: {
  history?: any[];
  current_location?: string | null;
}): SavedStatusShare | null {
  const latest = shipment.history?.[0];
  if (!latest?.status || !latest?.occurred_at) return null;

  const location =
    latest.location?.trim() ||
    shipment.current_location?.trim() ||
    '';

  const occurredAt =
    typeof latest.occurred_at === 'string'
      ? latest.occurred_at
      : latest.occurred_at.toISOString();

  const { date, time } = toBusinessDateTimeFields(occurredAt);

  return {
    status: latest.status,
    location,
    occurredAt: `${date}T${time}:00`,
    note: latest.note || undefined,
  };
}

export function ShipmentDetailClient({ shipmentId, initialData }: { shipmentId: string, initialData: any }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [shipment, setShipment] = useState(initialData);
  const [formData, setFormData] = useState<any>({ 
    ...initialData,
    miscellaneous_charges: (initialData.miscellaneous_charges && Number(initialData.miscellaneous_charges) > 0) ? initialData.miscellaneous_charges : '',
    estimated_delivery: initialData.estimated_delivery ? toBusinessDateInput(initialData.estimated_delivery) : '',
    booked_time: initialData.booked_date ? toBusinessTimeInput(initialData.booked_date) : ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [syncing, setSyncing] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingFinancials, setIsEditingFinancials] = useState(false);
  const [savingFinancials, setSavingFinancials] = useState(false);
  
  // Status Update state
  const [statusUpdate, setStatusUpdate] = useState(() => ({
    status: getNextStatusUpdate(initialData.current_status).status,
    location: '',
    note: '',
    occurred_at: '',
  }));
  const [dbServices, setDbServices] = useState<ServiceItem[]>([]);
  const [dbServiceThrough, setDbServiceThrough] = useState<ServiceItem[]>([]);

  // Edit Status modal state
  const [editingHistoryItem, setEditingHistoryItem] = useState<any | null>(null);
  const [editStatusForm, setEditStatusForm] = useState({
    status: '',
    location: '',
    date: '',
    time: '',
    note: ''
  });
  const [editLoading, setEditLoading] = useState(false);

  const isInitialSame = Boolean(
    shipment.sender_name &&
    shipment.receiver_name &&
    shipment.sender_name.trim().toLowerCase() === shipment.receiver_name.trim().toLowerCase() &&
    shipment.sender_phone &&
    shipment.receiver_phone &&
    shipment.sender_phone.trim() === shipment.receiver_phone.trim()
  );
  const [sameAsSender, setSameAsSender] = useState(isInitialSame);
  const isDelivered = shipment.current_status === 'Delivered';
  const shareableStatus = getShareableStatus(shipment);
  
  useEffect(() => {
    const nextUpdate = getNextStatusUpdate(shipment.current_status);
    setStatusUpdate((prev) => ({
      ...prev,
      status: nextUpdate.status,
      occurred_at: nextUpdate.occurred_at,
    }));
  }, [shipment.current_status]);

  // Layout refs and dynamic height calculation for Timeline card
  const leftColRef = useRef<HTMLDivElement>(null);
  const updateStatusRef = useRef<HTMLDivElement>(null);
  const timelineCardRef = useRef<HTMLDivElement>(null);
  const [timelineHeight, setTimelineHeight] = useState<number | null>(null);

  useEffect(() => {
    const calculateTimelineHeight = () => {
      if (typeof window === 'undefined') return;
      // Below 1280px (xl breakpoint), cards stack into single column
      if (window.innerWidth < 1280) {
        setTimelineHeight(null);
        return;
      }

      if (!leftColRef.current) return;

      const leftHeight = leftColRef.current.offsetHeight || 
        Array.from(leftColRef.current.children).reduce((acc, el) => acc + (el as HTMLElement).offsetHeight, 0);
      
      const updateHeight = updateStatusRef.current ? updateStatusRef.current.offsetHeight : 0;
      const gap = updateHeight > 0 ? 24 : 0; // gap-6 (1.5rem = 24px)
      const available = leftHeight - updateHeight - gap;

      if (available > 200) {
        setTimelineHeight(Math.round(available));
      }
    };

    calculateTimelineHeight();
    const animId = requestAnimationFrame(calculateTimelineHeight);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        calculateTimelineHeight();
      });

      if (leftColRef.current) observer.observe(leftColRef.current);
      if (updateStatusRef.current) observer.observe(updateStatusRef.current);
    }

    window.addEventListener('resize', calculateTimelineHeight);

    return () => {
      cancelAnimationFrame(animId);
      if (observer) observer.disconnect();
      window.removeEventListener('resize', calculateTimelineHeight);
    };
  }, [shipment, isEditing, isEditingFinancials, isDelivered, shareableStatus]);

    const handleMoneyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const raw = value.replace(/,/g, '');
    if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
      let clean = raw;
      if (clean.length > 1 && clean.startsWith('0') && !clean.startsWith('0.')) {
        clean = clean.replace(/^0+/, '');
        if (clean === '') clean = '0';
      }
      setFormData((prev: any) => ({ ...prev, [name]: clean }));
    }
  };

    const handleSameAsSenderChange = (checked: boolean) => {
    if (!isEditing || isDelivered) return;
    setSameAsSender(checked);
    if (checked) {
      setFormData((prev: any) => ({
        ...prev,
        receiver_name: prev.sender_name || '',
        receiver_phone: prev.sender_phone || '',
        receiver_email: prev.sender_email || prev.receiver_email || '',
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name } = e.target;
    let value = e.target.value;
    if (e.target.type === 'number') {
      if (value.length > 1 && value.startsWith('0') && !value.startsWith('0.')) {
        value = value.replace(/^0+/, '');
        if (value === '') value = '0';
      }
    }
    setFormData((prev: any) => {
      const updated = { ...prev, [name]: value };
      if (sameAsSender) {
        if (name === 'sender_name') updated.receiver_name = value;
        if (name === 'sender_phone') updated.receiver_phone = value;
        if (name === 'sender_email') updated.receiver_email = value;
      }
      return updated;
    });

    if (sameAsSender && (name === 'receiver_name' || name === 'receiver_phone' || name === 'receiver_email')) {
      setSameAsSender(false);
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setStatusUpdate((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const getSavedStatusShareMessage = (recipientName?: string) => {
    if (!shareableStatus) return '';
    return buildStatusUpdateShareMessage({
      trackingId: shipment.tracking_id,
      status: shareableStatus.status,
      location: shareableStatus.location,
      occurredAt: shareableStatus.occurredAt,
      note: shareableStatus.note,
      recipientName,
    });
  };

  const handleShareStatusToSender = () => {
    if (!shareableStatus) return;
    openWhatsAppShare(formData.sender_phone, getSavedStatusShareMessage(formData.sender_name));
  };

  const handleShareStatusToReceiver = () => {
    if (!shareableStatus) return;
    openWhatsAppShare(formData.receiver_phone, getSavedStatusShareMessage(formData.receiver_name));
  };

  const canSubmitStatusUpdate = isStatusFormComplete(statusUpdate);
  const canShareStatusUpdate = shareableStatus !== null;
  const normalizedCourierService = (shipment.service || '').toLowerCase().replace(/[\s\-_]+/g, '');
  const canSyncCourierTracking = normalizedCourierService === 'delhiveryb2b' || normalizedCourierService === 'delhiveryb2c' || normalizedCourierService === 'delhivery';

  const notifyShipmentsChanged = () => {
    try {
      sessionStorage.setItem('ksr_shipments_need_refresh', 'true');
      window.dispatchEvent(new CustomEvent('ksr-shipment-updated'));
    } catch {}
    router.refresh();
  };

  const handleSaveFinancials = async (e?: React.MouseEvent | React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');

    const parseMoney = (val: any) => {
      if (val === undefined || val === null || val === '') return 0;
      const clean = String(val).replace(/,/g, '').trim();
      const num = parseFloat(clean);
      return isNaN(num) ? 0 : num;
    };

    const receivedNum = parseMoney(formData.received_amount);
    const paidNum = parseMoney(formData.paid_amount);
    const miscNum = parseMoney(formData.miscellaneous_charges);

    if (receivedNum < 0 || paidNum < 0 || miscNum < 0) {
      setError('Financial amounts cannot be negative.');
      return;
    }

    setSavingFinancials(true);
    try {
      const res = await shipmentService.updateFinancials(shipmentId, {
        received_amount: receivedNum,
        paid_amount: paidNum,
        miscellaneous_charges: miscNum,
        version: shipment.version
      }) as any;

      const updated = res.data || res;

      setShipment((prev: any) => ({
        ...prev,
        ...updated,
        history: updated.history || prev.history || []
      }));
      setFormData((prev: any) => ({
        ...prev,
        received_amount: updated.received_amount,
        paid_amount: updated.paid_amount,
        miscellaneous_charges: (updated.miscellaneous_charges && Number(updated.miscellaneous_charges) > 0) ? updated.miscellaneous_charges : '',
        profit: updated.profit,
        version: updated.version,
      }));
      setIsEditingFinancials(false);
      setSuccess('Financial details and profit updated successfully');
      notifyShipmentsChanged();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to update financials');
    } finally {
      setSavingFinancials(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.estimated_delivery) {
      setError('Estimated Delivery Date is required');
      return;
    }

    setLoading(true);

    try {
      const { booked_date, booked_time, ...submitData } = formData as any;
      let finalBookedDate = shipment.booked_date;
      if (booked_date && booked_time) {
        const dateStr = booked_date.split('T')[0];
        finalBookedDate = new Date(`${dateStr}T${booked_time}:00`).toISOString();
      }

      const updated = await shipmentService.updateShipment(shipmentId, {
        ...submitData,
        booked_date: finalBookedDate,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        num_packages: parseInt(formData.num_packages) || 1,
        paid_amount: parseFloat(formData.paid_amount) || 0,
        received_amount: parseFloat(formData.received_amount) || 0,
        miscellaneous_charges: formData.miscellaneous_charges ? (parseFloat(formData.miscellaneous_charges) || 0) : 0,
        version: shipment.version // OCC
      }) as any;
      
      setShipment((prev: any) => ({
        ...prev,
        ...updated,
        history: updated.history || prev.history || []
      }));
      setFormData((prev: any) => ({
        ...prev,
        ...updated,
        booked_time: updated.booked_date ? toBusinessTimeInput(updated.booked_date) : prev.booked_time
      }));
      setIsEditing(false);
      setSuccess('Shipment details updated successfully');
      notifyShipmentsChanged();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to update shipment');
      if ((err as Error).message?.includes('refresh')) {
        // Automatically fetch latest if OCC conflict? We can just ask them to refresh manually or we can trigger it.
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitStatusUpdate) {
      setError('Please fill in status, location, update date, and update time.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    const submittedUpdate = { ...statusUpdate };

    try {
      const res = await shipmentService.updateStatus(shipmentId, {
        ...submittedUpdate,
        version: shipment.version // OCC
      });
      
      const resData = res as any;
      const isNewCancelledOrReturned = isCancelledOrReturnedStatus(submittedUpdate.status);
      const newShipment = {
        ...resData.shipment,
        profit: isNewCancelledOrReturned ? 0 : resData.shipment.profit,
        history: [resData.history, ...(shipment.history || [])]
      };
      setShipment(newShipment);
      setFormData((prev: any) => ({ ...prev, ...newShipment }));
      setSuccess('Status updated successfully. You can now share this update with the sender or receiver.');
      notifyShipmentsChanged();
      
      // Reset status input with next status and current date/time
      const nextUpdate = getNextStatusUpdate(resData.shipment.current_status);
      setStatusUpdate({
        status: nextUpdate.status,
        location: '',
        note: '',
        occurred_at: nextUpdate.occurred_at,
      });
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleUndoStatus = async () => {
    if (!shipment.history || shipment.history.length <= 1) {
      setError('Cannot undo the initial shipment creation status.');
      return;
    }

    const latest = shipment.history[0];
    const previous = shipment.history[1];
    const confirmMessage = `Are you sure you want to undo the status update "${latest.status}"? The shipment status will revert to "${previous.status}".`;
    
    if (!(await confirm({
      title: 'Undo Status Update',
      message: confirmMessage,
      confirmText: 'Undo Update',
      cancelText: 'Cancel'
    }))) {
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await shipmentService.undoStatus(shipmentId) as any;
      const updatedShipment = res.data || res;
      setShipment(updatedShipment);
      setFormData((prev: any) => ({
        ...prev,
        ...updatedShipment,
        estimated_delivery: updatedShipment.estimated_delivery ? toBusinessDateInput(updatedShipment.estimated_delivery) : prev.estimated_delivery,
        booked_time: updatedShipment.booked_date ? toBusinessTimeInput(updatedShipment.booked_date) : prev.booked_time
      }));
      setSuccess(`Status update undone. Shipment reverted to "${updatedShipment.current_status}".`);
      notifyShipmentsChanged();

      const nextUpdate = getNextStatusUpdate(updatedShipment.current_status);
      setStatusUpdate({
        status: nextUpdate.status,
        location: '',
        note: '',
        occurred_at: nextUpdate.occurred_at,
      });
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to undo status update');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStatus = async (historyId: string, statusName: string) => {
    if (!shipment.history || shipment.history.length <= 1) {
      setError('Cannot delete the initial shipment creation status.');
      return;
    }

    if (!(await confirm({
      title: 'Delete Status Entry',
      message: `Are you sure you want to delete the status entry "${statusName}" from the timeline?`,
      confirmText: 'Delete Entry',
      cancelText: 'Cancel'
    }))) {
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await shipmentService.deleteStatusHistory(shipmentId, historyId) as any;
      const updatedShipment = res.data || res;
      setShipment(updatedShipment);
      setFormData((prev: any) => ({
        ...prev,
        ...updatedShipment,
        estimated_delivery: updatedShipment.estimated_delivery ? toBusinessDateInput(updatedShipment.estimated_delivery) : prev.estimated_delivery,
        booked_time: updatedShipment.booked_date ? toBusinessTimeInput(updatedShipment.booked_date) : prev.booked_time
      }));
      setSuccess(`Status entry "${statusName}" deleted successfully.`);
      notifyShipmentsChanged();

      const nextUpdate = getNextStatusUpdate(updatedShipment.current_status);
      setStatusUpdate({
        status: nextUpdate.status,
        location: '',
        note: '',
        occurred_at: nextUpdate.occurred_at,
      });
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to delete status entry');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEditStatus = (event: any) => {
    const occurredAt = typeof event.occurred_at === 'string' ? event.occurred_at : new Date(event.occurred_at).toISOString();
    const { date, time } = toBusinessDateTimeFields(occurredAt);
    setEditStatusForm({
      status: event.status || '',
      location: event.location || '',
      date,
      time,
      note: event.note || ''
    });
    setEditingHistoryItem(event);
  };

  const handleSaveEditStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHistoryItem) return;

    if (!editStatusForm.status?.trim() || !editStatusForm.location?.trim() || !editStatusForm.date || !editStatusForm.time) {
      setError('Please fill in status, location, date, and time.');
      return;
    }

    setError('');
    setSuccess('');
    setEditLoading(true);

    try {
      const occurred_at = `${editStatusForm.date}T${editStatusForm.time}:00`;
      const res = await shipmentService.editStatus(shipmentId, editingHistoryItem.id, {
        status: editStatusForm.status,
        location: editStatusForm.location,
        occurred_at,
        note: editStatusForm.note,
        version: shipment.version
      }) as any;

      const updatedShipment = res.data || res;
      setShipment(updatedShipment);
      setFormData((prev: any) => ({
        ...prev,
        ...updatedShipment,
        estimated_delivery: updatedShipment.estimated_delivery ? toBusinessDateInput(updatedShipment.estimated_delivery) : prev.estimated_delivery,
        booked_time: updatedShipment.booked_date ? toBusinessTimeInput(updatedShipment.booked_date) : prev.booked_time
      }));
      setSuccess('Status entry updated successfully.');
      notifyShipmentsChanged();
      setEditingHistoryItem(null);

      const nextUpdate = getNextStatusUpdate(updatedShipment.current_status);
      setStatusUpdate({
        status: nextUpdate.status,
        location: '',
        note: '',
        occurred_at: nextUpdate.occurred_at,
      });
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to edit status');
    } finally {
      setEditLoading(false);
    }
  };

  const handleCustomerUpdateSave = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await shipmentService.updateCustomerUpdate(shipmentId, {
        customer_update: formData.customer_update,
        version: shipment.version
      });
      const resData = res as any;
      setShipment((prev: any) => ({
        ...prev,
        ...resData,
        history: resData.history || prev.history || []
      }));
      setFormData((prev: any) => ({ ...prev, ...resData }));
      setSuccess('Customer update saved successfully');
      notifyShipmentsChanged();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to save customer update');
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveToggle = async () => {
    if (!(await confirm(`Are you sure you want to ${shipment.is_active ? 'archive' : 'unarchive'} this shipment?`))) return;
    
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const updated = await shipmentService.archiveShipment(shipmentId, !shipment.is_active);
      const updatedData = updated as any;
      setShipment((prev: any) => ({ ...prev, is_active: updatedData.is_active }));
      setSuccess(`Shipment ${updatedData.is_active ? 'unarchived' : 'archived'} successfully`);
      notifyShipmentsChanged();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to archive shipment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!(await confirm("Are you sure you want to permanently delete this shipment? This action cannot be undone."))) return;
    try {
      setLoading(true);
      await shipmentService.deleteShipment(shipmentId);
      router.push('/admin/dashboard/shipments');
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to delete shipment');
      setLoading(false);
    }
  };

  const refreshData = async (preserveSuccessMsg: boolean | React.MouseEvent = false) => {
    const shouldPreserve = preserveSuccessMsg === true;
    try {
      if (!shouldPreserve) setError('');
      setLoading(true);
      const data = await shipmentService.getShipment(shipmentId);
      setShipment(data);
      const dataToSpread = data as any;
      setFormData({
        ...dataToSpread,
        estimated_delivery: dataToSpread.estimated_delivery ? toBusinessDateInput(dataToSpread.estimated_delivery) : '',
        miscellaneous_charges: (dataToSpread.miscellaneous_charges && Number(dataToSpread.miscellaneous_charges) > 0) ? dataToSpread.miscellaneous_charges : '',
        booked_time: dataToSpread.booked_date ? toBusinessTimeInput(dataToSpread.booked_date) : '',
      });
      
      const [s, st] = await Promise.all([
        ServicesApi.getServices(),
        ServiceThroughApi.getItems()
      ]);
      setDbServices(s.filter(i => i.is_enabled));
      setDbServiceThrough(st.filter(i => i.is_enabled));
      
      if (!shouldPreserve) {
        setSuccess('Data refreshed');
      }
    } catch(err) {
      console.error(err);
      if (shouldPreserve) {
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSyncTracking = async () => {
    if (syncing) return;
    if (!canSyncCourierTracking) {
      setError('Sync tracking is only supported for Delhivery B2B and Delhivery B2C shipments.');
      return;
    }
    if (!shipment.official_tracking_id) {
      setError('Cannot sync tracking: No official tracking ID (AWB/LR) assigned to this shipment.');
      return;
    }

    setSyncing(true);
    setError('');
    setSuccess('');

    let syncResult: any = null;
    try {
      const res = await shipmentService.syncTracking(shipmentId) as any;
      syncResult = res?.data || res;
    } catch (err: any) {
      console.error('[Sync Error]', err);
      setError(err.message || 'Courier synchronization failed');
      setSyncing(false);
      return;
    }

    const statusText = syncResult?.current_status || 'Updated';
    const eventCount = syncResult?.new_events ?? 0;
    const successMsg = `Tracking synced successfully: ${statusText} (${eventCount} update${eventCount === 1 ? '' : 's'} recorded)`;
    setSuccess(successMsg);

    try {
      await refreshData(true);
      setSuccess(successMsg);
      notifyShipmentsChanged();
    } catch (refreshErr: any) {
      console.error('[Refresh Error after Sync]', refreshErr);
      setError('Tracking synced successfully, but the page could not refresh automatically. Please refresh manually.');
    } finally {
      setSyncing(false);
    }
  };

  const handleCopy = (textToCopy: string, label: string) => {
    if (!textToCopy) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).catch(() => {
        // Fallback if permission rejected
        try {
          const textarea = document.createElement('textarea');
          textarea.value = textToCopy;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.focus();
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
        } catch (e) {
          console.error(e);
        }
      });
    } else {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch (e) {
        console.error(e);
      }
    }
    setSuccess(`${label} copied to clipboard!`);
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <Link href="/admin/dashboard/shipments" onClick={() => router.refresh()} className="shrink-0 mt-1 sm:mt-0 p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Shipment</h1>
              <span className="text-lg sm:text-2xl font-mono text-orange-500 font-bold tracking-wider cursor-pointer hover:text-orange-600 transition-colors flex items-center gap-2 break-all" onClick={() => handleCopy(shipment.tracking_id, 'KSR Tracking Number')} title="Click to copy KSR Tracking Number">
                {shipment.tracking_id}
                <Copy className="w-4 h-4 text-gray-400 hover:text-orange-500" />
              </span>
              <a 
                href={`/track?id=${shipment.tracking_id}`} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => handleCopy(shipment.tracking_id, 'KSR Tracking Number')}
                className="ml-2 inline-flex items-center gap-1.5 px-3 py-1 text-sm font-semibold text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 hover:text-orange-700 transition-colors"
                title="Open KSR tracking page and copy tracking number"
              >
                Track on KSR
              </a>
              {!shipment.is_active && (
                <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300">Archived</Badge>
              )}
            </div>
            {shipment.official_tracking_id && (
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 sm:mt-2">
                <p className="text-sm text-gray-500 flex items-center gap-2 cursor-pointer hover:text-gray-700 transition-colors break-all" onClick={() => handleCopy(shipment.official_tracking_id, 'Official Tracking Number')} title="Click to copy Official Tracking Number">
                  <span className="shrink-0">Official Tracking:</span> <span className="font-medium">{shipment.official_tracking_id}</span>
                  <Copy className="w-3 h-3 text-gray-400 hover:text-gray-600 shrink-0" />
                </p>
                {(() => {
                  const info = getOfficialTrackingInfo(shipment.service, shipment.official_tracking_id);
                  if (!info) return null;
                  return (
                    <a 
                      href={info.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={() => handleCopy(shipment.official_tracking_id, 'Official Tracking Number')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:text-blue-700 transition-colors"
                      title={`Track on ${info.name} and copy tracking number`}
                    >
                      Track on {info.name}
                    </a>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto mt-2 sm:mt-0">
          {canSyncCourierTracking && (
            <button 
              type="button"
              onClick={handleSyncTracking}
              disabled={syncing || !shipment.official_tracking_id}
              className="flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              title={shipment.official_tracking_id ? "Sync tracking events from courier partner" : "No official tracking ID assigned to sync"}
            >
              <RefreshCw className={`w-4 h-4 text-orange-500 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing...' : 'Sync Tracking'}</span>
            </button>
          )}
          <button onClick={refreshData} className="p-2 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200" title="Refresh">
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
          {isDelivered && (
             <button onClick={handleArchiveToggle} className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
               <ArchiveRestore className="w-4 h-4" />
               {shipment.is_active ? 'Archive' : 'Unarchive'}
             </button>
          )}
          <button onClick={handleDelete} className="flex items-center gap-2 rounded-xl bg-red-50 text-red-600 px-4 py-2.5 text-sm font-semibold shadow-sm border border-red-100 hover:bg-red-100 transition-colors">
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          <Badge variant="outline" className={`px-3 py-1 text-sm font-semibold
            ${isDelivered ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
            <span className={`w-2 h-2 rounded-full mr-2 ${isDelivered ? 'bg-green-500' : 'bg-blue-500 animate-pulse'}`}></span>
            {shipment.current_status}
          </Badge>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 font-medium flex justify-between items-center">
          {error}
          {error.includes('refresh') && (
            <button onClick={refreshData} className="text-sm bg-white px-3 py-1 rounded-lg border border-red-200 shadow-sm text-gray-800 hover:bg-gray-50">Refresh Now</button>
          )}
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-green-50 text-green-700 border border-green-100 font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <span>{success}</span>
          </div>
          {success.includes('Status') && shipment.history && shipment.history.length > 1 && (
            <button
              type="button"
              onClick={handleUndoStatus}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-100/80 hover:bg-amber-200 border border-amber-300/60 rounded-lg transition-colors shrink-0 shadow-2xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Undo Update
            </button>
          )}
        </div>
      )}

            {/* Unified 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 cols on xl): Shipment Details, Contact Details, Financials, Package Details */}
        <div ref={leftColRef} className="contents xl:flex xl:flex-col xl:col-span-2 xl:gap-6">
          {/* Shipment Details */}
          <div className="order-2 xl:order-none">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                 <div className="flex items-center gap-2">
                   <h2 className="text-lg font-semibold text-gray-900">Shipment Details</h2>
                   <button
                     type="button"
                     onClick={() => setIsEditing(!isEditing)}
                     className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isEditing ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600 hover:text-orange-500 hover:bg-orange-50'}`}
                     title={isEditing ? "Lock Editing" : "Unlock Editing"}
                   >
                     <Edit3 className="w-4 h-4" />
                     {isEditing ? "Lock Edit" : "Unlock Edit"}
                   </button>
                 </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Booked Date <span className="text-red-500">*</span></label>
                  <PremiumDatePicker 
                    value={formData.booked_date ? formData.booked_date.split('T')[0] : ''} 
                    onChange={(date) => setFormData((prev: any) => ({ ...prev, booked_date: formatDateToYYYYMMDD(date) }))} 
                    disabled={isDelivered || !isEditing} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Booked Time <span className="text-red-500">*</span></label>
                  <PremiumTimePicker 
                    value={formData.booked_time} 
                    onChange={(timeStr) => setFormData((prev: any) => ({ ...prev, booked_time: timeStr }))} 
                    disabled={isDelivered || !isEditing} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Shipment Type <span className="text-red-500">*</span></label>
                  <PremiumSelect
                    value={formData.shipment_type || 'Domestic'}
                    onChange={(value) => {
                      setFormData((prev: any) => ({
                        ...prev,
                        shipment_type: value,
                        medium: value === 'International' ? 'Air' : prev.medium
                      }));
                    }}
                    options={[
                      { label: "Domestic", value: "Domestic" },
                      { label: "International", value: "International" }
                    ]}
                    disabled={isDelivered || !isEditing}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Delivery Date <span className="text-red-500">*</span></label>
                  <PremiumDatePicker 
                    value={formData.estimated_delivery} 
                    onChange={(date) => setFormData((prev: any) => ({ ...prev, estimated_delivery: formatDateToYYYYMMDD(date) }))} 
                    disabled={isDelivered || !isEditing} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Service <span className="text-red-500">*</span></label>
                  <PremiumSelect
                    value={formData.service || ''}
                    onChange={(value) => handleChange({ target: { name: 'service', value } } as any)}
                    options={[
                      ...dbServices.map(s => ({ label: s.name, value: s.slug })),
                      ...(formData.service && !dbServices.find(s => s.slug === formData.service) ? [{ label: formData.service, value: formData.service }] : [])
                    ]}
                    placeholder="Select Service..."
                    disabled={isDelivered || !isEditing}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Service Through <span className="text-red-500">*</span></label>
                  <PremiumSelect
                    value={formData.service_through || ''}
                    onChange={(value) => handleChange({ target: { name: 'service_through', value } } as any)}
                    options={[
                      ...dbServiceThrough.map(st => ({ label: st.name, value: st.slug })),
                      ...(formData.service_through && !dbServiceThrough.find(st => st.slug === formData.service_through) ? [{ label: formData.service_through, value: formData.service_through }] : [])
                    ]}
                    placeholder="Select Vendor..."
                    disabled={isDelivered || !isEditing}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medium <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={`flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all select-none ${
                        isDelivered || !isEditing ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
                      } ${
                        formData.medium === 'Surface'
                          ? 'border-orange-500 bg-orange-50/70 text-orange-600 ring-1 ring-orange-500 shadow-xs'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="medium"
                        value="Surface"
                        checked={formData.medium === 'Surface'}
                        onChange={handleChange}
                        disabled={isDelivered || !isEditing}
                        className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500 accent-orange-500 cursor-pointer"
                      />
                      <Truck className={`w-4 h-4 ${formData.medium === 'Surface' ? 'text-orange-500' : 'text-gray-400'}`} />
                      <span>Surface</span>
                    </label>
                    <label
                      className={`flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all select-none ${
                        isDelivered || !isEditing ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
                      } ${
                        formData.medium === 'Air'
                          ? 'border-orange-500 bg-orange-50/70 text-orange-600 ring-1 ring-orange-500 shadow-xs'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="medium"
                        value="Air"
                        checked={formData.medium === 'Air'}
                        onChange={handleChange}
                        disabled={isDelivered || !isEditing}
                        className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500 accent-orange-500 cursor-pointer"
                      />
                      <Plane className={`w-4 h-4 ${formData.medium === 'Air' ? 'text-orange-500' : 'text-gray-400'}`} />
                      <span>Air</span>
                    </label>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Shipment Update (Visible to Customer - to be added for Delays or Emergencies)</label>
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <textarea name="customer_update" value={formData.customer_update || ''} onChange={handleChange} rows={3} disabled={isDelivered} className="flex-1 w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500" placeholder="E.g. Customs clearance is taking longer than expected."></textarea>
                    <button 
                      type="button" 
                      onClick={handleCustomerUpdateSave}
                      disabled={isDelivered || loading || formData.customer_update === shipment.customer_update}
                      className="px-5 py-3 bg-green-600 hover:bg-green-500 hover:shadow-[0_0_15px_rgba(34,197,94,0.6)] text-white font-semibold rounded-xl transition-all flex items-center gap-2 disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:shadow-none disabled:cursor-not-allowed whitespace-nowrap self-end sm:self-auto"
                    >
                      <Save className="w-5 h-5" /> Save Note
                    </button>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Internal Notes</label>
                  <textarea name="internal_notes" value={formData.internal_notes || ''} onChange={handleChange} rows={3} disabled={isDelivered || !isEditing} className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500"></textarea>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details, Financials, Package Details & Save Button */}
          <form onSubmit={handleUpdate} className="order-3 xl:order-none flex flex-col gap-6 opacity-100 transition-opacity" >
          {/* Same Sender and Receiver Details Full-Width Checkbox */}
            {!isDelivered && (
              <div className="w-full">
                <label
                  className={`group flex items-center justify-between p-3.5 sm:px-4 sm:py-3 rounded-2xl border select-none transition-all duration-200 min-h-[48px] w-full ${
                    !isEditing || isDelivered
                      ? 'cursor-not-allowed opacity-60 bg-gray-50/80 border-gray-200 text-gray-500'
                      : sameAsSender
                        ? 'cursor-pointer border-orange-400 bg-orange-50/70 text-orange-950 ring-1 ring-orange-400/30 shadow-xs'
                        : 'cursor-pointer border-gray-200/90 bg-white text-gray-700 hover:border-orange-200 hover:bg-orange-50/30 hover:text-gray-900 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="sameSenderAndReceiverDetails"
                      name="same_contact_details"
                      checked={sameAsSender}
                      disabled={!isEditing || isDelivered}
                      onChange={(e) => handleSameAsSenderChange(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-orange-500 peer-focus-visible:ring-offset-2 ${
                        !isEditing || isDelivered
                          ? sameAsSender
                            ? 'bg-gray-300 border-gray-300 text-gray-600'
                            : 'bg-gray-100 border-gray-300'
                          : sameAsSender
                            ? 'bg-orange-500 border-orange-500 text-white shadow-xs'
                            : 'bg-white border-gray-300 group-hover:border-orange-300'
                      }`}
                    >
                      <Check
                        className={`w-3.5 h-3.5 stroke-[3] transition-transform duration-200 ${
                          sameAsSender ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                        }`}
                      />
                    </div>
                    <span className="text-sm font-semibold tracking-tight">Same Sender and Receiver Details</span>
                    {(!isEditing || isDelivered) && (
                      <span className="text-[11px] font-medium text-gray-400 ml-1 hidden sm:inline">
                        (Locked - unlock edit to modify)
                      </span>
                    )}
                  </div>
                  <Copy className={`w-4 h-4 ml-4 transition-colors ${
                    !isEditing || isDelivered
                      ? 'text-gray-300'
                      : sameAsSender
                        ? 'text-orange-500'
                        : 'text-gray-400 group-hover:text-orange-400'
                  }`} />
                </label>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sender Info */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Sender Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name <span className="text-red-500">*</span></label>
                    <input required name="sender_name" value={formData.sender_name || ''} onChange={handleChange} disabled={isDelivered || !isEditing} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone <span className="text-red-500">*</span></label>
                    <input required name="sender_phone" value={formData.sender_phone || ''} onChange={handleChange} disabled={isDelivered || !isEditing} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City <span className="text-red-500">*</span></label>
                    <input required name="sender_city" value={formData.sender_city || ''} onChange={handleChange} disabled={isDelivered || !isEditing} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500" />
                  </div>
                </div>
              </div>

              {/* Receiver Info */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Receiver Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name <span className="text-red-500">*</span></label>
                    <input required name="receiver_name" value={formData.receiver_name || ''} onChange={handleChange} disabled={isDelivered || !isEditing} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone <span className="text-red-500">*</span></label>
                    <input required name="receiver_phone" value={formData.receiver_phone || ''} onChange={handleChange} disabled={isDelivered || !isEditing} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City <span className="text-red-500">*</span></label>
                    <input required name="receiver_city" value={formData.receiver_city || ''} onChange={handleChange} disabled={isDelivered || !isEditing} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Financials & Package */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Financials</h2>
                    <div className="flex items-center gap-2">
                      {isEditingFinancials ? (
                        <>
                          <button
                            type="button"
                            onClick={handleSaveFinancials}
                            disabled={savingFinancials || loading}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-600 text-white hover:bg-green-500 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Save className="w-3.5 h-3.5" />
                            {savingFinancials ? 'Saving...' : 'Save Financials'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev: any) => ({
                                ...prev,
                                received_amount: shipment.received_amount,
                                paid_amount: shipment.paid_amount,
                                miscellaneous_charges: (shipment.miscellaneous_charges && Number(shipment.miscellaneous_charges) > 0) ? shipment.miscellaneous_charges : '',
                              }));
                              setIsEditingFinancials(false);
                            }}
                            disabled={savingFinancials || loading}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsEditingFinancials(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200/60 transition-colors cursor-pointer"
                          title="Edit Financials"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit Financials
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        Received (₹) <span className="text-red-500">*</span>
                      </label>
                      <input 
                        required 
                        type="text" 
                        inputMode="decimal" 
                        name="received_amount" 
                        value={formatIndianNumberString(formData.received_amount)} 
                        onChange={handleMoneyChange} 
                        disabled={!isEditing && !isEditingFinancials} 
                        className="w-full h-11 rounded-xl border border-gray-200 px-3 sm:px-4 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-emerald-600 font-semibold bg-emerald-50/50 disabled:text-emerald-500 text-base sm:text-lg" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        Paid (₹) <span className="text-red-500">*</span>
                      </label>
                      <input 
                        required 
                        type="text" 
                        inputMode="decimal" 
                        name="paid_amount" 
                        value={formatIndianNumberString(formData.paid_amount)} 
                        onChange={handleMoneyChange} 
                        disabled={!isEditing && !isEditingFinancials} 
                        className="w-full h-11 rounded-xl border border-gray-200 px-3 sm:px-4 py-2.5 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-red-600 font-semibold bg-red-50/50 disabled:text-red-500 text-base sm:text-lg" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 sm:items-center mb-6">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700">
                        Miscellaneous Charges (₹)
                      </label>
                    </div>
                    <div>
                      <input 
                        type="text" 
                        inputMode="decimal" 
                        name="miscellaneous_charges" 
                        value={formatIndianNumberString(formData.miscellaneous_charges)} 
                        onChange={handleMoneyChange} 
                        disabled={!isEditing && !isEditingFinancials} 
                        className="w-full h-11 rounded-xl border border-gray-200 px-3 sm:px-4 py-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all text-amber-700 font-semibold bg-amber-50/40 disabled:text-amber-600 text-base sm:text-lg" 
                      />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between border border-gray-100 mt-6">
                   <span className="font-semibold text-gray-700">Profit</span>
                   <span className="text-2xl font-bold text-gray-900">
                     {formatCurrency(
                       isCancelledOrReturnedStatus(formData.current_status || shipment.current_status)
                         ? 0
                         : (isEditing || isEditingFinancials)
                           ? Math.round((
                               (parseFloat(String(formData.received_amount || 0).replace(/,/g, '')) || 0) -
                               (parseFloat(String(formData.paid_amount || 0).replace(/,/g, '')) || 0) -
                               (parseFloat(String(formData.miscellaneous_charges || 0).replace(/,/g, '')) || 0)
                             ) * 100) / 100
                           : (shipment.profit !== undefined && shipment.profit !== null ? shipment.profit : 0)
                     )}
                   </span>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Package Details</h2>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="h-10 flex items-end text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        <span>Weight (kg) <span className="text-red-500">*</span></span>
                      </label>
                      <input 
                        required 
                        type="number" 
                        step="0.01" 
                        name="weight" 
                        value={formData.weight || ''} 
                        onChange={handleChange} 
                        disabled={isDelivered || !isEditing} 
                        className="w-full h-11 rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500 text-gray-900" 
                      />
                    </div>
                    <div>
                      <label className="h-10 flex items-end text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        <span>Packages <span className="text-red-500">*</span></span>
                      </label>
                      <input 
                        required 
                        type="number" 
                        name="num_packages" 
                        value={formData.num_packages || 1} 
                        onChange={handleChange} 
                        disabled={isDelivered || !isEditing} 
                        className="w-full h-11 rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500 text-gray-900" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea 
                      name="description" 
                      value={formData.description || ''} 
                      onChange={handleChange} 
                      disabled={isDelivered || !isEditing} 
                      rows={2} 
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500 resize-none text-gray-900" 
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {isEditing && (
              <div className="flex justify-end pt-4">
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-xl bg-green-600 px-8 py-3 text-sm font-bold text-white shadow-sm hover:bg-green-500 hover:shadow-[0_0_15px_rgba(34,197,94,0.6)] transition-all disabled:opacity-50"
                >
                  <Save className="w-5 h-5" /> Save Changes
                </button>
              </div>
            )}
        </form>
        </div>

        {/* Right Column (1 col on xl): Update Status & Timeline */}
        <div className="contents xl:flex xl:flex-col xl:col-span-1 xl:gap-6 xl:min-h-0">
          {/* Update Status Card */}
          {(shareableStatus || !isDelivered) && (
            <div ref={updateStatusRef} className="order-1 xl:order-none bg-white rounded-3xl p-6 sm:p-8 border border-orange-200 shadow-sm relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -z-10 opacity-50"></div>
              <h2 className="text-lg font-bold text-gray-900 mb-6">
                {isDelivered ? 'Share Status Update' : 'Update Status'}
              </h2>
              {!isDelivered ? (
                <form onSubmit={handleStatusUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Status <span className="text-red-500">*</span></label>
                    <PremiumSelect
                      value={statusUpdate.status}
                      onChange={(value) => {
                        const newLoc = value === 'Delivered' ? (formData.receiver_city || '') : statusUpdate.location;
                        setStatusUpdate((prev) => ({
                          ...prev,
                          status: value,
                          location: newLoc,
                        }))
                      }}
                      options={STATUS_WORKFLOW.map(s => ({ label: s, value: s }))}
                      placeholder="Select status..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location <span className="text-red-500">*</span></label>
                    <input required name="location" value={statusUpdate.location} onChange={handleStatusChange} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all" placeholder="e.g. Mumbai Hub" />
                  </div>
                  <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Update Date <span className="text-red-500">*</span></label>
                      <PremiumDatePicker 
                        value={statusUpdate.occurred_at && statusUpdate.occurred_at.includes('T') ? statusUpdate.occurred_at.split('T')[0] : ''} 
                        onChange={(date) => {
                          const dateStr = date ? formatDateToYYYYMMDD(date) : '';
                          setStatusUpdate(prev => {
                            const timeStr = prev.occurred_at && prev.occurred_at.includes('T') ? prev.occurred_at.split('T')[1].substring(0, 5) : '';
                            return { ...prev, occurred_at: dateStr || timeStr ? `${dateStr}T${timeStr ? timeStr + ':00' : ''}` : '' };
                          });
                        }} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Update Time <span className="text-red-500">*</span></label>
                      <PremiumTimePicker 
                        value={statusUpdate.occurred_at && statusUpdate.occurred_at.includes('T') ? statusUpdate.occurred_at.split('T')[1].substring(0, 5) : ''} 
                        onChange={(timeStr) => {
                          setStatusUpdate(prev => {
                            const dateStr = prev.occurred_at && prev.occurred_at.includes('T') ? prev.occurred_at.split('T')[0] : '';
                            return { ...prev, occurred_at: dateStr || timeStr ? `${dateStr}T${timeStr ? timeStr + ':00' : ''}` : '' };
                          });
                        }} 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Note (Optional)</label>
                    <textarea name="note" value={statusUpdate.note} onChange={handleStatusChange} rows={2} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all" placeholder="Add any operational notes..." />
                  </div>
                  <button 
                    type="submit"
                    disabled={loading || !canSubmitStatusUpdate}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Update Status
                  </button>
                </form>
              ) : (
                shareableStatus && (
                  <p className="text-sm text-gray-600 mb-4">
                    Share the <span className="font-semibold text-gray-900">{shareableStatus.status}</span> update
                    {shareableStatus.location ? ` from ${shareableStatus.location}` : ''} with the sender or receiver.
                  </p>
                )
              )}
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${!isDelivered ? 'pt-1' : ''}`}>
                <button
                  type="button"
                  onClick={handleShareStatusToSender}
                  disabled={!canShareStatusUpdate || !formData.sender_phone?.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#1fb855] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Share2 className="w-4 h-4" />
                  Share to Sender
                </button>
                <button
                  type="button"
                  onClick={handleShareStatusToReceiver}
                  disabled={!canShareStatusUpdate || !formData.receiver_phone?.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#1fb855] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Share2 className="w-4 h-4" />
                  Share to Receiver
                </button>
              </div>
            </div>
          )}

          {/* Timeline Card: Starts directly below Update Status with 24px gap, stretches to bottom */}
          <div
            ref={timelineCardRef}
            style={timelineHeight ? { height: `${timelineHeight}px`, maxHeight: `${timelineHeight}px` } : undefined}
            className="order-4 xl:order-none bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col flex-1 min-h-[440px] max-h-[560px] xl:max-h-none xl:min-h-0 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-6 shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-gray-900">Timeline</h2>
                {shipment.history && shipment.history.length > 1 && (
                  <button
                    type="button"
                    onClick={handleUndoStatus}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/90 rounded-lg transition-colors shadow-2xs cursor-pointer"
                    title="Undo latest status update"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                    <span>Undo</span>
                  </button>
                )}
              </div>
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                {shipment.history?.length || 0} updates
              </span>
            </div>
            <div className="flow-root flex-1 min-h-0 overflow-y-auto overscroll-contain pr-2 select-text [scrollbar-gutter:stable]">
              <ul role="list" className="-mb-8 pb-4">
                {shipment.history?.map((event: any, eventIdx: number) => {
                  const isLast = eventIdx === shipment.history.length - 1;
                  const isTop = eventIdx === 0;
                  const canDeleteThis = !isTop && !isLast && shipment.history.length > 1;

                  return (
                    <li key={event.id || eventIdx} className="relative transition-all duration-300 ease-in-out group">
                      <div className="relative pb-8">
                        {!isLast ? (
                          <span className="absolute left-5 top-5 -ml-[0.5px] h-full w-[1px] bg-gray-200" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex items-start space-x-3.5">
                          <div>
                            <span className={`h-10 w-10 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm
                              ${event.status === 'Delivered' ? 'bg-green-100 text-green-600' : 
                                event.status === 'Cancelled' ? 'bg-red-100 text-red-600' :
                                event.status === 'Returned' ? 'bg-purple-100 text-purple-600' :
                                'bg-blue-50 text-blue-500'}`}>
                              {event.status === 'Delivered' ? <CheckCircle2 className="w-5 h-5" /> : 
                               event.status === 'In Transit' ? <Truck className="w-5 h-5" /> : 
                               <Clock className="w-5 h-5" />}
                            </span>
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col pt-1">
                            {/* Line 1: Status Title (Left) + Timestamp (Right) */}
                            <div className="flex justify-between items-baseline gap-2 mb-1">
                              <p className="text-sm font-bold text-gray-900 leading-snug truncate">
                                {event.status}
                              </p>
                              <time className="whitespace-nowrap text-xs text-gray-400 font-medium shrink-0 ml-auto" dateTime={event.occurred_at}>
                                {formatDateTime(event.occurred_at)}
                              </time>
                            </div>

                            {/* Line 2: Location & Current Badge (Left) + Edit/Delete Actions (Right) */}
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                {event.location && (
                                  <span className="font-medium text-gray-500 flex items-center gap-1 truncate">
                                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" /> {event.location}
                                  </span>
                                )}
                                {isTop && (
                                  <span className="text-[10px] font-bold text-orange-700 bg-orange-100/90 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                                    Current
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditStatus(event)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200/90 hover:border-orange-300 transition-all shadow-2xs cursor-pointer"
                                  title="Edit status details"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-orange-600" />
                                  <span>Edit</span>
                                </button>
                                {canDeleteThis && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteStatus(event.id, event.status)}
                                    className="inline-flex items-center justify-center p-1.5 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 border border-red-200/90 hover:border-red-300 transition-all shadow-2xs cursor-pointer"
                                    title="Delete this status entry"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                  </button>
                                )}
                              </div>
                            </div>
                            {event.note && (
                              <p className="mt-2 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100 leading-relaxed">
                                "{event.note}"
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Status Modal */}
      {editingHistoryItem && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setEditingHistoryItem(null)} />
          <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-100 z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-orange-500" />
                  Edit Status Entry
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Modify status milestone, location, timestamp, or note.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingHistoryItem(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditStatus} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Status <span className="text-red-500">*</span>
                </label>
                <PremiumSelect
                  value={editStatusForm.status}
                  onChange={(val) => setEditStatusForm((prev: any) => ({ ...prev, status: val }))}
                  options={STATUS_WORKFLOW.map(s => ({ label: s, value: s }))}
                  placeholder="Select status..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  name="location"
                  value={editStatusForm.location}
                  onChange={(e) => setEditStatusForm((prev: any) => ({ ...prev, location: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all text-sm"
                  placeholder="e.g. Surat Hub"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <PremiumDatePicker
                    value={editStatusForm.date}
                    onChange={(date) => {
                      const dateStr = date ? formatDateToYYYYMMDD(date) : '';
                      setEditStatusForm((prev: any) => ({ ...prev, date: dateStr }));
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Time (IST) <span className="text-red-500">*</span>
                  </label>
                  <PremiumTimePicker
                    value={editStatusForm.time}
                    onChange={(timeStr) => {
                      setEditStatusForm((prev: any) => ({ ...prev, time: timeStr }));
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Note (Optional)
                </label>
                <textarea
                  name="note"
                  value={editStatusForm.note}
                  onChange={(e) => setEditStatusForm((prev: any) => ({ ...prev, note: e.target.value }))}
                  rows={2}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all text-sm"
                  placeholder="Add operational notes or details..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingHistoryItem(null)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading || !editStatusForm.status?.trim() || !editStatusForm.location?.trim() || !editStatusForm.date || !editStatusForm.time}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {editLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
