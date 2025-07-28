import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { MsalService, MsalBroadcastService, MSAL_GUARD_CONFIG } from '@azure/msal-angular';
import { EventMessage, EventType, InteractionStatus, RedirectRequest, InteractionType } from '@azure/msal-browser';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { MsalGuardConfiguration } from '@azure/msal-angular/msal.guard.config'; // Explicitly import from this path

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  isLoggedIn: boolean = false;
  private readonly _destroying$ = new Subject<void>();

  constructor(
    @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
    private msalService: MsalService,
    private msalBroadcastService: MsalBroadcastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('AppComponent: ngOnInit started.');

    // 1. Handle MSAL redirect and process the authentication response
    // This must be called on every page load to process the redirect response
    this.msalService.instance.handleRedirectPromise().then((response) => {
      console.log('AppComponent: handleRedirectPromise next:', response);
      if (response && response.account) {
        // If a response is received (e.g., after a successful redirect login)
        this.msalService.instance.setActiveAccount(response.account);
      }
      this.checkAndLoginIfNecessary(); // Check status after processing redirect
    }).catch((error) => {
      console.error('AppComponent: MSAL Redirect Error:', error);
      // Handle login errors, e.g., display a message to the user
      // It's crucial to still call checkAndLoginIfNecessary() to ensure the app doesn't hang
      this.checkAndLoginIfNecessary();
    });

    // 2. Listen for account changes (login/logout)
    this.msalBroadcastService.msalSubject$
      .pipe(
        filter((msg: EventMessage) => msg.eventType === EventType.ACCOUNT_ADDED || msg.eventType === EventType.ACCOUNT_REMOVED),
        takeUntil(this._destroying$)
      )
      .subscribe((msg: EventMessage) => {
        console.log('AppComponent: MSAL account change event:', msg);
        this.setLoggedInStatus();
      });

    // 3. Listen for interaction status changes (e.g., after login/logout completes)
    this.msalBroadcastService.inProgress$
      .pipe(
        filter((status: InteractionStatus) => status === InteractionStatus.None),
        takeUntil(this._destroying$)
      )
      .subscribe((status: InteractionStatus) => {
        console.log('AppComponent: MSAL inProgress status change:', status);
        this.setLoggedInStatus();
      });

    // Initial check for logged-in status (important for direct loads without a redirect)
    // This will be called if handleRedirectPromise completes without a redirect.
    // However, it's already called within the handleRedirectPromise subscription's next/error blocks,
    // so an explicit call here might be redundant but acts as a safety net.
    // this.checkAndLoginIfNecessary();
  }

  // Method to check authentication status and trigger login if necessary
  private checkAndLoginIfNecessary(): void {
    const accounts = this.msalService.instance.getAllAccounts();
    this.isLoggedIn = accounts.length > 0;
    console.log('AppComponent: checkAndLoginIfNecessary - isLoggedIn:', this.isLoggedIn, 'Accounts:', accounts);

    if (!this.isLoggedIn) {
      console.log('User not logged in. Initiating login redirect...');
      // Only initiate login if MSAL is not already in an interaction state
      // Initiate login only if no interaction is in progress (handled by inProgress$ observable)
      if (this.msalGuardConfig.interactionType === InteractionType.Popup) {
        this.msalService.loginPopup({ ...this.msalGuardConfig.authRequest } as RedirectRequest)
          .subscribe({
            next: (response: any) => {
              console.log('AppComponent: Popup login success:', response);
              this.msalService.instance.setActiveAccount(response.account);
              this.setLoggedInStatus();
            },
            error: (error) => console.error('AppComponent: Popup login error:', error)
          });
      } else {
        console.log('AppComponent: Redirecting for login...');
        this.msalService.loginRedirect({ ...this.msalGuardConfig.authRequest } as RedirectRequest);
      }
    } else {
        console.log('AppComponent: User is already logged in.');
        // Optional: If logged in, ensure we are on a valid route or redirect from root
        // For example, if your root path is a public landing, but you want to redirect to profile
        // if user is logged in and currently on the root path.
        // if (this.router.url === '/') {
        //   this.router.navigate(['/profile']);
        // }
    }
  }

  // Updates the isLoggedIn status based on MSAL's current accounts
  setLoggedInStatus(): void {
    this.isLoggedIn = this.msalService.instance.getAllAccounts().length > 0;
    console.log('AppComponent: setLoggedInStatus called. isLoggedIn:', this.isLoggedIn);
    // Optional: If user logs out from another tab, this will update the UI
    // and potentially redirect them to a public page.
    // if (!this.isLoggedIn && this.router.url !== '/') {
    //   this.router.navigate(['/']);
    // }
  }

  // Triggers the MSAL login flow
  login(): void {
    console.log('AppComponent: Manual login initiated.');
    if (this.msalGuardConfig.interactionType === InteractionType.Popup) {
      this.msalService.loginPopup({ ...this.msalGuardConfig.authRequest } as RedirectRequest)
        .subscribe((response: any) => {
          console.log('AppComponent: Manual popup login success:', response);
          this.msalService.instance.setActiveAccount(response.account);
          this.setLoggedInStatus();
        });
    } else {
      console.log('AppComponent: Manual login redirect initiated.');
      this.msalService.loginRedirect({ ...this.msalGuardConfig.authRequest } as RedirectRequest);
    }
  }

  // Triggers the MSAL logout flow
  logout(): void {
    console.log('AppComponent: Logout initiated.');
    if (this.msalGuardConfig.interactionType === InteractionType.Popup) {
      this.msalService.logoutPopup({
        postLogoutRedirectUri: "http://localhost:4200" // Replace with your actual post-logout URI or remove this line if not needed
      });
    } else {
      this.msalService.logoutRedirect({
        postLogoutRedirectUri: "http://localhost:4200" // Replace with your actual post-logout URI or remove this line if not needed
      });
    }
  }

  // Cleans up subscriptions when the component is destroyed
  ngOnDestroy(): void {
    console.log('AppComponent: ngOnDestroy called.');
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }
}
