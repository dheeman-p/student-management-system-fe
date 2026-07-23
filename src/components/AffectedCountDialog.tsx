import { CSSProperties } from 'react';

export type AffectedCountAction = 'edit' | 'delete';

export interface AffectedCountDialogProps {
  /** Whether the dialog is visible. Renders nothing when false. */
  open: boolean;
  /** Which operation is pending confirmation. */
  action: AffectedCountAction;
  /** Number of students enrolled in the schedule entry being changed. */
  affectedCount: number;
  /** Optional human-readable label of the entry (e.g. "Math — Mon, Period 1"). */
  entryLabel?: string;
  /** Called when the Admin chooses to proceed despite the warning. */
  onConfirm: () => void;
  /** Called when the Admin cancels the pending action. */
  onCancel: () => void;
  /** Disables the confirm/cancel buttons while the underlying request is in flight. */
  busy?: boolean;
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const dialogStyle: CSSProperties = {
  background: '#fff',
  borderRadius: 8,
  padding: 24,
  maxWidth: 420,
  width: '90%',
  boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
  fontFamily: 'sans-serif',
};

const actionsStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
  marginTop: 20,
};

const warningStyle: CSSProperties = {
  color: '#8a6100',
  background: '#fff6e0',
  border: '1px solid #f0d38a',
  borderRadius: 4,
  padding: '8px 12px',
  fontSize: 14,
};

/**
 * Proceed-anyway confirmation dialog shown before saving an edit or
 * performing a delete on a schedule entry that has enrolled students.
 * The Admin can either cancel or explicitly confirm they want to proceed
 * despite the warning.
 */
export default function AffectedCountDialog({
  open,
  action,
  affectedCount,
  entryLabel,
  onConfirm,
  onCancel,
  busy = false,
}: AffectedCountDialogProps) {
  if (!open) return null;

  const actionVerb = action === 'delete' ? 'Delete' : 'Save changes to';
  const consequence =
    action === 'delete'
      ? 'This will also remove their enrollment records for this slot.'
      : 'Enrolled students will keep their enrollment, but the schedule details will change for them.';

  return (
    <div role="presentation" style={overlayStyle} onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="affected-count-dialog-title"
        style={dialogStyle}
        onClick={(e) => e.stopPropagation()}
        data-testid="affected-count-dialog"
      >
        <h2 id="affected-count-dialog-title" style={{ marginTop: 0, fontSize: 18 }}>
          {actionVerb} schedule entry{entryLabel ? `: ${entryLabel}` : ''}?
        </h2>
        <p role="alert" style={warningStyle}>
          {affectedCount} {affectedCount === 1 ? 'student is' : 'students are'} enrolled in this slot. {consequence}
        </p>
        <p style={{ fontSize: 14, color: '#444' }}>Do you want to proceed anyway?</p>
        <div style={actionsStyle}>
          <button type="button" onClick={onCancel} disabled={busy} style={{ padding: '8px 16px' }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            data-testid="affected-count-confirm"
            style={{ padding: '8px 16px', background: '#b00020', color: '#fff', border: 'none', borderRadius: 4 }}
          >
            {busy ? 'Working…' : 'Proceed anyway'}
          </button>
        </div>
      </div>
    </div>
  );
}
