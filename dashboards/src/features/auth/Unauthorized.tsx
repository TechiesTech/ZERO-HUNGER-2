import { Link } from 'react-router-dom';

export function Unauthorized() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#080808] p-6 text-center text-white">
      <h1 className="text-2xl font-bold">Unauthorized</h1>
      <p className="text-sm text-white/60">This portal is for admin and kitchen accounts only.</p>
      <Link to="/login" className="text-sm text-[#49E619] hover:underline">Return to login</Link>
    </main>
  );
}
