import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

interface FieldProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
}

export function Field({ label, hint, error, children }: FieldProps) {
  return (
    <label className="kf-field">
      {label ? <span className="kf-field__label">{label}</span> : null}
      {children}
      {error ? (
        <span className="kf-field__error">{error}</span>
      ) : hint ? (
        <span className="kf-field__hint">{hint}</span>
      ) : null}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={['kf-input', props.className].filter(Boolean).join(' ')} {...props} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={['kf-textarea', props.className].filter(Boolean).join(' ')} {...props} />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={['kf-select', props.className].filter(Boolean).join(' ')} {...props} />;
}

export function Checkbox({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: ReactNode }) {
  return (
    <label className="kf-checkbox-row">
      <input
        type="checkbox"
        className={['kf-checkbox', props.className].filter(Boolean).join(' ')}
        {...props}
      />
      {label ? <span>{label}</span> : null}
    </label>
  );
}
