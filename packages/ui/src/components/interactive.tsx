'use client';

import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react';

export function Switch({
  checked,
  defaultChecked = false,
  onCheckedChange,
  label,
  disabled,
}: {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
}) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const value = checked ?? internalChecked;

  function toggle() {
    if (disabled) return;

    const next = !value;

    if (checked === undefined) {
      setInternalChecked(next);
    }

    onCheckedChange?.(next);
  }

  return (
    <label className="kf-switch-row">
      <button
        type="button"
        role="switch"
        aria-checked={value}
        data-checked={value}
        disabled={disabled}
        className="kf-switch"
        onClick={toggle}
      />
      {label ? <span>{label}</span> : null}
    </label>
  );
}

export function Tabs({
  items,
  defaultValue,
}: {
  items: Array<{ value: string; label: ReactNode; content: ReactNode }>;
  defaultValue?: string;
}) {
  const [active, setActive] = useState(defaultValue ?? items[0]?.value ?? '');

  return (
    <div>
      <div className="kf-tabs" role="tablist">
        {items.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active === item.value}
            className="kf-tabs__tab"
            onClick={() => setActive(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {items.map((item) =>
        active === item.value ? (
          <div key={item.value} role="tabpanel">
            {item.content}
          </div>
        ) : null,
      )}
    </div>
  );
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange?: (page: number) => void;
}) {
  return (
    <nav className="kf-pagination" aria-label="Pagination">
      {Array.from({ length: pageCount }, (_, index) => index + 1).map((value) => (
        <button
          key={value}
          type="button"
          aria-current={value === page ? 'page' : undefined}
          onClick={() => onPageChange?.(value)}
        >
          {value}
        </button>
      ))}
    </nav>
  );
}

export function IconButton({
  children,
  'aria-label': ariaLabel,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  'aria-label': string;
}) {
  return (
    <button type="button" className="kf-button kf-button--ghost" aria-label={ariaLabel} {...props}>
      {children}
    </button>
  );
}
