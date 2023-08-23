
//Login and register forms
import React, { useState } from "react";
import companyLogo from '../../public/bot-image.png';
import Image from 'next/image';
interface LoginFormProps {
  onSubmit: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(true);
  const [emailError, setEmailError] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);




  const handleUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(event.target.value);
  };

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const response = await fetch("https://dexterv2-16d166718906.herokuapp.com/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        // Login successful
        const responseBody = await response.json();
        const token = responseBody.access_token
        localStorage.setItem("token", token);
        setLoginError(false);
        onSubmit();
        // Redirect to the desired page or perform other actions
      } else {
        // Login failed
        setLoginError(true);
      }
    } catch (error) {
      console.error("Error submitting login form:", error);
    }
  };

  const handleRegisterSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.endsWith('@galy.co')) {
      setEmailError(true);
      return;
    }

    try {
      const response = await fetch("https://dexterv2-16d166718906.herokuapp.com/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ username, email, password }),
      });

      if (response.ok) {


        // Set isRegistered to true when registration is successful
        setEmailError(false); // Reset emailError if it was previously set

        onSubmit();
        window.location.reload();
      } else {
        // Login failed
        setLoginError(true);
      }
    } catch (error) {
      console.error("Error submitting register form:", error);
    }
  };

  const handleSwitchToRegister = () => {
    setShowLoginForm(false);
    setIsRegistered(false);
    setEmailError(false);
  };

  const handleSwitchToLogin = () => {
    setShowLoginForm(true);
    setIsRegistered(false);
    setEmailError(false);
  };

  return (
    <div>
      <div className="relative top-5  h-20 w-30">
        <Image
          src='/bot-image.png'
          alt="Company Logo"
          layout="fill"
          objectFit="contain"
        />
      </div>
      {showLoginForm ? (

        <div className="login-form">
          <h2 className="text-2xl font-bold leading-[1.1] tracking-tighter text-center">Dexter Login</h2><br></br>
          {loginError && (
            <div className="error-message ">
              Incorrect credentials. Try again or contact the admin center.
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email" className="text-1xl  leading-[1.1] tracking-tighter">Email:</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={handleEmailChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="text-1xl  leading-[1.1] tracking-tighter">Password:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={handlePasswordChange}
                required
              />
            </div>
            <br></br>
            <button className="login-button text-1xl font-bold leading-[1.1] tracking-tighter" type="submit" >
              Login
            </button>
          </form>
          <br />

          <button className="switch-button-login text-1xl  leading-[1.1] tracking-tighter" onClick={handleSwitchToRegister}>
            Do not have an account yet?
          </button>
        </div>
      ) : (
        <div className="register-form">
          <h2 className="text-2xl font-bold leading-[1.1] tracking-tighter text-center">Dexter Registration</h2><br></br>
          {emailError && (
            <div className="error-message">
              Please include a valid @galy.co email.
            </div>
          )}
          <form onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label className="register-label text-1xl  leading-[1.1] tracking-tighter " htmlFor="email">
                Username:
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={handleUsernameChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="register-label  text-1xl leading-[1.1] tracking-tighter" htmlFor="email">
                Email:
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={handleEmailChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="register-label  text-1xl  leading-[1.1] tracking-tighter" htmlFor="password">
                Password:
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={handlePasswordChange}
                required
              />
            </div>
            <br></br>
            <button className="register-button  text-1xl font-bold leading-[1.1] tracking-tighter" type="submit">
              Register
            </button>
          </form>
          <br />
          <button className="switch-button  text-1xl  leading-[1.1] tracking-tighter" onClick={handleSwitchToLogin}>
            Back to login
          </button>

          <p className="register-note  text-1xl leading-[1.1] tracking-tighter">*Note: you will be redirected to the login page once you register.</p>
        </div>

      )}
    </div>
  );
};

export default LoginForm;


