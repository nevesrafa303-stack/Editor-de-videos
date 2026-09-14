import type { ComponentProps } from "react";

type IconProps = ComponentProps<"svg">;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="18"
      height="18"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconDashboard = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </Icon>
);

export const IconFunnel = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3 4h18l-7 8v7l-4 2v-9z" />
  </Icon>
);

export const IconCalendar = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Icon>
);

export const IconUsers = (props: IconProps) => (
  <Icon {...props}>
    <path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20" />
    <circle cx="9" cy="7" r="3.2" />
    <path d="M22 20v-1.5a4 4 0 0 0-3-3.87M16.5 4.2a3.2 3.2 0 0 1 0 5.9" />
  </Icon>
);

export const IconDocument = (props: IconProps) => (
  <Icon {...props}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5M9 13h6M9 17h4" />
  </Icon>
);

export const IconMoney = (props: IconProps) => (
  <Icon {...props}>
    <rect x="2.5" y="6" width="19" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.6" />
    <path d="M6 12h.01M18 12h.01" />
  </Icon>
);

export const IconSettings = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.56V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9v.01a1.7 1.7 0 0 0 1.56 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1z" />
  </Icon>
);

export const IconTooth = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 5.5C10.6 4.5 9.4 4 8 4a4 4 0 0 0-4 4.2c0 2.2.9 3.4 1.5 5.3.5 1.6.6 3.3.9 4.8.2 1.2.7 2 1.6 2s1.3-.8 1.6-2.2c.3-1.6.5-3.1 1.4-3.1s1.1 1.5 1.4 3.1c.3 1.4.7 2.2 1.6 2.2s1.4-.8 1.6-2c.3-1.5.4-3.2.9-4.8C21.1 11.6 22 10.4 22 8.2A4 4 0 0 0 18 4c-1.4 0-2.6.5-4 1.5" />
  </Icon>
);

export const IconPlus = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const IconSearch = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </Icon>
);

export const IconWhatsapp = (props: IconProps) => (
  <Icon {...props}>
    <path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 20.5l1.7-5.4A8.5 8.5 0 1 1 21 11.5z" />
    <path d="M8.8 8.5c.3-.7.6-.7.9-.7h.6c.2 0 .5 0 .7.6l.7 1.7c0 .3 0 .5-.2.7l-.4.4a.4.4 0 0 0 0 .5 6 6 0 0 0 2.6 2.3c.2 0 .4 0 .5-.2l.5-.6c.2-.2.4-.2.6-.1l1.6.8c.2.1.4.2.4.4v.7c-.1.5-.7 1.2-1.6 1.2-2.3 0-5-2.4-5.8-4.2-.4-.9-.5-1.7-.5-2.2 0-.4 0-.9.4-1.3z" />
  </Icon>
);

export const IconChevronLeft = (props: IconProps) => (
  <Icon {...props}>
    <path d="m14 6-6 6 6 6" />
  </Icon>
);

export const IconChevronRight = (props: IconProps) => (
  <Icon {...props}>
    <path d="m10 6 6 6-6 6" />
  </Icon>
);

export const IconLogout = (props: IconProps) => (
  <Icon {...props}>
    <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3M16 17l5-5-5-5M21 12H9" />
  </Icon>
);
