import { Component, OnInit } from '@angular/core';
import { AppService } from 'src/app/app.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {

  public firstName: any;
  public lastName: any;
  public email: any;
  public userName: any = '';
  public password: any;
  public selectedCountry: any;
  public mobileNumber: any;
  public isAdmin: boolean = false;
  public countryName: string;
  public countryCode: string;
  public countryList: any[] = [];
  public countryCodes: string[];

  constructor(
    public appService: AppService,
    public router: Router,
    public toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.getCountries();
  }

  public goToSignIn = () => {
    this.router.navigate(['login']);
  }

  public getCountries() {
    // get list of countries 
    this.appService.countries()
      .subscribe((responseList) => {
        console.log(responseList);
        for (let item in responseList) {
          this.countryList.push({ code: item, name: responseList[item] })
        }
        console.log(this.countryList)
        this.countryList = this.countryList.sort((first, second) => {
          return first.name.toUpperCase() < second.name.toUpperCase() ? -1 : (first.name.toUpperCase() > second.name.toUpperCase() ? 1 : 0);
        });
        this.getCountryCodes();
        this.selectedCountry = 'IN';
        this.countryName = this.countryList['this.selectedCountry'];
        console.log(this.countryName)
      })
  }

  public getCountryCodes() {
    // get list of country codes
    this.appService.codes()
      .subscribe((data) => {
        this.countryCodes = data;
        console.log(this.countryCodes)
        this.countryCode = this.countryCodes['IN'];
        console.log(this.countryCode)

      })
  }

  public onCountryChange() {
    // called when user change the country code
    this.countryCode = this.countryCodes[this.selectedCountry];
    this.countryName = this.countryList[this.selectedCountry];
  }

  public setUserName(): void{
    // if user singup as an admin then suffix the username with "-admin"
    if(this.isAdmin && this.userName!==''){
      if(!this.userName.includes('-admin')){
        this.userName = this.userName + '-admin'
      }
    }else{
      this.userName = this.userName.split('-admin')[0]
    }
  }

  public signUpFunction: any = () => {
    // validate signup form and call service method for api call of signup
    if (!this.userName) {
      this.toastr.warning('username required');
    } else if (!this.firstName) {
      this.toastr.warning('first name required');
    } else if (!this.lastName) {
      this.toastr.warning('last name required');
    } else if (!this.mobileNumber) {
      this.toastr.warning('mobile number required');
    } else if (!this.email) {
      this.toastr.warning('email id required');
    } else if (!this.password) {
      this.toastr.warning('password required');
    } else if (this.mobileNumber.toString().length != 10) {
      this.toastr.warning('Please enter 10 digit mobile number');
    }
    else {
      let data = {
        firstName: this.firstName,
        lastName: this.lastName,
        mobileNumber: this.mobileNumber,
        email: this.email,
        password: this.password,
        userName: this.userName,
        isAdmin: this.isAdmin,
        countryName: this.selectedCountry,
        countryCode: this.countryCode
      }
      this.appService.signUp(data)
        .subscribe((apiResponse) => {
          if (apiResponse.status === 200) {
            console.log('Signup successful');
            setTimeout(() => {
              this.router.navigate(['']);
            }, 1000);
          } else {
            this.toastr.error(apiResponse.message);
          }
        }, (err) => {
          this.toastr.error('some error occured');
        });
    }
  }



}
