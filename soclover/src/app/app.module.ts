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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HomeComponent } from './page/home/home.component';
import { ButtonsComponent } from './components/buttons/buttons.component';

import { LogonComponent } from './components/logon/logon.component';
import { BoardComponent } from './page/board/board.component';
import { BrowseComponent } from './page/browse/browse.component';
import { HttpClientModule } from '@angular/common/http';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
@NgModule({
  declarations: [
    AppComponent,
    LeafComponent,
    HomeComponent,
    CustomKeyboardComponent,
    ButtonsComponent,
    LogonComponent,
    BoardComponent,
    BrowseComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    NgxSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatIconModule,
    HttpClientModule,
    MatPaginatorModule,
    MatTableModule,
    RouterModule.forRoot(appRoutes, { initialNavigation: 'enabledBlocking' }),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
