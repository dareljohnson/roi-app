import Link from 'next/link';

export default function AdminNav() {
  return (
    <nav className="mb-6 flex gap-4 border-b pb-2">
      <Link href="/admin" className="hover:underline">Dashboard</Link>
      <Link href="/admin/documentation" className="hover:underline">Troubleshooting Wiki</Link>
      {/* Add more admin links as needed */}
    </nav>
  );
}
