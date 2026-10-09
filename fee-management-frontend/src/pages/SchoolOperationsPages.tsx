import {
  createAnnouncement,
  createSchoolHoliday,
  createSupportRequest,
  createTimetableEntry,
  getAnnouncements,
  getSchoolHolidays,
  getSupportRequests,
  getTimetableEntries,
  type SchoolAudience,
  type TimetableEntryPayload,
} from "@/api/adminApi/adminApi"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { Bell, BookOpen, CalendarDays, LoaderCircle, Megaphone, Send } from "lucide-react"
import { type FormEvent, type ReactNode, useMemo, useState } from "react"

const Card = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <section className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</section>
)

const PageHeader = ({ title, description, eyebrow = "School operations" }: { title: string; description: string; eyebrow?: string }) => (
  <header><p className="text-sm font-semibold text-blue-600">{eyebrow}</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h2><p className="mt-2 max-w-3xl text-sm text-slate-500 sm:text-base">{description}</p></header>
)

const Loading = () => <p className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500"><LoaderCircle className="size-4 animate-spin" /> Loading…</p>

const errorMessage = (error: unknown) => {
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

const ErrorBanner = ({ error }: { error: unknown }) => <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700" role="alert">{errorMessage(error)}</p>

const audienceLabel: Record<SchoolAudience, string> = {
  students: "Students",
  staff: "Staff",
  everyone: "Students & staff",
}

const audienceOptions = <><option value="students">Students</option><option value="staff">Staff</option><option value="everyone">Students & staff</option></>

const dateText = (value: string) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value.slice(0, 10)}T00:00:00`))

const currentAcademicYear = () => {
  const now = new Date()
  const start = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
  return `${start}-${String(start + 1).slice(-2)}`
}

const inputClass = "mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-3 focus:ring-blue-100"

export const AnnouncementManagementPage = () => {
  const client = useQueryClient()
  const [audience, setAudience] = useState<SchoolAudience>("everyone")
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const query = useQuery({ queryKey: ["announcements"], queryFn: getAnnouncements })
  const publish = useMutation({ mutationFn: () => createAnnouncement({ audience, title: title.trim(), message: message.trim(), is_published: true }), onSuccess: () => { setTitle(""); setMessage(""); void client.invalidateQueries({ queryKey: ["announcements"] }) } })
  return <div className="mx-auto max-w-7xl space-y-6 pb-8"><PageHeader title="Announcements" description="Publish in-app notices for student and staff portals. This records a notice; it does not send email or WhatsApp." />{query.isPending ? <Loading /> : query.error ? <ErrorBanner error={query.error} /> : <div className="grid gap-6 xl:grid-cols-5"><Card className="h-fit p-5 sm:p-6 xl:col-span-2"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Megaphone className="size-5" /></span><div><h3 className="font-semibold text-slate-900">Publish announcement</h3><p className="mt-1 text-sm text-slate-500">Visible immediately to the chosen audience.</p></div></div><form className="mt-6 space-y-4" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); publish.mutate() }}><label className="block text-sm font-semibold text-slate-700">Audience<select className={inputClass} onChange={(event) => setAudience(event.target.value as SchoolAudience)} value={audience}>{audienceOptions}</select></label><label className="block text-sm font-semibold text-slate-700">Title<input className={inputClass} maxLength={160} onChange={(event) => setTitle(event.target.value)} required value={title} /></label><label className="block text-sm font-semibold text-slate-700">Message<textarea className="mt-1.5 min-h-32 w-full rounded-lg border border-slate-200 p-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100" onChange={(event) => setMessage(event.target.value)} required value={message} /></label>{publish.error && <ErrorBanner error={publish.error} />}<button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60" disabled={publish.isPending} type="submit"><Send className="size-4" />{publish.isPending ? "Publishing…" : "Publish"}</button></form></Card><Card className="xl:col-span-3"><div className="border-b border-slate-100 p-5 sm:px-6"><h3 className="font-semibold text-slate-900">Published notices</h3><p className="mt-1 text-sm text-slate-500">Most recent first.</p></div>{query.data?.length ? <div className="divide-y divide-slate-100">{query.data.map((announcement) => <article className="p-5 sm:px-6" key={announcement.id}><div className="flex items-start justify-between gap-4"><div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{audienceLabel[announcement.audience]}</span><h3 className="mt-3 font-semibold text-slate-900">{announcement.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{announcement.message}</p><p className="mt-3 text-xs text-slate-400">Published by {announcement.published_by_name} · {dateText(announcement.published_at)}</p></div>{!announcement.is_published && <span className="text-xs font-semibold text-slate-400">Draft</span>}</div></article>)}</div> : <p className="p-6 text-sm text-slate-500">No announcements have been published.</p>}</Card></div>}</div>
}

export const HolidayManagementPage = () => {
  const client = useQueryClient()
  const [audience, setAudience] = useState<SchoolAudience>("everyone")
  const [name, setName] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const query = useQuery({ queryKey: ["school-holidays"], queryFn: getSchoolHolidays })
  const create = useMutation({ mutationFn: () => createSchoolHoliday({ audience, name: name.trim(), start_date: startDate, end_date: endDate, is_published: true }), onSuccess: () => { setName(""); setStartDate(""); setEndDate(""); void client.invalidateQueries({ queryKey: ["school-holidays"] }) } })
  return <div className="mx-auto max-w-7xl space-y-6 pb-8"><PageHeader title="School holidays" description="Publish official holiday dates to the selected portals." />{query.isPending ? <Loading /> : query.error ? <ErrorBanner error={query.error} /> : <div className="grid gap-6 xl:grid-cols-5"><Card className="h-fit p-5 sm:p-6 xl:col-span-2"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><CalendarDays className="size-5" /></span><div><h3 className="font-semibold text-slate-900">Add holiday</h3><p className="mt-1 text-sm text-slate-500">A single date uses the same start and end date.</p></div></div><form className="mt-6 space-y-4" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); create.mutate() }}><label className="block text-sm font-semibold text-slate-700">Holiday name<input className={inputClass} onChange={(event) => setName(event.target.value)} required value={name} /></label><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1"><label className="block text-sm font-semibold text-slate-700">Start date<input className={inputClass} onChange={(event) => setStartDate(event.target.value)} required type="date" value={startDate} /></label><label className="block text-sm font-semibold text-slate-700">End date<input className={inputClass} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} required type="date" value={endDate} /></label></div><label className="block text-sm font-semibold text-slate-700">Audience<select className={inputClass} onChange={(event) => setAudience(event.target.value as SchoolAudience)} value={audience}>{audienceOptions}</select></label>{create.error && <ErrorBanner error={create.error} />}<button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60" disabled={create.isPending} type="submit"><CalendarDays className="size-4" />{create.isPending ? "Saving…" : "Publish holiday"}</button></form></Card><Card className="xl:col-span-3"><div className="border-b border-slate-100 p-5 sm:px-6"><h3 className="font-semibold text-slate-900">Holiday calendar</h3><p className="mt-1 text-sm text-slate-500">Published dates shown in the portals.</p></div>{query.data?.length ? <div className="divide-y divide-slate-100">{query.data.map((holiday) => <div className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6" key={holiday.id}><div><p className="font-semibold text-slate-800">{holiday.name}</p><p className="mt-1 text-sm text-slate-500">{dateText(holiday.start_date)}{holiday.start_date !== holiday.end_date ? ` – ${dateText(holiday.end_date)}` : ""}</p></div><span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{audienceLabel[holiday.audience]}</span></div>)}</div> : <p className="p-6 text-sm text-slate-500">No holidays have been published.</p>}</Card></div>}</div>
}

const blankTimetable = (): TimetableEntryPayload => ({ academic_year: currentAcademicYear(), class_name: "", section: "", day_of_week: 1, start_time: "08:00", end_time: "09:00", subject: "", room: "", teacher_name: "" })

export const TimetableManagementPage = () => {
  const client = useQueryClient()
  const [form, setForm] = useState<TimetableEntryPayload>(blankTimetable)
  const query = useQuery({ queryKey: ["timetable"], queryFn: () => getTimetableEntries() })
  const create = useMutation({ mutationFn: () => createTimetableEntry(form), onSuccess: () => { setForm(blankTimetable()); void client.invalidateQueries({ queryKey: ["timetable"] }) } })
  return <div className="mx-auto max-w-7xl space-y-6 pb-8"><PageHeader title="Academic timetable" description="Create class schedules that students can view in their portal." />{query.isPending ? <Loading /> : query.error ? <ErrorBanner error={query.error} /> : <div className="grid gap-6 xl:grid-cols-5"><Card className="h-fit p-5 sm:p-6 xl:col-span-2"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><BookOpen className="size-5" /></span><div><h3 className="font-semibold text-slate-900">Add class period</h3><p className="mt-1 text-sm text-slate-500">One entry represents one scheduled subject.</p></div></div><form className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-1" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); create.mutate() }}><label className="block text-sm font-semibold text-slate-700">Academic year<input className={inputClass} onChange={(event) => setForm((current) => ({ ...current, academic_year: event.target.value }))} required value={form.academic_year} /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold text-slate-700">Class<input className={inputClass} onChange={(event) => setForm((current) => ({ ...current, class_name: event.target.value }))} required value={form.class_name} /></label><label className="block text-sm font-semibold text-slate-700">Section<input className={inputClass} onChange={(event) => setForm((current) => ({ ...current, section: event.target.value }))} required value={form.section} /></label></div><label className="block text-sm font-semibold text-slate-700">Day<select className={inputClass} onChange={(event) => setForm((current) => ({ ...current, day_of_week: Number(event.target.value) }))} value={form.day_of_week}>{["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, index) => <option key={day} value={index + 1}>{day}</option>)}</select></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold text-slate-700">Starts<input className={inputClass} onChange={(event) => setForm((current) => ({ ...current, start_time: event.target.value }))} required type="time" value={form.start_time} /></label><label className="block text-sm font-semibold text-slate-700">Ends<input className={inputClass} onChange={(event) => setForm((current) => ({ ...current, end_time: event.target.value }))} required type="time" value={form.end_time} /></label></div><label className="block text-sm font-semibold text-slate-700">Subject<input className={inputClass} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} required value={form.subject} /></label><label className="block text-sm font-semibold text-slate-700">Room <span className="font-normal text-slate-400">(optional)</span><input className={inputClass} onChange={(event) => setForm((current) => ({ ...current, room: event.target.value }))} value={form.room} /></label><label className="block text-sm font-semibold text-slate-700">Teacher <span className="font-normal text-slate-400">(optional)</span><input className={inputClass} onChange={(event) => setForm((current) => ({ ...current, teacher_name: event.target.value }))} value={form.teacher_name} /></label>{create.error && <ErrorBanner error={create.error} />}<button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60" disabled={create.isPending} type="submit"><BookOpen className="size-4" />{create.isPending ? "Saving…" : "Add period"}</button></form></Card><Card className="xl:col-span-3"><div className="border-b border-slate-100 p-5 sm:px-6"><h3 className="font-semibold text-slate-900">Published class periods</h3><p className="mt-1 text-sm text-slate-500">All timetable entries currently available to students.</p></div>{query.data?.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase"><tr><th className="px-5 py-3 sm:px-6">Class</th><th className="px-5 py-3">Day</th><th className="px-5 py-3">Time</th><th className="px-5 py-3">Subject</th><th className="px-5 py-3 sm:px-6">Room / teacher</th></tr></thead><tbody className="divide-y divide-slate-100">{query.data.map((entry) => <tr key={entry.id}><td className="px-5 py-4 font-semibold text-slate-800 sm:px-6">{entry.class_name}-{entry.section}<p className="mt-0.5 text-xs font-normal text-slate-400">{entry.academic_year}</p></td><td className="px-5 py-4 text-slate-700">{entry.day_name}</td><td className="px-5 py-4 text-slate-700">{entry.start_time.slice(0, 5)} – {entry.end_time.slice(0, 5)}</td><td className="px-5 py-4 font-semibold text-slate-800">{entry.subject}</td><td className="px-5 py-4 text-slate-600 sm:px-6">{entry.room || "—"}{entry.teacher_name ? ` · ${entry.teacher_name}` : ""}</td></tr>)}</tbody></table></div> : <p className="p-6 text-sm text-slate-500">No timetable periods have been added.</p>}</Card></div>}</div>
}

export const StudentNoticesPage = () => {
  const query = useQuery({ queryKey: ["announcements"], queryFn: getAnnouncements })
  return <div className="mx-auto max-w-5xl space-y-6 pb-8"><PageHeader eyebrow="Student portal" title="Notices" description="Updates published by the school office." />{query.isPending ? <Loading /> : query.error ? <ErrorBanner error={query.error} /> : query.data?.length ? <div className="space-y-4">{query.data.map((announcement) => <Card className="p-5 sm:p-6" key={announcement.id}><div className="flex gap-4"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Bell className="size-5" /></span><div><p className="text-xs font-semibold text-slate-400">{dateText(announcement.published_at)}</p><h3 className="mt-1 font-semibold text-slate-900">{announcement.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{announcement.message}</p></div></div></Card>)}</div> : <Card className="p-6 text-sm text-slate-500">No notices have been published yet.</Card>}</div>
}

export const StudentHolidaysPage = () => {
  const query = useQuery({ queryKey: ["school-holidays"], queryFn: getSchoolHolidays })
  return <div className="mx-auto max-w-5xl space-y-6 pb-8"><PageHeader eyebrow="Student portal" title="School holidays" description="Official holidays published by the school office." />{query.isPending ? <Loading /> : query.error ? <ErrorBanner error={query.error} /> : <Card>{query.data?.length ? <div className="divide-y divide-slate-100">{query.data.map((holiday) => <div className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6" key={holiday.id}><div><h3 className="font-semibold text-slate-900">{holiday.name}</h3><p className="mt-1 text-sm text-slate-500">{dateText(holiday.start_date)}{holiday.start_date !== holiday.end_date ? ` – ${dateText(holiday.end_date)}` : ""}</p></div><CalendarDays className="size-5 text-amber-600" /></div>)}</div> : <p className="p-6 text-sm text-slate-500">No holidays have been published yet.</p>}</Card>}</div>
}

export const StudentTimetablePage = () => {
  const query = useQuery({ queryKey: ["student-timetable"], queryFn: () => getTimetableEntries() })
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const entriesByTime = useMemo(() => {
    const grouped = new Map<string, Map<string, { subject: string; room: string }>>()
    for (const entry of query.data ?? []) { const time = `${entry.start_time.slice(0, 5)} – ${entry.end_time.slice(0, 5)}`; const byDay = grouped.get(time) ?? new Map(); byDay.set(entry.day_name, { subject: entry.subject, room: entry.room }); grouped.set(time, byDay) }
    return [...grouped.entries()]
  }, [query.data])
  return <div className="mx-auto max-w-7xl space-y-6 pb-8"><PageHeader eyebrow="Student portal" title="Timetable" description="Your class schedule, published by the school office." />{query.isPending ? <Loading /> : query.error ? <ErrorBanner error={query.error} /> : <Card>{entriesByTime.length ? <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-center text-sm"><thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase"><tr><th className="px-5 py-4 text-left">Time</th>{days.map((day) => <th className="px-4 py-4" key={day}>{day}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{entriesByTime.map(([time, byDay]) => <tr key={time}><td className="px-5 py-4 text-left font-semibold text-slate-700">{time}</td>{days.map((day) => { const entry = byDay.get(day); return <td className="px-4 py-4 text-slate-700" key={`${time}-${day}`}>{entry ? <><p className="font-semibold">{entry.subject}</p>{entry.room && <p className="mt-1 text-xs text-slate-400">{entry.room}</p>}</> : <span className="text-slate-300">—</span>}</td> })}</tr>)}</tbody></table></div> : <p className="p-6 text-sm text-slate-500">Your timetable has not been published yet.</p>}</Card>}</div>
}

export const StudentSupportPage = () => {
  const client = useQueryClient()
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const query = useQuery({ queryKey: ["support-requests"], queryFn: getSupportRequests })
  const submit = useMutation({ mutationFn: () => createSupportRequest({ subject: subject.trim(), message: message.trim() }), onSuccess: () => { setSubject(""); setMessage(""); void client.invalidateQueries({ queryKey: ["support-requests"] }) } })
  return <div className="mx-auto max-w-6xl space-y-6 pb-8"><PageHeader eyebrow="Student portal" title="Support" description="Send a request to the school office and follow the response here." />{query.isPending ? <Loading /> : query.error ? <ErrorBanner error={query.error} /> : <div className="grid gap-6 xl:grid-cols-5"><Card className="h-fit p-5 sm:p-6 xl:col-span-2"><h3 className="font-semibold text-slate-900">New request</h3><p className="mt-1 text-sm text-slate-500">Use this for fees, school records, or academic questions.</p><form className="mt-5 space-y-4" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); submit.mutate() }}><label className="block text-sm font-semibold text-slate-700">Subject<input className={inputClass} maxLength={160} onChange={(event) => setSubject(event.target.value)} required value={subject} /></label><label className="block text-sm font-semibold text-slate-700">Message<textarea className="mt-1.5 min-h-32 w-full rounded-lg border border-slate-200 p-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100" onChange={(event) => setMessage(event.target.value)} required value={message} /></label>{submit.error && <ErrorBanner error={submit.error} />}<button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60" disabled={submit.isPending} type="submit"><Send className="size-4" />{submit.isPending ? "Sending…" : "Send request"}</button></form></Card><Card className="xl:col-span-3"><div className="border-b border-slate-100 p-5 sm:px-6"><h3 className="font-semibold text-slate-900">Your requests</h3><p className="mt-1 text-sm text-slate-500">The office response appears here when available.</p></div>{query.data?.length ? <div className="divide-y divide-slate-100">{query.data.map((request) => <article className="p-5 sm:px-6" key={request.id}><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-900">{request.subject}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{request.message}</p><p className="mt-2 text-xs text-slate-400">{dateText(request.created_at)}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${request.status === "resolved" ? "bg-emerald-50 text-emerald-700" : request.status === "in_progress" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>{request.status.replaceAll("_", " ")}</span></div>{request.office_response && <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700"><p className="font-semibold text-slate-800">School office</p><p className="mt-1 leading-6">{request.office_response}</p></div>}</article>)}</div> : <p className="p-6 text-sm text-slate-500">You have not sent a support request.</p>}</Card></div>}</div>
}
