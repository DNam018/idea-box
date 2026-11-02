/**
 * Icon lay nguyen tu canvas design: stroke SVG 24x24, stroke-width 1.8.
 * Dung class .ic / .ic-sm de thua kich thuoc va mau tu CSS.
 */
import type { SVGProps } from 'react';

type Props = SVGProps<SVGSVGElement> & { small?: boolean };

function Svg({ small, className, children, ...rest }: Props & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={[small ? 'ic ic-sm' : 'ic', className].filter(Boolean).join(' ')}
      aria-hidden={rest['aria-label'] ? undefined : true}
      role={rest['aria-label'] ? 'img' : undefined}
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconBulb = (p: Props) => (
  <Svg {...p}>
    <path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z" />
  </Svg>
);
export const IconUpload = (p: Props) => (
  <Svg {...p}><path d="M12 16V5M7 9l5-5 5 5M5 20h14" /></Svg>
);
export const IconDownload = (p: Props) => (
  <Svg {...p}><path d="M12 4v11M7 11l5 5 5-5M5 20h14" /></Svg>
);
export const IconClose = (p: Props) => (
  <Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>
);
export const IconCheck = (p: Props) => (
  <Svg {...p}><path d="M5 12l5 5 9-10" /></Svg>
);
export const IconAlert = (p: Props) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16.5v.5" /></Svg>
);
export const IconSearch = (p: Props) => (
  <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></Svg>
);
export const IconPin = (p: Props) => (
  <Svg {...p}><path d="M12 17v5M9 3h6l-1 6 3 3v2H7v-2l3-3z" /></Svg>
);
export const IconClip = (p: Props) => (
  <Svg {...p}>
    <path d="M21 11.5l-8.5 8.5a5 5 0 01-7-7L14 4.5a3.5 3.5 0 015 5l-8.5 8.5a2 2 0 01-3-3L15 7" />
  </Svg>
);
export const IconTrash = (p: Props) => (
  <Svg {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></Svg>
);
export const IconEye = (p: Props) => (
  <Svg {...p}>
    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />
  </Svg>
);
export const IconDoc = (p: Props) => (
  <Svg {...p}><path d="M7 3h7l5 5v13H7zM14 3v5h5" /></Svg>
);
export const IconImage = (p: Props) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="10" r="1.6" /><path d="M21 16l-5-5-8 9" />
  </Svg>
);
export const IconBack = (p: Props) => (
  <Svg {...p}><path d="M15 5l-7 7 7 7" /></Svg>
);
export const IconLock = (p: Props) => (
  <Svg {...p}><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 118 0v3" /></Svg>
);
export const IconSpinner = (p: Props) => (
  <Svg {...p} className={['spin', p.className].filter(Boolean).join(' ')}>
    <path d="M12 3a9 9 0 019 9" />
  </Svg>
);

/** Chon icon + mau thumbnail theo loai tep, khop voi .thumb trong design. */
export function fileIcon(mime: string) {
  if (mime.startsWith('image/')) return { Icon: IconImage, cls: '' };
  if (mime.includes('spreadsheet')) return { Icon: IconDoc, cls: 'xl' };
  if (mime.includes('presentation')) return { Icon: IconDoc, cls: 'pp' };
  return { Icon: IconDoc, cls: 'doc' };
}
