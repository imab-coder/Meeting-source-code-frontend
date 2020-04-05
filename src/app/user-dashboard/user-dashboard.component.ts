import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Cookie } from 'ng2-cookies';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AppService } from '../app.service';
import { CalendarEvent } from 'angular-calendar';

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css']
})
export class UserDashboardComponent implements OnInit {

  @ViewChild('meetingTemplate') meetingTemplate: TemplateRef<any>;
  @ViewChild('reminderTemplate') reminderTemplate: TemplateRef<any>;

  public authToken: any;
  public isAdmin: any;
  public meetingModalRef: BsModalRef;
  public remiderModalRef: BsModalRef;
  public meetings: any[];
  public events: CalendarEvent[] = [];
  public isReminderSnooze: boolean = true;
  public meetingEvent: any;
  public showMeetingDetails: boolean = false;
  public selectedMeetingForView: any;
  public activeUser: string = Cookie.get('activeUserFullName');
  public title: string;
  public inviter: any;
  public invitee: any;
  public start: any;
  public end: any;
  public allUsers: any[];
  public allUsersData: any[]
  public userSortedList: any;
  public modalData;

  constructor(
    public router: Router,
    public toastr: ToastrService,
    public appService: AppService,
    public modalService: BsModalService
  ) { }

  ngOnInit(): void {

    this.authToken = Cookie.get('authToken');
    this.isAdmin = Cookie.get('activeUserType') === 'admin';

    if (Cookie.get('authToken') == null || Cookie.get('authToken') == '' || Cookie.get('authToken') == undefined) {
      if (this.meetingModalRef) {
        this.meetingModalRef.hide();
      }
      if (this.remiderModalRef) {
        this.remiderModalRef.hide();
      }
      this.router.navigate(['']);
    }else {
      this.getMeetings();
    }

    setInterval(() => {
       this.meetingReminder()
    }, 5000)
  }

  public getMeetings(): void {
    this.appService.getMeetingsByInvitee().subscribe((response) => {
      if (response.status == 200) {
        this.meetings = response.data;
        for (let event of this.meetings) {
          event.title = event.title;
          event.start = this.getDateObject(event.start);
          event.end = this.getDateObject(event.end);
          event.color = event.color;
          event.actions = null;
          event.remindMe = true;
        }
        this.events = this.meetings
        this.toastr.success('meetings found for you');
      } else {
        this.toastr.error(response.message);
        this.meetings = [];
      }
    }, (error) => {
      this.toastr.error('something went wrong' + error);
      this.meetings = [];
    })
  }

  private getDateObject(date): Date {
    return new Date(
      new Date(date).getUTCFullYear(),
      new Date(date).getUTCMonth(),
      new Date(date).getUTCDate(),
      new Date(date).getUTCHours(),
      new Date(date).getUTCMinutes()
    );
  }

  public meetingReminder(): void {
    let currentTime = new Date().getTime();
    for (let meeting of this.meetings) {
      let timeDifference = (meeting.start).getTime() - currentTime;
      if (timeDifference <= 60000 && timeDifference > 0) {
        if ((this.isReminderSnooze || this.meetingEvent != meeting) && Cookie.get('authToken') != null) {
          this.isReminderSnooze = false;
          this.meetingEvent = meeting;
          this.remiderModalRef = this.modalService.show(this.reminderTemplate);
          break;
        }
      } else if ((meeting.start).getTime() == currentTime && Cookie.get('authToken') != null) {
        this.toastr.info('Meeting started');
      }
    }
  }


  public onCalendarEvent(calendarEvent): void {
    if (calendarEvent.action == 'view') {
      this.showMeetingDetails = true;
      this.selectedMeetingForView = calendarEvent.event;
      this.appService.getUserById(calendarEvent.event.inviter)
        .subscribe((response) => {
          if (response.status == 200) {
            this.selectedMeetingForView['inviterFullName'] = `${response.data.firstName} ${response.data.lastName} (${response.data.userName})`
            this.meetingModalRef = this.modalService.show(this.meetingTemplate);
          } else {
            this.toastr.error(response.message);
          }
        }, (error) => {
          this.toastr.error('something went wrong' + error);
        })
    }
  }

  public closeModal(): void {
    this.getMeetings();
    this.meetingModalRef.hide();
  }

  public snoozeRemiderModal(): void {
    this.isReminderSnooze = true;
    this.remiderModalRef.hide();
  }
  public dismissRemiderModal(): void {
    this.remiderModalRef.hide();
  }

  public logout(): void {
    this.appService.logout().subscribe((apiResponse) => {
      if (apiResponse.status === 200) {
        Cookie.delete('activeUserEmail');
        Cookie.delete('activeUserFullName');
        Cookie.delete('activeUserId');
        Cookie.delete('activeUserName');
        Cookie.delete('activeUserType');
        Cookie.delete('authToken');
        this.authToken = null;
        this.activeUser = null;
        this.toastr.success('Logout Successfull');
        this.router.navigate(['']);
      } else {
        Cookie.delete('activeUserEmail');
        Cookie.delete('activeUserFullName');
        Cookie.delete('activeUserId');
        Cookie.delete('activeUserName');
        Cookie.delete('activeUserType');
        Cookie.delete('authToken');
        this.toastr.error(apiResponse.message);
      }
    }, (err) => {
      Cookie.delete('activeUserEmail');
      Cookie.delete('activeUserFullName');
      Cookie.delete('activeUserId');
      Cookie.delete('activeUserName');
      Cookie.delete('activeUserType');
      Cookie.delete('authToken');
      this.toastr.error('some error occured');
    });
  }

}
