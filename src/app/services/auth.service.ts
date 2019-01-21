
import {filter, shareReplay, tap} from 'rxjs/operators';
import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable, BehaviorSubject} from "rxjs";
import {User} from "../model/user";
import * as auth0 from 'auth0-js';
import {Router} from "@angular/router";
import * as moment from 'moment';
//import { timingSafeEqual } from 'crypto';

export const ANONYMOUS_USER: User = {
    id: undefined,
    email: ''
};

/* const AUTH_CONFIG = {
    clientID: 'hHhF4PWGY7vxLQH2HatJaUOertB1dDrU',
    domain: "angularsecuritycourse.auth0.com"
}; */

const AUTH_CONFIG = {
    clientID: 'nxuvfzF2px1SuZ1b04UNYgR0y3Z7B0R1',
    domain: "r-security.eu.auth0.com"
};


@Injectable()
export class AuthService {

     auth0 = new auth0.WebAuth({
        clientID: AUTH_CONFIG.clientID,
        domain: AUTH_CONFIG.domain,
        responseType: 'token id_token',
        redirectUri: 'https://localhost:4200/lessons',
        scope: 'openid email' //asking users for permition to use thier email
    }); 

    private subject = new BehaviorSubject<User>(undefined);

    uaer$: Observable<User> = this.subject.asObservable().pipe(filter(user => !!user));

    constructor(private http: HttpClient, private router: Router) {
        if (this.isLoggedIn()) {
            this.userInfo();
        }
    }

    login() {
        this.auth0.authorize({initialScreen:'login'});
    }

    signUp() {
        this.auth0.authorize({initialScreen:'signUp'});
    }

    logout() {
        localStorage.removeItem('id_token');
        localStorage.removeItem('expires_at');
        this.router.navigate(['/lessons']);
    }

    public isLoggedIn() {
        return moment().isBefore(this.getExpiration());
    }

    isLoggedOut() {
        return !this.isLoggedIn();
    }

    getExpiration() {
        const expiration= localStorage.getItem("expires_at");
        const expiresAt = JSON.parse(expiration);
        return moment(expiresAt);
    }

    retrieveAuthInfoFromUrl() {
        this.auth0.parseHash((err, authResult) => {
            if (err) {
                console.log("Could not parse the hash", err);
                return;
            }
            else if (authResult && authResult.idToken) {
                
                window.location.hash = '';

                console.log("Authentication succesful, authResult", authResult);

                this.setSession(authResult);

                this.userInfo();
            }

            
        });
    }

    userInfo() {
        this.http.put<User>('/api/userinfo', null)
            .pipe(shareReplay(), tap(user => this.subject.next(user)))
            .subscribe();
    }

    setSession(authResult) {

        const expiresAt = moment().add(authResult.expiresIn, 'second');
        localStorage.setItem("id_token", authResult.idToken);
        localStorage.setItem("expires_at", JSON.stringify(expiresAt.valueOf()));
    }

}






