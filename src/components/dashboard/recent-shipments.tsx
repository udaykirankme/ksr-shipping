"use client";

import { useState } from "react";
import { Search, Eye, Package } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDate } from "@/lib/format";

export function RecentShipments({ initialData = [] }: { initialData?: any[] }) {
  const [search, setSearch] = useState("");
  
  const filtered = initialData.filter(s => 
    (s.tracking_id as string)?.toLowerCase().includes(search.toLowerCase()) ||
    (s.sender_name as string)?.toLowerCase().includes(search.toLowerCase()) ||
    (s.receiver_name as string)?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusVariant = (status: string) => {
    switch(status) {
      case "Delivered": return "success";
      case "In Transit": return "warning";
      case "Out For Delivery": return "success";
      case "Shipment Created": return "default";
      case "Picked Up": return "outline";
      default: return "default";
    }
  };

  return (
    <Card className="rounded-2xl border border-orange-100/50 shadow-[0_4px_20px_rgba(255,106,0,0.05)] hover:shadow-[0_4px_25px_rgba(255,106,0,0.15)] transition-all duration-300 h-full bg-white">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <CardTitle className="text-lg">Recent Shipments</CardTitle>
        <div className="relative w-full sm:w-64 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
          <input 
            type="search"
            placeholder="Search tracking, names..."
            className="premium-input w-full pl-9 pr-4"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tracking No.</TableHead>
                <TableHead>Sender</TableHead>
                <TableHead>Receiver</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((shipment) => (
                <TableRow key={shipment.id}>
                  <TableCell className="font-medium text-gray-900">{shipment.tracking_id}</TableCell>
                  <TableCell>{shipment.sender_name || 'N/A'}</TableCell>
                  <TableCell>{shipment.receiver_name || 'N/A'}</TableCell>
                  <TableCell>{shipment.destination || shipment.receiver_city || 'N/A'}</TableCell>
                  <TableCell>{formatDate(shipment.booked_date)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(shipment.current_status)}>
                      {shipment.current_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/dashboard/shipments/${shipment.id}`}>
                      <button className="h-8 w-8 p-1 rounded hover:bg-gray-100 inline-flex items-center justify-center transition-colors" title="View details">
                        <Eye className="w-4 h-4 text-gray-500 hover:text-orange-600" />
                      </button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-900">No shipments found</h3>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your search query or create a new shipment.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
