import React, { FormEvent, useEffect, useState } from 'react';
import { Redirect } from 'react-router';
import {
  getAdminStatus,
  getUserDataById,
  putUserData,
  removeCookieExpiration,
  removeUserPhotoById,
  setAuthCookieMaxAge
} from '../../api/httpClient';
import { UserData } from '../../interfaces/User';
import { RoutePath } from '../../router/RoutePath';
import AuthLayout from '../auth/AuthLayout';

const defaultUserData: UserData = {
  email: '',
  firstName: '',
  lastName: '',
  id: '',
  company: ''
};

export const Userprofile = () => {
  const user_email: string | null =
    sessionStorage.getItem('email') || localStorage.getItem('email');
  const user_id: string | null =
    sessionStorage.getItem('user_id') || localStorage.getItem('user_id');

  const [cookieMaxAgeSeconds, setCookieMaxAgeSeconds] = useState<number>(300);

  const setCookieMaxAgeValue = ({ target }: { target: EventTarget | null }) => {
    const { value } = target as HTMLInputElement;
    const intValue = !isNaN(Number(value)) ? Number(value).valueOf() : 0;
    setCookieMaxAgeSeconds(intValue);
  };

  const [user, setUser] = useState<UserData>(defaultUserData);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const onInput = ({ target }: { target: EventTarget | null }) => {
    const { name, value } = target as HTMLInputElement;
    setUser({ ...user, [name]: value });
  };

  useEffect(() => {
    if (user_email && user_id) {
      getUserDataById(user_id).then((data) => setUser(data));
      getAdminStatus(user_email).then((data) => setIsAdmin(!!data.isAdmin));
    }
  }, []);

  const sendUserData = (e: FormEvent) => {
    e.preventDefault();
    putUserData(user).then(() => {
      if (localStorage.getItem('email')) {
        localStorage.setItem('userName', `${user.firstName} ${user.lastName}`);
      } else {
        sessionStorage.setItem(
          'userName',
          `${user.firstName} ${user.lastName}`
        );
      }
      window.location.href = RoutePath.Home;
    });
  };

  return (
    <>
      {user_email && user_id ? (
        <AuthLayout>
          <div className="login-form">
            <form onSubmit={sendUserData}>
              <div className="form-group">
                <label>Email</label>
                <input
                  className="au-input au-input--full"
                  type="text"
                  name="email"
                  placeholder="Email"
                  value={user.email}
                  onInput={onInput}
                />
              </div>
              <div className="form-group">
                <label>FirstName</label>
                <input
                  className="au-input au-input--full"
                  type="text"
                  name="firstName"
                  placeholder="FName"
                  value={user.firstName}
                  onInput={onInput}
                />
              </div>
              <div className="form-group">
                <label>LastName</label>
                <input
                  className="au-input au-input--full"
                  type="text"
                  name="lastName"
                  placeholder="LName"
                  value={user.lastName}
                  onInput={onInput}
                />
              </div>
              <button
                className="au-btn au-btn--block au-btn--green m-b-20"
                type="submit"
              >
                Save changes
              </button>
            </form>
            <div>
              <button
                className="au-btn au-btn--block au-btn--blue m-b-20"
                onClick={() => removeUserPhotoById(user.id, isAdmin)}
              >
                Remove user profile photo
              </button>
            </div>
          </div>
          <br />
          <br />
          <div className="auth-utils-container">
            <h2 className="auth-utils-title">Authentication Utils</h2>
            <div className="form-group">
              <label>Authentication Expiration Time Prolonging (Seconds)</label>
              <input
                className="au-input au-input--full"
                type="text"
                name="maxAgeSeconds"
                placeholder="300"
                value={cookieMaxAgeSeconds}
                onInput={setCookieMaxAgeValue}
              />
            </div>
            <button
              className="au-btn au-btn--block au-btn--green m-b-20"
              onClick={() => setAuthCookieMaxAge(cookieMaxAgeSeconds)}
            >
              Prolong Authentication's Expiration Time
            </button>
            <button
              className="au-btn au-btn--block au-btn--blue m-b-20"
              onClick={() => removeCookieExpiration()}
            >
              Remove Authentication Cookie's Expiration
            </button>
          </div>
        </AuthLayout>
      ) : (
        <Redirect
          to={{ pathname: RoutePath.Login, state: { from: '/userprofile' } }}
        />
      )}
    </>
  );
};

export default Userprofile;
