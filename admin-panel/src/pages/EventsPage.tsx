import { useEffect, useState } from "react";
import api from "../lib/api";
import type { Event } from "../types";
import toast from "react-hot-toast";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import DataTable from "../components/DataTable";
import PageHeader from "../components/PageHeader";

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [eType, setEType] = useState("seasonal");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [banner, setBanner] = useState("");

  const fetchEvents = () => {
    api
      .get("/admin/events")
      .then((r) => setEvents(r.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(fetchEvents, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    api
      .post("/admin/events", {
        name,
        description,
        type: eType,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        banner_url: banner,
      })
      .then(() => {
        toast.success("Event created");
        setShowForm(false);
        setName("");
        fetchEvents();
      })
      .catch(() => toast.error("Failed"));
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete?")) return;
    api
      .delete(`/admin/events/${id}`)
      .then(() => {
        toast.success("Deleted");
        fetchEvents();
      })
      .catch(() => toast.error("Failed"));
  };

  return (
    <div>
      <PageHeader
        title="Events"
        flag="NOT WIRED"
        subtitle="Seasonal and special events"
        action={
          <button onClick={() => setShowForm(!showForm)} className="dq-btn">
            <PlusIcon className="h-[17px] w-[17px]" strokeWidth={2.6} />
            New Event
          </button>
        }
      />

      {showForm && (
        <form onSubmit={handleCreate} className="dq-card mt-5 p-[22px]">
          <div className="dq-eyebrow mb-4">New event</div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="dq-label">Name</label>
              <input
                className="dq-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ramadan 2026"
              />
            </div>
            <div>
              <label className="dq-label">Type</label>
              <select
                className="dq-input"
                value={eType}
                onChange={(e) => setEType(e.target.value)}
              >
                <option value="seasonal">Seasonal</option>
                <option value="challenge">Challenge</option>
                <option value="community">Community</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="dq-label">Description</label>
              <textarea
                className="dq-input min-h-[70px] leading-relaxed"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="dq-label">Start date</label>
              <input
                type="datetime-local"
                className="dq-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="dq-label">End date</label>
              <input
                type="datetime-local"
                className="dq-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="dq-label">Banner URL</label>
              <input
                className="dq-input"
                value={banner}
                onChange={(e) => setBanner(e.target.value)}
                placeholder="https://…"
              />
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="dq-btn-ghost"
            >
              Cancel
            </button>
            <button type="submit" className="dq-btn">
              Create Event
            </button>
          </div>
        </form>
      )}

      <div className="mt-[18px]">
        <DataTable
          columns={[
            {
              key: "name",
              label: "Name",
              render: (e: Event) => (
                <span className="text-[13.5px] font-extrabold text-fg">
                  {e.name}
                </span>
              ),
            },
            {
              key: "type",
              label: "Type",
              render: (e: Event) => (
                <span
                  className="dq-badge"
                  style={{ background: "rgba(167,139,250,.14)", color: "#A78BFA" }}
                >
                  {e.type}
                </span>
              ),
            },
            {
              key: "is_active",
              label: "Active",
              render: (e: Event) => (
                <span
                  className={`dq-badge ${
                    e.is_active ? "dq-badge-easy" : "dq-badge-neutral"
                  }`}
                >
                  {e.is_active ? "Yes" : "No"}
                </span>
              ),
            },
            {
              key: "start",
              label: "Start",
              render: (e: Event) => (
                <span className="text-[13px] font-bold text-fg-dim">
                  {new Date(e.start_date).toLocaleDateString()}
                </span>
              ),
            },
            {
              key: "end",
              label: "End",
              render: (e: Event) => (
                <span className="text-[13px] font-bold text-fg-dim">
                  {new Date(e.end_date).toLocaleDateString()}
                </span>
              ),
            },
            {
              key: "actions",
              label: "Actions",
              align: "right" as const,
              render: (e: Event) => (
                <button
                  onClick={() => handleDelete(e.id)}
                  className="dq-icon-btn dq-icon-btn-danger"
                  title="Delete"
                >
                  <TrashIcon className="h-[15px] w-[15px]" strokeWidth={2.2} />
                </button>
              ),
            },
          ]}
          data={events}
          loading={loading}
          emptyMessage="No events yet."
        />
      </div>
    </div>
  );
}
