const LABELS = {
  on_the_way: 'On the way',
  safe: 'Arrived safely',
  overdue: 'Overdue',
  sos: 'SOS triggered',
}

export default function StatusBadge({ status }) {
  const label = LABELS[status] ?? status
  return (
    <span className={`badge badge-${status}`}>
      <span className="badge-dot" />
      {label}
    </span>
  )
}
