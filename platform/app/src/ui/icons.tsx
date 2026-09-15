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

export const IconPeople = (props: IconProps) => (
  <Icon {...props}>
    <path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20" />
    <circle cx="9" cy="7" r="3.2" />
    <path d="M22 20v-1.5a4 4 0 0 0-3-3.87M16.5 4.2a3.2 3.2 0 0 1 0 5.9" />
  </Icon>
);

export const IconCalendar = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Icon>
);

export const IconFunnel = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3 4h18l-7 8v7l-4 2v-9z" />
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

export const IconBox = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 3 3 7.5v9L12 21l9-4.5v-9z" />
    <path d="M3 7.5 12 12l9-4.5M12 12v9" />
  </Icon>
);

export const IconCard = (props: IconProps) => (
  <Icon {...props}>
    <rect x="2.5" y="5" width="19" height="14" rx="2" />
    <path d="M2.5 9.5h19M6 14.5h4" />
  </Icon>
);

export const IconClipboard = (props: IconProps) => (
  <Icon {...props}>
    <path d="M9 4h6v3H9z" />
    <path d="M15 5.5h2.5A1.5 1.5 0 0 1 19 7v12a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19V7a1.5 1.5 0 0 1 1.5-1.5H9" />
    <path d="M8.5 12h7M8.5 16h4" />
  </Icon>
);

export const IconTooth = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 5.5C10.6 4.5 9.4 4 8 4a4 4 0 0 0-4 4.2c0 2.2.9 3.4 1.5 5.3.5 1.6.6 3.3.9 4.8.2 1.2.7 2 1.6 2s1.3-.8 1.6-2.2c.3-1.6.5-3.1 1.4-3.1s1.1 1.5 1.4 3.1c.3 1.4.7 2.2 1.6 2.2s1.4-.8 1.6-2c.3-1.5.4-3.2.9-4.8C21.1 11.6 22 10.4 22 8.2A4 4 0 0 0 18 4c-1.4 0-2.6.5-4 1.5" />
  </Icon>
);

export const IconSearch = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </Icon>
);

export const IconPlus = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const IconExit = (props: IconProps) => (
  <Icon {...props}>
    <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3M16 17l5-5-5-5M21 12H9" />
  </Icon>
);

export const IconAlert = (props: IconProps) => (
  <Icon {...props}>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    <path d="M12 9v4M12 17h.01" />
  </Icon>
);
