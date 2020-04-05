import { Component, OnInit } from '@angular/core';
import { AppService } from 'src/app/app.service';
import { Router } from '@angular/router';
import { Cookie } from 'ng2-cookies';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  public email;
  public password;

  constructor(
    public appService: AppService,
    public router: Router,
    public toastr: ToastrService
  ) { }

  ngOnInit(): void {
  }

  public goToSignUp = () => {
    this.router.navigate(['signup']);
  }

  public goToForgotPassword = () => {
    this.router.navigate(['forgot-password'])
  }

  public login = () => {
    if (!this.email) {
      this.toastr.warning('Enter email address');
    } else if (!this.password) {
      this.toastr.warning('Enter password');
    } else {
      let data = {
        email: this.email,
        password: this.password
      }
      this.appService.login(data).subscribe((apiResponse) => {
        if (apiResponse.status === 200) {
          Cookie.deleteAll();
          let userType = apiResponse.data.userDetails.isAdmin ? 'admin' : 'user';
          Cookie.set('activeUserType', userType);
          Cookie.set('activeUserId', apiResponse.data.userDetails.userId);
          Cookie.set('activeUserEmail', apiResponse.data.userDetails.email);
          Cookie.set('activeUserName', apiResponse.data.userDetails.userName);
          Cookie.set('authToken', apiResponse.data.authToken);
          Cookie.set('activeUserFullName', apiResponse.data.userDetails.firstName + ' ' + apiResponse.data.userDetails.lastName);
          if (apiResponse.data.userDetails.isAdmin) {
            console.log('login successfull')
            this.router.navigate(['admin/dashboard']);
          } else {
            console.log('login successfull')
            this.router.navigate(['user/dashboard']);
          }
        } else {
          console.log('login failed, please try again');
        }
      }, (err) => {
        console.log('login failed, please try again');
      });
    }
  }
  

}
