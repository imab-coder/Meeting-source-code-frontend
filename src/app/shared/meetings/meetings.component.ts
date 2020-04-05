import { Component, OnInit, Output, EventEmitter, Input, ViewChild, TemplateRef } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Cookie } from 'ng2-cookies';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AppService } from 'src/app/app.service';
import { SocketService } from 'src/app/socket.service';

@Component({
  selector: 'app-meeting',
  templateUrl: './meetings.component.html',
  styleUrls: ['./meetings.component.css']
})
export class MeetingsComponent implements OnInit {

  private authToken: string
  public meetingFormGroup: FormGroup;
  public inviter: string;
  public invitee: string;

  @Output() onFormClose = new EventEmitter<any>();
  @Input() isEditMeeting: boolean;
  @Input() isViewOnlyMeeting: boolean;
  @Input() selectedMeeting: any;
  @Input() selectedDate: any;
  @ViewChild('dt1') startDatePickerModal: TemplateRef<any>;

  constructor(
    public toastr: ToastrService,
    public appService: AppService,
    public socketService: SocketService,
    private formBuilder: FormBuilder
  ) { }

  ngOnInit() {
    this.authToken = Cookie.get('authToken');
    let isAdmin = Cookie.get('activeUserType') === 'admin';
    let activeUserFullName = Cookie.get('activeUserFullName');
    let activeUserName = Cookie.get('activeUserName');
    if(isAdmin){
      this.inviter = `${activeUserFullName} (${activeUserName})`;
      this.invitee = Cookie.get('selectedUserFullName');
    }else{
      this.inviter = this.selectedMeeting.inviterFullName;
      this.invitee = `${activeUserFullName} (${activeUserName})`;
    }

    if (this.isEditMeeting || this.isViewOnlyMeeting) {
      this.meetingFormGroup = this.formBuilder.group({
        title: [{ value: this.selectedMeeting.title, disabled: this.isViewOnlyMeeting }, Validators.required],
        purpose: [{ value: this.selectedMeeting.purpose, disabled: this.isViewOnlyMeeting }, Validators.required],
        start: [{ value: new Date(this.selectedMeeting.start), disabled: this.isViewOnlyMeeting }, Validators.required],
        end: [{ value: new Date(this.selectedMeeting.end), disabled: this.isViewOnlyMeeting }, Validators.required],
        location: [{ value: this.selectedMeeting.location, disabled: this.isViewOnlyMeeting }, Validators.required],
        inviterName: [{ value: this.inviter, disabled: true }],
        inviteeName: [{ value: this.invitee, disabled: true }],
        authToken: [this.authToken]
      });
    } else {
      this.meetingFormGroup = this.formBuilder.group({
        title: ['', Validators.required],
        purpose: ['', Validators.required],
        start: [new Date(this.selectedDate.start), Validators.required],
        end: [new Date(this.selectedDate.start), Validators.required],
        location: ['', Validators.required],
        inviterName: [{ value: this.inviter, disabled: true }],
        inviteeName: [{ value: this.invitee, disabled: true }],
        authToken: [this.authToken]
      });
    }
  }

  public saveMeeting(): any {
    this.meetingFormGroup.value['inviterEmail'] = Cookie.get('activeUserEmail');
    this.meetingFormGroup.value['inviteeEmail'] = Cookie.get('selectedUserEmail');
    this.meetingFormGroup.value['inviter'] = Cookie.get('activeUserId');
    this.meetingFormGroup.value['invitee'] = Cookie.get('selectedUserId');

      let formControls = this.meetingFormGroup.controls;
      if (formControls.title.invalid || formControls.title.value.trim('') == "") {
        this.toastr.warning('Please enter proper title of meeting');
      } else if (formControls.purpose.invalid || formControls.purpose.value.trim('') == "") {
        this.toastr.warning('Please enter proper purpose of meeting');
      } else if (formControls.start.invalid || (!formControls.start.value && formControls.start.value.trim('') == "")) {
        this.toastr.warning('Please enter proper start date-time of meeting');
      } else if (formControls.end.invalid || (!formControls.end.value && formControls.end.value.trim('') == "")) {
        this.toastr.warning('Please enter proper end date-time of meeting');
      } else if (formControls.start.value.getTime() > formControls.end.value.getTime()) {
        this.toastr.warning('End date-time cannot be before start date-time');
      } else if (new Date().getTime() > formControls.start.value.getTime()) {
        this.toastr.warning('The selected date-time has been past, meeting cannot be schedulded.')
      } else if (formControls.location.invalid || formControls.location.value.trim('') == "") {
        this.toastr.warning('Please enter proper location of meeting');
      } else {
      if (this.isEditMeeting) {
    
        this.appService.updateMeeting(this.meetingFormGroup.value, this.selectedMeeting.meetingId)
          .subscribe((apiResponse) => {
            if (apiResponse.status === 200) {
              let meetingNotification = {
                message: `Meeting Updated. Your meeting with title: "${this.meetingFormGroup.controls.title.value}" has been updated, which is scheduled on ${this.meetingFormGroup.controls.start.value}`,
                userId:  this.meetingFormGroup.value['invitee']
              }
              this.socketService.notifyUpdates(meetingNotification);
              this.toastr.success('meeting updated');
              this.onFormClose.emit(true);
            } else {
              this.toastr.error(apiResponse.message);
            }
          }, (error) => {
            this.toastr.error('something went wrong');
          });
      } else {
        this.appService.createMeeting(this.meetingFormGroup.value)
          .subscribe((apiResponse) => {
            if (apiResponse.status === 200) {
              let meetingNotification = {
                message: `A new meeting with title: "${this.meetingFormGroup.controls.title.value}" has been scheduled for you on ${this.meetingFormGroup.controls.start.value}`,
                userId:  this.meetingFormGroup.value['invitee']
              }
              this.socketService.notifyUpdates(meetingNotification);
              this.toastr.success('meeting created');
              this.onFormClose.emit(true);
            } else {
              this.toastr.error(apiResponse.message)
            }
          }, (error) => {
            this.toastr.error('something went wrong')
          });
      }
    }
  }

  public onClickCancel() {
    this.onFormClose.emit(true);
  }
}
