'use client';

import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from 'react';

export interface ModalProps {
  open: boolean;
  title: ReactNode;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
}

export function Modal({ open, title, children, onClose, footer }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;

    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;

    if (!dialog) {
      return;
    }

    function handleClose() {
      onClose();
    }

    dialog.addEventListener('close', handleClose);

    return () => {
      dialog.removeEventListener('close', handleClose);
    };
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      className="kf-dialog"
      aria-labelledby="kf-modal-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) {
          onClose();
        }
      }}
    >
      <div className="kf-dialog__panel">
        <div className="kf-dialog__header">
          <h2 id="kf-modal-title" className="kf-dialog__title">
            {title}
          </h2>

          <button
            type="button"
            className="kf-dialog__close"
            aria-label="Schließen"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="kf-dialog__content">{children}</div>

        {footer ? <div className="kf-dialog__footer">{footer}</div> : null}
      </div>
    </dialog>
  );
}

export interface DialogProps extends ModalProps {}

export function Dialog(props: DialogProps) {
  return <Modal {...props} />;
}

export interface DropdownItem {
  id: string;
  label: ReactNode;
  disabled?: boolean;
  onSelect?: () => void;
}

export function Dropdown({ label, items }: { label: ReactNode; items: DropdownItem[] }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div ref={rootRef} className="kf-dropdown">
      <button
        type="button"
        className="kf-button kf-button--secondary"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {label}
      </button>

      {open ? (
        <div className="kf-dropdown__menu" role="menu">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className="kf-dropdown__item"
              disabled={item.disabled}
              onClick={() => {
                item.onSelect?.();
                setOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function Tooltip({ content, children }: { content: ReactNode; children: ReactNode }) {
  return (
    <span className="kf-tooltip">
      <span className="kf-tooltip__trigger" tabIndex={0}>
        {children}
      </span>
      <span className="kf-tooltip__content" role="tooltip">
        {content}
      </span>
    </span>
  );
}

export type ToastVariant = 'info' | 'success' | 'warning' | 'danger';

export interface ToastProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: ToastVariant;
  title?: ReactNode;
  onClose?: () => void;
}

export function Toast({
  variant = 'info',
  title,
  children,
  onClose,
  className,
  ...props
}: ToastProps) {
  return (
    <div
      role="status"
      className={['kf-toast', `kf-toast--${variant}`, className].filter(Boolean).join(' ')}
      {...props}
    >
      <div className="kf-toast__body">
        {title ? <strong className="kf-toast__title">{title}</strong> : null}
        {children ? <div>{children}</div> : null}
      </div>

      {onClose ? (
        <button
          type="button"
          className="kf-toast__close"
          aria-label="Benachrichtigung schließen"
          onClick={onClose}
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
