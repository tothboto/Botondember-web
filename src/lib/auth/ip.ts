/**
 * A látogató IP-címe a brute force védelemhez.
 * (Éles üzemben a tárhely / proxy adja meg az `x-forwarded-for` fejlécet.)
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = headers.get("x-real-ip")?.trim();
  const ip = forwarded || real || "helyi";
  return ip.slice(0, 64);
}
