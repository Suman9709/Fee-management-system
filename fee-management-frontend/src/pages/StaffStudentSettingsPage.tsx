import {
  createClassroom,
  createStudentAttendance,
  getClassrooms,
  getStudentAttendance,
  getStudents,
  updateClassroom,
  updateStudent,
  updateStudentAttendance,
  type Classroom,
  type ClassroomPayload,
  type StudentAttendance,
  type StudentAttendancePayload,
  type StudentProfile,
} from "@/api/adminApi/adminApi"
import axios from "axios"
import { CalendarDays, CheckCircle2, GraduationCap, Pencil, Save, UserRoundCog } from "lucide-react"
import { type FormEvent, useEffect, useState } from "react"

const academicYear = () => {
  const today = new Date()
  const start = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1
  return `${start}-${String(start + 1).slice(-2)}`
}

const currentMonth = () => new Date().toISOString().slice(0, 7).concat("-01")

const emptyClassroom = (): ClassroomPayload => ({
  academic_year: academicYear(),
  class_name: "",
  section: "",
  class_teacher: "",
  is_active: true,
})

const inputClassName = "mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-3 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400"

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

export const StaffStudentSettingsPage = () => {
  const [students, setStudents] = useState<StudentProfile[]>([])
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [attendance, setAttendance] = useState<StudentAttendance[]>([])
  const [classroomForm, setClassroomForm] = useState<ClassroomPayload>(emptyClassroom)
  const [editingClassroomId, setEditingClassroomId] = useState<number | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [selectedClassroomId, setSelectedClassroomId] = useState("")
  const [attendanceForm, setAttendanceForm] = useState<StudentAttendancePayload>({ student: 0, attendance_month: currentMonth(), working_days: 0, days_present: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [studentData, classroomData, attendanceData] = await Promise.all([
        getStudents(),
        getClassrooms(academicYear()),
        getStudentAttendance(),
      ])
      setStudents(studentData)
      setClassrooms(classroomData)
      setAttendance(attendanceData)
    } catch (loadError) {
      setError(apiError(loadError))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const submitClassroom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setNotice("")
    setIsSaving(true)
    try {
      const payload = {
        ...classroomForm,
        academic_year: classroomForm.academic_year.trim(),
        class_name: classroomForm.class_name.trim(),
        section: classroomForm.section.trim(),
        class_teacher: classroomForm.class_teacher.trim(),
      }
      if (editingClassroomId) {
        await updateClassroom(editingClassroomId, payload)
        setNotice("Class teacher assignment updated.")
      } else {
        await createClassroom(payload)
        setNotice("Classroom and teacher assignment created.")
      }
      setClassroomForm(emptyClassroom())
      setEditingClassroomId(null)
      await loadData()
    } catch (saveError) {
      setError(apiError(saveError))
    } finally {
      setIsSaving(false)
    }
  }

  const assignStudent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const student = students.find((item) => String(item.id) === selectedStudentId)
    const classroom = classrooms.find((item) => String(item.id) === selectedClassroomId)
    if (!student || !classroom) return
    setError("")
    setNotice("")
    setIsSaving(true)
    try {
      await updateStudent(student.student_id, {
        class_name: classroom.class_name,
        section: classroom.section,
      })
      setNotice(`${student.full_name} is assigned to Class ${classroom.class_name}-${classroom.section}.`)
      await loadData()
    } catch (saveError) {
      setError(apiError(saveError))
    } finally {
      setIsSaving(false)
    }
  }

  const saveAttendance = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!attendanceForm.student) return
    setError("")
    setNotice("")
    setIsSaving(true)
    try {
      const existing = attendance.find((record) => record.student === attendanceForm.student && record.attendance_month === attendanceForm.attendance_month)
      if (existing) {
        await updateStudentAttendance(existing.id, attendanceForm)
        setNotice("Attendance record updated.")
      } else {
        await createStudentAttendance(attendanceForm)
        setNotice("Attendance record saved.")
      }
      await loadData()
    } catch (saveError) {
      setError(apiError(saveError))
    } finally {
      setIsSaving(false)
    }
  }

  return <div className="mx-auto max-w-7xl space-y-6 pb-8"><header><p className="text-sm font-semibold text-blue-600">Office staff workspace</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Student setup</h2><p className="mt-2 max-w-3xl text-sm text-slate-500 sm:text-base">Assign class teachers, place students in a class section, and publish monthly attendance to the student portal.</p></header>{notice && <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"><CheckCircle2 className="size-4" />{notice}</div>}{error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">{error}</div>}<div className="grid gap-6 xl:grid-cols-2"><section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-5 sm:px-6"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><UserRoundCog className="size-5" /></span><div><h3 className="font-semibold text-slate-900">Class teacher assignment</h3><p className="mt-0.5 text-sm text-slate-500">Set the teacher for each class and section.</p></div></div></div><form className="border-b border-slate-100 p-5 sm:p-6" onSubmit={submitClassroom}><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700">Academic year<input className={inputClassName} onChange={(event) => setClassroomForm((current) => ({ ...current, academic_year: event.target.value }))} required value={classroomForm.academic_year} /></label><label className="text-sm font-semibold text-slate-700">Class<input className={inputClassName} onChange={(event) => setClassroomForm((current) => ({ ...current, class_name: event.target.value }))} placeholder="e.g. 10" required value={classroomForm.class_name} /></label><label className="text-sm font-semibold text-slate-700">Section<input className={inputClassName} onChange={(event) => setClassroomForm((current) => ({ ...current, section: event.target.value }))} placeholder="e.g. A" required value={classroomForm.section} /></label><label className="text-sm font-semibold text-slate-700">Class teacher<input className={inputClassName} onChange={(event) => setClassroomForm((current) => ({ ...current, class_teacher: event.target.value }))} placeholder="Teacher name" value={classroomForm.class_teacher} /></label></div><div className="mt-5 flex gap-3"><button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60" disabled={isSaving} type="submit"><Save className="size-4" />{editingClassroomId ? "Update teacher" : "Save class teacher"}</button>{editingClassroomId && <button className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50" onClick={() => { setEditingClassroomId(null); setClassroomForm(emptyClassroom()) }} type="button">Cancel</button>}</div></form><div className="divide-y divide-slate-100">{isLoading ? <p className="p-5 text-sm text-slate-500">Loading classes…</p> : classrooms.length === 0 ? <p className="p-5 text-sm text-slate-500">No class sections have been created.</p> : classrooms.map((classroom) => <div className="flex items-center justify-between gap-3 px-5 py-4 sm:px-6" key={classroom.id}><div><p className="font-semibold text-slate-800">Class {classroom.class_name}-{classroom.section}</p><p className="mt-1 text-sm text-slate-500">{classroom.class_teacher || "Teacher not assigned"}</p></div><button className="rounded-lg p-2 text-blue-600 hover:bg-blue-50" onClick={() => { setEditingClassroomId(classroom.id); setClassroomForm({ academic_year: classroom.academic_year, class_name: classroom.class_name, section: classroom.section, class_teacher: classroom.class_teacher, is_active: classroom.is_active }) }} type="button"><Pencil className="size-4" /></button></div>)}</div></section><div className="space-y-6"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><GraduationCap className="size-5" /></span><div><h3 className="font-semibold text-slate-900">Student class assignment</h3><p className="mt-0.5 text-sm text-slate-500">The selected class teacher is shown in the student portal.</p></div></div><form className="mt-5 space-y-4" onSubmit={assignStudent}><label className="block text-sm font-semibold text-slate-700">Student<select className={inputClassName} onChange={(event) => setSelectedStudentId(event.target.value)} required value={selectedStudentId}><option value="">Select student</option>{students.map((student) => <option key={student.id} value={student.id}>{student.full_name} · {student.student_id} · Current: {student.class_name}-{student.section}</option>)}</select></label><label className="block text-sm font-semibold text-slate-700">Class section<select className={inputClassName} onChange={(event) => setSelectedClassroomId(event.target.value)} required value={selectedClassroomId}><option value="">Select class section</option>{classrooms.filter((classroom) => classroom.is_active).map((classroom) => <option key={classroom.id} value={classroom.id}>Class {classroom.class_name}-{classroom.section} · {classroom.class_teacher || "No teacher"}</option>)}</select></label><button className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60" disabled={isSaving || !selectedStudentId || !selectedClassroomId} type="submit">Assign student</button></form></section><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><CalendarDays className="size-5" /></span><div><h3 className="font-semibold text-slate-900">Monthly attendance</h3><p className="mt-0.5 text-sm text-slate-500">Save or update the month’s attendance for one student.</p></div></div><form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={saveAttendance}><label className="text-sm font-semibold text-slate-700 sm:col-span-2">Student<select className={inputClassName} onChange={(event) => setAttendanceForm((current) => ({ ...current, student: Number(event.target.value) }))} required value={attendanceForm.student || ""}><option value="">Select student</option>{students.map((student) => <option key={student.id} value={student.id}>{student.full_name} · {student.student_id}</option>)}</select></label><label className="text-sm font-semibold text-slate-700">Month<input className={inputClassName} onChange={(event) => setAttendanceForm((current) => ({ ...current, attendance_month: `${event.target.value}-01` }))} required type="month" value={attendanceForm.attendance_month.slice(0, 7)} /></label><label className="text-sm font-semibold text-slate-700">Working days<input className={inputClassName} min="1" onChange={(event) => setAttendanceForm((current) => ({ ...current, working_days: Number(event.target.value) }))} required type="number" value={attendanceForm.working_days || ""} /></label><label className="text-sm font-semibold text-slate-700">Days present<input className={inputClassName} min="0" onChange={(event) => setAttendanceForm((current) => ({ ...current, days_present: Number(event.target.value) }))} required type="number" value={attendanceForm.days_present || ""} /></label><div className="flex items-end"><button className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60" disabled={isSaving || !attendanceForm.student} type="submit">Save attendance</button></div></form></section></div></div></div>
}
