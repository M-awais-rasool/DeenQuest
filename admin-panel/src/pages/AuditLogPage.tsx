import { useEffect, useState } from "react";
import api from "../lib/api";
import type { AuditLog } from "../types";
import DataTable from "../components/DataTable";
import PageHeader from "../components/PageHeader";

/** Verb → badge tint, so create/update/delete read at a glance. */
function actionStyle(action: string): React.CSSProperties {
  if (action.includes("create")) return { background: "#0F2A26", color: "#5EE0CE" };
  if (action.includes("update")) return { background: "rgba(110,150,240,.14)", color: "#6E96F0" };
  if (action.includes("delete")) return { background: "#2A1218", color: "#F0838C" };
  if (action.includes("publish")) return { background: "#2A2212", color: "#EFB65A" };
  return { background: "rgba(255,255,255,.06)", color: "#8DA5A3" };
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 30;

  useEffect(() => {
    setLoading(true);
    api
      .get(`/admin/audit-logs?page=${page}&per_page=${perPage}`)
      .then((r) => {
        const d = r.data.data;
        setLogs(d?.items ?? d ?? []);
        setTotal(d?.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / perPage) || 1;

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        flag="NOT WIRED"
        subtitle="Every action taken in this panel"
      />

      <div className="mt-6">
        <DataTable
          columns={[
            {
              key: "created_at",
              label: "Time",
              render: (l: AuditLog) => (
                <span className="font-mono text-xs text-fg-dimmer">
                  {new Date(l.created_at).toLocaleString()}
                </span>
              ),
            },
            {
              key: "action",
              label: "Action",
              render: (l: AuditLog) => (
                <span className="dq-badge" style={actionStyle(l.action)}>
                  {l.action}
                </span>
              ),
            },
            {
              key: "resource",
              label: "Resource",
              render: (l: AuditLog) => (
                <span className="font-bold text-fg-dim">{l.resource}</span>
              ),
            },
            {
              key: "resource_id",
              label: "Resource ID",
              render: (l: AuditLog) => (
                <span className="font-mono text-xs text-fg-faint">
                  {l.resource_id ? `${l.resource_id.slice(0, 12)}…` : "—"}
                </span>
              ),
            },
            {
              key: "admin_id",
              label: "Admin",
              render: (l: AuditLog) => (
                <span className="font-mono text-xs text-fg-faint">
                  {l.admin_id?.slice(0, 8) ?? "—"}
                </span>
              ),
            },
            {
              key: "changes",
              label: "Details",
              render: (l: AuditLog) => (
                <span className="block max-w-[220px] truncate text-xs font-semibold text-fg-faint">
                  {l.changes ? JSON.stringify(l.changes).slice(0, 60) : "—"}
                </span>
              ),
            },
          ]}
          data={logs}
          loading={loading}
          emptyMessage="No admin activity recorded."
        />
      </div>

      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between">
          <p className="text-[13px] font-semibold text-fg-dimmer">
            Page {page} of {totalPages} · {total.toLocaleString()} entries
          </p>
          <div className="flex gap-2.5">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="dq-btn-ghost"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="dq-btn-ghost"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
