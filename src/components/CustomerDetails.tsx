
import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Customer } from '@/types';
import { toast } from "@/components/ui/sonner";
import { Edit, Trash, Save } from "lucide-react";

const CustomerDetails = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    address: '',
    gst: '',
  });
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const { data, error } = await supabase.from('customers').select('*');
    if (error) {
      toast.error('Error fetching customers', {
        description: error.message,
      });
    } else {
      setCustomers(data || []);
    }
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.address || !newCustomer.gst) {
      toast.error('Please fill in all fields');
      return;
    }

    const { error } = await supabase.from('customers').insert(newCustomer);
    if (error) {
      toast.error('Error adding customer', {
        description: error.message,
      });
    } else {
      toast.success('Customer added successfully!');
      setNewCustomer({ name: '', address: '', gst: '' });
      fetchCustomers();
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) {
      toast.error('Error deleting customer', {
        description: error.message,
      });
    } else {
      toast.success('Customer deleted successfully!');
      fetchCustomers();
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
  };

  const handleSaveEdit = async () => {
    if (!editingCustomer) return;
    
    const { error } = await supabase
      .from('customers')
      .update({
        name: editingCustomer.name,
        address: editingCustomer.address,
        gst: editingCustomer.gst
      })
      .eq('id', editingCustomer.id);
    
    if (error) {
      toast.error('Error updating customer', {
        description: error.message,
      });
    } else {
      toast.success('Customer updated successfully!');
      setEditingCustomer(null);
      fetchCustomers();
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Add New Customer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Customer Name"
              value={newCustomer.name}
              onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
            />
            <Input
              placeholder="Customer Address"
              value={newCustomer.address}
              onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
            />
            <Input
              placeholder="GST Number"
              value={newCustomer.gst}
              onChange={(e) => setNewCustomer({ ...newCustomer, gst: e.target.value })}
            />
          </div>
          <Button onClick={handleAddCustomer} className="mt-4">Add Customer</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>GST Number</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    {editingCustomer?.id === customer.id ? (
                      <Input 
                        value={editingCustomer.name} 
                        onChange={(e) => setEditingCustomer({...editingCustomer, name: e.target.value})}
                      />
                    ) : (
                      customer.name
                    )}
                  </TableCell>
                  <TableCell>
                    {editingCustomer?.id === customer.id ? (
                      <Input 
                        value={editingCustomer.address} 
                        onChange={(e) => setEditingCustomer({...editingCustomer, address: e.target.value})}
                      />
                    ) : (
                      customer.address
                    )}
                  </TableCell>
                  <TableCell>
                    {editingCustomer?.id === customer.id ? (
                      <Input 
                        value={editingCustomer.gst} 
                        onChange={(e) => setEditingCustomer({...editingCustomer, gst: e.target.value})}
                      />
                    ) : (
                      customer.gst
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {editingCustomer?.id === customer.id ? (
                        <Button size="sm" variant="outline" onClick={handleSaveEdit}>
                          <Save className="h-4 w-4 mr-1" /> Save
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleEditCustomer(customer)}>
                          <Edit className="h-4 w-4 mr-1" /> Edit
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => handleDeleteCustomer(customer.id)}
                        disabled={editingCustomer?.id === customer.id}
                      >
                        <Trash className="h-4 w-4 mr-1" /> Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerDetails;
