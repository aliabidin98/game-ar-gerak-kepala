import * as XLSX from 'xlsx';
import { Question } from '../types';

export const TEMPLATE_QUESTIONS = [
  { Soal: 'Apa nama ibukota negara Indonesia?', OpsiKiri: 'Bandung', OpsiKanan: 'Jakarta', Jawaban: 'kanan', Gambar: '' },
  { Soal: 'Berapa hasil dari 7 x 8?', OpsiKiri: '56', OpsiKanan: '54', Jawaban: 'kiri', Gambar: '' },
  { Soal: 'Hewan mamalia yang bisa terbang?', OpsiKiri: 'Kelelawar', OpsiKanan: 'Burung Hantu', Jawaban: 'kiri', Gambar: '' },
  { Soal: 'Planet terdekat dari matahari?', OpsiKiri: 'Mars', OpsiKanan: 'Merkurius', Jawaban: 'kanan', Gambar: '' },
  { Soal: 'Siapa penemu bola lampu pijar?', OpsiKiri: 'Thomas A. Edison', OpsiKanan: 'Nikola Tesla', Jawaban: 'kiri', Gambar: '' }
];

export function downloadExcelTemplate(): boolean {
  try {
    const ws = XLSX.utils.json_to_sheet(TEMPLATE_QUESTIONS);
    ws['!cols'] = [{ wch: 40 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 30 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Soal');
    XLSX.writeFile(wb, 'Template_Soal_EduTilt.xlsx');
    return true;
  } catch (err) {
    console.error('Failed to download excel file directly:', err);
    return false;
  }
}

export function downloadCsvTemplate(): void {
  const header = 'Soal,OpsiKiri,OpsiKanan,Jawaban,Gambar\n';
  const rows = TEMPLATE_QUESTIONS.map(
    q => `"${q.Soal.replace(/"/g, '""')}","${q.OpsiKiri.replace(/"/g, '""')}","${q.OpsiKanan.replace(/"/g, '""')}",${q.Jawaban},"${q.Gambar || ''}"`
  ).join('\n');
  const csvContent = '\uFEFF' + header + rows;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'Template_Soal_EduTilt.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportQuestionsToExcel(questions: Question[]): boolean {
  try {
    const exportData = questions.map((q) => ({
      Soal: q.q,
      OpsiKiri: q.l,
      OpsiKanan: q.r,
      Jawaban: q.a,
      Kategori: q.category || 'Umum',
      Gambar: q.image || ''
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = [{ wch: 45 }, { wch: 22 }, { wch: 22 }, { wch: 14 }, { wch: 16 }, { wch: 35 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bank Soal');
    XLSX.writeFile(wb, `Bank_Soal_EduTilt_${new Date().toISOString().slice(0, 10)}.xlsx`);
    return true;
  } catch (err) {
    console.error('Failed to export questions to excel:', err);
    return false;
  }
}

export async function parseQuestionsFromFile(file: File): Promise<{
  success: boolean;
  questions?: Question[];
  importedCount?: number;
  error?: string;
}> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          return resolve({ success: false, error: 'File Excel tidak memiliki lembar (sheet).' });
        }
        const worksheet = workbook.Sheets[firstSheetName];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (!rawJson || rawJson.length === 0) {
          return resolve({ success: false, error: 'File kosong atau tidak ada data yang terbaca.' });
        }

        const validQuestions: Question[] = [];

        rawJson.forEach((row, idx) => {
          // Normalize key names
          let qText = '';
          let leftText = '';
          let rightText = '';
          let ansText = '';
          let catText = 'Umum';
          let imgText = '';

          Object.keys(row).forEach((k) => {
            const cleanKey = k.toLowerCase().replace(/[\s_-]/g, '');
            const val = String(row[k] ?? '').trim();

            if (cleanKey === 'soal' || cleanKey === 'pertanyaan' || cleanKey === 'question') {
              qText = val;
            } else if (cleanKey === 'opsikiri' || cleanKey === 'kiri' || cleanKey === 'left' || cleanKey === 'opsia') {
              leftText = val;
            } else if (cleanKey === 'opsikanan' || cleanKey === 'kanan' || cleanKey === 'right' || cleanKey === 'opsib') {
              rightText = val;
            } else if (cleanKey === 'jawaban' || cleanKey === 'kunci' || cleanKey === 'kuncijawaban' || cleanKey === 'answer') {
              ansText = val.toLowerCase();
            } else if (cleanKey === 'kategori' || cleanKey === 'category' || cleanKey === 'mapel') {
              catText = val;
            } else if (cleanKey === 'gambar' || cleanKey === 'image' || cleanKey === 'foto' || cleanKey === 'urlgambar' || cleanKey === 'linkgambar') {
              imgText = val;
            }
          });

          // Check if valid
          if (qText && leftText && rightText && (ansText === 'kiri' || ansText === 'kanan' || ansText === 'a' || ansText === 'b')) {
            const normalizedAns: 'kiri' | 'kanan' = (ansText === 'kiri' || ansText === 'a') ? 'kiri' : 'kanan';
            validQuestions.push({
              id: Date.now() + idx + Math.random(),
              q: qText,
              l: leftText,
              r: rightText,
              a: normalizedAns,
              category: catText || 'Umum',
              ...(imgText ? { image: imgText } : {})
            });
          }
        });

        if (validQuestions.length === 0) {
          return resolve({
            success: false,
            error: 'Tidak ditemukan baris yang valid. Pastikan ada kolom Soal, OpsiKiri, OpsiKanan, dan Jawaban (kiri/kanan).'
          });
        }

        return resolve({
          success: true,
          questions: validQuestions,
          importedCount: validQuestions.length
        });
      } catch (err) {
        console.error('Error parsing file:', err);
        return resolve({
          success: false,
          error: 'Terjadi kesalahan saat memproses file. Pastikan format file .xlsx atau .csv valid.'
        });
      }
    };

    reader.onerror = () => {
      resolve({ success: false, error: 'Gagal membaca file.' });
    };

    reader.readAsArrayBuffer(file);
  });
}
