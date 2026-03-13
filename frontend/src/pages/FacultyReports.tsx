import { useState, useEffect } from "react";
import { LayoutDashboard, Users, BarChart3, FileText, Settings, Loader2, Download, Printer } from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { TopNavbar } from "../components/TopNavbar";
import { studentsApi, reportsApi, type StudentSummary, type WeeklyReport, type User } from "../lib/api";

const facultySidebar = [
  { icon: LayoutDashboard, label: "Overview", path: "/faculty/dashboard" },
  { icon: Users, label: "Students", path: "/faculty/students" },
  { icon: BarChart3, label: "Class Analytics", path: "/faculty/analytics" },
  { icon: FileText, label: "Reports", path: "/faculty/reports" },
  { icon: Settings, label: "Settings", path: "/faculty/settings" },
];

export function FacultyReports() {
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [reports, setReports] = useState<Record<number, WeeklyReport>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user: User | null = JSON.parse(localStorage.getItem("user") || "null");
    const [printing, setPrinting] = useState<number | null>(null);

  useEffect(() => {
    studentsApi.list()
      .then(async (list) => {
        setStudents(list);
        const reportMap: Record<number, WeeklyReport> = {};
        await Promise.all(list.map(async (s) => {
          try {
            reportMap[s.id] = await reportsApi.studentWeekly(s.id);
          } catch { /* skip */ }
        }));
        setReports(reportMap);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const riskColor = (level: string) =>
    level === "high" ? "text-red-600 bg-red-50 dark:bg-red-900/30" : level === "medium" ? "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30" : "text-green-600 bg-green-50 dark:bg-green-900/30";

    function exportCSV() {
      const rows = [
        ["Name", "Student ID", "Department", "Risk Level", "Completion %", "Completed Tasks", "Overdue", "Total Tasks", "Workload Score", "Report Period"],
        ...students.map((s) => {
          const r = reports[s.id];
          return [
            s.name,
            s.student_id,
            s.department,
            s.risk_level,
            r ? r.completion_rate : s.completion_rate,
            r ? r.completed_tasks : "",
            r ? r.missed_deadlines : s.missed_deadlines,
            r ? r.total_tasks : s.total_tasks,
            s.workload_score,
            r ? r.report_period : "",
          ];
        }),
      ];
      const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `class-report-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    function printReport(s: StudentSummary) {
      const r = reports[s.id];
      setPrinting(s.id);
      const win = window.open("", "_blank");
      if (!win) { setPrinting(null); return; }
      const recs = r?.recommendations.map((rec) => `<li>${rec}</li>`).join("") || "";
      win.document.write(`
        <html><head><title>Report – ${s.name}</title>
        <style>
          body { font-family: sans-serif; padding: 40px; max-width: 700px; margin: auto; color: #111; }
          h1 { font-size: 22px; margin-bottom: 4px; }
          .sub { color: #555; font-size: 14px; margin-bottom: 24px; }
          .badge { display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: bold; }
          .high { background: #fee2e2; color: #b91c1c; }
          .medium { background: #fef9c3; color: #92400e; }
          .low { background: #dcfce7; color: #15803d; }
          .grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin: 20px 0; }
          .card { background: #f9fafb; border-radius: 10px; padding: 12px; }
          .label { font-size: 11px; color: #888; }
          .value { font-size: 20px; font-weight: bold; margin-top: 4px; }
          .recs { background: #eff6ff; border-radius: 10px; padding: 16px; margin-top: 16px; }
          .recs h3 { font-size: 13px; margin: 0 0 8px; color: #1e40af; }
          .recs li { font-size: 13px; color: #374151; margin-bottom: 4px; }
          footer { margin-top: 40px; font-size: 11px; color: #aaa; text-align: center; }
        </style></head><body>
        <h1>${s.name}</h1>
        <p class="sub">${s.student_id} &middot; ${s.department} &middot; Year ${s.year}</p>
        <span class="badge ${s.risk_level}">${s.risk_level.charAt(0).toUpperCase() + s.risk_level.slice(1)} Risk</span>
        ${r ? `<p style="font-size:12px;color:#888;margin-top:12px">${r.report_period}</p>
        <div class="grid">
          <div class="card"><div class="label">Completion</div><div class="value">${r.completion_rate}%</div></div>
          <div class="card"><div class="label">Completed</div><div class="value" style="color:#16a34a">${r.completed_tasks}</div></div>
          <div class="card"><div class="label">Overdue</div><div class="value" style="color:#dc2626">${r.missed_deadlines}</div></div>
          <div class="card"><div class="label">Total Tasks</div><div class="value">${r.total_tasks}</div></div>
        </div>
        ${recs ? `<div class="recs"><h3>Recommendations</h3><ul>${recs}</ul></div>` : ""}` : "<p>No report data available.</p>"}
        <footer>Generated ${new Date().toLocaleString()} &middot; Academic Early Risk System</footer>
        </body></html>
      `);
      win.document.close();
      win.print();
      setPrinting(null);
    }

    function printAllReports() {
      const win = window.open("", "_blank");
      if (!win) return;
      const pages = students.map((s) => {
        const r = reports[s.id];
        const recs = r?.recommendations.map((rec) => `<li>${rec}</li>`).join("") || "";
        return `
          <div style="page-break-after:always;padding:40px;">
            <h1 style="font-size:20px;margin-bottom:4px">${s.name}</h1>
            <p style="color:#555;font-size:13px;margin-bottom:16px">${s.student_id} &middot; ${s.department} &middot; Year ${s.year}</p>
            <span style="background:${s.risk_level === "high" ? "#fee2e2" : s.risk_level === "medium" ? "#fef9c3" : "#dcfce7"};color:${s.risk_level === "high" ? "#b91c1c" : s.risk_level === "medium" ? "#92400e" : "#15803d"};padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:bold">${s.risk_level.charAt(0).toUpperCase() + s.risk_level.slice(1)} Risk</span>
            ${r ? `<p style="font-size:11px;color:#888;margin-top:10px">${r.report_period}</p>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:16px 0">
              <div style="background:#f9fafb;border-radius:8px;padding:10px"><div style="font-size:10px;color:#888">Completion</div><div style="font-size:18px;font-weight:bold">${r.completion_rate}%</div></div>
              <div style="background:#f9fafb;border-radius:8px;padding:10px"><div style="font-size:10px;color:#888">Completed</div><div style="font-size:18px;font-weight:bold;color:#16a34a">${r.completed_tasks}</div></div>
              <div style="background:#f9fafb;border-radius:8px;padding:10px"><div style="font-size:10px;color:#888">Overdue</div><div style="font-size:18px;font-weight:bold;color:#dc2626">${r.missed_deadlines}</div></div>
              <div style="background:#f9fafb;border-radius:8px;padding:10px"><div style="font-size:10px;color:#888">Total Tasks</div><div style="font-size:18px;font-weight:bold">${r.total_tasks}</div></div>
            </div>
            ${recs ? `<div style="background:#eff6ff;border-radius:8px;padding:14px"><p style="font-size:12px;font-weight:600;color:#1e40af;margin:0 0 6px">Recommendations</p><ul style="margin:0;padding-left:16px">${recs}</ul></div>` : ""}` : "<p>No report data.</p>"}
          </div>`;
      }).join("");
      win.document.write(`<html><head><title>Class Reports</title><style>body{font-family:sans-serif;margin:0}li{font-size:12px;margin-bottom:3px;color:#374151}</style></head><body>${pages}</body></html>`);
      win.document.close();
      win.print();
    }

  return (
    <div className="flex h-screen bg-[#F9FAFB] dark:bg-gray-900">
      <Sidebar role="faculty" items={facultySidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar title="Reports" subtitle="Generate and view student reports" userName={user?.name || "Faculty"} />
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" /></div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-700 rounded-2xl p-6 text-center">{error}</div>
          ) : (
              <div className="space-y-4">
                {/* Action Bar */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{students.length} students · {Object.keys(reports).length} reports generated</p>
                  <div className="flex gap-3">
                    <button
                      onClick={exportCSV}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </button>
                    <button
                      onClick={printAllReports}
                      className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white text-sm font-medium rounded-xl hover:bg-[#1d4ed8] transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                      Print All Reports
                    </button>
                  </div>
                </div>

              {students.map((s) => {
                const r = reports[s.id];
                return (
                  <div key={s.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{s.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{s.student_id} · {s.department}</p>
                      </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${riskColor(s.risk_level)}`}>
                            {s.risk_level.charAt(0).toUpperCase() + s.risk_level.slice(1)}
                          </span>
                          <button
                            onClick={() => printReport(s)}
                            disabled={printing === s.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Print
                          </button>
                        </div>
                    </div>
                    {r ? (
                      <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">{r.report_period}</p>
                        <div className="grid grid-cols-4 gap-3 text-sm mb-3">
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3"><span className="text-gray-500 dark:text-gray-400 text-xs">Completion</span><p className="font-bold">{r.completion_rate}%</p></div>
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3"><span className="text-gray-500 dark:text-gray-400 text-xs">Completed</span><p className="font-bold text-green-600">{r.completed_tasks}</p></div>
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3"><span className="text-gray-500 dark:text-gray-400 text-xs">Overdue</span><p className="font-bold text-red-600">{r.missed_deadlines}</p></div>
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3"><span className="text-gray-500 dark:text-gray-400 text-xs">Total</span><p className="font-bold text-gray-900 dark:text-white">{r.total_tasks}</p></div>
                        </div>
                        {r.recommendations.length > 0 && (
                          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-3">
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Recommendations</p>
                            {r.recommendations.map((rec, i) => <p key={i} className="text-xs text-gray-600 dark:text-gray-400">• {rec}</p>)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 dark:text-gray-500">No report data available</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
