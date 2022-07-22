import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Navigate, Route, NavLink} from 'react-router-dom';
import { setAuthToken ,userSigninService, verifyTokenService,
         userLogoutService, userLoginService } from "./services/auth";
import moment from 'moment';
import Home from "./pages/home";
import User from "./pages/user";
import Room from "./pages/createroom";
import About from "./pages/about";
import Footer from "./pages/footer";
import './App.css';

function App() {
    const [user, setUser] = useState("");
    const [pass, setPass] = useState("");
    const [isAuthenticated, setAuthStatus] = useState(false);
    const [isLogin, setLoginToggle] = useState(false);
    const [cookie, setCookie] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
      var account = localStorage.getItem('MODTaccount');
      if (!account) return
      setCookie(JSON.parse(account));
      setAuthToken(cookie.token);
      setAuthStatus(true);
      const verifyTokenTimer = setTimeout(async () => {
          const result = await verifyTokenService();
          if (result.data) { 
          setCookie(result.data);
          setAuthToken(cookie.token); 
          } 
          if (!result.data) return (userLogoutService(), setCookie([]), setAuthStatus(false),setAuthToken(""), localStorage.setItem('MODTaccount', ""));
    }, moment(cookie.expiredAt).diff(moment()) - 10 * 1000);
      return () => {
        clearTimeout(verifyTokenTimer);
      }
    }, [cookie.expiredAt, cookie.token]);

    const sendSignIn = async (e) => {
      e.preventDefault();
      const result = await userSigninService(user, pass);

      if (result.data) {
        localStorage.setItem('MODTaccount', JSON.stringify(result.data));
        setCookie(result.data);
        setAuthToken(cookie.token);
        setAuthStatus(true);
        setError("");
      }
      if (!result.data) {
        localStorage.setItem('MODTaccount', "");
        setError(result.response.data.message);
        userLogoutService();
        setCookie([]);
        setAuthStatus(false);
        setAuthToken("");
      } 
      setUser("");
      setPass("");
    }

    const sendLogIn = async(e) => {
      e.preventDefault()
      const result = await userLoginService(user, pass);
  
      if (result.data) {
        localStorage.setItem('MODTaccount', JSON.stringify(result.data));
        setCookie(result.data);
        setAuthToken(cookie.token);
        setAuthStatus(true);
        setError("");
      }
      if (!result.data) {
        localStorage.setItem('MODTaccount', "");
        setError(result.response.data.message);
        userLogoutService();
        setCookie([]);
        setAuthStatus(false);
        setAuthToken("");
      } 
      setUser("");
      setPass("");
    };

    const sendLogout = async  () => {
      await userLogoutService();
      localStorage.setItem('MODTaccount', "");
      setCookie([]);
      setAuthStatus(false);
      setAuthToken("");
    }

    const validateSignin = async  () => {
      const result = await verifyTokenService();
      if (!result.data) return (userLogoutService(), setCookie([]), setAuthStatus(false),setAuthToken(""));
      setCookie(result.data)
    }

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
      <label>Logout?</label><br/><input type="submit" onClick={() => sendLogout()} />
      <br/>
      <br/>  
      <br/>
      </>
      )}
       </div>
        <Routes>
          <Route path="/"  element={ <Home /> } />
          <Route path="/user"  element={isAuthenticated ? <User cookie = {cookie} /> : <Navigate replace to='/'/> } />
          <Route path="/createrooms"  element={isAuthenticated ? <Room functions={[isAuthenticated, setAuthStatus]} cookie = {cookie} /> : <Navigate replace to='/'/> } />
          <Route path="/about"  element={ <About /> } />
        </Routes>
      </Router>




      {!isAuthenticated && (
        <>
      <h1>Welcome {user}</h1>
      <div className='Form-Container-Login'>
      <label>Login or Create New User?</label><br/><input type="checkbox"  onChange={() => setLoginToggle(!isLogin)} defaultChecked={isLogin}/>
      <form>
        <label>Username</label><br/><input type="text" maxLength="30" onChange={(e) => setUser(e.target.value.replace(/^\s/g, '').replace(/\s$/g, ''))} value={user} /><br/>
        <label>Password</label><br/><input type="password" maxLength="30" onChange={(e) => setPass(e.target.value.replace(/^\s/g, '').replace(/\s$/g, ''))} value={pass} /><br/>

        {!isLogin ?
        <>
        <label>Ready to Login?</label><br/><input type="submit" onClick={(e) => sendLogIn(e)} /><br/>
        </>
        :
        <>
        <label>Ready to Create a New User?</label><br/><input type="submit" onClick={(e) => sendSignIn(e)} /><br/>
        </>
        }

        <label style={{color: "red"}}>{error}</label><br/>
      </form>
      </div>
      </>
      )}
      <br/><br/><br/>
      <div className='Form-Container-Validation'>
      <label>Are you valid?</label><br/><input type="submit" onClick={() => validateSignin()} /><br/>
      <label>{JSON.stringify(cookie, null, 2)}</label><br/>
      <Footer />
      </div>
    </div>
  );
}

export default App;