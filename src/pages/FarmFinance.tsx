import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Pencil, Plus, Trash2, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { Link } from "@/lib/router-compat";
import {
  EXPENSE_CATEGORIES, byCategory, byCrop, byMonth, expenseSchema, formatINR, inRange, incomeSchema, saleTotal, summarize,
  type Expense, type Income,
} from "@/lib/finance";

type Dict = Record<string, [string, string, string]>; // english, hindi, marathi
const D: Dict = {
  title: ["Expenses & Profit", "खर्च और मुनाफा", "खर्च आणि नफा"],
  dashboard: ["Dashboard", "डैशबोर्ड", "डॅशबोर्ड"],
  expenses: ["Expenses", "खर्च", "खर्च"],
  income: ["Income", "आय", "उत्पन्न"],
  totalExp: ["Total expenses", "कुल खर्च", "एकूण खर्च"],
  totalInc: ["Total income", "कुल आय", "एकूण उत्पन्न"],
  net: ["Net profit / loss", "शुद्ध लाभ / हानि", "निव्वळ नफा / तोटा"],
  from: ["From", "से", "पासून"], to: ["To", "तक", "पर्यंत"], clear: ["Clear", "साफ़ करें", "साफ करा"],
  byCrop: ["Crop-wise profit / loss", "फसलवार लाभ / हानि", "पीकनिहाय नफा / तोटा"],
  monthly: ["Monthly income vs expenses", "मासिक आय बनाम खर्च", "मासिक उत्पन्न विरुद्ध खर्च"],
  catBreak: ["Expense by category", "श्रेणी अनुसार खर्च", "प्रकारानुसार खर्च"],
  addExp: ["Add expense", "खर्च जोड़ें", "खर्च जोडा"], addInc: ["Add sale", "बिक्री जोड़ें", "विक्री जोडा"],
  edit: ["Edit", "बदलें", "बदला"], save: ["Save", "सहेजें", "जतन करा"], cancel: ["Cancel", "रद्द करें", "रद्द करा"],
  del: ["Delete", "हटाएं", "हटवा"], confirmDel: ["Delete this record?", "यह रिकॉर्ड हटाएं?", "ही नोंद हटवायची?"],
  confirmDelBody: ["This cannot be undone.", "इसे वापस नहीं किया जा सकता।", "हे परत करता येणार नाही."],
  crop: ["Crop name", "फसल का नाम", "पिकाचे नाव"], farm: ["Farm name", "खेत का नाम", "शेताचे नाव"],
  category: ["Category", "श्रेणी", "प्रकार"], amount: ["Amount (₹)", "राशि (₹)", "रक्कम (₹)"],
  date: ["Date", "तारीख", "तारीख"], qty: ["Quantity", "मात्रा", "प्रमाण"], notes: ["Notes", "टिप्पणी", "टीप"],
  qtySold: ["Quantity sold", "बेची गई मात्रा", "विकलेले प्रमाण"], unit: ["Unit", "इकाई", "एकक"],
  price: ["Price per unit (₹)", "प्रति इकाई मूल्य (₹)", "प्रति एकक दर (₹)"], total: ["Total", "कुल", "एकूण"],
  market: ["Market name", "मंडी का नाम", "बाजाराचे नाव"],
  empty: ["No records yet. Add your first one.", "अभी कोई रिकॉर्ड नहीं। पहला जोड़ें।", "अजून नोंदी नाहीत. पहिली नोंद जोडा."],
  saved: ["Saved", "सहेजा गया", "जतन केले"], deleted: ["Deleted", "हटाया गया", "हटवले"],
  error: ["Something went wrong", "कुछ गलत हुआ", "काहीतरी चुकले"],
  invalid: ["Please check the highlighted fields", "कृपया भरे गए विवरण जांचें", "कृपया भरलेली माहिती तपासा"],
  login: ["Please log in to track your farm money", "अपना खेत हिसाब रखने के लिए लॉगिन करें", "शेताचा हिशोब ठेवण्यासाठी लॉगिन करा"],
  loginBtn: ["Login", "लॉगिन", "लॉगिन"],
  seeds: ["Seeds", "बीज", "बियाणे"], fertilizers: ["Fertilizers", "खाद", "खते"], pesticides: ["Pesticides", "कीटनाशक", "कीटकनाशके"],
  labor: ["Labor", "मजदूरी", "मजुरी"], irrigation: ["Irrigation", "सिंचाई", "सिंचन"], machinery: ["Machinery", "मशीनरी", "यंत्रसामग्री"],
  transportation: ["Transport", "परिवहन", "वाहतूक"], other: ["Other", "अन्य", "इतर"],
  kg: ["kg", "किलो", "किलो"], quintal: ["quintal", "क्विंटल", "क्विंटल"],
};
const idx: Record<Language, number> = { english: 0, hindi: 1, marathi: 2 };
const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--secondary))", "hsl(var(--destructive))", "hsl(var(--muted-foreground))", "hsl(var(--ring))", "hsl(var(--chart-1, var(--primary)))", "hsl(var(--foreground))"];
const today = () => new Date().toISOString().slice(0, 10);

type ExpForm = { id?: string; crop_name: string; farm_name: string; category: string; amount: string; expense_date: string; quantity: string; notes: string };
type IncForm = { id?: string; crop_name: string; quantity: string; unit: string; price_per_unit: string; sale_date: string; market_name: string; notes: string };
const emptyExp = (): ExpForm => ({ crop_name: "", farm_name: "", category: "seeds", amount: "", expense_date: today(), quantity: "", notes: "" });
const emptyInc = (): IncForm => ({ crop_name: "", quantity: "", unit: "quintal", price_per_unit: "", sale_date: today(), market_name: "", notes: "" });

export default function FarmFinance() {
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const L = (k: string) => D[k]?.[idx[language] ?? 0] ?? k;
  const qc = useQueryClient();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [expForm, setExpForm] = useState<ExpForm | null>(null);
  const [incForm, setIncForm] = useState<IncForm | null>(null);
  const [toDelete, setToDelete] = useState<{ table: "farm_expenses" | "farm_income"; id: string } | null>(null);
  const [errors, setErrors] = useState<Set<string>>(new Set());

  const expQ = useQuery({
    queryKey: ["farm_expenses", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("farm_expenses").select("*").order("expense_date", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r: Expense) => ({ ...r, amount: Number(r.amount) })) as Expense[];
    },
  });
  const incQ = useQuery({
    queryKey: ["farm_income", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("farm_income").select("*").order("sale_date", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r: Income) => ({ ...r, quantity: Number(r.quantity), price_per_unit: Number(r.price_per_unit), total_amount: Number(r.total_amount) })) as Income[];
    },
  });

  const exps = useMemo(() => (expQ.data ?? []).filter((e) => inRange(e.expense_date, from, to)), [expQ.data, from, to]);
  const incs = useMemo(() => (incQ.data ?? []).filter((i) => inRange(i.sale_date, from, to)), [incQ.data, from, to]);
  const sum = summarize(exps, incs);
  const crops = byCrop(exps, incs);
  const months = byMonth(exps, incs);
  const cats = byCategory(exps).map((c) => ({ ...c, name: L(c.category) }));

  const fail = (e: unknown) => { console.error(e); toast.error(L("error")); };
  const done = (table: string) => { qc.invalidateQueries({ queryKey: [table] }); toast.success(L("saved")); };

  const saveExp = useMutation({
    mutationFn: async (f: ExpForm) => {
      const p = expenseSchema.parse(f);
      const row = { ...p, farm_name: p.farm_name || null, quantity: p.quantity || null, notes: p.notes || null };
      const { error } = f.id ? await supabase.from("farm_expenses").update(row).eq("id", f.id) : await supabase.from("farm_expenses").insert(row);
      if (error) throw error;
    },
    onSuccess: () => { done("farm_expenses"); setExpForm(null); }, onError: fail,
  });
  const saveInc = useMutation({
    mutationFn: async (f: IncForm) => {
      const p = incomeSchema.parse(f);
      const row = { ...p, market_name: p.market_name || null, notes: p.notes || null };
      const { error } = f.id ? await supabase.from("farm_income").update(row).eq("id", f.id) : await supabase.from("farm_income").insert(row);
      if (error) throw error;
    },
    onSuccess: () => { done("farm_income"); setIncForm(null); }, onError: fail,
  });
  const remove = useMutation({
    mutationFn: async (d: { table: string; id: string }) => {
      const { error } = await supabase.from(d.table).delete().eq("id", d.id);
      if (error) throw error;
      return d.table;
    },
    onSuccess: (table) => { qc.invalidateQueries({ queryKey: [table] }); toast.success(L("deleted")); setToDelete(null); }, onError: fail,
  });

  const submitExp = () => {
    const r = expenseSchema.safeParse(expForm);
    if (!r.success) { setErrors(new Set(r.error.issues.map((i) => String(i.path[0])))); toast.error(L("invalid")); return; }
    setErrors(new Set()); saveExp.mutate(expForm!);
  };
  const submitInc = () => {
    const r = incomeSchema.safeParse(incForm);
    if (!r.success) { setErrors(new Set(r.error.issues.map((i) => String(i.path[0])))); toast.error(L("invalid")); return; }
    setErrors(new Set()); saveInc.mutate(incForm!);
  };
  const err = (k: string) => (errors.has(k) ? "border-destructive" : "");

  if (loading) return <AppLayout title={L("title")}><div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div></AppLayout>;
  if (!user) return (
    <AppLayout title={L("title")}>
      <div className="p-6 text-center space-y-4">
        <Wallet className="mx-auto h-12 w-12 text-primary" />
        <p className="text-muted-foreground">{L("login")}</p>
        <Button asChild><Link to="/auth">{L("loginBtn")}</Link></Button>
      </div>
    </AppLayout>
  );

  const isLoading = expQ.isLoading || incQ.isLoading;
  const Empty = () => <p className="py-8 text-center text-sm text-muted-foreground">{L("empty")}</p>;

  return (
    <AppLayout title={L("title")}>
      <div className="mx-auto max-w-5xl space-y-4 p-4">
        <div className="flex flex-wrap items-end gap-2">
          <div><Label className="text-xs">{L("from")}</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><Label className="text-xs">{L("to")}</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          {(from || to) && <Button variant="ghost" onClick={() => { setFrom(""); setTo(""); }}>{L("clear")}</Button>}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">{L("totalInc")}</p><p className="text-xl font-bold text-primary">{formatINR(sum.totalIncome)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">{L("totalExp")}</p><p className="text-xl font-bold text-destructive">{formatINR(sum.totalExpenses)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">{L("net")}</p><p className={`text-xl font-bold ${sum.net >= 0 ? "text-primary" : "text-destructive"}`}>{formatINR(sum.net)}</p></CardContent></Card>
        </div>

        {isLoading ? <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
          <Tabs defaultValue="dashboard">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dashboard">{L("dashboard")}</TabsTrigger>
              <TabsTrigger value="expenses">{L("expenses")}</TabsTrigger>
              <TabsTrigger value="income">{L("income")}</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-4">
              {exps.length + incs.length === 0 ? <Card><CardContent><Empty /></CardContent></Card> : (<>
                <Card><CardHeader><CardTitle className="text-base">{L("monthly")}</CardTitle></CardHeader><CardContent className="h-64">
                  <ResponsiveContainer><BarChart data={months}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" fontSize={11} /><YAxis fontSize={11} /><Tooltip formatter={(v: number) => formatINR(v)} /><Legend />
                    <Bar dataKey="income" name={L("income")} fill="hsl(var(--primary))" /><Bar dataKey="expenses" name={L("expenses")} fill="hsl(var(--destructive))" /></BarChart></ResponsiveContainer>
                </CardContent></Card>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card><CardHeader><CardTitle className="text-base">{L("catBreak")}</CardTitle></CardHeader><CardContent className="h-64">
                    {cats.length === 0 ? <Empty /> : <ResponsiveContainer><PieChart><Pie data={cats} dataKey="value" nameKey="name" outerRadius={80} label={(d) => d.name}>{cats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={(v: number) => formatINR(v)} /></PieChart></ResponsiveContainer>}
                  </CardContent></Card>
                  <Card><CardHeader><CardTitle className="text-base">{L("byCrop")}</CardTitle></CardHeader><CardContent className="space-y-2">
                    {crops.map((c) => (
                      <div key={c.crop} className="flex items-center justify-between rounded-lg border border-border p-2 text-sm">
                        <div><p className="font-medium">{c.crop}</p><p className="text-xs text-muted-foreground">{formatINR(c.income)} − {formatINR(c.expenses)}</p></div>
                        <span className={`font-bold ${c.profit >= 0 ? "text-primary" : "text-destructive"}`}>{formatINR(c.profit)}</span>
                      </div>))}
                  </CardContent></Card>
                </div>
              </>)}
            </TabsContent>

            <TabsContent value="expenses" className="space-y-2">
              <Button onClick={() => { setErrors(new Set()); setExpForm(emptyExp()); }}><Plus className="mr-1 h-4 w-4" />{L("addExp")}</Button>
              {exps.length === 0 ? <Empty /> : exps.map((e) => (
                <Card key={e.id}><CardContent className="flex items-center justify-between gap-2 p-3">
                  <div className="min-w-0"><p className="font-medium">{e.crop_name} · {L(e.category)}</p>
                    <p className="truncate text-xs text-muted-foreground">{e.expense_date}{e.farm_name ? ` · ${e.farm_name}` : ""}{e.quantity ? ` · ${e.quantity}` : ""}{e.notes ? ` · ${e.notes}` : ""}</p></div>
                  <div className="flex shrink-0 items-center gap-1"><span className="font-bold text-destructive">{formatINR(e.amount)}</span>
                    <Button size="icon" variant="ghost" aria-label={L("edit")} onClick={() => { setErrors(new Set()); setExpForm({ id: e.id, crop_name: e.crop_name, farm_name: e.farm_name ?? "", category: e.category, amount: String(e.amount), expense_date: e.expense_date, quantity: e.quantity ?? "", notes: e.notes ?? "" }); }}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" aria-label={L("del")} onClick={() => setToDelete({ table: "farm_expenses", id: e.id })}><Trash2 className="h-4 w-4" /></Button></div>
                </CardContent></Card>))}
            </TabsContent>

            <TabsContent value="income" className="space-y-2">
              <Button onClick={() => { setErrors(new Set()); setIncForm(emptyInc()); }}><Plus className="mr-1 h-4 w-4" />{L("addInc")}</Button>
              {incs.length === 0 ? <Empty /> : incs.map((i) => (
                <Card key={i.id}><CardContent className="flex items-center justify-between gap-2 p-3">
                  <div className="min-w-0"><p className="font-medium">{i.crop_name} · {i.quantity} {L(i.unit)} × {formatINR(i.price_per_unit)}</p>
                    <p className="truncate text-xs text-muted-foreground">{i.sale_date}{i.market_name ? ` · ${i.market_name}` : ""}{i.notes ? ` · ${i.notes}` : ""}</p></div>
                  <div className="flex shrink-0 items-center gap-1"><span className="font-bold text-primary">{formatINR(i.total_amount)}</span>
                    <Button size="icon" variant="ghost" aria-label={L("edit")} onClick={() => { setErrors(new Set()); setIncForm({ id: i.id, crop_name: i.crop_name, quantity: String(i.quantity), unit: i.unit, price_per_unit: String(i.price_per_unit), sale_date: i.sale_date, market_name: i.market_name ?? "", notes: i.notes ?? "" }); }}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" aria-label={L("del")} onClick={() => setToDelete({ table: "farm_income", id: i.id })}><Trash2 className="h-4 w-4" /></Button></div>
                </CardContent></Card>))}
            </TabsContent>
          </Tabs>
        )}
      </div>

      <Dialog open={!!expForm} onOpenChange={(o) => !o && setExpForm(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{expForm?.id ? L("edit") : L("addExp")}</DialogTitle></DialogHeader>
          {expForm && <div className="space-y-3">
            <div><Label>{L("crop")} *</Label><Input className={err("crop_name")} maxLength={100} value={expForm.crop_name} onChange={(e) => setExpForm({ ...expForm, crop_name: e.target.value })} /></div>
            <div><Label>{L("farm")}</Label><Input maxLength={100} value={expForm.farm_name} onChange={(e) => setExpForm({ ...expForm, farm_name: e.target.value })} /></div>
            <div><Label>{L("category")} *</Label><Select value={expForm.category} onValueChange={(v) => setExpForm({ ...expForm, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{L(c)}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>{L("amount")} *</Label><Input className={err("amount")} type="number" min="0" step="0.01" inputMode="decimal" value={expForm.amount} onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })} /></div>
              <div><Label>{L("date")} *</Label><Input className={err("expense_date")} type="date" value={expForm.expense_date} onChange={(e) => setExpForm({ ...expForm, expense_date: e.target.value })} /></div>
            </div>
            <div><Label>{L("qty")}</Label><Input maxLength={50} value={expForm.quantity} onChange={(e) => setExpForm({ ...expForm, quantity: e.target.value })} /></div>
            <div><Label>{L("notes")}</Label><Textarea maxLength={500} value={expForm.notes} onChange={(e) => setExpForm({ ...expForm, notes: e.target.value })} /></div>
          </div>}
          <DialogFooter><Button variant="outline" onClick={() => setExpForm(null)}>{L("cancel")}</Button><Button onClick={submitExp} disabled={saveExp.isPending}>{saveExp.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}{L("save")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!incForm} onOpenChange={(o) => !o && setIncForm(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{incForm?.id ? L("edit") : L("addInc")}</DialogTitle></DialogHeader>
          {incForm && <div className="space-y-3">
            <div><Label>{L("crop")} *</Label><Input className={err("crop_name")} maxLength={100} value={incForm.crop_name} onChange={(e) => setIncForm({ ...incForm, crop_name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>{L("qtySold")} *</Label><Input className={err("quantity")} type="number" min="0" step="0.01" inputMode="decimal" value={incForm.quantity} onChange={(e) => setIncForm({ ...incForm, quantity: e.target.value })} /></div>
              <div><Label>{L("unit")}</Label><Select value={incForm.unit} onValueChange={(v) => setIncForm({ ...incForm, unit: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="kg">{L("kg")}</SelectItem><SelectItem value="quintal">{L("quintal")}</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>{L("price")} *</Label><Input className={err("price_per_unit")} type="number" min="0" step="0.01" inputMode="decimal" value={incForm.price_per_unit} onChange={(e) => setIncForm({ ...incForm, price_per_unit: e.target.value })} /></div>
              <div><Label>{L("date")} *</Label><Input className={err("sale_date")} type="date" value={incForm.sale_date} onChange={(e) => setIncForm({ ...incForm, sale_date: e.target.value })} /></div>
            </div>
            <p className="rounded-lg bg-muted p-2 text-sm">{L("total")}: <b>{formatINR(saleTotal(Number(incForm.quantity) || 0, Number(incForm.price_per_unit) || 0))}</b></p>
            <div><Label>{L("market")}</Label><Input maxLength={100} value={incForm.market_name} onChange={(e) => setIncForm({ ...incForm, market_name: e.target.value })} /></div>
            <div><Label>{L("notes")}</Label><Textarea maxLength={500} value={incForm.notes} onChange={(e) => setIncForm({ ...incForm, notes: e.target.value })} /></div>
          </div>}
          <DialogFooter><Button variant="outline" onClick={() => setIncForm(null)}>{L("cancel")}</Button><Button onClick={submitInc} disabled={saveInc.isPending}>{saveInc.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}{L("save")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{L("confirmDel")}</AlertDialogTitle><AlertDialogDescription>{L("confirmDelBody")}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{L("cancel")}</AlertDialogCancel><AlertDialogAction onClick={(e) => { e.preventDefault(); if (toDelete) remove.mutate(toDelete); }}>{L("del")}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
