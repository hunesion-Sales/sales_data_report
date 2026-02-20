export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

// 최대 파일 크기: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// 허용 MIME 타입
const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
];

// Excel 매직 바이트
// XLSX (ZIP): PK (0x50 0x4B 0x03 0x04)
// XLS (OLE2): 0xD0 0xCF 0x11 0xE0
const XLSX_MAGIC = [0x50, 0x4B, 0x03, 0x04];
const XLS_MAGIC = [0xD0, 0xCF, 0x11, 0xE0];

/**
 * 파일 확장자 검증
 */
function validateExtension(fileName: string): boolean {
  const ext = fileName.toLowerCase().split('.').pop();
  return ext === 'xlsx' || ext === 'xls';
}

/**
 * MIME 타입 검증
 * 주의: 브라우저별로 MIME 감지가 다를 수 있으므로 빈 문자열도 허용
 */
function validateMimeType(file: File): boolean {
  if (!file.type || file.type === '') return true; // MIME 미감지 시 통과 (매직 바이트에서 검증)
  return ALLOWED_MIME_TYPES.includes(file.type);
}

/**
 * 매직 바이트 검증 (파일 헤더의 첫 4바이트)
 */
async function validateMagicBytes(file: File): Promise<boolean> {
  const slice = file.slice(0, 4);
  const buffer = await slice.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  if (bytes.length < 4) return false;

  const isXlsx = XLSX_MAGIC.every((b, i) => bytes[i] === b);
  const isXls = XLS_MAGIC.every((b, i) => bytes[i] === b);

  return isXlsx || isXls;
}

/**
 * 엑셀 파일 종합 검증 (확장자 + MIME + 크기 + 매직 바이트)
 */
export async function validateExcelFile(file: File): Promise<FileValidationResult> {
  // 1. 확장자 검증
  if (!validateExtension(file.name)) {
    return { valid: false, error: '지원하지 않는 파일 형식입니다. .xlsx 또는 .xls 파일을 업로드해주세요.' };
  }

  // 2. 파일 크기 검증
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `파일 크기가 너무 큽니다 (${sizeMB}MB). 최대 10MB까지 업로드 가능합니다.` };
  }

  if (file.size === 0) {
    return { valid: false, error: '빈 파일입니다. 유효한 엑셀 파일을 업로드해주세요.' };
  }

  // 3. MIME 타입 검증
  if (!validateMimeType(file)) {
    return { valid: false, error: '유효한 엑셀 파일이 아닙니다. 파일 형식을 확인해주세요.' };
  }

  // 4. 매직 바이트 검증
  const magicValid = await validateMagicBytes(file);
  if (!magicValid) {
    return { valid: false, error: '파일 내용이 엑셀 형식이 아닙니다. 정상적인 엑셀 파일을 업로드해주세요.' };
  }

  return { valid: true };
}
