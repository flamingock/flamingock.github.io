const VARIANT_STYLES = {
  default: { fontSize: '0.65em', padding: '0.1rem 0.5rem',   marginLeft: '0.5rem' },
  title:   { fontSize: '0.5em',  padding: '0.08rem 0.4rem',  marginLeft: '0.5rem' },
  table:   { fontSize: '0.6em',  padding: '0.05rem 0.35rem', marginLeft: '0.3rem' },
};

export default function VersionBadge({ version, variant = 'default' }) {
  const variantStyle = VARIANT_STYLES[variant] ?? VARIANT_STYLES.default;
  return (
    <span style={{
      backgroundColor: 'var(--ifm-color-primary)',
      color: 'white',
      borderRadius: '4px',
      fontWeight: '600',
      verticalAlign: 'middle',
      letterSpacing: '0.03em',
      ...variantStyle,
    }}>
      Since {version}
    </span>
  );
}
