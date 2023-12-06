import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Injectable } from '@angular/core';

import { Message, MessageType } from '@soclover/lib-soclover';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class ConnectionService {
  ws?: WebSocket;
  readySubject = new BehaviorSubject<boolean>(false);
  messageSubject = new BehaviorSubject<Message | undefined>(undefined);
  statusSubject = new BehaviorSubject<any>('');
  name!: string;
  clientID: string;
  error: any;
  constructor(public router: Router) {
    this.clientID =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
  }

  async connect() {
    try {
      this.statusSubject.next('Connecting');
      this.ws = new WebSocket(environment.SERVER_URL);

      this.ws.onopen = (evt) => {
        this.readySubject.next(true);
      };

      this.ws.onclose = (evt) => {
        console.log('evt:', evt);
        this.statusSubject.next('Disconnected (closed)');
        delete this.ws;
      };

      this.ws.onmessage = (evt) => {
        const mess: Message = JSON.parse(evt.data);
        if (mess.clientID !== this.clientID) {
          this.messageSubject.next(mess);
        }
      };

      this.ws.onerror = (evt) => {
        console.log('Error', evt);
        this.error = "Connection error - can't connect to server";
        this.statusSubject.next('Disconnected (error)');
        delete this.ws;
      };
    } catch (err) {
      this.statusSubject.next(err);
      console.error('Err:', err);
    }
  }

  async waitTillReady(): Promise<any> {
    if (this.readySubject.value) return Promise.resolve(true);

    return new Promise<void>((resolve) => {
      this.readySubject.subscribe((res) => {
        if (res) resolve();
      });
    });
  }

  async doSend(message: Message) {
    await this.waitTillReady();

    if (this.name) {
      message.sender = this.name;
    }
    // console.log('SENT: \n' + JSON.stringify(message, null, 2));
    if (!this.ws) {
      throw Error('ws not set');
    }
    message.clientID = this.clientID;
    this.ws.send(JSON.stringify(message, null, 2));
  }

  async doSendSync(message: Message): Promise<any> {
    if (!this.name) {
      throw Error('user name not set');
    }

    await this.waitTillReady();
    if (this.name) {
      message.sender = this.name;
    }
    if (!this.ws) {
      throw Error('ws not set');
    }

    message.clientID = this.clientID;
    this.ws.send(JSON.stringify(message, null, 2));
  }

  async logon(name: string) {
    if (this.ws) {
      return this.name || '';
    }
    await this.connect();
    this.name = name;
    const message: Message = {
      sender: this.name,
      type: MessageType.SEND_LOGON,
    };
    await this.doSend(message);
    window.document.title = this.name || 'No one';
    return null;
  }

  async disconnect() {
    if (this.name) {
      const message: Message = {
        type: MessageType.SEND_LOGOUT,
      };
      await this.doSendSync(message);
      this.name = '';
    }
    if (this.ws) {
      this.ws.close();
      delete this.ws;
    }
  }

  async getState() {
    if (!this.name) return;
    const message: Message = {
      sender: this.name,
      type: MessageType.GET_STATE,
    };

    await this.doSendSync(message);
  }

  canActivate(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      if (this.name) {
        resolve(true);
      } else {
        resolve(false);
        this.router.navigate(['/']);
      }
    });
  }
}
