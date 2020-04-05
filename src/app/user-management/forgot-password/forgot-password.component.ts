import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AppService } from 'src/app/app.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {

  public email;

  constructor(
    public router: Router,
    public toastr: ToastrService,
    public appService: AppService
  ) { }

  ngOnInit(): void {
  }

  public forgotPassword(): void {
    if (!this.email) {
      this.toastr.warning('email required')
    } else {
      let data = {
        email: this.email
      }
      this.appService.forgotPassword(data).subscribe((response) => {
        this.toastr.success('Please check your email to reset password')
        if (response.status === 200) {
          setTimeout(() => {
            this.router.navigate(['']);
          }, 1000)
        } else {
          this.toastr.error(response.message)
        }
      }, (error) => {
        this.toastr.error('Something went wrong, please try again')
      })
    }
  }

}
