export default function VersionBadge({ version }) {
  return (
    <span style={{
      backgroundColor: 'var(--ifm-color-primary)',
      color: 'white',
      padding: '0.1rem 0.5rem',
      borderRadius: '4px',
      fontSize: '0.65em',
      fontWeight: '600',
      verticalAlign: 'middle',
      marginLeft: '0.5rem',
      letterSpacing: '0.03em',
    }}>
      Since {version}
    </span>
  );
}
