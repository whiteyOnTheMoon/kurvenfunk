import styles from './admin-placeholder.module.css';

interface AdminPlaceholderProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function AdminPlaceholder({ eyebrow, title, description }: AdminPlaceholderProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </header>

      <section className={styles.placeholder}>
        <strong>{title}</strong>
        <span>
          Dieser Verwaltungsbereich wird in einem späteren Kurvenfunk-Task funktional umgesetzt.
        </span>
      </section>
    </div>
  );
}
