import {
  createClassFeeStructure,
  createTransportLocation,
  getClassFeeStructures,
  getTransportLocations,
  updateClassFeeStructure,
  updateTransportLocation,
  type ClassFeePayload,
  type ClassFeeStructure,
  type TransportLocation,
  type TransportLocationPayload,
} from "@/api/adminApi/adminApi"
import axios from "axios"
import { BusFront, CheckCircle2, GraduationCap, Pencil, Plus, Save, X } from "lucide-react"
import { type FormEvent, useEffect, useState } from "react"

const currentAcademicYear = () => {
  const today = new Date()
  const startYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1
  return `${startYear}-${String(startYear + 1).slice(-2)}`
}

const emptyClassFee = (): ClassFeePayload => ({
  academic_year: currentAcademicYear(),
  class_name: "",
  monthly_school_fee: "",
  is_active: true,
})

const emptyTransportLocation = (): TransportLocationPayload => ({
  location_name: "",
  monthly_transport_fee: "",
  is_active: true,
})

const inputClassName =
  "mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-3 focus:ring-blue-100"

const apiError = (error: unknown) => {
  if (!axios.isAxiosError(error)) return "Something went wrong. Please try again."
  const data = error.response?.data
  if (typeof data?.detail === "string") return data.detail
  if (data && typeof data === "object") {
    const [field, messages] = Object.entries(data)[0] ?? []
    const message = Array.isArray(messages) ? messages[0] : messages
    if (typeof message === "string") return `${field.replaceAll("_", " ")}: ${message}`
  }
  return error.response ? "Please review the values and try again." : "Unable to reach the backend."
}

const ActiveBadge = ({ isActive }: { isActive: boolean }) => (
  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
    {isActive ? "Active" : "Inactive"}
  </span>
)

export const FeeConfigurationPage = () => {
  const [classFees, setClassFees] = useState<ClassFeeStructure[]>([])
  const [transportLocations, setTransportLocations] = useState<TransportLocation[]>([])
  const [classFeeForm, setClassFeeForm] = useState<ClassFeePayload>(emptyClassFee)
  const [transportForm, setTransportForm] = useState<TransportLocationPayload>(emptyTransportLocation)
  const [editingClassFeeId, setEditingClassFeeId] = useState<number | null>(null)
  const [editingLocationId, setEditingLocationId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingClass, setIsSavingClass] = useState(false)
  const [isSavingLocation, setIsSavingLocation] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const [classes, locations] = await Promise.all([
        getClassFeeStructures(),
        getTransportLocations(),
      ])
      setClassFees(classes)
      setTransportLocations(locations)
    } catch (loadError) {
      setError(apiError(loadError))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadSettings()
  }, [])

  const submitClassFee = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setNotice("")
    setIsSavingClass(true)
    try {
      const payload = {
        ...classFeeForm,
        academic_year: classFeeForm.academic_year.trim(),
        class_name: classFeeForm.class_name.trim(),
      }
      if (editingClassFeeId) {
        await updateClassFeeStructure(editingClassFeeId, payload)
        setNotice("Class fee updated. New student admissions will use this fee.")
      } else {
        await createClassFeeStructure(payload)
        setNotice("Class and monthly fee created. Students in this class can now be admitted.")
      }
      setClassFeeForm(emptyClassFee())
      setEditingClassFeeId(null)
      await loadSettings()
    } catch (saveError) {
      setError(apiError(saveError))
    } finally {
      setIsSavingClass(false)
    }
  }

  const submitTransportLocation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setNotice("")
    setIsSavingLocation(true)
    try {
      const payload = {
        ...transportForm,
        location_name: transportForm.location_name.trim(),
      }
      if (editingLocationId) {
        await updateTransportLocation(editingLocationId, payload)
        setNotice("Transport location fee updated. New admissions will use this fee.")
      } else {
        await createTransportLocation(payload)
        setNotice("Transport location created.")
      }
      setTransportForm(emptyTransportLocation())
      setEditingLocationId(null)
      await loadSettings()
    } catch (saveError) {
      setError(apiError(saveError))
    } finally {
      setIsSavingLocation(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-8">
      <header>
        <p className="text-sm font-semibold text-blue-600">Fee configuration</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Classes and transport fees</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-500 sm:text-base">Create classes, set their monthly school fee, and manage pickup locations. Each new student receives a current-month invoice from these settings.</p>
      </header>

      {notice && <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"><CheckCircle2 className="size-4" />{notice}</div>}
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
            <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><GraduationCap className="size-5" /></span><div><h3 className="font-semibold text-slate-900">Class fees</h3><p className="mt-0.5 text-sm text-slate-500">Creating a class here also sets its monthly school fee.</p></div></div>
          </div>
          <form className="border-b border-slate-100 p-5 sm:p-6" onSubmit={submitClassFee}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">Academic year<input className={inputClassName} onChange={(event) => setClassFeeForm((current) => ({ ...current, academic_year: event.target.value }))} placeholder="2026-27" required value={classFeeForm.academic_year} /></label>
              <label className="text-sm font-semibold text-slate-700">Class name<input className={inputClassName} onChange={(event) => setClassFeeForm((current) => ({ ...current, class_name: event.target.value }))} placeholder="e.g. 10" required value={classFeeForm.class_name} /></label>
              <label className="text-sm font-semibold text-slate-700">Monthly school fee (₹)<input className={inputClassName} min="0" onChange={(event) => setClassFeeForm((current) => ({ ...current, monthly_school_fee: event.target.value }))} required step="0.01" type="number" value={classFeeForm.monthly_school_fee} /></label>
              <label className="mt-6 flex items-center gap-2 text-sm font-semibold text-slate-700"><input checked={classFeeForm.is_active} onChange={(event) => setClassFeeForm((current) => ({ ...current, is_active: event.target.checked }))} type="checkbox" /> Active for admissions</label>
            </div>
            <div className="mt-5 flex flex-wrap gap-3"><button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60" disabled={isSavingClass} type="submit"><Save className="size-4" />{isSavingClass ? "Saving..." : editingClassFeeId ? "Update class fee" : "Create class fee"}</button>{editingClassFeeId && <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50" onClick={() => { setEditingClassFeeId(null); setClassFeeForm(emptyClassFee()) }} type="button"><X className="size-4" />Cancel edit</button>}</div>
          </form>
          <div className="divide-y divide-slate-100">
            {isLoading ? <p className="px-5 py-6 text-sm text-slate-500">Loading class fees…</p> : classFees.length === 0 ? <p className="px-5 py-6 text-sm text-slate-500">No classes configured yet.</p> : classFees.map((classFee) => <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6" key={classFee.id}><div><p className="font-semibold text-slate-800">Class {classFee.class_name} <span className="font-normal text-slate-400">· {classFee.academic_year}</span></p><p className="mt-1 text-sm text-slate-500">₹{classFee.monthly_school_fee} per month</p></div><div className="flex items-center gap-3"><ActiveBadge isActive={classFee.is_active} /><button aria-label={`Edit class ${classFee.class_name} fee`} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50" onClick={() => { setEditingClassFeeId(classFee.id); setClassFeeForm({ academic_year: classFee.academic_year, class_name: classFee.class_name, monthly_school_fee: classFee.monthly_school_fee, is_active: classFee.is_active }); setError(""); setNotice("") }} type="button"><Pencil className="size-4" /></button></div></div>)}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
            <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><BusFront className="size-5" /></span><div><h3 className="font-semibold text-slate-900">Transport locations</h3><p className="mt-0.5 text-sm text-slate-500">Begusarai-area locations are preloaded with ₹0 fees for you to set.</p></div></div>
          </div>
          <form className="border-b border-slate-100 p-5 sm:p-6" onSubmit={submitTransportLocation}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">Location name<input className={inputClassName} onChange={(event) => setTransportForm((current) => ({ ...current, location_name: event.target.value }))} placeholder="e.g. Barauni" required value={transportForm.location_name} /></label>
              <label className="text-sm font-semibold text-slate-700">Monthly transport fee (₹)<input className={inputClassName} min="0" onChange={(event) => setTransportForm((current) => ({ ...current, monthly_transport_fee: event.target.value }))} required step="0.01" type="number" value={transportForm.monthly_transport_fee} /></label>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input checked={transportForm.is_active} onChange={(event) => setTransportForm((current) => ({ ...current, is_active: event.target.checked }))} type="checkbox" /> Available for admissions</label>
            </div>
            <div className="mt-5 flex flex-wrap gap-3"><button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60" disabled={isSavingLocation} type="submit"><Plus className="size-4" />{isSavingLocation ? "Saving..." : editingLocationId ? "Update location" : "Create location"}</button>{editingLocationId && <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50" onClick={() => { setEditingLocationId(null); setTransportForm(emptyTransportLocation()) }} type="button"><X className="size-4" />Cancel edit</button>}</div>
          </form>
          <div className="divide-y divide-slate-100">
            {isLoading ? <p className="px-5 py-6 text-sm text-slate-500">Loading transport locations…</p> : transportLocations.length === 0 ? <p className="px-5 py-6 text-sm text-slate-500">No transport locations configured yet.</p> : transportLocations.map((location) => <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6" key={location.id}><div><p className="font-semibold text-slate-800">{location.location_name}</p><p className="mt-1 text-sm text-slate-500">₹{location.monthly_transport_fee} per month</p></div><div className="flex items-center gap-3"><ActiveBadge isActive={location.is_active} /><button aria-label={`Edit ${location.location_name}`} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50" onClick={() => { setEditingLocationId(location.id); setTransportForm({ location_name: location.location_name, monthly_transport_fee: location.monthly_transport_fee, is_active: location.is_active }); setError(""); setNotice("") }} type="button"><Pencil className="size-4" /></button></div></div>)}
          </div>
        </section>
      </div>
    </div>
  )
}
