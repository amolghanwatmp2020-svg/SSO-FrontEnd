import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable, from } from 'rxjs';
import { MsalService } from '@azure/msal-angular';
import { map, first } from 'rxjs/operators'; // Import 'first' operator

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private msalService: MsalService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const expectedRoles = route.data['roles'] as Array<string>;

    // Ensure MSAL has processed any redirect and has an active account
    // Convert the Promise to an Observable using 'from'
    return from(this.msalService.instance.handleRedirectPromise()).pipe(
      map(() => {
        const account = this.msalService.instance.getActiveAccount();
        if (account && account.idTokenClaims) {
          // The 'roles' claim might be an array or a string depending on how it's configured in Azure AD
          const roles = (account.idTokenClaims as any).roles || [];
          const userRoles = Array.isArray(roles) ? roles : [roles]; // Ensure it's an array

          if (expectedRoles && expectedRoles.length > 0) {
            const hasRequiredRole = expectedRoles.some(role => userRoles.includes(role));
            if (hasRequiredRole) {
              return true;
            } else {
              console.warn('User does not have required roles. Redirecting to unauthorized page.');
              this.router.navigate(['/unauthorized']);
              return false;
            }
          }
          // If no specific roles are required for this route, but MsalGuard passed, allow access
          return true;
        } else {
          // This case should ideally be handled by MsalGuard first, but as a fallback:
          console.warn('No active MSAL account found. Redirecting to home/login.');
          this.router.navigate(['/']); // Or trigger login
          return false;
        }
      })
    );
  }
}