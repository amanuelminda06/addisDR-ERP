import type { Route } from "next";
import Link from "next/link";

export function toRoute(href: string): Route {
  return href as Route;
}

export interface NavLinkProps {
  href: string;
  className?: string;
  children: React.ReactNode;
  prefetch?: boolean;
  scroll?: boolean;
  title?: string;
  "aria-current"?: "page" | undefined;
  onClick?: () => void;
}

export function NavLink({
  href,
  className,
  children,
  prefetch,
  scroll,
  title,
  onClick,
  ...rest
}: NavLinkProps) {
  return (
    <Link
      href={toRoute(href)}
      className={className}
      prefetch={prefetch}
      scroll={scroll}
      title={title}
      onClick={onClick}
      {...rest}
    >
      {children}
    </Link>
  );
}
