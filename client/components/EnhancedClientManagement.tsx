import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Users,
  Edit3,
  Trash2,
  Plus,
  Search,
  AlertTriangle,
  Building,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { User } from "@shared/types";

interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  totalJobs: number;
  totalValue: number;
  status: "active" | "inactive";
  createdAt: string;
  notes: string;
}

interface EnhancedClientManagementProps {
  currentUser: User;
}

export function EnhancedClientManagement({
  currentUser,
}: EnhancedClientManagementProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editForm, setEditForm] = useState<Partial<Client>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const isAdmin = currentUser.role === "admin";

  useEffect(() => {
    if (isAdmin) {
      fetchClients();
    }
  }, [isAdmin]);

  const fetchClients = async () => {
    // Mock client data
    const mockClients: Client[] = [
      {
        id: "1",
        name: "John Smith",
        company: "ABC Corporation",
        email: "john@abc.com",
        phone: "+27 11 123 4567",
        address: "123 Business Street",
        city: "Johannesburg",
        totalJobs: 12,
        totalValue: 45000,
        status: "active",
        createdAt: "2024-01-15",
        notes: "VIP client, always pays on time",
      },
      {
        id: "2",
        name: "Sarah Johnson",
        company: "XYZ Holdings",
        email: "sarah@xyz.com",
        phone: "+27 21 987 6543",
        address: "456 Corporate Ave",
        city: "Cape Town",
        totalJobs: 8,
        totalValue: 32000,
        status: "active",
        createdAt: "2024-02-20",
        notes: "Prefers morning appointments",
      },
      {
        id: "3",
        name: "Mike Wilson",
        company: "Wilson Industries",
        email: "mike@wilson.com",
        phone: "+27 11 555 1234",
        address: "789 Industrial Park",
        city: "Johannesburg",
        totalJobs: 5,
        totalValue: 18500,
        status: "inactive",
        createdAt: "2024-03-10",
        notes: "Large property, multiple units",
      },
    ];
    setClients(mockClients);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setEditForm(client);
    setShowEditModal(true);
  };

  const handleDeleteClient = (client: Client) => {
    setSelectedClient(client);
    setShowDeleteModal(true);
    setDeleteConfirmText("");
  };

  const handleSaveClient = () => {
    if (selectedClient?.id) {
      setClients((prev) =>
        prev.map((client) =>
          client.id === selectedClient.id ? { ...client, ...editForm } : client,
        ),
      );
    } else {
      // Add new client
      const newClient: Client = {
        id: Date.now().toString(),
        name: editForm.name || "",
        company: editForm.company || "",
        email: editForm.email || "",
        phone: editForm.phone || "",
        address: editForm.address || "",
        city: editForm.city || "",
        totalJobs: 0,
        totalValue: 0,
        status: "active",
        createdAt: new Date().toISOString().split("T")[0],
        notes: editForm.notes || "",
      };
      setClients((prev) => [...prev, newClient]);
    }

    setShowEditModal(false);
    setSelectedClient(null);
    setEditForm({});
  };

  const confirmDeleteClient = () => {
    if (deleteConfirmText === "top sarturious ur" && selectedClient) {
      setClients((prev) =>
        prev.filter((client) => client.id !== selectedClient.id),
      );
      setShowDeleteModal(false);
      setSelectedClient(null);
      setDeleteConfirmText("");
    }
  };

  const handleAddClient = () => {
    setSelectedClient(null);
    setEditForm({});
    setShowEditModal(true);
  };

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getClientStats = () => {
    const totalClients = clients.length;
    const activeClients = clients.filter((c) => c.status === "active").length;
    const totalValue = clients.reduce(
      (sum, client) => sum + client.totalValue,
      0,
    );
    const avgValue = totalClients > 0 ? totalValue / totalClients : 0;

    return { totalClients, activeClients, totalValue, avgValue };
  };

  const stats = getClientStats();

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Access Restricted
          </h3>
          <p className="text-gray-600">
            Client Management is only accessible to administrators.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Client Management
          </h2>
          <p className="text-gray-600">
            Manage client information and relationships
          </p>
        </div>
        <Button onClick={handleAddClient}>
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Clients</p>
                <p className="text-xl font-bold text-blue-600">
                  {stats.totalClients}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Clients</p>
                <p className="text-xl font-bold text-green-600">
                  {stats.activeClients}
                </p>
              </div>
              <Building className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-xl font-bold text-purple-600">
                  R{stats.totalValue.toFixed(2)}
                </p>
              </div>
              <Phone className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Value</p>
                <p className="text-xl font-bold text-orange-600">
                  R{stats.avgValue.toFixed(2)}
                </p>
              </div>
              <Mail className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search clients by name, company, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Client Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Details</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Jobs</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{client.name}</span>
                      <span className="text-sm text-gray-600">
                        {client.company}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span className="text-sm">{client.email}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span className="text-sm">{client.phone}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <div className="flex flex-col">
                        <span className="text-sm">{client.address}</span>
                        <span className="text-xs text-gray-600">
                          {client.city}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{client.totalJobs}</TableCell>
                  <TableCell className="font-medium">
                    R{client.totalValue.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        client.status === "active" ? "default" : "secondary"
                      }
                    >
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClient(client)}
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteClient(client)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit/Add Client Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedClient ? "Edit Client" : "Add New Client"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Full Name</Label>
              <Input
                value={editForm.name || ""}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="John Smith"
              />
            </div>
            <div>
              <Label>Company</Label>
              <Input
                value={editForm.company || ""}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, company: e.target.value }))
                }
                placeholder="ABC Corporation"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={editForm.email || ""}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="john@abc.com"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={editForm.phone || ""}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="+27 11 123 4567"
              />
            </div>
            <div>
              <Label>Address</Label>
              <Input
                value={editForm.address || ""}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder="123 Business Street"
              />
            </div>
            <div>
              <Label>City</Label>
              <Input
                value={editForm.city || ""}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, city: e.target.value }))
                }
                placeholder="Johannesburg"
              />
            </div>
            <div className="col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={editForm.notes || ""}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Additional notes about the client..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveClient}>
              {selectedClient ? "Save Changes" : "Add Client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirm Client Deletion
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              You are about to delete <strong>{selectedClient?.name}</strong>{" "}
              from {selectedClient?.company}.
            </p>
            <p className="text-sm text-gray-600">
              This action cannot be undone. To confirm deletion, please type:
            </p>
            <div className="bg-gray-100 p-3 rounded font-mono text-sm">
              top sarturious ur
            </div>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type the confirmation text..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteClient}
              disabled={deleteConfirmText !== "top sarturious ur"}
            >
              Delete Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
