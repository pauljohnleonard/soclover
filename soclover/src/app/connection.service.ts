import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Injectable } from '@angular/core';

import { Message, MessageType, User } from '@soclover/lib-soclover';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class ConnectionService {
  ws?: WebSocket;
  readySubject = new BehaviorSubject<boolean>(false);
  messageSubject = new BehaviorSubject<Message | undefined>(undefined);

  user?: User | null;
  clientID: string;
  constructor(public router: Router) {
    this.clientID =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
  }

  async connect() {
    try {
      this.ws = new WebSocket(environment.SERVER_URL);

      this.ws.onopen = (evt) => {
        this.readySubject.next(true);
      };

      this.ws.onclose = (evt) => {
        console.log(
          'DISCONNECTED -------------------------------------------------------------------  '
        );
        const message: Message = {
          type: MessageType.CONNECTION_LOSS,
        };
        this.messageSubject.next(message);
        delete this.ws;
      };

      this.ws.onmessage = (evt) => {
        const mess: Message = JSON.parse(evt.data);
        // console.log('RECIEVED:\n', JSON.stringify(mess, null, 2));
        if (mess.clientID === this.clientID) {
          console.log(
            '  RECIEVED  OWN MESSAGE ----------------------------------- '
          );
        } else {
          this.messageSubject.next(mess);
        }
      };

      this.ws.onerror = (evt) => {
        console.log(
          '  WS        ERROR ----------------------------------- ',
          evt
        );
        const message: Message = {
          type: MessageType.CONNECTION_LOSS,
        };
        this.messageSubject.next(message);
        delete this.ws;
      };
    } catch (err) {
      console.error(err);
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

    if (this.user) {
      message.sender = this.user.name;
    }
    // console.log('SENT: \n' + JSON.stringify(message, null, 2));
    if (!this.ws) {
      throw Error('ws not set');
    }
    message.clientID = this.clientID;
    this.ws.send(JSON.stringify(message, null, 2));
  }

  async doSendSync(message: Message): Promise<any> {
    if (!this.user) {
      throw Error('user not set');
    }

    await this.waitTillReady();
    if (this.user.name) {
      message.sender = this.user.name;
    }
    if (!this.ws) {
      throw Error('ws not set');
    }

    message.clientID = this.clientID;
    this.ws.send(JSON.stringify(message, null, 2));
  }

  async logon(name: string): Promise<User | null> {
    if (this.user) return this.user;
    await this.connect();
    this.user = { name };
    const message: Message = {
      sender: this.user.name,
      type: MessageType.SEND_LOGON,
    };
    await this.doSend(message);
    window.document.title = this.user.name || 'No one';
    return null;
  }

  async disconnect() {
    if (this.user) {
      const message: Message = {
        type: MessageType.SEND_LOGOUT,
      };
      await this.doSendSync(message);
      this.user = null;
    }
    if (this.ws) {
      this.ws.close();
      delete this.ws;
    }
  }

  async getState() {
    if (!this.user) return;
    const message: Message = {
      sender: this.user.name,
      type: MessageType.GET_STATE,
    };

    await this.doSendSync(message);
  }

  canActivate(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      if (this.user) {
        resolve(true);
      } else {
        resolve(false);
        this.router.navigate(['/']);
      }
    });
  }
}
