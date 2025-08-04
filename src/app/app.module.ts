import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; // Required if using Angular Material or similar

import {
  MsalGuard,
  MsalInterceptor,
  MsalModule,
  MsalBroadcastService,
  MsalService,
  MSAL_GUARD_CONFIG,
  MSAL_INSTANCE,
  MSAL_INTERCEPTOR_CONFIG,
  MsalRedirectComponent // Required for handling redirects
} from '@azure/msal-angular';
import {
  IPublicClientApplication,
  PublicClientApplication,
  InteractionType,
  BrowserCacheLocation,
  LogLevel,
  RedirectRequest // Ensure RedirectRequest is imported
} from '@azure/msal-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { RoleGuard } from './guards/role.guard'; // Import your custom RoleGuard
import { HomeComponent } from './components/home/home/home.component';
import { AdminComponent } from './components/admin/admin/admin.component';
import { ProfileComponent } from './components/profile/profile/profile.component';
import { UnauthorizedComponent } from './components/unauthorized/unauthorized.component';

// Configuration for MSAL PublicClientApplication
const isIE =
  window.navigator.userAgent.indexOf('MSIE ') > -1 ||
  window.navigator.userAgent.indexOf('Trident/') > -1; // IE 11

export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
   auth: {
      clientId: '41d2efd6-9450-44c0-8402-93c770829813', // Replace with your Angular app's Client ID from Azure AD
      authority: 'https://login.microsoftonline.com/5770dac6-f9fd-4036-ad2a-93d72c8e00e8', // Replace with your Tenant ID or B2C tenant URL (e.g., https://<tenant-name>.b2clogin.com/<tenant-name>.onmicrosoft.com/<policy-name>)
      redirectUri: 'http://localhost:4200', // Your Angular app's redirect URI (must match Azure AD registration)
      postLogoutRedirectUri: 'http://localhost:4200', // Where to redirect after logout
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage, // Stores tokens in browser's local storage
      storeAuthStateInCookie: isIE, // Set to true for IE 11
    },
    system: {
      loggerOptions: {
        loggerCallback: (level, message, containsPii) => {
          if (containsPii) {
            return; // Avoid logging PII in production
          }
          switch (level) {
            case LogLevel.Error:
              console.error(message);
              return;
            case LogLevel.Info:
              console.info(message);
              return;
            case LogLevel.Verbose:
              console.debug(message);
              return;
            case LogLevel.Warning:
              console.warn(message);
              return;
          }
        },
        piiLoggingEnabled: false // Disable PII logging in production
      },
    },
  });
}

// Configuration for MSAL Interceptor (to attach tokens to API calls)
export function MSALInterceptorConfigFactory() {
  const protectedResourceMap = new Map<string, Array<string>>();
  // Map your API endpoints to the required scopes (from your .NET Core API's app registration)
  // Example: 'https://localhost:5001/api' or 'YOUR_API_BASE_URL/api'
  protectedResourceMap.set('http://localhost:7175/api', ['api://59de5ef0-7b5c-4d4a-833d-e145edc85013/access_as_user']);

  return {
    interactionType: InteractionType.Redirect, // Or Popup, depending on your login flow preference
    protectedResourceMap,
  };
}

// Configuration for MSAL Guard (for route protection)
export function MSALGuardConfigFactory() {
  return {
    interactionType: InteractionType.Redirect, // Or Popup
    authRequest: {
      scopes: ['openid', 'profile', 'User.Read'], // Basic scopes, add more as needed for user info
    } as RedirectRequest, // Cast to RedirectRequest for consistency
  };
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    AdminComponent,
    ProfileComponent,
    UnauthorizedComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule, // Add this if you intend to use Angular Material or similar
    MsalModule, // MsalModule does not need .forRoot() if you provide MSAL_INSTANCE
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true, // Important for multiple interceptors
    },
    {
      provide: MSAL_INSTANCE,
      useFactory: MSALInstanceFactory,
    },
    {
      provide: MSAL_GUARD_CONFIG,
      useFactory: MSALGuardConfigFactory,
    },
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useFactory: MSALInterceptorConfigFactory,
    },
    MsalService,
    MsalGuard,
    MsalBroadcastService,
    RoleGuard // Provide your custom RoleGuard
  ],
  bootstrap: [AppComponent, MsalRedirectComponent], // MsalRedirectComponent is crucial for handling redirects
})
export class AppModule {}