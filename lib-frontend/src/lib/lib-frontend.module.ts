import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MydialogComponent } from './mydialog/mydialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
@NgModule({
  imports: [CommonModule, MatDialogModule, MatIconModule],
  declarations: [MydialogComponent]
})
export class LibFrontendModule {}
export { AuthService } from './auth.service';
export { LoginGuardService } from './login-guard.service';
