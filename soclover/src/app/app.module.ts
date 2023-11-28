import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { appRoutes } from './app.routes';
import { LeafComponent } from './components/leaf/leaf.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';
import { NgxSpinnerModule } from 'ngx-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

import { CustomKeyboardComponent } from './components/custom-keyboard/custom-keyboard.component';
import { ReactiveFormsModule } from '@angular/forms';
import { HomeComponent } from './components/home/home.component';
@NgModule({
  declarations: [
    AppComponent,
    LeafComponent,
    HomeComponent,
    CustomKeyboardComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    NgxSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatIconModule,

    RouterModule.forRoot(appRoutes, { initialNavigation: 'enabledBlocking' }),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
