interface Column<T> {
  key: string;
  label: string;
  /** Right-align the header + cells (used for the actions column). */
  align?: "left" | "right";
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
}

export default function DataTable<T extends object>({
  columns,
  data,
  loading,
  emptyMessage = "Nothing here yet",
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="dq-card flex items-center justify-center p-12">
        <div className="dq-spinner h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="dq-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="dq-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={col.align === "right" ? "text-right" : undefined}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-14 text-center text-sm font-semibold text-fg-faint"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, idx) => (
                <tr key={idx}>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={col.align === "right" ? "text-right" : undefined}
                    >
                      {col.render
                        ? col.render(item)
                        : String(
                            (item as Record<string, unknown>)[col.key] ?? "",
                          )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
