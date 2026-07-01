import { useState, useCallback } from 'react';
import { MessageCircle, Copy, Check } from 'lucide-react';
import wechatQr from '@/assets/wechat-qr.png';
import { useI18n } from '@/i18n';
import { getDeviceId } from '@/utils/deviceId';
import type { ProduceResult } from '@/core/diagnostic/bundle';
import DiagnosticUpload from './diagnostic/DiagnosticUpload';
import ExportSuccessCard from './diagnostic/ExportSuccessCard';

export default function FeedbackSection() {
  const { t } = useI18n();
  const [description, setDescription] = useState('');
  const [exportSuccess, setExportSuccess] = useState<ProduceResult | null>(null);
  const [idCopied, setIdCopied] = useState(false);
  const deviceId = getDeviceId();

  const handleCopyDeviceId = useCallback(() => {
    void navigator.clipboard.writeText(deviceId).then(() => {
      setIdCopied(true);
      setTimeout(() => setIdCopied(false), 2000);
    });
  }, [deviceId]);

  return (
    <div className="space-y-6 max-w-lg">
      {/* Header — centered */}
      <div className="flex flex-col items-center text-center pb-2">
        <div className="h-12 w-12 rounded-2xl bg-[var(--abu-clay-bg)] flex items-center justify-center mb-3">
          <MessageCircle className="h-6 w-6 text-[var(--abu-clay)]" />
        </div>
        <h3 className="text-[16px] font-semibold text-[var(--abu-text-primary)]">{t.about.feedback}</h3>
        <p className="text-[12px] text-[var(--abu-text-tertiary)] mt-1">{t.diagnostic.exportDesc}</p>
      </div>

      {/* Diagnostic upload + description */}
      <DiagnosticUpload
        onExportSuccess={setExportSuccess}
        description={description}
        onDescriptionChange={setDescription}
      />

      {/* Export success card */}
      {exportSuccess && (
        <ExportSuccessCard
          path={exportSuccess.path}
          sizeBytes={exportSuccess.sizeBytes}
          scrubbedTextCount={exportSuccess.scrubbedTextCount}
          fileList={exportSuccess.fileList}
          onDismiss={() => setExportSuccess(null)}
        />
      )}

      {/* Divider */}
      <div className="border-t border-[var(--abu-border)]" />

      {/* WeChat QR — centered */}
      <div className="flex flex-col items-center text-center space-y-3">
        <p className="text-[12px] font-medium text-[var(--abu-text-secondary)]">{t.about.wechatSectionTitle}</p>
        <img src={wechatQr} alt="WeChat QR" className="w-40 h-40 rounded-xl shadow-sm" />
        <p className="text-[12px] text-[var(--abu-text-tertiary)]">{t.about.feedbackDesc}</p>
      </div>

      {/* Device ID */}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--abu-border)]">
        <span className="text-xs text-[var(--abu-text-muted)]">{t.about.deviceId}</span>
        <button
          type="button"
          onClick={handleCopyDeviceId}
          className="flex items-center gap-1.5 text-xs font-mono text-[var(--abu-text-muted)] hover:text-[var(--abu-text-secondary)] transition-colors"
          title={deviceId}
        >
          <span>{deviceId.slice(0, 8)}</span>
          {idCopied
            ? <Check className="h-3 w-3 text-green-500" />
            : <Copy className="h-3 w-3" />
          }
        </button>
      </div>
    </div>
  );
}
