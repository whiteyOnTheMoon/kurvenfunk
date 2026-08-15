import type { HTMLAttributes, ImgHTMLAttributes, ReactNode } from 'react';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={['kf-card', className].filter(Boolean).join(' ')} {...props} />;
}

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={['kf-badge', className].filter(Boolean).join(' ')} {...props} />;
}

export interface AvatarProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallback?: ReactNode;
}

export function Avatar({ src, alt = '', fallback = '?', className, ...props }: AvatarProps) {
  return (
    <span className={['kf-avatar', className].filter(Boolean).join(' ')}>
      {src ? <img src={src} alt={alt} {...props} /> : fallback}
    </span>
  );
}

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

export function Alert({
  variant = 'info',
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: AlertVariant }) {
  return (
    <div
      role="alert"
      className={['kf-alert', `kf-alert--${variant}`, className].filter(Boolean).join(' ')}
      {...props}
    />
  );
}

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={['kf-skeleton', className].filter(Boolean).join(' ')} {...props} />;
}

export function EmptyState({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return (
    <div className="kf-empty-state">
      <strong>{title}</strong>
      {children}
    </div>
  );
}
