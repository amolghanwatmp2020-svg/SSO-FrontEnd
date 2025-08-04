import { Component, OnInit } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { AccountInfo } from '@azure/msal-browser';
import { HttpClient } from '@angular/common/http'; // Import HttpClient

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  profileData: any;
  account: AccountInfo | null = null;
  apiResponse: string = 'No API call made yet.';
  adminApiResponse: string = 'No Admin API call made yet.';
  userApiResponse: string = 'No User API call made yet.';

  // IMPORTANT: Replace with your actual .NET Core API base URL
  private readonly API_BASE_URL = 'https://sso-b3fkfeb7f9d5hwen.indonesiacentral-01.azurewebsites.net/api';

  constructor(private msalService: MsalService, private http: HttpClient) { } // Inject HttpClient

  ngOnInit(): void {
    this.account = this.msalService.instance.getActiveAccount();
    if (this.account && this.account.idTokenClaims) {
      this.profileData = this.account.idTokenClaims;
    }
  }

  // Calls a general authenticated API endpoint
  callAuthenticatedApi(): void {
    this.apiResponse = 'Calling authenticated API...';
    this.http.get<string[]>(`${this.API_BASE_URL}/Test/authenticated`)
      .subscribe({
        next: (data) => {
          this.apiResponse = `Authenticated API Response: ${data.join(', ')}`;
          console.log('Authenticated API Response:', data);
        },
        error: (error) => {
          this.apiResponse = `Error calling authenticated API: ${error.statusText || error.message}`;
          console.error('Error calling authenticated API:', error);
        }
      });
  }

  // Calls the Admin-protected API endpoint
  callAdminApi(): void {
    this.adminApiResponse = 'Calling Admin API...';
    this.http.get<string>(`${this.API_BASE_URL}/Test/public`)
      .subscribe({
        next: (data) => {
          this.adminApiResponse = `Admin API Response: ${data}`;
          console.log('Admin API Response:', data);
        },
        error: (error) => {
          this.adminApiResponse = `Error calling Admin API: ${error.statusText || error.message}`;
          console.error('Error calling Admin API:', error);
        }
      });
  }

  // Calls the User-protected API endpoint
  callUserApi(): void {
    this.userApiResponse = 'Calling User API...';
    this.http.get<string>(`${this.API_BASE_URL}/Test/user-data`)
      .subscribe({
        next: (data) => {
          this.userApiResponse = `User API Response: ${data}`;
          console.log('User API Response:', data);
        },
        error: (error) => {
          this.userApiResponse = `Error calling User API: ${error.statusText || error.message}`;
          console.error('Error calling User API:', error);
        }
      });
  }
}