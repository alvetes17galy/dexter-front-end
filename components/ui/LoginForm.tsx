
//Login and register forms
import React, { useState } from "react";

interface LoginFormProps {
  onSubmit: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(true);
  const [emailError, setEmailError]=useState(false);

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
      const response = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        // Login successful
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
    if (!email.endsWith('@galy.co')){
      setEmailError(true);
      return;
    }
    
    try {
      const response = await fetch("http://localhost:8000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ username, email, password }),
      });

      if (response.ok) {
        

        setLoginError(false);
        onSubmit();
        
        
      
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
  };

  const handleSwitchToLogin = () => {
    setShowLoginForm(true);
  };

  return (
    <div>
      {showLoginForm ? (
        <div className="login-form">
          <h2>Dexter Login</h2>
          {loginError && (
            <div className="error-message">
              Incorrect credentials. Try again or contact the admin center.
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={handleEmailChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={handlePasswordChange}
                required
              />
            </div>
            <button className="login-button" type="submit">
              Login
            </button>
          </form>
          <br />
          <button className="switch-button" onClick={handleSwitchToRegister}>
            Register...
          </button>
        </div>
      ) : (
        <div className="register-form">
          <h2>Dexter Registration</h2>
          {emailError && (
        <div className="error-message">
          Please include a valid @galy.co email.
        </div>
      )}
          <form onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label className="register-label" htmlFor="email">
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
              <label className="register-label" htmlFor="email">
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
              <label className="register-label" htmlFor="password">
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
            <button className="register-button" type="submit">
              Register and login
            </button>
          </form>
          <br />
          <button className="switch-button" onClick={handleSwitchToLogin}>
            Login...
          </button>
        </div>
      )}
    </div>
  );
};

export default LoginForm;


