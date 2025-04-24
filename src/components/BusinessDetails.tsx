
import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Business } from '@/types';
import { toast } from "@/components/ui/sonner";

const BusinessDetails = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [newBusiness, setNewBusiness] = useState({
    name: '',
    address: '',
    gst: '',
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [editBusiness, setEditBusiness] = useState<{ name: string; address: string; gst: string }>({ name: '', address: '', gst: '' });

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    const { data, error } = await supabase.from('businesses').select('*');
    if (error) {
      toast.error('Error fetching businesses', {
        description: error.message,
      });
    } else {
      setBusinesses(data || []);
    }
  };

  const handleAddBusiness = async () => {
    const { error } = await supabase.from('businesses').insert(newBusiness);
    if (error) {
      toast.error('Error adding business', {
        description: error.message,
      });
    } else {
      toast.success('Business added successfully!');
      setNewBusiness({ name: '', address: '', gst: '' });
      fetchBusinesses();
    }
  };

  const handleEdit = (business: Business) => {
    setEditId(String(business.id));
    setEditBusiness({ name: business.name, address: business.address, gst: business.gst });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('businesses').delete().eq('id', id);
    if (error) {
      toast.error('Error deleting business', { description: error.message });
    } else {
      toast.success('Business deleted successfully!');
      fetchBusinesses();
    }
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setEditBusiness({ name: '', address: '', gst: '' });
  };

  const handleSaveEdit = async (id: string) => {
    const { error } = await supabase.from('businesses').update(editBusiness).eq('id', id);
    if (error) {
      toast.error('Error updating business', { description: error.message });
    } else {
      toast.success('Business updated successfully!');
      setEditId(null);
      setEditBusiness({ name: '', address: '', gst: '' });
      fetchBusinesses();
    }
  };


  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Add New Business</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Business Name"
              value={newBusiness.name}
              onChange={(e) => setNewBusiness({ ...newBusiness, name: e.target.value })}
            />
            <Input
              placeholder="Business Address"
              value={newBusiness.address}
              onChange={(e) => setNewBusiness({ ...newBusiness, address: e.target.value })}
            />
            <Input
              placeholder="GST Number"
              value={newBusiness.gst}
              onChange={(e) => setNewBusiness({ ...newBusiness, gst: e.target.value })}
            />
          </div>
          <Button onClick={handleAddBusiness} className="mt-4">Add Business</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved Businesses</CardTitle>
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
              {businesses.map((business) => (
                <TableRow key={business.id}>
                  {editId === String(business.id) ? (
                    <>
                      <TableCell>
                        <Input
                          value={editBusiness.name}
                          onChange={(e) => setEditBusiness({ ...editBusiness, name: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editBusiness.address}
                          onChange={(e) => setEditBusiness({ ...editBusiness, address: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editBusiness.gst}
                          onChange={(e) => setEditBusiness({ ...editBusiness, gst: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <Button size="sm" onClick={() => handleSaveEdit(String(business.id))}>Save</Button>
                        <Button size="sm" variant="outline" className="ml-2" onClick={handleCancelEdit}>Cancel</Button>
                        <Button size="sm" variant="destructive" className="ml-2" onClick={() => handleDelete(String(business.id))}>Delete</Button>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>{business.name}</TableCell>
                      <TableCell>{business.address}</TableCell>
                      <TableCell>{business.gst}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(business)}>Edit</Button>
                        <Button size="sm" variant="destructive" className="ml-2" onClick={() => handleDelete(String(business.id))}>Delete</Button>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessDetails;
