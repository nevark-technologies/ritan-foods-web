/** Account pages read the session cookie, so they stream at request time. */
export const instant = false;

export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return children;
}
