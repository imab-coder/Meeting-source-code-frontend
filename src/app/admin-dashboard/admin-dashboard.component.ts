import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { AppService } from '../app.service';
import { Cookie } from 'ng2-cookies';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { SocketService } from '../socket.service';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { CalendarEvent } from 'angular-calendar';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {

  @ViewChild('meetingTemplate') meetingTemplate: TemplateRef<any>;
  @ViewChild('reminderTemplate') reminderTemplate: TemplateRef<any>;

  public authToken: any;
  public activeUser: string;
  public userType: string = Cookie.get('activeUserType');
  public inviter: any;
  public isAdmin: boolean;
  public meetingModalRef: BsModalRef;
  public remiderModalRef: BsModalRef;
  public meetingListForReminder: any[];
  public userList: any[];
  public userSortedList: any[];
  public isReminderSnooze: boolean = true;
  public meetingEvent: any;
  public selectedDate: any;
  public selectedUser: any;
  public calendarAction: string;
  public meetings: any = [];
  public events: CalendarEvent[] = [];
  public showCalender: boolean = false;
  public isEditMeeting: boolean = false;
  public selectedMeeting: any;
  public modalData;



  constructor(
    public appService: AppService,
    public router: Router,
    public toastr: ToastrService,
    public socketService: SocketService,
    public modalService: BsModalService
  ) { }

  ngOnInit(): void {

    this.activeUser = Cookie.get('activeUserFullName')
    this.inviter = Cookie.get('activeUserId')
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
      this.getAllUsers();
      this.getMeetingsByInviter();
    } 
    // meeting remider for every 5 second
    setInterval(() => {
      if(this.meetingListForReminder){
        this.meetingReminder();
      }
    }, 5000)
  }

  private getAllUsers(): void {
    if (this.authToken) {
      this.appService.getUsers().subscribe((response) => {
        if (response.status === 200) {
          let responseData = response.data;
          this.userList = []
          for (let i = 0; i < responseData.length; i++) {
            let user = {
              fullName: `${responseData[i].firstName} ${responseData[i].lastName}`,
              userName: responseData[i].userName,
              email: responseData[i].email,
              mobile: `+${responseData[i].countryCode} ${responseData[i].mobileNumber}`,
              userId: responseData[i].userId,
              isAdmin: responseData[i].isAdmin
            }
            this.userList.push(user)
            this.userSortedList = this.userList.sort((user1, user2) => {
              if (user1.fullName > user2.fullName) { return 1; }
              if (user1.fullName < user2.fullName) { return -1; }
              return 0;
            });
          }
        } else {
          this.toastr.error(response.message);
        }
      }, (error) => {
        this.toastr.error('something went wrong');
      })
    } else {
      this.toastr.info('Something went wrong, please login again.');
      if (this.meetingModalRef) {
        this.meetingModalRef.hide();
      }
      if (this.remiderModalRef) {
        this.remiderModalRef.hide();
      }
      this.router.navigate(['']);
    }
  }

  private getMeetingsByInviter(): void {
    this.appService.getMeetingsByInviter().subscribe((response) => {
      if (response.status === 200) {
        this.meetingListForReminder = response.data;
      } else {
        this.toastr.error(response.message);
      }
    }, (error) => {
      this.toastr.error('something went wrong');
    })
  }

  public meetingReminder(): void {
    let currentTime = new Date().getTime();
    for (let meeting of this.meetingListForReminder) {
      let meetingTime = (this.getDateObject(meeting.start)).getTime();
      let timeDifference = meetingTime - currentTime;
      if (timeDifference <= 60000 && timeDifference > 0) {
        if ((this.isReminderSnooze || this.meetingEvent != meeting) && Cookie.get('authToken')) {
          this.isReminderSnooze = false;
          this.meetingEvent = meeting;
          this.remiderModalRef = this.modalService.show(this.reminderTemplate);
          break;
        }
      } else if (meetingTime == currentTime &&  Cookie.get('authToken')) {
        this.toastr.info('Meeting started');
      }
    }
  }

  public displaySelectedUserMeetings(selectedUser, isFirstCall) {
    this.selectedUser = selectedUser;
    Cookie.delete('selectedUserId');
    Cookie.delete('selectedUserFullName');
    Cookie.delete('selectedUserEmail');
    Cookie.set('selectedUserId', selectedUser.userId);
    Cookie.set('selectedUserFullName', `${selectedUser.fullName} (${selectedUser.userName})`);
    Cookie.set('selectedUserEmail', selectedUser.email);
    this.appService.getSelectedUserMeetings(this.inviter, selectedUser.userId, this.authToken)
      .subscribe((data) => {
        if (data.status === 200) {
          this.meetings = data.data
          for (let event of this.meetings) {
            event.title = event.title;
            event.start = this.getDateObject(event.start);
            event.end = this.getDateObject(event.end);
            event.color = event.color;
            event.actions = null;
            event.remindMe = true;
          }
          this.events = this.meetings
          if (isFirstCall) {
            this.toastr.success('meetings found for selected user');
          }
          this.showCalender = true;
        } else {
          this.toastr.error(data.message)
          this.showCalender = true;
          this.meetings = []
        }
      }, (error) => {
        this.toastr.error('something went wrong' + error);
        this.showCalender = false;
        this.meetings = []
      })
  }

  public onCalendarEvent(calendarEvent): any {
    this.calendarAction = calendarEvent.action;
    if (calendarEvent.action == 'create') {
      this.isEditMeeting = false;
      this.selectedDate = { start: calendarEvent.event.selectedDate, end: calendarEvent.event.selectedDate };
    } else if (calendarEvent.action == 'edit') {
      this.isEditMeeting = true;
      this.selectedMeeting = calendarEvent.event;
    } else if (calendarEvent.action == 'delete') {
      this.appService.deleteMeeting(calendarEvent.event.meetingId)
        .subscribe((apiResponse) => {
          if (apiResponse.status === 200) {
            this.toastr.success('Meeting deleted');
            let meetingNotification = {
              message: `Meeting Canceled. Your meeting with title: "${calendarEvent.event.title}" on ${calendarEvent.event.start} has been cancled.`,
              userId: calendarEvent.event.invitee
            }
            this.socketService.notifyUpdates(meetingNotification);
          } else {
            this.toastr.error(apiResponse.message);
          }
        }, (error) => {
          this.toastr.error('Error: something went wrong')
        });
    }
    if (calendarEvent.action == 'create' || calendarEvent.action == 'edit') {
      this.meetingModalRef = this.modalService.show(this.meetingTemplate, { class: 'modal-md' });
    }
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

  public onCreateMeetingClicked(): void {
    this.calendarAction = "create";
    this.selectedDate = { start: new Date(), end: new Date() };
    this.meetingModalRef = this.modalService.show(this.meetingTemplate, { class: 'modal-md' });
  }

  public closeMeetingModal(): void {
    this.displaySelectedUserMeetings(this.selectedUser, false);
    this.meetingModalRef.hide();
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
        Cookie.delete('selectedUserEmail');
        Cookie.delete('selectedUserFullName');
        Cookie.delete('selectedUserId');
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
        Cookie.delete('selectedUserEmail');
        Cookie.delete('selectedUserFullName');
        Cookie.delete('selectedUserId');
        this.toastr.error(apiResponse.message);
      }
    }, (err) => {
      Cookie.delete('activeUserEmail');
      Cookie.delete('activeUserFullName');
      Cookie.delete('activeUserId');
      Cookie.delete('activeUserName');
      Cookie.delete('activeUserType');
      Cookie.delete('authToken');
      Cookie.delete('selectedUserEmail');
      Cookie.delete('selectedUserFullName');
      Cookie.delete('selectedUserId');
      this.toastr.error('some error occured');
    });
  }

  public snoozeRemiderModal(): void {
    this.isReminderSnooze = true;
    this.remiderModalRef.hide();
  }
  public dismissRemiderModal(): void {
    this.remiderModalRef.hide();
  }

  public onClickBack(): void{
    this.getMeetingsByInviter();
  }

}
