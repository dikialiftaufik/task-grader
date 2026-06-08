'use client';

import React, { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { MessageCircle, FileText, Check, X, Search } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { formatRelativeTime } from '@/lib/utils';
import { getPublicUrl } from '@/lib/supabase/storage';
import ChatBox from '@/components/ui/ChatBox';

export default function DiskusiAsprakPage() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  
  const [actionResponse, setActionResponse] = useState('');
  const [newGrade, setNewGrade] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadDisputes();
  }, []);

  async function loadDisputes() {
    const res = await fetch('/api/dispute');
    const data = await res.json();
    if (data.success) {
      setDisputes(data.data);
      if (selectedDispute) {
        const updated = data.data.find((d: any) => d.id === selectedDispute.id);
        if (updated) setSelectedDispute(updated);
      }
    }
    setLoading(false);
  }

  const handleRespond = async (action: 'terima' | 'tolak') => {
    if (!actionResponse || actionResponse.length < 10) {
      toast.error('Alasan respons harus diisi (min 10 karakter)');
      return;
    }
    if (action === 'terima' && !newGrade) {
      toast.error('Nilai baru harus diisi jika menerima keberatan');
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(`/api/dispute/${selectedDispute.id}/respond`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          response: actionResponse,
          new_grade: action === 'terima' ? parseFloat(newGrade) : undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Keberatan berhasil di${action}`);
        setActionResponse('');
        setNewGrade('');
        loadDisputes();
      } else {
        toast.error(data.error || 'Gagal merespons keberatan');
      }
    } catch (err) {
      toast.error('Koneksi gagal');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'baru') return 'var(--blue)';
    if (status === 'diproses') return 'var(--orange)';
    if (status === 'diterima') return 'var(--green)';
    if (status === 'ditolak') return 'var(--red)';
    return 'var(--dark)';
  };

  return (
    <div>
      <h1 className="section-title section-title-asprak">DISKUSI & KEBERATAN</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
        {/* Inbox List */}
        <Card padding="none" className="lg:col-span-1 flex flex-col h-full overflow-hidden border-r-2 border-[var(--dark)]">
          <div className="p-4 border-b-2 border-[var(--dark)] bg-[var(--yellow)]">
            <h3 className="text-sm font-bold uppercase mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Inbox Keberatan
            </h3>
            <div className="neo-input bg-white flex items-center p-0 overflow-hidden">
              <div className="px-2 text-[var(--muted-text)]"><Search size={16} /></div>
              <input type="text" placeholder="Cari nama atau NIM..." className="w-full text-sm p-2 outline-none" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm font-medium">Memuat...</div>
            ) : disputes.length === 0 ? (
              <EmptyState icon={<MessageCircle size={32} />} title="Tidak ada keberatan" description="Semua clear!" />
            ) : (
              disputes.map(d => (
                <div 
                  key={d.id} 
                  onClick={() => setSelectedDispute(d)}
                  className={`p-4 border-b border-[var(--dark)] cursor-pointer transition-colors ${selectedDispute?.id === d.id ? 'bg-[var(--dark)] text-white' : 'hover:bg-[var(--muted)]'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-sm truncate">{d.users.full_name}</p>
                    <span className="text-[10px] font-bold uppercase px-1" style={{ backgroundColor: getStatusColor(d.status), color: 'white' }}>{d.status}</span>
                  </div>
                  <p className={`text-xs ${selectedDispute?.id === d.id ? 'text-gray-300' : 'text-gray-600'}`}>Modul {d.modules.number} - {d.users.nim}</p>
                  <p className={`text-[10px] mt-2 ${selectedDispute?.id === d.id ? 'text-gray-400' : 'text-gray-500'}`}>{formatRelativeTime(d.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Detail Panel */}
        <Card padding="none" className="lg:col-span-2 h-full flex flex-col overflow-hidden">
          {!selectedDispute ? (
            <div className="h-full flex items-center justify-center p-6">
              <EmptyState
                icon={<MessageCircle size={48} />}
                title="Pilih Percakapan"
                description="Pilih salah satu keberatan dari inbox untuk melihat detail dan memberikan respons."
              />
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-4 border-b-2 border-[var(--dark)] bg-[var(--muted)] flex justify-between items-center shrink-0">
                <div>
                  <h2 className="font-bold text-lg">{selectedDispute.users.full_name} <span className="font-mono text-sm text-[var(--muted-text)]">({selectedDispute.users.nim})</span></h2>
                  <p className="text-sm font-bold" style={{ color: 'var(--blue)' }}>Modul {selectedDispute.modules.number} - {selectedDispute.modules.title}</p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 font-bold text-xs text-white uppercase" style={{ backgroundColor: getStatusColor(selectedDispute.status) }}>
                    Status: {selectedDispute.status}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[var(--white)]">
                {/* Info Keberatan */}
                <div className="border-2 border-[var(--dark)] p-4 relative">
                  <span className="absolute -top-3 left-4 bg-[var(--dark)] text-white text-xs font-bold px-2 py-1 uppercase">Detail Keberatan</span>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4 mt-2">
                    <div>
                      <p className="text-xs text-[var(--muted-text)] font-bold">Komponen Dipersoalkan:</p>
                      <ul className="list-disc pl-4 text-sm font-medium mt-1">
                        {selectedDispute.komponen_dipersoalkan.map((k: string) => <li key={k}>{k}</li>)}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--muted-text)] font-bold">Nilai Saat Ini:</p>
                      <p className="text-xl font-bold font-display">{selectedDispute.nilai_sebelum}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-[var(--muted-text)] font-bold mb-1">Alasan / Penjelasan Praktikan:</p>
                    <div className="bg-[var(--muted)] p-3 border border-[var(--dark)] text-sm font-mono whitespace-pre-wrap">
                      {selectedDispute.alasan}
                    </div>
                  </div>

                  {selectedDispute.nilai_diminta && (
                    <div className="mb-4">
                      <p className="text-xs text-[var(--muted-text)] font-bold mb-1">Nilai yang Diminta:</p>
                      <p className="font-bold text-[var(--blue)] text-lg">{selectedDispute.nilai_diminta}</p>
                    </div>
                  )}

                  {selectedDispute.bukti_paths && selectedDispute.bukti_paths.length > 0 && (
                    <div>
                      <p className="text-xs text-[var(--muted-text)] font-bold mb-2">Bukti Lampiran:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedDispute.bukti_paths.map((path: string, i: number) => {
                          const url = getPublicUrl('submissions', path);
                          return (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs bg-white border-2 border-[var(--dark)] p-2 hover:bg-[var(--yellow)] transition-colors font-bold">
                              <FileText size={14} /> Bukti {i+1}
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Respons Asprak */}
                {selectedDispute.status === 'baru' || selectedDispute.status === 'diproses' ? (
                  <div className="border-2 border-[var(--dark)] p-4 bg-[var(--yellow)] relative">
                    <span className="absolute -top-3 left-4 bg-[var(--dark)] text-white text-xs font-bold px-2 py-1 uppercase">Beri Respons</span>
                    
                    <div className="mt-2 space-y-4">
                      <div>
                        <label className="block text-xs font-bold mb-1">Tanggapan / Alasan Keputusan *</label>
                        <textarea 
                          className="neo-input w-full min-h-[100px]"
                          placeholder="Jelaskan mengapa Anda menerima atau menolak keberatan ini..."
                          value={actionResponse}
                          onChange={e => setActionResponse(e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold mb-1">Nilai Akhir Baru (Jika Diterima)</label>
                        <Input 
                          type="number"
                          placeholder="Masukkan nilai baru (0-100)"
                          value={newGrade}
                          onChange={e => setNewGrade(e.target.value)}
                        />
                        <p className="text-[10px] text-[var(--muted-text)] mt-1">Hanya berlaku jika Anda menerima keberatan.</p>
                      </div>

                      <div className="flex gap-3 justify-end pt-2">
                        <Button 
                          variant="danger" 
                          icon={<X size={16} />}
                          loading={processing}
                          onClick={() => handleRespond('tolak')}
                        >
                          Tolak Keberatan
                        </Button>
                        <Button 
                          variant="success" 
                          icon={<Check size={16} />}
                          loading={processing}
                          onClick={() => handleRespond('terima')}
                        >
                          Terima & Ubah Nilai
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-[var(--dark)] p-4 bg-[var(--muted)] relative opacity-80">
                    <span className="absolute -top-3 left-4 bg-[var(--dark)] text-white text-xs font-bold px-2 py-1 uppercase">Respons Anda</span>
                    <div className="mt-2">
                      <p className="text-xs text-[var(--muted-text)] font-bold mb-1">Keputusan:</p>
                      <p className={`font-bold uppercase ${selectedDispute.status === 'diterima' ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>{selectedDispute.status}</p>
                      
                      <p className="text-xs text-[var(--muted-text)] font-bold mt-3 mb-1">Komentar:</p>
                      <p className="text-sm bg-white p-2 border border-[var(--dark)]">{selectedDispute.asprak_response}</p>

                      {selectedDispute.status === 'diterima' && selectedDispute.nilai_sesudah && (
                        <>
                          <p className="text-xs text-[var(--muted-text)] font-bold mt-3 mb-1">Nilai Diubah Menjadi:</p>
                          <p className="text-xl font-bold font-display">{selectedDispute.nilai_sesudah}</p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Diskusi / Chat */}
                <div className="mt-8 border-t-2 border-[var(--dark)] pt-8">
                  <h3 className="font-bold text-lg mb-4 uppercase" style={{ fontFamily: 'var(--font-display)' }}>Tanya Jawab / Chat Praktikan</h3>
                  <div className="h-[400px]">
                    <ChatBox praktikanId={selectedDispute.user_id} disputeId={selectedDispute.id} />
                  </div>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
