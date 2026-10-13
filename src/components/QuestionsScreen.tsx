import React, { useState, useRef } from 'react';
import {
  Database,
  Plus,
  Trash2,
  Edit2,
  FileSpreadsheet,
  Download,
  Upload,
  RotateCcw,
  Search,
  X,
  Check,
  Info
} from 'lucide-react';
import { Question } from '../types';
import {
  downloadExcelTemplate,
  downloadCsvTemplate,
  exportQuestionsToExcel,
  parseQuestionsFromFile
} from '../utils/excel';
import { soundManager } from '../utils/audio';

interface QuestionsScreenProps {
  questions: Question[];
  onSaveQuestions: (questions: Question[]) => void;
  onResetQuestions: () => void;
  onBack: () => void;
}

export const QuestionsScreen: React.FC<QuestionsScreenProps> = ({
  questions,
  onSaveQuestions,
  onResetQuestions,
  onBack
}) => {
  const [formQ, setFormQ] = useState('');
  const [formL, setFormL] = useState('');
  const [formR, setFormR] = useState('');
  const [formA, setFormA] = useState<'kiri' | 'kanan'>('kanan');
  const [formCat, setFormCat] = useState('Umum');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  // Edit Modal State
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Reset Confirmation Modal State
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleAddQuestion = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formQ.trim() || !formL.trim() || !formR.trim()) {
      showToast('Harap lengkapi Pertanyaan, Opsi Kiri, dan Opsi Kanan!', 'error');
      return;
    }

    const newQuestion: Question = {
      id: Date.now() + Math.random(),
      q: formQ.trim(),
      l: formL.trim(),
      r: formR.trim(),
      a: formA,
      category: formCat.trim() || 'Umum'
    };

    onSaveQuestions([...questions, newQuestion]);
    soundManager.playCorrect();
    showToast('Pertanyaan baru berhasil ditambahkan!', 'success');

    // Reset input fields
    setFormQ('');
    setFormL('');
    setFormR('');
  };

  const handleDelete = (id: number | string) => {
    soundManager.playClick();
    const updated = questions.filter((q) => q.id !== id);
    onSaveQuestions(updated);
    showToast('Pertanyaan telah dihapus.', 'info');
  };

  const handleSaveEdit = () => {
    if (!editingQuestion) return;
    if (!editingQuestion.q.trim() || !editingQuestion.l.trim() || !editingQuestion.r.trim()) {
      showToast('Semua kolom harus diisi!', 'error');
      return;
    }

    const updated = questions.map((q) => (q.id === editingQuestion.id ? editingQuestion : q));
    onSaveQuestions(updated);
    soundManager.playCorrect();
    setEditingQuestion(null);
    showToast('Perubahan soal berhasil disimpan!', 'success');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await parseQuestionsFromFile(file);
    if (result.success && result.questions && result.questions.length > 0) {
      onSaveQuestions([...questions, ...result.questions]);
      soundManager.playCorrect();
      showToast(`Sukses! ${result.importedCount} soal berhasil diimpor ke Bank Soal.`, 'success');
    } else {
      soundManager.playWrong();
      showToast(result.error || 'Gagal mengimpor file.', 'error');
    }

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplateExcel = () => {
    soundManager.playClick();
    const ok = downloadExcelTemplate();
    if (ok) {
      showToast('File template Excel berhasil diunduh.', 'success');
    } else {
      downloadCsvTemplate();
      showToast('Unduhan Excel dialihkan ke format CSV.', 'info');
    }
  };

  const handleDownloadTemplateCsv = () => {
    soundManager.playClick();
    downloadCsvTemplate();
    showToast('File template CSV berhasil diunduh.', 'success');
  };

  const handleExport = () => {
    soundManager.playClick();
    if (questions.length === 0) {
      showToast('Belum ada soal untuk diekspor.', 'error');
      return;
    }
    const ok = exportQuestionsToExcel(questions);
    if (ok) {
      showToast('Bank soal berhasil diekspor ke Excel!', 'success');
    }
  };

  // Filter questions
  const categories = ['Semua', ...Array.from(new Set(questions.map((q) => q.category || 'Umum')))];

  const filteredQuestions = questions.filter((q) => {
    const matchesCategory = selectedCategory === 'Semua' || (q.category || 'Umum') === selectedCategory;
    const matchesSearch =
      q.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.l.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.r.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="glass-panel-modal p-5 md:p-8 rounded-[2rem] flex flex-col w-full max-w-5xl h-[92vh] animate-pop overflow-hidden relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl border shadow-2xl flex items-center gap-2 text-sm md:text-base font-bold animate-pop ${
            toastType === 'success'
              ? 'bg-emerald-900/90 text-emerald-200 border-emerald-500'
              : toastType === 'error'
              ? 'bg-red-900/90 text-red-200 border-red-500'
              : 'bg-blue-900/90 text-blue-200 border-blue-500'
          }`}
        >
          {toastType === 'success' ? <Check className="w-5 h-5" /> : <Info className="w-5 h-5" />}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Close button */}
      <button
        onClick={() => {
          soundManager.playClick();
          onBack();
        }}
        className="absolute top-5 right-5 text-gray-400 hover:text-white p-2 rounded-full hover:bg-slate-800/60 transition-colors z-20 cursor-pointer"
        aria-label="Tutup"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Header */}
      <div className="flex items-center justify-center gap-3 mb-1">
        <Database className="w-8 h-8 text-yellow-400" />
        <h2 className="text-3xl md:text-4xl font-heading text-yellow-400 text-center">
          Bank Soal Edukasi
        </h2>
      </div>
      <p className="text-center text-gray-300 text-sm mb-4">
        Kelola pertanyaan kuis, tambah materi baru, atau impor langsung dari Microsoft Excel / Google Sheets
      </p>

      {/* Input Form Baru */}
      <form
        onSubmit={handleAddQuestion}
        className="bg-slate-900/85 p-4 md:p-5 rounded-2xl border border-slate-700/60 shadow-inner mb-4 shrink-0"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-gray-300 mb-1">Pertanyaan Baru</label>
            <input
              type="text"
              value={formQ}
              onChange={(e) => setFormQ(e.target.value)}
              placeholder="Contoh: Apa ibukota Jawa Timur?"
              className="w-full p-2.5 bg-slate-800 rounded-xl text-white text-sm border border-slate-600 focus:border-yellow-400 outline-none transition-colors"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-cyan-300 mb-1">Opsi Kiri (👈)</label>
            <input
              type="text"
              value={formL}
              onChange={(e) => setFormL(e.target.value)}
              placeholder="Opsi Kiri"
              className="w-full p-2.5 bg-slate-800 rounded-xl text-white text-sm border border-slate-600 focus:border-cyan-400 outline-none transition-colors"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-emerald-300 mb-1">Opsi Kanan (👉)</label>
            <input
              type="text"
              value={formR}
              onChange={(e) => setFormR(e.target.value)}
              placeholder="Opsi Kanan"
              className="w-full p-2.5 bg-slate-800 rounded-xl text-white text-sm border border-slate-600 focus:border-emerald-400 outline-none transition-colors"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-300 mb-1">Kunci Jawaban</label>
            <select
              value={formA}
              onChange={(e) => setFormA(e.target.value as 'kiri' | 'kanan')}
              className="w-full p-2.5 bg-slate-800 rounded-xl text-white text-sm border border-slate-600 focus:border-yellow-400 outline-none cursor-pointer"
            >
              <option value="kiri">👈 Kiri</option>
              <option value="kanan">👉 Kanan</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer text-sm"
            >
              <Plus className="w-4 h-4" /> Tambah
            </button>
          </div>
        </div>
      </form>

      {/* Toolbar & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-3 shrink-0">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari pertanyaan atau opsi..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900/80 rounded-xl text-xs md:text-sm text-white border border-slate-700 outline-none focus:border-yellow-400"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 bg-slate-900/80 rounded-xl text-xs md:text-sm text-gray-200 border border-slate-700 outline-none cursor-pointer"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <input
            type="file"
            ref={fileInputRef}
            accept=".xlsx, .xls, .csv"
            className="hidden"
            onChange={handleFileUpload}
          />

          <button
            onClick={handleDownloadTemplateExcel}
            title="Unduh format file Excel untuk diisi"
            className="py-1.5 px-3 bg-sky-600/90 hover:bg-sky-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow"
          >
            <Download className="w-3.5 h-3.5" /> Template Excel
          </button>

          <button
            onClick={handleDownloadTemplateCsv}
            title="Unduh alternatif format file CSV"
            className="py-1.5 px-2.5 bg-slate-700 hover:bg-slate-600 text-gray-200 rounded-lg font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow"
          >
            .CSV
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            title="Unggah file Excel atau CSV berisi soal"
            className="py-1.5 px-3 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow"
          >
            <Upload className="w-3.5 h-3.5" /> Impor File
          </button>

          <button
            onClick={handleExport}
            title="Simpan seluruh bank soal ke file Excel"
            className="py-1.5 px-3 bg-teal-600/90 hover:bg-teal-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Ekspor
          </button>

          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              setShowResetConfirmModal(true);
            }}
            title="Kembalikan bank soal ke 5 pertanyaan bawaan"
            className="py-1.5 px-3 bg-red-700/80 hover:bg-red-600 active:bg-red-800 text-white rounded-lg font-bold text-xs flex items-center gap-1 transition-all cursor-pointer border border-red-500/40 hover:scale-105"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Bawaan
          </button>
        </div>
      </div>

      {/* Info Help Banner */}
      <div className="bg-blue-950/40 border border-blue-500/30 rounded-xl px-3.5 py-2 mb-3 text-xs text-blue-200/90 flex items-center gap-2 shrink-0">
        <Info className="w-4 h-4 text-cyan-400 shrink-0" />
        <span>
          Format kolom Excel / CSV: <b>Soal</b>, <b>OpsiKiri</b>, <b>OpsiKanan</b>, dan <b>Jawaban</b> (isi dengan "kiri" atau "kanan").
        </span>
      </div>

      {/* Question Table */}
      <div className="flex-1 overflow-y-auto bg-slate-900/80 rounded-2xl border border-slate-700/60 min-h-0">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-slate-800/90 sticky top-0 z-10 text-xs font-bold uppercase tracking-wider text-gray-300">
            <tr>
              <th className="p-3.5 border-b border-slate-700">No</th>
              <th className="p-3.5 border-b border-slate-700">Pertanyaan</th>
              <th className="p-3.5 border-b border-slate-700 text-cyan-300">Opsi Kiri</th>
              <th className="p-3.5 border-b border-slate-700 text-emerald-300">Opsi Kanan</th>
              <th className="p-3.5 border-b border-slate-700">Kunci</th>
              <th className="p-3.5 border-b border-slate-700 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-gray-200">
            {filteredQuestions.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-400 italic">
                  Tidak ada soal yang cocok dengan pencarian.
                </td>
              </tr>
            ) : (
              filteredQuestions.map((q, idx) => (
                <tr key={q.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-3.5 text-gray-400 font-mono text-xs w-12">{idx + 1}</td>
                  <td className="p-3.5 font-medium">{q.q}</td>
                  <td className="p-3.5 text-cyan-300 font-semibold">{q.l}</td>
                  <td className="p-3.5 text-emerald-300 font-semibold">{q.r}</td>
                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                        q.a === 'kiri'
                          ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
                          : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {q.a === 'kiri' ? '👈 Kiri' : '👉 Kanan'}
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setEditingQuestion(q)}
                        className="p-1.5 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Edit soal"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(q.id)}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Hapus soal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-pop">
          <div className="glass-panel p-6 rounded-2xl w-full max-w-lg border border-slate-600 shadow-2xl">
            <h3 className="text-xl font-heading text-yellow-400 mb-4 flex items-center gap-2">
              <Edit2 className="w-5 h-5" /> Ubah Pertanyaan
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Pertanyaan</label>
                <input
                  type="text"
                  value={editingQuestion.q}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, q: e.target.value })}
                  className="w-full p-2.5 bg-slate-800 rounded-xl text-white text-sm border border-slate-600 focus:border-yellow-400 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-cyan-300 mb-1">Opsi Kiri</label>
                  <input
                    type="text"
                    value={editingQuestion.l}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, l: e.target.value })}
                    className="w-full p-2.5 bg-slate-800 rounded-xl text-white text-sm border border-slate-600 focus:border-cyan-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-emerald-300 mb-1">Opsi Kanan</label>
                  <input
                    type="text"
                    value={editingQuestion.r}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, r: e.target.value })}
                    className="w-full p-2.5 bg-slate-800 rounded-xl text-white text-sm border border-slate-600 focus:border-emerald-400 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Kunci Jawaban</label>
                <select
                  value={editingQuestion.a}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      a: e.target.value as 'kiri' | 'kanan'
                    })
                  }
                  className="w-full p-2.5 bg-slate-800 rounded-xl text-white text-sm border border-slate-600 focus:border-yellow-400 outline-none cursor-pointer"
                >
                  <option value="kiri">👈 Kiri</option>
                  <option value="kanan">👉 Kanan</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingQuestion(null)}
                className="py-2 px-4 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm font-bold text-gray-200 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                className="py-2 px-5 bg-yellow-600 hover:bg-yellow-500 rounded-xl text-sm font-bold text-white shadow-lg cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Reset Bawaan */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-pop">
          <div className="glass-panel-modal p-6 md:p-8 rounded-2xl w-full max-w-md border border-red-500/40 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto mb-4 text-red-400">
              <RotateCcw className="w-8 h-8 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <h3 className="text-xl md:text-2xl font-heading text-white mb-2">
              Kembalikan Soal Bawaan?
            </h3>
            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              Semua pertanyaan yang ada saat ini akan digantikan kembali dengan <b>5 soal bawaan asli</b> aplikasi. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  setShowResetConfirmModal(false);
                }}
                className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-gray-200 font-bold rounded-xl transition-all cursor-pointer text-sm"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  soundManager.playCorrect();
                  onResetQuestions();
                  setSearchTerm('');
                  setSelectedCategory('Semua');
                  setShowResetConfirmModal(false);
                  showToast('Bank soal berhasil dikembalikan ke 5 soal bawaan!', 'success');
                }}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold rounded-xl transition-all shadow-lg cursor-pointer text-sm"
              >
                Ya, Reset Soal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
