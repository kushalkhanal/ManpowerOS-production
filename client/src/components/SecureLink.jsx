import { useSecureDocUrl } from '../utils/secureDocUrl';

/**
 * Anchor that resolves a stored document URL through the secure proxy
 * before rendering. Safe to use inside .map() loops since the hook is
 * scoped to this component instance.
 *
 * Renders nothing if storedUrl is falsy. While resolving, renders the
 * link with `aria-disabled` and a non-clickable placeholder so layout
 * doesn't shift.
 */
const SecureLink = ({
  storedUrl,
  children,
  className,
  fallbackText = 'Loading…',
  ...anchorProps
}) => {
  const { url, loading } = useSecureDocUrl(storedUrl);

  if (!storedUrl) return null;

  if (!url || loading) {
    return (
      <span className={className} aria-disabled="true" style={{ opacity: 0.6 }}>
        {fallbackText}
      </span>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className} {...anchorProps}>
      {children}
    </a>
  );
};

export default SecureLink;
