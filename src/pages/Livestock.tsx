import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Phone, MapPin, Plus, Trash2, PawPrint } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "@/lib/router-compat";
import { formatINR } from "@/lib/finance";

const ANIMALS = ["cow", "buffalo", "goat", "sheep", "bullock", "poultry", "other"] as const;
// [marathi, hindi, english]
const D: Record<string, [string, string, string]> = {
  title: ["जनावरे खरेदी-विक्री", "पशु खरीद-बिक्री", "Livestock Buy & Sell"],
  all: ["सर्व", "सभी", "All"], sell: ["विक्रीसाठी", "बिक्री के लिए", "For sale"], buy: ["खरेदी हवी", "खरीदना है", "Wanted"],
  post: ["जाहिरात टाका", "विज्ञापन डालें", "Post listing"], type: ["प्रकार", "प्रकार", "Type"],
  animal: ["जनावर", "पशु", "Animal"], breed: ["जात", "नस्ल", "Breed"], age: ["वय (वर्षे)", "उम्र (वर्ष)", "Age (years)"],
  price: ["किंमत (₹)", "कीमत (₹)", "Price (₹)"], location: ["गाव / जिल्हा", "गांव / जिला", "Village / District"],
  phone: ["मोबाईल नंबर", "मोबाइल नंबर", "Mobile number"], desc: ["माहिती", "विवरण", "Details"],
  save: ["जतन करा", "सेव करें", "Save"], cancel: ["रद्द", "रद्द", "Cancel"], call: ["कॉल करा", "कॉल करें", "Call"],
  empty: ["अजून जाहिराती नाहीत", "अभी कोई विज्ञापन नहीं", "No listings yet"], mine: ["माझी", "मेरी", "Mine"],
  login: ["जाहिराती पाहण्यासाठी लॉगिन करा", "विज्ञापन देखने के लिए लॉगिन करें", "Log in to view listings"],
  loginBtn: ["लॉगिन", "लॉगिन", "Log in"], saved: ["जाहिरात टाकली", "विज्ञापन डाला गया", "Listing posted"],
  deleted: ["हटवले", "हटाया गया", "Deleted"], invalid: ["कृपया माहिती तपासा", "कृपया जानकारी जांचें", "Please check the details"],
  error: ["काहीतरी चुकले", "कुछ गलत हुआ", "Something went wrong"],
  cow: ["गाय", "गाय", "Cow"], buffalo: ["म्हैस", "भैंस", "Buffalo"], goat: ["शेळी", "बकरी", "Goat"], sheep: ["मेंढी", "भेड़", "Sheep"],
  bullock: ["बैल", "बैल", "Bullock"], poultry: ["कोंबडी", "मुर्गी", "Poultry"], other: ["इतर", "अन्य", "Other"],
};
const idx: Record<string, number> = { marathi: 0, hindi: 1, english: 2 };

const schema = z.object({
  listing_type: z.enum(["sell", "buy"]),
  animal: z.enum(ANIMALS),
  breed: z.string().trim().max(60).optional(),
  age_years: z.coerce.number().min(0).max(40).optional(),
  price: z.coerce.number().min(0).max(10000000),
  location: z.string().trim().min(2).max(100),
  contact_phone: z.string().trim().regex(/^[6-9]\d{9}$/),
  description: z.string().trim().max(500).optional(),
});

type Form = { listing_type: "sell" | "buy"; animal: string; breed: string; age_years: string; price: string; location: string; contact_phone: string; description: string };
const empty = (): Form => ({ listing_type: "sell", animal: "cow", breed: "", age_years: "", price: "", location: "", contact_phone: "", description: "" });

export default function Livestock() {
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const L = (k: string) => D[k]?.[idx[language] ?? 0] ?? k;
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState<Form | null>(null);
  const [errors, setErrors] = useState<Set<string>>(new Set());

  const q = useQuery({
    queryKey: ["livestock_listings"], enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("livestock_listings").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async (row: z.infer<typeof schema>) => {
      const { error } = await supabase.from("livestock_listings").insert({ ...row, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["livestock_listings"] }); toast.success(L("saved")); setForm(null); },
    onError: () => toast.error(L("error")),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("livestock_listings").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["livestock_listings"] }); toast.success(L("deleted")); },
    onError: () => toast.error(L("error")),
  });

  const submit = () => {
    if (!form) return;
    const r = schema.safeParse({ ...form, breed: form.breed || undefined, age_years: form.age_years || undefined, description: form.description || undefined });
    if (!r.success) { setErrors(new Set(r.error.issues.map((i) => String(i.path[0])))); toast.error(L("invalid")); return; }
    setErrors(new Set());
    save.mutate(r.data);
  };

  if (loading) return <AppLayout title={L("title")}><div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div></AppLayout>;
  if (!user) return (
    <AppLayout title={L("title")}>
      <div className="space-y-4 p-10 text-center">
        <PawPrint className="mx-auto h-12 w-12 text-primary" />
        <p className="text-muted-foreground">{L("login")}</p>
        <Button asChild><Link to="/auth">{L("loginBtn")}</Link></Button>
      </div>
    </AppLayout>
  );

  const rows = (q.data ?? []).filter((r) => filter === "all" || (filter === "mine" ? r.user_id === user.id : r.listing_type === filter));
  const field = (k: keyof Form, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div><Label>{label}</Label><Input value={form![k]} onChange={(e) => setForm({ ...form!, [k]: e.target.value })} className={errors.has(k) ? "border-destructive" : ""} {...props} /></div>
  );

  return (
    <AppLayout title={L("title")}>
      <div className="mx-auto max-w-5xl space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
              {["all", "sell", "buy", "mine"].map((k) => <TabsTrigger key={k} value={k}>{L(k)}</TabsTrigger>)}
            </TabsList>
          </Tabs>
          <Button onClick={() => { setErrors(new Set()); setForm(empty()); }}><Plus className="h-4 w-4" />{L("post")}</Button>
        </div>

        {q.isLoading ? <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          : rows.length === 0 ? <p className="py-10 text-center text-muted-foreground">{L("empty")}</p>
          : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {rows.map((r) => (
                <Card key={r.id}>
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.listing_type === "sell" ? "bg-primary/10 text-primary" : "bg-accent text-accent-foreground"}`}>{L(r.listing_type)}</span>
                        <h3 className="mt-1 text-lg font-semibold">{L(r.animal)}{r.breed ? ` · ${r.breed}` : ""}</h3>
                      </div>
                      <p className="text-lg font-bold text-primary">{formatINR(Number(r.price))}</p>
                    </div>
                    {r.age_years != null && <p className="text-sm text-muted-foreground">{L("age")}: {r.age_years}</p>}
                    {r.description && <p className="text-sm">{r.description}</p>}
                    <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{r.location}</p>
                    <div className="flex gap-2 pt-1">
                      <Button asChild variant="outline" className="flex-1"><a href={`tel:${r.contact_phone}`}><Phone className="h-4 w-4" />{L("call")} {r.contact_phone}</a></Button>
                      {r.user_id === user.id && <Button variant="ghost" size="icon" onClick={() => del.mutate(r.id)} aria-label="delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
      </div>

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{L("post")}</DialogTitle></DialogHeader>
          {form && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><Label>{L("type")}</Label>
                <Select value={form.listing_type} onValueChange={(v) => setForm({ ...form, listing_type: v as Form["listing_type"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="sell">{L("sell")}</SelectItem><SelectItem value="buy">{L("buy")}</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>{L("animal")}</Label>
                <Select value={form.animal} onValueChange={(v) => setForm({ ...form, animal: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ANIMALS.map((a) => <SelectItem key={a} value={a}>{L(a)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {field("breed", L("breed"))}
              {field("age_years", L("age"), { type: "number", min: 0 })}
              {field("price", L("price"), { type: "number", min: 0 })}
              {field("contact_phone", L("phone"), { type: "tel", inputMode: "numeric", maxLength: 10 })}
              <div className="sm:col-span-2">{field("location", L("location"))}</div>
              <div className="sm:col-span-2"><Label>{L("desc")}</Label><Textarea value={form.description} maxLength={500} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>{L("cancel")}</Button>
            <Button onClick={submit} disabled={save.isPending}>{save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}{L("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
