"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Filter,
  Download,
  MoreHorizontal,
  User,
  Phone,
  Mail,
  CreditCard,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { CostumeTypeLabels, PaymentStatus, type Registration } from "@/types";

// Real registrations from Main Black Star Tracker.xlsx - Registrations sheet
const mockRegistrations: Registration[] = [
  {
    id: "1",
    seasonId: "2026",
    firstName: "Zayne",
    lastName: "Walsh",
    age: 2.5,
    gender: "boy",
    costumeType: "boys_backline",
    style: "White Tank",
    topSize: "4T",
    bottomSize: "4T",
    bandSize: "Small",
    waist: '22"',
    shoeSize: "8",
    shoeCategory: "Toddler",
    addOns: "None",
    parentName: "Kim Walsh",
    parentPhone: "416-555-0101",
    registrationDate: new Date("2026-01-15"),
    paymentStatus: "paid",
    amountPaid: 300,
    balanceOwing: 0,
    notes: "",
    createdAt: new Date("2026-01-15"),
    updatedAt: new Date("2026-01-15"),
  },
  {
    id: "2",
    seasonId: "2026",
    firstName: "Caleeb",
    lastName: "Smith",
    age: 7,
    gender: "boy",
    costumeType: "boys_backline",
    style: "White T-Shirt",
    topSize: "L (10-12)",
    bottomSize: "M (8-9)",
    bandSize: "Large",
    waist: '1"',
    shoeSize: "N/A",
    parentName: "Chelsea Alphonso",
    parentPhone: "416-555-0102",
    registrationDate: new Date("2026-01-15"),
    paymentStatus: "paid",
    amountPaid: 300,
    balanceOwing: 0,
    notes: "",
    createdAt: new Date("2026-01-15"),
    updatedAt: new Date("2026-01-15"),
  },
  {
    id: "3",
    seasonId: "2026",
    firstName: "Ciara",
    lastName: "Walsh",
    age: 4,
    gender: "girl",
    costumeType: "girls_backline",
    style: "White Shorts",
    topSize: "S (6-7)",
    bottomSize: "S (6-7)",
    bandSize: "Small",
    girlsTopSize: "Small",
    waist: '21"',
    shoeSize: "12Y",
    shoeCategory: "Little Kid",
    addOns: "None",
    parentName: "Kali Walsh",
    parentPhone: "416-555-0103",
    registrationDate: new Date("2026-01-15"),
    paymentStatus: "paid",
    amountPaid: 300,
    balanceOwing: 0,
    notes: "",
    createdAt: new Date("2026-01-15"),
    updatedAt: new Date("2026-01-15"),
  },
  {
    id: "4",
    seasonId: "2026",
    firstName: "Emelia",
    lastName: "Fajardo",
    age: 7,
    gender: "girl",
    costumeType: "girls_backline",
    style: "White Shorts",
    topSize: "S (6-7)",
    bottomSize: "S (6-7)",
    bandSize: "Small",
    girlsTopSize: "Small",
    shoeSize: "N/A",
    addOns: "None",
    parentName: "Leeann Samuel",
    parentPhone: "416-555-0104",
    registrationDate: new Date("2026-01-15"),
    paymentStatus: "paid",
    amountPaid: 300,
    balanceOwing: 0,
    notes: "",
    createdAt: new Date("2026-01-15"),
    updatedAt: new Date("2026-01-15"),
  },
  {
    id: "5",
    seasonId: "2026",
    firstName: "Tristin",
    lastName: "Phillip",
    age: 7,
    gender: "boy",
    costumeType: "boys_backline",
    style: "White Tank",
    topSize: "M (8-9)",
    bottomSize: "M (8-9)",
    bandSize: "Small",
    waist: '25.5"',
    shoeSize: "N/A",
    addOns: "None",
    parentName: "Crystal Samuel",
    parentPhone: "416-555-0105",
    registrationDate: new Date("2026-01-15"),
    paymentStatus: "paid",
    amountPaid: 300,
    balanceOwing: 0,
    notes: "",
    createdAt: new Date("2026-01-15"),
    updatedAt: new Date("2026-01-15"),
  },
  {
    id: "6",
    seasonId: "2026",
    firstName: "Quintin",
    lastName: "Phillip",
    age: 6,
    gender: "boy",
    costumeType: "boys_backline",
    style: "White Tank",
    topSize: "S (6-7)",
    bottomSize: "S (6-7)",
    bandSize: "Small",
    waist: '23"',
    shoeSize: "N/A",
    addOns: "None",
    parentName: "Crystal Samuel",
    parentPhone: "416-555-0105",
    registrationDate: new Date("2026-01-15"),
    paymentStatus: "paid",
    amountPaid: 300,
    balanceOwing: 0,
    notes: "Sibling of Tristin",
    createdAt: new Date("2026-01-15"),
    updatedAt: new Date("2026-01-15"),
  },
  {
    id: "7",
    seasonId: "2026",
    firstName: "Olivia Jade",
    lastName: "Laidlaw",
    age: 2,
    gender: "girl",
    costumeType: "girls_backline",
    style: "White Shorts",
    topSize: "2T",
    bottomSize: "2T",
    bandSize: "Small",
    girlsTopSize: "Small",
    shoeSize: "N/A",
    addOns: "None",
    parentName: "Larissa Estrella",
    parentPhone: "416-555-0106",
    registrationDate: new Date("2026-01-15"),
    paymentStatus: "paid",
    amountPaid: 300,
    balanceOwing: 0,
    notes: "",
    createdAt: new Date("2026-01-15"),
    updatedAt: new Date("2026-01-15"),
  },
  {
    id: "8",
    seasonId: "2026",
    firstName: "Kaylaha",
    lastName: "",
    age: 4,
    gender: "girl",
    costumeType: "toddler_frontline",
    style: "White Shorts",
    topSize: "4T",
    bottomSize: "4T",
    bandSize: "Small",
    girlsTopSize: "Small",
    shoeSize: "12",
    shoeCategory: "Little Kid",
    addOns: "None",
    parentName: "Deon Dabideen",
    parentPhone: "416-555-0107",
    registrationDate: new Date("2026-01-15"),
    paymentStatus: "paid",
    amountPaid: 300,
    balanceOwing: 0,
    notes: "",
    createdAt: new Date("2026-01-15"),
    updatedAt: new Date("2026-01-15"),
  },
  {
    id: "9",
    seasonId: "2026",
    firstName: "Ava",
    lastName: "",
    age: 0,
    gender: "girl",
    costumeType: "girls_ultra_frontline",
    style: "Green Shorts",
    topSize: "Adult Small",
    bottomSize: "Adult Small",
    bandSize: "Large",
    girlsTopSize: "Extra Large",
    shoeSize: "8",
    shoeCategory: "Adult",
    addOns: "None",
    parentName: "Camille",
    parentPhone: "416-555-0108",
    registrationDate: new Date("2026-01-15"),
    paymentStatus: "paid",
    amountPaid: 450,
    balanceOwing: 0,
    notes: "",
    createdAt: new Date("2026-01-15"),
    updatedAt: new Date("2026-01-15"),
  },
  {
    id: "10",
    seasonId: "2026",
    firstName: "Mateo",
    lastName: "",
    age: 0,
    gender: "boy",
    costumeType: "boys_ultra_frontline",
    style: "White Tank",
    topSize: "Adult Small",
    bottomSize: "Adult Small",
    bandSize: "Large",
    shoeSize: "9",
    shoeCategory: "Adult",
    addOns: "None",
    parentName: "Camille",
    parentPhone: "416-555-0108",
    registrationDate: new Date("2026-01-15"),
    paymentStatus: "paid",
    amountPaid: 450,
    balanceOwing: 0,
    notes: "Sibling of Ava",
    createdAt: new Date("2026-01-15"),
    updatedAt: new Date("2026-01-15"),
  },
  {
    id: "11",
    seasonId: "2026",
    firstName: "Max",
    lastName: "",
    age: 0,
    gender: "boy",
    costumeType: "boys_ultra_frontline",
    style: "White Tank",
    topSize: "Adult Small",
    bottomSize: "Adult Small",
    bandSize: "Large",
    shoeSize: "5",
    shoeCategory: "Adult",
    addOns: "None",
    parentName: "Tamara",
    parentPhone: "416-555-0109",
    registrationDate: new Date("2026-01-15"),
    paymentStatus: "paid",
    amountPaid: 450,
    balanceOwing: 0,
    notes: "",
    createdAt: new Date("2026-01-15"),
    updatedAt: new Date("2026-01-15"),
  },
  {
    id: "12",
    seasonId: "2026",
    firstName: "Parker",
    lastName: "",
    age: 0,
    gender: "boy",
    costumeType: "boys_ultra_frontline",
    style: "White Tank",
    topSize: "Adult Small",
    bottomSize: "Adult Small",
    bandSize: "Large",
    addOns: "None",
    parentName: "Cindy",
    parentPhone: "416-555-0110",
    registrationDate: new Date("2026-01-15"),
    paymentStatus: "paid",
    amountPaid: 450,
    balanceOwing: 0,
    notes: "",
    createdAt: new Date("2026-01-15"),
    updatedAt: new Date("2026-01-15"),
  },
];

export default function RegistrationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [costumeFilter, setCostumeFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const filtered = mockRegistrations.filter((reg) => {
    const matchesSearch =
      `${reg.firstName} ${reg.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (reg.parentPhone?.includes(searchQuery) ?? false);
    
    const matchesCostume = costumeFilter === "all" || reg.costumeType === costumeFilter;
    const matchesPayment = paymentFilter === "all" || reg.paymentStatus === paymentFilter;
    
    return matchesSearch && matchesCostume && matchesPayment;
  });

  const getPaymentBadge = (status: PaymentStatus) => {
    switch (status) {
      case "paid":
        return <Badge className="badge-emerald">Paid</Badge>;
      case "partial":
        return <Badge className="badge-gold">Partial</Badge>;
      case "unpaid":
        return <Badge className="badge-crimson">Unpaid</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-header"
      >
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Registrations
          </h1>
          <p className="text-void-400 mt-1">
            {mockRegistrations.length} participants registered for 2026
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-void-700 text-void-300 hover:bg-void-800">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gold-btn">
                <Plus className="w-4 h-4 mr-2" />
                Add Registration
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-void-800/50 max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display text-xl gold-text">
                  New Registration
                </DialogTitle>
              </DialogHeader>
              <RegistrationForm onClose={() => setIsAddDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-void-500" />
          <Input
            placeholder="Search by name, parent, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="luxury-input pl-10"
          />
        </div>
        <Select value={costumeFilter} onValueChange={setCostumeFilter}>
          <SelectTrigger className="luxury-input w-full sm:w-[200px]">
            <Filter className="w-4 h-4 mr-2 text-void-500" />
            <SelectValue placeholder="Costume Type" />
          </SelectTrigger>
          <SelectContent className="bg-void-900 border-void-700">
            <SelectItem value="all">All Costumes</SelectItem>
            {Object.entries(CostumeTypeLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="luxury-input w-full sm:w-[180px]">
            <CreditCard className="w-4 h-4 mr-2 text-void-500" />
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent className="bg-void-900 border-void-700">
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Desktop Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="hidden md:block"
      >
        <Card className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="luxury-table w-full">
              <thead>
                <tr>
                  <th>Participant</th>
                  <th>Costume</th>
                  <th>Parent</th>
                  <th>Size</th>
                  <th>Payment</th>
                  <th>Balance</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((reg, index) => (
                  <motion.tr
                    key={reg.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="group cursor-pointer"
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gold-500/10 flex items-center justify-center border border-gold-500/20">
                          <User className="w-4 h-4 text-gold-400" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {reg.firstName} {reg.lastName}
                          </p>
                          <p className="text-xs text-void-500">
                            {reg.gender === "boy" ? "Boy" : "Girl"}, {reg.age} years
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm text-void-300">
                        {CostumeTypeLabels[reg.costumeType]}
                      </span>
                      <p className="text-xs text-void-500">{reg.style}</p>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-void-300">{reg.parentName}</span>
                      </div>
                      <p className="text-xs text-void-500">{reg.parentPhone}</p>
                    </td>
                    <td>
                      <span className="text-sm text-void-300">{reg.topSize}</span>
                      <p className="text-xs text-void-500">{reg.bandSize}</p>
                    </td>
                    <td>{getPaymentBadge(reg.paymentStatus)}</td>
                    <td>
                      <span className={cn("text-sm font-medium", reg.balanceOwing > 0 ? "text-crimson" : "text-emerald")}>
                        {formatCurrency(reg.balanceOwing)}
                      </span>
                    </td>
                    <td>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 text-void-500 hover:text-gold-400">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((reg, index) => (
          <motion.div
            key={reg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="glass-card p-4 rounded-lg border border-void-800/50"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold-500/10 flex items-center justify-center border border-gold-500/20">
                  <User className="w-5 h-5 text-gold-400" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {reg.firstName} {reg.lastName}
                  </p>
                  <p className="text-xs text-void-500">
                    {reg.gender === "boy" ? "Boy" : "Girl"}, {reg.age} years
                  </p>
                </div>
              </div>
              {getPaymentBadge(reg.paymentStatus)}
            </div>
            
            <div className="mt-3 pt-3 border-t border-void-800/50 grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-void-500 text-xs">Costume</p>
                <p className="text-void-300">{CostumeTypeLabels[reg.costumeType]}</p>
              </div>
              <div>
                <p className="text-void-500 text-xs">Style</p>
                <p className="text-void-300">{reg.style}</p>
              </div>
              <div>
                <p className="text-void-500 text-xs">Parent</p>
                <p className="text-void-300">{reg.parentName}</p>
              </div>
              <div>
                <p className="text-void-500 text-xs">Balance</p>
                <p className={cn("font-medium", reg.balanceOwing > 0 ? "text-crimson" : "text-emerald")}>
                  {formatCurrency(reg.balanceOwing)}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex flex-wrap gap-4 text-sm text-void-500"
      >
        <span>Total: <strong className="text-foreground">{filtered.length}</strong></span>
        <span>Paid: <strong className="text-emerald">{filtered.filter(r => r.paymentStatus === "paid").length}</strong></span>
        <span>Partial: <strong className="text-gold-400">{filtered.filter(r => r.paymentStatus === "partial").length}</strong></span>
        <span>Unpaid: <strong className="text-crimson">{filtered.filter(r => r.paymentStatus === "unpaid").length}</strong></span>
        <span className="ml-auto">
          Outstanding: <strong className="text-crimson">{formatCurrency(filtered.reduce((sum, r) => sum + r.balanceOwing, 0))}</strong>
        </span>
      </motion.div>
    </div>
  );
}

function RegistrationForm({ onClose }: { onClose: () => void }) {
  return (
    <form className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-void-300">First Name</Label>
          <Input className="luxury-input" placeholder="Enter first name" />
        </div>
        <div className="space-y-2">
          <Label className="text-void-300">Last Name</Label>
          <Input className="luxury-input" placeholder="Enter last name" />
        </div>
        <div className="space-y-2">
          <Label className="text-void-300">Age</Label>
          <Input type="number" className="luxury-input" placeholder="Enter age" />
        </div>
        <div className="space-y-2">
          <Label className="text-void-300">Gender</Label>
          <Select>
            <SelectTrigger className="luxury-input">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent className="bg-void-900 border-void-700">
              <SelectItem value="boy">Boy</SelectItem>
              <SelectItem value="girl">Girl</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-void-300">Costume Type</Label>
          <Select>
            <SelectTrigger className="luxury-input">
              <SelectValue placeholder="Select costume" />
            </SelectTrigger>
            <SelectContent className="bg-void-900 border-void-700">
              {Object.entries(CostumeTypeLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-void-300">Style</Label>
          <Input className="luxury-input" placeholder="e.g. White Tank" />
        </div>
        <div className="space-y-2">
          <Label className="text-void-300">Top Size</Label>
          <Input className="luxury-input" placeholder="e.g. 4T, S (6-7)" />
        </div>
        <div className="space-y-2">
          <Label className="text-void-300">Bottom Size</Label>
          <Input className="luxury-input" placeholder="e.g. 4T, M (8-9)" />
        </div>
        <div className="space-y-2">
          <Label className="text-void-300">Band Size</Label>
          <Select>
            <SelectTrigger className="luxury-input">
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent className="bg-void-900 border-void-700">
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="large">Large</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-void-300">Shoe Size</Label>
          <Input className="luxury-input" placeholder="e.g. 8 Toddler" />
        </div>
      </div>

      <div className="border-t border-void-800/50 pt-4">
        <h3 className="text-sm font-semibold text-void-300 mb-3">Parent Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-void-300">Parent Name</Label>
            <Input className="luxury-input" placeholder="Enter parent name" />
          </div>
          <div className="space-y-2">
            <Label className="text-void-300">Parent Email</Label>
            <Input type="email" className="luxury-input" placeholder="Enter email" />
          </div>
          <div className="space-y-2">
            <Label className="text-void-300">Parent Phone</Label>
            <Input className="luxury-input" placeholder="Enter phone number" />
          </div>
        </div>
      </div>

      <div className="border-t border-void-800/50 pt-4">
        <h3 className="text-sm font-semibold text-void-300 mb-3">Payment</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-void-300">Amount Paid</Label>
            <Input type="number" className="luxury-input" placeholder="0.00" />
          </div>
          <div className="space-y-2">
            <Label className="text-void-300">Total Cost</Label>
            <Input type="number" className="luxury-input" placeholder="300.00" />
          </div>
          <div className="space-y-2">
            <Label className="text-void-300">Payment Status</Label>
            <Select>
              <SelectTrigger className="luxury-input">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-void-900 border-void-700">
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="border-void-700 text-void-300">
          Cancel
        </Button>
        <Button type="submit" className="gold-btn">
          Save Registration
        </Button>
      </div>
    </form>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={cn("text-sm font-medium", className)}>{children}</label>;
}
