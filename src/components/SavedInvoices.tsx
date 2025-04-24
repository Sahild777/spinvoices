import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from "lucide-react";
import { generatePDF } from '@/utils/pdfGenerator';
import { toast } from "sonner";
import { Invoice } from '@/types';

const SavedInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editId, setEditId] = useState<string | number | null>(null);
  const [editInvoice, setEditInvoice] = useState<Partial<Invoice>>({});

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Parse the items from JSON string
      const parsedInvoices = (data || []).map(invoice => ({
        ...invoice,
        items: JSON.parse(invoice.items as string)
      })) as Invoice[];

      setInvoices(parsedInvoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to fetch invoices');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = (invoice: Invoice) => {
    try {
      generatePDF(invoice);
      toast.success('PDF generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setEditId(invoice.id);
    setEditInvoice({ ...invoice });
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setEditInvoice({});
  };

  const handleSaveEdit = async (id: string | number) => {
    // Don't update items field here for simplicity (edit only main fields)
    const { error } = await supabase.from('invoices').update({
      business_name: editInvoice.business_name,
      customer_name: editInvoice.customer_name,
      total_amount: editInvoice.total_amount,
    }).eq('id', String(id));
    if (error) {
      toast.error('Error updating invoice', { description: error.message });
    } else {
      toast.success('Invoice updated successfully!');
      setEditId(null);
      setEditInvoice({});
      fetchInvoices();
    }
  };

  const handleDelete = async (id: string | number) => {
    const { error } = await supabase.from('invoices').delete().eq('id', String(id));
    if (error) {
      toast.error('Error deleting invoice', { description: error.message });
    } else {
      toast.success('Invoice deleted successfully!');
      fetchInvoices();
    }
  };



  if (isLoading) {
    return <div className="p-4">Loading invoices...</div>;
  }

  return (
    <div className="p-4">
      {invoices.length === 0 ? (
        <p className="text-center text-muted-foreground">No saved invoices</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice Number</TableHead>
              <TableHead>Business Name</TableHead>
              <TableHead>Customer Name</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                {editId === invoice.id ? (
                  <>
                    <TableCell>{invoice.invoice_number}</TableCell>
                    <TableCell>
                      <input
                        className="border rounded px-2 py-1 w-full"
                        value={editInvoice.business_name as string || ''}
                        onChange={e => setEditInvoice({ ...editInvoice, business_name: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        className="border rounded px-2 py-1 w-full"
                        value={editInvoice.customer_name as string || ''}
                        onChange={e => setEditInvoice({ ...editInvoice, customer_name: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        className="border rounded px-2 py-1 w-full"
                        type="number"
                        value={editInvoice.total_amount as number || 0}
                        onChange={e => setEditInvoice({ ...editInvoice, total_amount: parseFloat(e.target.value) })}
                      />
                    </TableCell>
                    <TableCell>{invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : (invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : '')}</TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => handleSaveEdit(invoice.id)}>Save</Button>
                      <Button size="sm" variant="outline" className="ml-2" onClick={handleCancelEdit}>Cancel</Button>
                      <Button size="sm" variant="destructive" className="ml-2" onClick={() => handleDelete(invoice.id)}>Delete</Button>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>{invoice.invoice_number}</TableCell>
                    <TableCell>{invoice.business_name}</TableCell>
                    <TableCell>{invoice.customer_name}</TableCell>
                    <TableCell>₹{invoice.total_amount.toFixed(2)}</TableCell>
                    <TableCell>{invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : (invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : '')}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownloadPDF(invoice)}
                        >
                          <Download className="mr-2 h-4 w-4" /> Download PDF
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(invoice)}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(invoice.id)}>Delete</Button>
                      </div>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default SavedInvoices;
