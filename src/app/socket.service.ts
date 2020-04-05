import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { HttpClient } from '@angular/common/http';
import { Cookie } from 'ng2-cookies';

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  private userId: string;
  public socket;
  public url = 'http://localhost:3001';

  constructor(
    public http: HttpClient
  ) { 
    this.socket = io( this.url);
    this.userId = Cookie.get('activeUserId');
    this.socket.on(this.userId, (data) => {
      alert(data.message);
    })
  }

  public notifyUpdates = (data) => {
    this.socket.emit('meeting-notification', data);
  }
}
