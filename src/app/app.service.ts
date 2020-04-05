import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams, HttpClient } from '@angular/common/http';
import { Cookie } from 'ng2-cookies';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  private url = 'http://localhost:3000';

  logoutUrl= `${this.url}/api/v1/users/logout`;
  getUsersUrl= `${this.url}/api/v1/users/view/all`;
  getUserByIdUrl= `${this.url}/api/v1/users`;


  constructor(
    public http: HttpClient
  ) { }

  public signUp(data): Observable<any> {
    const params = new HttpParams()
      .set('userName', data.userName)
      .set('firstName', data.firstName)
      .set('lastName', data.lastName)
      .set('mobileNumber', data.mobileNumber)
      .set('email', data.email)
      .set('password', data.password)
      .set('countryName', data.countryName)
      .set('isAdmin', data.isAdmin)
      .set('countryCode',data.countryCode);
    return this.http.post(`${this.url}/api/v1/users/signup`, params);
  }

  public forgotPassword(data): Observable<any> {
    const params = new HttpParams()
      .set('email', data.email)
    return this.http.post(`${this.url}/api/v1/users/forgotPassword`, params);
  }

  public login(data): Observable<any> {
    const params = new HttpParams()
      .set('email', data.email)
      .set('password', data.password)
    return this.http.post(`${this.url}/api/v1/users/login`, params);
  }

  public logout(): Observable<any> {
    const params = new HttpParams()
      .set('authToken', Cookie.get('authToken'))
    return this.http.post(`${this.logoutUrl}/${Cookie.get('activeUserId')}`, params)
  }

  public getUsers(): Observable<any> {
    return this.http.get(`${this.getUsersUrl}?authToken=${Cookie.get('authToken')}`);
  }
  public getUserById(userId): Observable<any> {
    return this.http.get(`${this.getUserByIdUrl}/${userId}?authToken=${Cookie.get('authToken')}`)
  }

  public codes(): any {
    return this.http.get('assets/codes.json');
  }

  public countries(): any {
    return this.http.get('assets/countries.json');
  }




  public createMeeting(data): Observable<any> {
    const params = new HttpParams()
      .set('title', data.title)
      .set('inviter', data.inviter)
      .set('invitee', data.invitee)
      .set('purpose',data.purpose)
      .set('start', data.start)
      .set('end', data.end)
      .set('location',data.location)
      .set('inviterEmail',data.inviterEmail)
      .set('inviteeEmail',data.inviteeEmail)
      .set('authToken', Cookie.get('authToken'))
    return this.http.post(`${this.url}/api/v1/meeting/create`, params);
  }

  public getSelectedUserMeetings(inviter, invitee, authToken): Observable<any> {
    return this.http.get(`${this.url}/api/v1/meeting/getByInviterAndInvitee?inviter=${inviter}&invitee=${invitee}&authToken=${Cookie.get('authToken')}`);
  }

  public updateMeeting(data, meetingId): Observable<any> {
    const params = new HttpParams()
      .set('title', data.title)
      .set('start', data.start)
      .set('end', data.end)
      .set('location',data.location)
      .set('purpose',data.purpose)
      .set('inviterEmail',data.inviterEmail)
      .set('inviteeEmail',data.inviteeEmail)
      .set('authToken', Cookie.get('authToken'))
    return this.http.put(`${this.url}/api/v1/meeting/update/${meetingId}`, params);
  }

  public deleteMeeting(meetingId): Observable<any> {
    const params = new HttpParams()
      .set('authToken', Cookie.get('authToken'))
    return this.http.post(`${this.url}/api/v1/meeting/delete/${meetingId}`, params)
  }

  public getMeetingsByInvitee(): Observable<any>{
    return this.http.get(`${this.url}/api/v1/meeting/getByInvitee/${Cookie.get('activeUserId')}?authToken=${Cookie.get('authToken')}`);
  }

  public getMeetingsByInviter(): Observable<any>{
    return this.http.get(`${this.url}/api/v1/meeting/getByInviter/${Cookie.get('activeUserId')}?authToken=${Cookie.get('authToken')}`);
  }
}
