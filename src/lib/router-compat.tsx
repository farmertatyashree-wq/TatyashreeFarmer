// Small adapter so the imported screens' navigation runs on TanStack Router.
import { forwardRef, useEffect, type AnchorHTMLAttributes, type ReactNode } from "react";
import {
  Link as TLink,
  useNavigate as useTNavigate,
  useLocation as useTLocation,
  useParams as useTParams,
} from "@tanstack/react-router";

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { to: string; children?: ReactNode };

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(({ to, ...props }, ref) => (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  <TLink ref={ref} to={to as any} {...(props as any)} />
));
Link.displayName = "Link";

type NavLinkProps = Omit<LinkProps, "className" | "children"> & {
  className?: string | ((s: { isActive: boolean }) => string);
  children?: ReactNode | ((s: { isActive: boolean }) => ReactNode);
  end?: boolean;
};

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(({ to, className, children, end, ...props }, ref) => {
  const { pathname } = useTLocation();
  const isActive = to === "/" || end ? pathname === to : pathname === to || pathname.startsWith(to + "/");
  return (
    <Link ref={ref} to={to} className={typeof className === "function" ? className({ isActive }) : className} {...props}>
      {typeof children === "function" ? children({ isActive }) : children}
    </Link>
  );
});
NavLink.displayName = "NavLink";

export function useNavigate() {
  const navigate = useTNavigate();
  return (to: string | number, opts?: { replace?: boolean }) => {
    if (typeof to === "number") return window.history.go(to);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    navigate({ to: to as any, replace: opts?.replace });
  };
}

export function useLocation() {
  return useTLocation();
}

export function useParams<T extends Record<string, string>>(): Partial<T> {
  return useTParams({ strict: false }) as Partial<T>;
}

export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  const navigate = useNavigate();
  useEffect(() => navigate(to, { replace }), [to]);
  return null;
}
