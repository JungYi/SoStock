import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

const NavItem = ({ href, label, icon }) => {
  const router = useRouter();
  const active = router.pathname === href;
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-3 py-2 rounded transition
        ${active ? 'bg-amber-200/60 text-black' : 'text-gray-700 hover:bg-gray-100'}`}
    >
      {icon ? <span aria-hidden>{icon}</span> : null}
      <span>{label}</span>
    </Link>
  );
};

const Layout = ({ children }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7F2EC] text-[#1F1A17]">
      {/* Topbar (mobile) */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-[#F7F2EC]/80 backdrop-blur md:hidden">
        <button
          type="button"
          aria-label="Toggle menu"
          className="p-2 rounded border"
          onClick={() => setOpen((v) => !v)}
        >
          ☰
        </button>
        <Link href="/" className="font-serif text-xl">Maison So</Link>
        <div className="w-9" />
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-0 md:gap-6">
          {/* Sidebar */}
          <aside
            className={`md:sticky md:top-6 md:h-[calc(100vh-3rem)] bg-[#EADFD4] md:rounded-2xl p-4 md:block
              ${open ? 'block' : 'hidden'}`}
          >
            <div className="hidden md:block px-2 pb-4">
              <Link href="/" className="font-serif text-2xl">Maison So</Link>
            </div>
            <nav className="flex flex-col gap-1">
              <NavItem href="/inventory" label="Inventory" />
              <NavItem href="/order" label="Orders" />
              <NavItem href="/receipt" label="Receiving" />
            </nav>
          </aside>

          {/* Content */}
          <main className="p-4 md:p-0">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default Layout;