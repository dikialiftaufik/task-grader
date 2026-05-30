'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Skeleton from '@/components/ui/Skeleton';
import { Users, Trash2, UserPlus, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import type { User } from '@/types';

export default function PraktikanPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [praktikans, setPraktikans] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [newNama, setNewNama] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newNim, setNewNim] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadPraktikans();
  }, []);

  async function loadPraktikans() {
    try {
      const res = await fetch('/api/admin/users');
      const json = await res.json();
      if (json.success) {
        setPraktikans(json.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
    setLoading(false);
  }

  async function handleAddPraktikan() {
    if (!newNama || !newUsername || !newNim) {
      toast.error('Harap isi semua kolom!');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: newNama, username: newUsername, nim: newNim }),
      });
      const json = await res.json();

      if (json.success) {
        toast.success('Akun praktikan berhasil dibuat!');
        setNewNama('');
        setNewUsername('');
        setNewNim('');
        setShowForm(false);
        loadPraktikans();
      } else {
        toast.error('Gagal: ' + json.error);
      }
    } catch {
      toast.error('Terjadi kesalahan server');
    }
    setSaving(false);
  }

  async function handleDeletePraktikan(id: string, name: string) {
    if (!confirm(`Yakin ingin menghapus akun ${name}?\nSemua data nilai dan absensinya akan terhapus permanen.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      const json = await res.json();

      if (json.success) {
        toast.success(`Akun ${name} berhasil dihapus`);
        loadPraktikans();
      } else {
        toast.error('Gagal: ' + json.error);
      }
    } catch {
      toast.error('Terjadi kesalahan server');
    }
  }

  const filteredPraktikans = praktikans.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.full_name.toLowerCase().includes(q) ||
      (p.nim || '').toLowerCase().includes(q) ||
      p.username.toLowerCase().includes(q)
    );
  });

  if (loading) return <Skeleton height={400} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title section-title-asprak">PRAKTIKAN</h1>
          <p className="text-sm" style={{ color: 'var(--muted-text)' }}>
            {praktikans.length} praktikan terdaftar
          </p>
        </div>
        <Button
          variant="primary-asprak"
          icon={<UserPlus size={16} />}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Tutup Form' : 'Tambah Praktikan'}
        </Button>
      </div>

      {/* Add Form */}
      {showForm && (
        <Card className="mb-6" padding="md" accentColor="var(--yellow)" accentPosition="left">
          <h3 className="text-sm font-bold uppercase mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Daftarkan Akun Baru
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Input
              label="Nama Lengkap"
              placeholder="Contoh: Budi Santoso"
              value={newNama}
              onChange={(e) => setNewNama(e.target.value)}
            />
            <Input
              label="Username"
              placeholder="Contoh: budisantoso"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
            />
            <Input
              label="NIM"
              placeholder="Contoh: 1301213456"
              value={newNim}
              onChange={(e) => setNewNim(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4">
            <Button variant="primary-asprak" loading={saving} onClick={handleAddPraktikan}>
              Daftarkan
            </Button>
            <p className="text-xs" style={{ color: 'var(--muted-text)' }}>
              Password default menggunakan NIM. Praktikan dapat mengubahnya setelah login.
            </p>
          </div>
        </Card>
      )}

      {/* Search */}
      <Card className="mb-6" padding="sm" shadow={false} style={{ background: 'var(--muted)' } as React.CSSProperties}>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-text)]" />
          <input
            className="neo-input pl-10"
            placeholder="Cari berdasarkan nama, NIM, atau username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </Card>

      {/* Table */}
      <Card padding="sm">
        <div className="overflow-x-auto">
          <table className="neo-table">
            <thead>
              <tr>
                <th>NIM</th>
                <th>Nama Lengkap</th>
                <th>Username</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredPraktikans.length > 0 ? (
                filteredPraktikans.map((p) => (
                  <tr key={p.id}>
                    <td className="font-mono text-sm">{p.nim}</td>
                    <td className="font-bold">{p.full_name}</td>
                    <td className="text-sm" style={{ color: 'var(--muted-text)' }}>
                      @{p.username}
                    </td>
                    <td>
                      <button
                        onClick={() => handleDeletePraktikan(p.id, p.full_name)}
                        className="p-2 bg-[var(--red)] text-white border-2 border-[var(--dark)] hover:brightness-90 transition-all cursor-pointer"
                        title="Hapus Akun"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-8" style={{ color: 'var(--muted-text)' }}>
                    {praktikans.length === 0
                      ? 'Belum ada praktikan terdaftar. Klik "Tambah Praktikan" untuk memulai.'
                      : 'Tidak ada praktikan yang cocok dengan pencarian.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
