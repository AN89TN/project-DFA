import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Navigate, Route, NavLink} from 'react-router-dom';
import { setAuthToken ,userSigninService, verifyTokenService,
         userLogoutService, userLoginService, reciveUserDataService } from "./services/auth";
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
    const [getOptions, setOptions] = useState([]);
    const [toggleMenu, setToggleMenu] = useState(false);
    const [screenWidth, setScreenWidth] = useState(window.innerWidth)

    useEffect(() => {
    var account = localStorage.getItem('MODTaccount');
      if (!account) return
      setCookie(JSON.parse(account));
      setAuthToken(cookie.token);
      setAuthStatus(true);
    }, [cookie.token]);

    useEffect(() => {
      const verifyTokenTimer = setTimeout(async () => {
          const result = await verifyTokenService();
          if (result.data) { 
          localStorage.setItem('MODTaccount', JSON.stringify(result.data));
          setCookie(result.data);
          setAuthToken(cookie.token); 
          } 
          if (!result.data) return (userLogoutService(), setCookie([]), setAuthStatus(false),setAuthToken(""), localStorage.setItem('MODTaccount', ""));
    }, moment(cookie.expiredAt).diff(moment()) - 10 * 1000);
      return () => {
        clearTimeout(verifyTokenTimer);
      }
    }, [cookie.token, cookie.expiredAt]);

    
    useEffect(() => {
      if (isAuthenticated === false) return
      const getDataUser = async () => {
        const result = await reciveUserDataService();
        if (result.error) return (userLogoutService(), setAuthStatus(false), setAuthToken(""), localStorage.setItem('MODTaccount', ""))
        setOptions(result.data.options[0]);
      };
      getDataUser();
      
    },[isAuthenticated]);

    useEffect(() => {
      const changeWidth = () => {
        if (window.innerWidth <= 600)
        setScreenWidth(600);
        if (window.innerWidth >= 601)
        setScreenWidth(601);
      }
      window.addEventListener('resize', changeWidth)
      return () => {
        window.removeEventListener('resize', changeWidth)
      }
    }, [])

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
      setOptions([]);
    };

    const getDataUser = async () => {
      const result = await reciveUserDataService();
      if (result.error) return (userLogoutService(), setAuthStatus(false), setAuthToken(""), localStorage.setItem('MODTaccount', ""))
      setOptions(result.data.options[0]);
    };

    const toggleNav = () => {
      setToggleMenu(!toggleMenu)
    }

  return (
    <div className="App-Main">
    
      <Router>
    <div className="Logo-Container">
      {screenWidth <= 600 ? 
          <>
          <input className="Button-Nav-Bar-Nav" type="button" onClick={toggleNav}  value={"☰"}/>
          <div className='Logo'></div>
          </>
          : null}
      </div>
      <ul className='Nav-Bar-Container'>
        
          {(toggleMenu || screenWidth >= 601) && (
            <>
          <div className='Logo-Full'></div>
          <li><NavLink to="/">Home</NavLink></li>
          <li><NavLink to="/about">About</NavLink></li>
      {isAuthenticated && (
      <>
          <li><NavLink to="/user">User</NavLink></li>
          <li><NavLink to="/createrooms">Rooms</NavLink></li>
          <li><input className="Button-Nav-Bar-Log" type="button" onClick={() => sendLogout()} value={"Logout"}/></li>
      </>
      )}
      </>
          )}
       </ul>
        <Routes>
          <Route path="/"  element={ <Home options={[getOptions, setOptions]} auth={[isAuthenticated, setAuthStatus]} cookie = {cookie} /> } />
          <Route path="/user"  element={isAuthenticated ? <User logOut={sendLogout} dataUser={getDataUser} options={[getOptions, setOptions]} auth={[isAuthenticated, setAuthStatus]} cookie = {cookie} /> : <Navigate replace to='/'/> } />
          <Route path="/createrooms"  element={isAuthenticated ? <Room options={[getOptions, setOptions]} auth={[isAuthenticated, setAuthStatus]} cookie = {cookie} /> : <Navigate replace to='/'/> } />
          <Route path="/about"  element={ <About /> } />
        </Routes>
      </Router>




      {!isAuthenticated && (
        <>
      <div className='Container-Login-Form'>
      <h1>Welcome<br/>{user}</h1>
      <div className='Login-Form'>
      <div className='Login-Signin'>
      <label>Login or Create New User?</label><br/><br/>
      <label className="label-text">Login</label>
      <label className="label">
      -
      <div className="toggle">
      <input className="toggle-state" type="checkbox" onChange={() => setLoginToggle(!isLogin)} defaultChecked={isLogin} />
      <div className="indicator"></div>
      </div>
      -
      </label>
      <label className="label-text">Signin</label>
      <br/><br/>
      </div>
      
      <form>
        <label>Username</label><br/><input type="text" maxLength="30" onChange={(e) => setUser(e.target.value.replace(/^\s/g, '').replace(/\s$/g, ''))} value={user} /><br/>
        <label>Password</label><br/><input type="password" maxLength="30" onChange={(e) => setPass(e.target.value.replace(/^\s/g, '').replace(/\s$/g, ''))} value={pass} /><br/>

        {!isLogin ?
        <>
        <label>Ready to Login?</label><br/><input className='raise-button' type="submit" onClick={(e) => sendLogIn(e)} /><br/>
        </>
        :
        <>
        <label>Ready to Create a New User?</label><br/><input className='raise-button' type="submit" onClick={(e) => sendSignIn(e)} /><br/>
        </>
        }

        <label style={{color: "red"}}>{error}</label>
      </form>
      </div>
      </div>
      </>
      )}
      <div className='Container-Footer'>
      <Footer />
      </div>
    </div>
  );
}

export default App;