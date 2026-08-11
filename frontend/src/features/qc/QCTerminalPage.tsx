import { useState } from "react";
import { ShieldCheck, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/services/axios";

export default function QCTerminalPage() {
  const [qcPersonCardId, setQcPersonCardId] = useState("");
  const [tagCode, setTagCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [bundleData, setBundleData] = useState<any>(null);

  const [submitting, setSubmitting] = useState(false);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagCode || !qcPersonCardId) {
      toast.error("Please enter both QC Inspector ID and Tag Code");
      return;
    }

    setLoading(true);
    setBundleData(null);

    try {
      const res = await apiClient.post("/qc-checks/scan", {
        tagCode,
        qcPersonCardId
      });
      setBundleData(res.data.data);
      toast.success("Bundle data retrieved");
      setTagCode("");
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message;
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleQcDecision = async (status: 'PASS' | 'FAIL' | 'REWORK') => {
    if (!bundleData) return;
    setSubmitting(true);
    try {
      await apiClient.post("/qc-checks", {
        bundleId: bundleData.bundle.id,
        tagId: bundleData.tag.id,
        qcPersonId: bundleData.qcPerson.id,
        qcTier: "FINAL_QC",
        status: status,
        defectNotes: status !== 'PASS' ? "Defect identified in final inspection" : null
      });
      toast.success(`Bundle marked as ${status}`);
      setBundleData(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-zinc-900 border border-white/10 p-8 rounded-2xl shadow-2xl">
        <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
          <div className="bg-purple-500/20 p-4 rounded-xl text-purple-500">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">QC Inspection Terminal</h1>
            <p className="text-zinc-400">Final Verification Station</p>
          </div>
        </div>

        {!bundleData ? (
          <form onSubmit={handleScan} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">QC Inspector NFC Card ID</label>
              <input 
                type="text" 
                autoFocus
                value={qcPersonCardId}
                onChange={e => setQcPersonCardId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                placeholder="e.g., QC-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Bundle Tag Code</label>
              <input 
                type="text" 
                value={tagCode}
                onChange={e => setTagCode(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                placeholder="e.g., TAG-001"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-lg py-4 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Scan for QC"}
            </button>
          </form>
        ) : (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="bg-zinc-950 p-6 rounded-xl border border-white/5">
              <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
                Bundle {bundleData.bundle.bundleNumber}
                <span className="text-sm font-normal text-zinc-400 bg-zinc-900 px-3 py-1 rounded-full border border-white/5">
                  Qty: {bundleData.bundle.quantity}
                </span>
              </h2>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Accountability Trail</h3>
                {bundleData.accountabilityTrail.map((log: any, i: number) => (
                  <div key={i} className="flex justify-between items-center bg-zinc-900 p-4 rounded-lg border border-white/5">
                    <div>
                      <div className="font-medium text-white">{log.operationName}</div>
                      <div className="text-sm text-zinc-400">Operator: {log.operatorName}</div>
                    </div>
                    <div className="text-right text-sm font-mono text-zinc-500">
                      {new Date(log.inTime).toLocaleTimeString()} - {log.outTime ? new Date(log.outTime).toLocaleTimeString() : 'In Progress'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <button 
                onClick={() => handleQcDecision('PASS')}
                disabled={submitting}
                className="bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/50 hover:border-emerald-500 text-emerald-400 hover:text-white font-bold py-4 rounded-xl transition-all flex flex-col items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-8 h-8" />
                PASS BUNDLE
              </button>
              <button 
                onClick={() => handleQcDecision('REWORK')}
                disabled={submitting}
                className="bg-amber-600/20 hover:bg-amber-600 border border-amber-500/50 hover:border-amber-500 text-amber-400 hover:text-white font-bold py-4 rounded-xl transition-all flex flex-col items-center justify-center gap-2"
              >
                <Loader2 className="w-8 h-8" />
                SEND TO REWORK
              </button>
              <button 
                onClick={() => handleQcDecision('FAIL')}
                disabled={submitting}
                className="bg-red-600/20 hover:bg-red-600 border border-red-500/50 hover:border-red-500 text-red-400 hover:text-white font-bold py-4 rounded-xl transition-all flex flex-col items-center justify-center gap-2"
              >
                <XCircle className="w-8 h-8" />
                FAIL BUNDLE
              </button>
            </div>
            
            <button 
              onClick={() => setBundleData(null)}
              className="w-full text-center text-zinc-500 hover:text-zinc-300 py-2"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
