import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';

import { RoleGuard } from './guards/role.guard'; // Import your custom RoleGuard
import { HomeComponent } from './components/home/home/home.component';
import { ProfileComponent } from './components/profile/profile/profile.component';
import { AdminComponent } from './components/admin/admin/admin.component';
import { UnauthorizedComponent } from './components/unauthorized/unauthorized.component';

const routes: Routes = [
  { path: '', component: HomeComponent }, // Public home page (login handled by AppComponent)
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [MsalGuard] // Requires basic authentication
  },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [MsalGuard, RoleGuard], // Requires authentication AND 'Admin' role
    data: { roles: ['SuperAdmin'] } // Define the required role(s)
  },
  {
    path: 'unauthorized',
    component: UnauthorizedComponent // Page for unauthorized access
  },
  { path: '**', redirectTo: '' } // Redirect any unknown paths to home
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
