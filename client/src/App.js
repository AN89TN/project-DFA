import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Navigate, Route, NavLink } from 'react-router-dom';
import { setAuthToken ,userSigninService, verifyTokenService, userLogoutService, getUserListService } from "./services/auth";
import moment from 'moment';
import Home from "./pages/home";
import User from "./pages/user";
import Room from "./pages/createroom";
import About from "./pages/about";

import './App.css';

function App() {
    const [user, setUser] = useState("");
    const [pass, setPass] = useState("");
    const [isAuthenticated, setAuthStatus] = useState(false)
    const [cookie, setCookie] = useState([]);
    const [error, setError] = useState("")

    const sendSignIn = async (e) => {
      const result = await userSigninService(user, pass);
      if (result.data) {
        setCookie(result.data);
        setAuthToken(cookie.token);
        setAuthStatus(true);
        setError("");
      }
      if (!result.data) {
        setError(result.response.data.message);
        userLogoutService();
        setCookie([]);
        setAuthStatus(false);
        setAuthToken("");
      } 
      setUser("");
      setPass("");
    }

    const sendLogout = async  () => {
      userLogoutService();
      setCookie([]);
      setAuthStatus(false);
      setAuthToken("");
    }

    const reciveData = async  () => {
      getUserListService();
      
    }

    const validateSignin = async  () => {
      const result = await verifyTokenService();
      setCookie(result.data)
    }
    
    useEffect(() => {
      setAuthToken(cookie.token);
      const verifyTokenTimer = setTimeout(() => {
          const result = verifyTokenService();
          if (!result)
          setCookie(result.data)
      }, moment(cookie.expiredAt).diff() - 10 * 1000);
      return () => {
        clearTimeout(verifyTokenTimer);
      }
    }, [cookie])




  return (
    <div className="App">
    
      <Router>
        <div className='Nav-Bar'>
        <div>
          <NavLink to="/">To Home</NavLink>
      </div>
      <div>
          <NavLink to="/about">To About</NavLink>
      </div>
      {isAuthenticated && (
      <>
      <div>
          <NavLink to="/user">To User</NavLink>
      </div>
      <div>
          <NavLink to="/createrooms">To Create Rooms</NavLink>
      </div>
      </>
      )}
       </div>
        <Routes>
          <Route path="/"  element={ <Home /> } />
          <Route path="/user"  element={isAuthenticated ? <User cookie = {cookie} /> : <Navigate replace to='/'/> } />
          <Route path="/createrooms"  element={isAuthenticated ? <Room /> : <Navigate replace to='/'/> } />
          <Route path="/about"  element={ <About /> } />
        </Routes>
      </Router>





      <h1>Welcome User {user}</h1>
      <div className='Form-Container-Login'>
      <form onClick={(e) => e.preventDefault()}>
        <label>Username</label><br/><input type="text" onChange={(e) => setUser(e.target.value)} value={user} /><br/>
        <label>Password</label><br/><input type="password" onChange={(e) => setPass(e.target.value)} value={pass} /><br/>
        <label>Ready to Submit?</label><br/><input type="submit" onClick={() => sendSignIn()} /><br/>
        <label style={{color: "red"}}>{error}</label><br/>
      </form>
      </div>
      <br/><br/><br/>
      <div className='Form-Container-Validation'>
      <label>Are you valid?</label><br/><input type="submit" onClick={() => validateSignin()} /><br/>
      <label>{JSON.stringify(cookie, null, 2)}</label><br/>
      <label>Logout?</label><br/><input type="submit" onClick={() => sendLogout()} /><br/>
      <label>userdata?</label><br/><input type="submit" onClick={() => reciveData()} /><br/>
      
      </div>
    </div>
  );
}

export default App;
