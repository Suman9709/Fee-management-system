import { downloadInvoice } from "@/api/adminApi/adminApi"
import { Download, LoaderCircle } from "lucide-react"
import { useState } from "react"

export const InvoiceDownloadButton = ({ invoiceId }: { invoiceId: number }) => {
  const [isDownloading, setIsDownloading] = useState(false)
  const [failed, setFailed] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)
    setFailed(false)
    try {
      await downloadInvoice(invoiceId)
    } catch {
      setFailed(true)
    } finally {
      setIsDownloading(false)
    }
  }

  return <div><button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-wait disabled:opacity-60" disabled={isDownloading} onClick={() => void handleDownload()} type="button"><span>{isDownloading ? <LoaderCircle className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}</span>{isDownloading ? "Preparing…" : "Download"}</button>{failed && <p className="mt-1 text-xs text-rose-600" role="alert">Could not download. Retry.</p>}</div>
}
