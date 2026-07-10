type LoadingStateProps = {
  label: string;
  title?: string;
};

export function LoadingState({ label, title = '拾音岛' }: LoadingStateProps) {
  return (
    <main aria-busy="true" aria-label={label} className="app-loading" role="status">
      <strong>{title}</strong>
      <span>{label}</span>
    </main>
  );
}
