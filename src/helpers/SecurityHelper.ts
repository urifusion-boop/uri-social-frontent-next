export class SecurityHelper {
  static parseJwt(token: string): { userId: string; email: string; firstName: string; lastName: string } | null {
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const claims = JSON.parse(window.atob(base64)).claims;
      return claims ?? null;
    } catch {
      return null;
    }
  }
}
