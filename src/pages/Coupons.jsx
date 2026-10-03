import { useEffect, useState } from "react";
import API from "../api/axios";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Power, X } from "lucide-react";

const emptyForm = {
  code: "",
  discountType: "percentage",
  discountValue: "",
  minPurchase: "0",
  maxDiscount: "",
  usageLimit: "",
  perUserLimit: "",
  startsAt: "",
  expiresAt: "",
  isActive: true,
};

export default function Coupons() {
  const [coupons,setCoupons]=useState([]);
  const [loading,setLoading]=useState(true);
  const [show,setShow]=useState(false);
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState(emptyForm);
  const [saving,setSaving]=useState(false);

  const load=async()=>{
    try {
      const {data}=await API.get("/admin/coupons");
      if(data.success) setCoupons(data.data||[]);
    } catch(e){ toast.error(e.response?.data?.message||"Failed to load coupons"); }
    finally{setLoading(false);}
  };
  useEffect(()=>{load();},[]);

  const openCreate=()=>{setEditing(null);setForm(emptyForm);setShow(true);};
  const openEdit=(c)=>{
    const local=d=>d?new Date(d).toISOString().slice(0,16):"";
    setEditing(c);
    setForm({
      code:c.code||"", discountType:c.discountType||"percentage",
      discountValue:c.discountValue??"", minPurchase:c.minPurchase??0,
      maxDiscount:c.maxDiscount??"", usageLimit:c.usageLimit??"",
      perUserLimit:c.perUserLimit??"", startsAt:local(c.startsAt),
      expiresAt:local(c.expiresAt), isActive:c.isActive
    });
    setShow(true);
  };
  const change=e=>setForm({...form,[e.target.name]:e.target.value});
  const save=async e=>{
    e.preventDefault();setSaving(true);
    try {
      const payload={...form,
        discountValue:Number(form.discountValue),
        minPurchase:Number(form.minPurchase||0),
        maxDiscount:form.maxDiscount===""?null:Number(form.maxDiscount),
        usageLimit:form.usageLimit===""?null:Number(form.usageLimit),
        perUserLimit:form.perUserLimit===""?null:Number(form.perUserLimit),
      };
      const {data}=editing
        ? await API.put(`/admin/coupons/${editing._id}`,payload)
        : await API.post("/admin/coupons",payload);
      if(!data.success) throw new Error(data.message);
      toast.success(editing?"Coupon updated":"Coupon created");
      setShow(false);await load();
    } catch(e){toast.error(e.response?.data?.message||e.message||"Save failed");}
    finally{setSaving(false);}
  };
  const toggle=async id=>{
    try{const {data}=await API.patch(`/admin/coupons/${id}/toggle`);toast.success(data.message);load();}
    catch(e){toast.error(e.response?.data?.message||"Update failed");}
  };
  const remove=async id=>{
    if(!window.confirm("Delete this coupon?")) return;
    try{await API.delete(`/admin/coupons/${id}`);toast.success("Coupon deleted");load();}
    catch(e){toast.error(e.response?.data?.message||"Delete failed");}
  };

  return <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div><h1 className="text-2xl font-bold text-gray-900">Coupons</h1><p className="text-sm text-gray-500 mt-1">Create and control promotional discounts</p></div>
      <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"><Plus className="w-4 h-4"/>Create Coupon</button>
    </div>

    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {loading?<div className="h-48 grid place-items-center text-gray-400">Loading...</div>:
      <div className="overflow-x-auto"><table className="w-full text-sm">
        <thead className="bg-gray-50 border-b"><tr>
          {["Code","Discount","Limits","Validity","Used","Status","Actions"].map(x=><th key={x} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{x}</th>)}
        </tr></thead>
        <tbody className="divide-y">
          {coupons.map(c=><tr key={c._id} className="hover:bg-gray-50">
            <td className="px-5 py-4 font-bold">{c.code}</td>
            <td className="px-5 py-4">{c.discountType==="percentage"?`${c.discountValue}%`:`₹${c.discountValue}`}{c.maxDiscount!=null&&c.discountType==="percentage"?<span className="block text-xs text-gray-400">Max ₹{c.maxDiscount}</span>:null}</td>
            <td className="px-5 py-4 text-xs text-gray-600"><div>Min: ₹{c.minPurchase||0}</div><div>Total: {c.usageLimit??"∞"} · User: {c.perUserLimit??"∞"}</div></td>
            <td className="px-5 py-4 text-xs text-gray-600">{c.startsAt?new Date(c.startsAt).toLocaleDateString("en-IN"):"Now"} → {c.expiresAt?new Date(c.expiresAt).toLocaleDateString("en-IN"):"No expiry"}</td>
            <td className="px-5 py-4">{c.usedCount||c.usageRecords||0}</td>
            <td className="px-5 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${c.isActive?"bg-green-100 text-green-700":"bg-gray-100 text-gray-600"}`}>{c.isActive?"Active":"Paused"}</span></td>
            <td className="px-5 py-4"><div className="flex gap-1">
              <button title="Edit" onClick={()=>openEdit(c)} className="p-2 rounded hover:bg-blue-50 text-gray-500 hover:text-blue-600"><Pencil className="w-4 h-4"/></button>
              <button title={c.isActive?"Pause":"Activate"} onClick={()=>toggle(c._id)} className="p-2 rounded hover:bg-amber-50 text-gray-500 hover:text-amber-600"><Power className="w-4 h-4"/></button>
              <button title="Delete" onClick={()=>remove(c._id)} className="p-2 rounded hover:bg-red-50 text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
            </div></td>
          </tr>)}
          {!coupons.length&&<tr><td colSpan="7" className="py-14 text-center text-gray-400">No coupons created yet.</td></tr>}
        </tbody>
      </table></div>}
    </div>

    {show&&<div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
      <form onSubmit={save} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div className="flex justify-between items-center"><div><h2 className="text-xl font-bold">{editing?"Edit Coupon":"Create Coupon"}</h2><p className="text-xs text-gray-500">All pricing rules are enforced by the API.</p></div><button type="button" onClick={()=>setShow(false)}><X/></button></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="text-sm font-medium">Code<input required name="code" value={form.code} onChange={change} className="mt-1 w-full border rounded-lg px-3 py-2 uppercase" /></label>
          <label className="text-sm font-medium">Discount Type<select name="discountType" value={form.discountType} onChange={change} className="mt-1 w-full border rounded-lg px-3 py-2"><option value="percentage">Percentage</option><option value="fixed">Fixed Amount</option></select></label>
          <label className="text-sm font-medium">Discount Value<input required type="number" min="0.01" step="0.01" name="discountValue" value={form.discountValue} onChange={change} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
          <label className="text-sm font-medium">Minimum Purchase<input type="number" min="0" step="0.01" name="minPurchase" value={form.minPurchase} onChange={change} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
          {form.discountType==="percentage"&&<label className="text-sm font-medium">Maximum Discount<input type="number" min="0" step="0.01" name="maxDiscount" value={form.maxDiscount} onChange={change} placeholder="Unlimited" className="mt-1 w-full border rounded-lg px-3 py-2" /></label>}
          <label className="text-sm font-medium">Total Usage Limit<input type="number" min="1" name="usageLimit" value={form.usageLimit} onChange={change} placeholder="Unlimited" className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
          <label className="text-sm font-medium">Per User Limit<input type="number" min="1" name="perUserLimit" value={form.perUserLimit} onChange={change} placeholder="Unlimited" className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
          <label className="text-sm font-medium">Start Date<input type="datetime-local" name="startsAt" value={form.startsAt} onChange={change} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
          <label className="text-sm font-medium">Expiry Date<input type="datetime-local" name="expiresAt" value={form.expiresAt} onChange={change} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
          <label className="sm:col-span-2 flex items-center gap-2 text-sm font-medium"><input type="checkbox" name="isActive" checked={form.isActive} onChange={e=>setForm({...form,isActive:e.target.checked})}/> Active</label>
        </div>
        <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={()=>setShow(false)} className="px-4 py-2 rounded-lg border">Cancel</button><button disabled={saving} className="px-5 py-2 rounded-lg bg-primary-600 text-white font-semibold disabled:opacity-60">{saving?"Saving...":editing?"Update Coupon":"Create Coupon"}</button></div>
      </form>
    </div>}
  </div>;
}
