
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import SavedInvoices from './SavedInvoices';
import BusinessDetails from './BusinessDetails';
import CustomerDetails from './CustomerDetails';
import { supabase } from "@/integrations/supabase/client";
import { Business, Customer } from '@/types';
import { format } from 'date-fns';

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  gstRate: number;
}

const InvoiceForm = () => {
  const [items, setItems] = useState<InvoiceItem[]>([{
    description: '',
    quantity: 1,
    rate: 0,
    gstRate: 18,
  }]);

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [invoiceDate, setInvoiceDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');

  useEffect(() => {
    fetchBusinessesAndCustomers();
    generateDefaultInvoiceNumber();
  }, []);

  const generateDefaultInvoiceNumber = () => {
    const today = new Date();
    const dateString = format(today, 'yyyyMMdd');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setInvoiceNumber(`INV-${dateString}-${randomNum}`);
  };

  const fetchBusinessesAndCustomers = async () => {
    const [businessesResult, customersResult] = await Promise.all([
      supabase.from('businesses').select('*'),
      supabase.from('customers').select('*')
    ]);

    if (businessesResult.error) {
      toast.error('Error fetching businesses', {
        description: businessesResult.error.message,
      });
    } else {
      setBusinesses(businessesResult.data || []);
    }

    if (customersResult.error) {
      toast.error('Error fetching customers', {
        description: customersResult.error.message,
      });
    } else {
      setCustomers(customersResult.data || []);
    }
  };

  const handleAddItem = () => {
    setItems([...items, {
      description: '',
      quantity: 1,
      rate: 0,
      gstRate: 18,
    }]);
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };
    setItems(newItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  };

  const calculateGST = () => {
    return items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.rate;
      return sum + (itemTotal * item.gstRate / 100);
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateGST();
  };

  const handleSaveInvoice = async () => {
    if (!selectedBusiness || !selectedCustomer) {
      toast.error('Please select a business and customer');
      return;
    }

    if (!invoiceNumber.trim()) {
      toast.error('Please enter an invoice number');
      return;
    }

    const subtotal = calculateSubtotal();
    const gstAmount = calculateGST();
    const totalAmount = calculateTotal();

    try {
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          business_name: selectedBusiness.name,
          business_address: selectedBusiness.address,
          business_gst: selectedBusiness.gst,
          customer_name: selectedCustomer.name,
          customer_address: selectedCustomer.address,
          customer_gst: selectedCustomer.gst,
          items: JSON.stringify(items),
          subtotal: subtotal,
          gst_amount: gstAmount,
          total_amount: totalAmount,
        })
        .select();

      if (error) throw error;

      toast.success('Invoice saved successfully!', {
        description: `Invoice saved with total amount: ₹${totalAmount.toFixed(2)}`,
      });
      
      // Generate a new invoice number for the next invoice
      generateDefaultInvoiceNumber();
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error('Failed to save invoice', {
        description: 'Please try again later.',
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Tabs defaultValue="create">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="create">Create Invoice</TabsTrigger>
          <TabsTrigger value="saved">Saved Invoices</TabsTrigger>
          <TabsTrigger value="businesses">Business Details</TabsTrigger>
          <TabsTrigger value="customers">Customer Details</TabsTrigger>
        </TabsList>
        <TabsContent value="create">
          <Card className="p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Calculator className="w-6 h-6" />
              GST Invoice Generator
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Label htmlFor="invoice-number" className="mb-2 block">Invoice Number</Label>
                <Input
                  id="invoice-number"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="mb-4"
                />
                
                <Label htmlFor="invoice-date" className="mb-2 block">Invoice Date</Label>
                <div className="flex items-center space-x-2 mb-4">
                  <Input
                    id="invoice-date"
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                  />
                  <CalendarIcon className="h-4 w-4 opacity-50" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Business Details</h3>
                <Select 
                  value={selectedBusiness?.id || ""} 
                  onValueChange={(value) => {
                    const business = businesses.find(b => b.id === value);
                    setSelectedBusiness(business || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Business" />
                  </SelectTrigger>
                  <SelectContent>
                    {businesses.map((business) => (
                      <SelectItem key={business.id} value={business.id}>
                        {business.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedBusiness && (
                  <div className="mt-2 text-sm">
                    <p><strong>Address:</strong> {selectedBusiness.address}</p>
                    <p><strong>GST:</strong> {selectedBusiness.gst}</p>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Customer Details</h3>
                <Select 
                  value={selectedCustomer?.id || ""} 
                  onValueChange={(value) => {
                    const customer = customers.find(c => c.id === value);
                    setSelectedCustomer(customer || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedCustomer && (
                  <div className="mt-2 text-sm">
                    <p><strong>Address:</strong> {selectedCustomer.address}</p>
                    <p><strong>GST:</strong> {selectedCustomer.gst}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Items</h3>
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Rate (₹)</Label>
                    <Input
                      type="number"
                      value={item.rate}
                      onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>GST Rate (%)</Label>
                    <Input
                      type="number"
                      value={item.gstRate}
                      onChange={(e) => handleItemChange(index, 'gstRate', parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              ))}
              <Button 
                variant="outline"
                onClick={handleAddItem}
                className="mt-2"
              >
                Add Item
              </Button>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Subtotal:</span>
                <span>₹{calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">GST:</span>
                <span>₹{calculateGST().toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span>₹{calculateTotal().toFixed(2)}</span>
              </div>
            </div>
            
            <Button 
              className="mt-4"
              onClick={handleSaveInvoice}
            >
              Save Invoice
            </Button>
          </Card>
        </TabsContent>
        <TabsContent value="saved">
          <SavedInvoices />
        </TabsContent>
        <TabsContent value="businesses">
          <BusinessDetails />
        </TabsContent>
        <TabsContent value="customers">
          <CustomerDetails />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InvoiceForm;
