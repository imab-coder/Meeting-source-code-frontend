import { Component, OnInit, EventEmitter, Input, Output, OnChanges } from '@angular/core';
import { CalendarView, CalendarEvent } from 'angular-calendar';
import { ToastrService } from 'ngx-toastr';
import { SocketService } from 'src/app/socket.service';
import { Cookie } from 'ng2-cookies';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnChanges {

  @Input() modalData: any;
  @Input() meetings: any;
  @Output() calendarEventEmitter = new EventEmitter<any>();

  public view: CalendarView = CalendarView.Month;
  public CalendarView = CalendarView;
  public viewDate: Date = new Date();
  public events: CalendarEvent[] = this.meetings;
  public activeDayIsOpen: boolean = false;

  refresh: Subject<any> = new Subject();

  constructor(
    public toastr: ToastrService,
    public socketService: SocketService
  ) { }

  ngOnChanges(): void {

    this.events = this.meetings;
    if (Cookie.get('activeUserType') === 'admin') {
      for (let meeting of this.meetings) {
        meeting.actions = [
          {
            label: '<i class="fa fa-fw fa-pencil"></i>',
            onClick: ({ event }: { event: CalendarEvent }): void => {
              this.calendarEventEmitter.emit({ event: event, action: 'edit' });
            }
          },
          {
            label: '<i class="fa fa-fw fa-times"></i>',
            onClick: ({ event }: { event: CalendarEvent }): void => {
              this.events = this.events.filter(iEvent => iEvent !== event);
              this.calendarEventEmitter.emit({ event: event, action: 'delete' });
              this.activeDayIsOpen = false;
            }
          },
          {
            label: '<i class="fa fa-fw fa-plus"></i>',
            onClick: ({ event }: { event: CalendarEvent }): void => {
              if (new Date().getTime() < event.start.getTime() || new Date().getDate() == event.start.getDate()) {
                event['selectedDate'] = event.start;
                this.calendarEventEmitter.emit({ event: event, action: 'create' });
                this.activeDayIsOpen = false;
              } else {
                this.toastr.warning('The selected day has been past, please select today or later day to schedule a meeting.');
              }
            }
          }
        ];
      }
    } else {
      for (let meeting of this.meetings) {
        meeting.actions = [
          {
            label: '<i class="fa fa-fw fa-info-circle"></i>',
            onClick: ({ event }: { event: CalendarEvent }): void => {
              this.calendarEventEmitter.emit({ event: event, action: 'view' });
            }
          }
        ];
      }
    }
  }


  public onDayCellClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    this.activeDayIsOpen = false;
    this.viewDate = date;
    if (Cookie.get('activeUserType') === 'admin') {
      if (events.length === 0) {
        if (new Date().getTime() < date.getTime() || new Date().getDate() == date.getDate()) {
          event['selectedDate'] = date;
          this.calendarEventEmitter.emit({ event: event, action: 'create' });
        } else {
          this.toastr.warning('The selected day has been past, please select today or later day to schedule a meeting.');
        }
      } else {
        this.activeDayIsOpen = true;
      }
    }else{
      if(events.length>0){
        this.activeDayIsOpen = true;
      }
    }
  }

  public handleEvent(event, data) {
    let eventAction = Cookie.get('activeUserType') === 'admin' ? 'edit' : 'view';
    this.calendarEventEmitter.emit({ event: data, action: eventAction });
  }

}
